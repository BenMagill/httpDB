import { readFileSync, writeFile } from "fs"
import { FileExtension } from "../enums/FileTypes"
import { RowType } from "../enums/RowType"
import { queryExecutor } from "../funcs/queryExecutor"
import validName from "../funcs/validName"
import { log, Scope, Type } from "../logger"
import { Database } from "./Database"

export type ValidTypes = string | number | object | boolean | any[] | Date

interface Row {
    // Hacky solution
    type: RowType
    index?: boolean
    required?: boolean
    default?: any // Can't be used with PRIMARY_KEY. Works only when required false
    currentMax?: number // Used with PRIMARY_KEY. Only in Schema when on disk
    ref?: string // Used with foreign key. Refers to the name of a table in the db
}

export interface Schema {
    // key is the name of the row
    [key: string]: Row
}

interface TableInfo {
    primary: number
}

export class Table {
    name: string
    dbName: string

    primaryKeyMax: number

    schema: Schema // The structure of the table

    rows: Array<any> // All rows in the db
    rowCount: number // Number of rows.

    // indexes: array

    constructor(name: string, dbName: string, schema?: Schema, parentDB?: Database) {
        if (!validName(name)) throw new Error(`Name of table "${name}" is not valid`)

        this.name = name
        this.dbName = dbName

        if (schema && parentDB) {
            log(Type.INFO, Scope.TABLE, `Creating new table ${name}`)

            // If schema then means new table

            this.rows = []
            this.rowCount = 0
            this.primaryKeyMax = 0

            log(Type.INFO, Scope.TABLE, `Validating schema`)
            const parsedSchema = Table.validateSchema(schema, parentDB)

            if (!parsedSchema) {
                throw new Error("Invalid Table data")
            } else {
                this.schema = parsedSchema
            }

            // Save to disk
            this.saveSchema()
            this.saveData()
            this.saveInfo()

            log(Type.INFO, Scope.TABLE, `Created new table ${name}`)

            
        } else {
            // Load from files
            // Load schema from file
            log(Type.INFO, Scope.TABLE, `Loading table ${name} from disk`)
            
            const schemaDataSerialised = readFileSync(
                this.getFilePath(FileExtension.TABLE_SCHEMA),
                { encoding: "utf-8" }
            )
            this.schema = JSON.parse(schemaDataSerialised)

            // Load other info
            const tableInfo = readFileSync(
                this.getFilePath(FileExtension.TABLE_INFO),
                { encoding: "utf-8" }
            )
            const info: TableInfo = JSON.parse(tableInfo)
            this.primaryKeyMax = info.primary

            // Load data from file
            const dataSerialised = readFileSync(
                this.getFilePath(FileExtension.TABLE),
                { encoding: "utf-8" }
            )
            const data: Array<any> = JSON.parse(dataSerialised)
            this.rows = data
            this.rowCount = data.length
        }
    }

    static validateSchema(schema: Schema, parentDB: Database): Schema | null {
        var hasPrimary = false

        for (const fieldName in schema) {
            if (Object.prototype.hasOwnProperty.call(schema, fieldName)) {
                const fieldProperties = schema[fieldName]

                if (fieldProperties.type === RowType.PRIMARY_KEY) {
                    // If already a primary key then error
                    if (hasPrimary) return null

                    hasPrimary = true
                } else if (fieldProperties.type === RowType.FOREIGN_KEY) {
                    if (!fieldProperties.ref) {
                        throw new Error("Foreign Key field must include a reference to another table")
                    }
                    
                    if (fieldProperties.ref === this.name) {
                        throw new Error("Foreign Key table referenced must not be itself") 
                    }
                    var foundTable = parentDB.findTable(fieldProperties.ref)
                    if (!foundTable) {
                        throw new Error("Foreign Key table referenced not found") 
                    }
                    //TODO: ensure foreign key fields ref is equal to a valid table
                    // Once again has the problem of has to access the parent database.
                    /**
                     * Ideas: 
                     *  Provides a reference to parent table in instantiation which can then be used to use its functions.  
                     *      This would be pretty viable as a quick fix. However may be quite inefficient for large number of tables 
                     *      What am i saying idiot its only a reference not a copy of the class so would take up barely and memory
                     *  
                     */

                }
            }
        }

        if (!hasPrimary) return null

        return schema
    }

    // TODO add type somehow
    addOne(row: { [key: string]: any }) {
        log(Type.INFO, Scope.TABLE, `Adding row to ${this.name}`)

        // Check if inputted rows match schema options
        for (const field in this.schema) {
            if (Object.prototype.hasOwnProperty.call(this.schema, field)) {
                const fieldInfo = this.schema[field]

                if (fieldInfo.type === RowType.PRIMARY_KEY) {
                    row[field] = this.primaryKeyMax + 1
                } else {
                    // If required make sure inputted
                    if (fieldInfo.required) {
                        if (row[field] === undefined) {
                            throw new Error(
                                `Field "${field} required on table ${this.name}"`
                            )
                        }
                    }
                    // If default provided and not inputted
                    if (fieldInfo.default != undefined && row[field] == undefined) {
                        row[field] = fieldInfo.default
                    }

                    // Check type
                    if (!this.validateField(fieldInfo.type, row[field]) && fieldInfo.required) {
                        throw new Error(
                            `Type of field "${field}" does not match input (${typeof row[
                                field
                            ]}) `
                        )
                    }
                }
            }
        }

        this.rows.push(row)
        
        this.primaryKeyMax += 1
        
        log(Type.INFO, Scope.TABLE, `Row added to ${this.name}`)
        
        this.saveData()
        this.saveInfo()
        

        return true
    }

    find(query: any, parentDB: Database) {
        console.log({table: this.rows, parentDB: parentDB.tables["table1"].rows})
        // TODO: add foreign key support
        // Needs a way to access other tables in the database
        // Could be done by recieving a reference to the parent database so that it can call findTable() and then get a row matching foreign key
        log(Type.INFO, Scope.TABLE, `Finding rows in ${this.name}`)
        
        var [rows, locations] = queryExecutor([...this.rows], query, this.schema)

        // TODO VEry hacky find better way
        var rowsOut = JSON.parse(JSON.stringify(rows))
        
        // console.log(rows)
        // TODO: slow as hell so find better way to do it 
        
        // Get tables to populate foreign keys with
        var populate = query.$populate
        // console.log(populate)
        if (populate && populate instanceof Array) {
            // console.log("found fields to populate")
            for (let i = 0; i < populate.length; i++) {
                const table = populate[i];
                // console.log(table)
                const foundTable = parentDB.findTable(table) 
                // console.log(foundTable)
                if (foundTable) {
                    // Table exists

                    var primaryField = ""
                    // Get location of primarykey in foreign table
                    for (const fSchemaField in foundTable.schema) {
                        if (Object.prototype.hasOwnProperty.call(foundTable.schema, fSchemaField)) {
                            const fFieldProps = foundTable.schema[fSchemaField];
                            if (fFieldProps.type === RowType.PRIMARY_KEY) {
                                primaryField = fSchemaField
                            }
                            
                        }
                    }

                    // Check if in schema and if so what field
                    for (const schemaField in this.schema) {
                        if (Object.prototype.hasOwnProperty.call(this.schema, schemaField)) {
                            const schemaFieldProperties = this.schema[schemaField];
                            if (schemaFieldProperties.type === RowType.FOREIGN_KEY) {
                                if (schemaFieldProperties.ref === table) {
                                    // Populate each row
                                    for (let j = 0; j < rows.length; j++) {
                                        const row = rowsOut[j];
                                        // console.log(row[schemaField])
                                        // If field has data
                                        if (row[schemaField]) {
                                            var [data] = queryExecutor([...foundTable.rows], {[primaryField]: {$eq: row[schemaField]}}, foundTable.schema)
                                            // console.log(data[0])
                                            // rowsOut.push({...row, [schemaField]: data[0]})
                                            row[schemaField] = data[0]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return rowsOut
    }
    
    delete(query: any) {
        // Delete rows based on conditions
        
        const [rows, locations] = queryExecutor(this.rows, query, this.schema)

        log(Type.WARN, Scope.TABLE, `Deleting ${locations.length} row(s) from ${this.name}`)

        for (let i = locations.length-1; i >= 0 ; i--) {
            const index = locations[i];
            this.rows.splice(index, 1)
        }

        log(Type.WARN, Scope.TABLE, `Deleted ${locations.length} row(s) from ${this.name}`)

        this.saveData()
        this.rowCount -= locations.length

        return locations.length
    }   

    update(query: any) {
        
        // Update based on options
        const [rows, locations] = queryExecutor(this.rows, query, this.schema)

        log(Type.INFO, Scope.TABLE, `Updating ${locations.length} row(s) in ${this.name} `)

        var modifications = query["$set"]
        for (let i = 0; i < locations.length; i++) {
            const index = locations[i];
            for (const variable in modifications) {
                if (Object.prototype.hasOwnProperty.call(modifications, variable)) {
                    const newValue = modifications[variable];
                    // Check if value in schema
                    if (this.schema[variable]) {
                        this.rows[index][variable] = newValue 
                    }
                }
            }
        }

        log(Type.INFO, Scope.TABLE, `Updated ${locations.length} row(s) in ${this.name} `)

        this.saveData()

        return locations.length

    }

    saveSchema() {
        var serialised = JSON.stringify(this.schema)
        writeFile(this.getFilePath(FileExtension.TABLE_SCHEMA), serialised, () => {
            log(Type.INFO, Scope.TABLE, `Saved schema for table ${this.name}`)
        })
    }

    saveInfo() {
        var data = {
            primary: this.primaryKeyMax,
        }
        writeFile(
            this.getFilePath(FileExtension.TABLE_INFO),
            JSON.stringify(data),
            () => {
                log(Type.INFO, Scope.TABLE, `Saved info for table ${this.name}`)
            }
        )
    }

    saveData() {
        // Saves the row data
        // Schema only saved when saved so not needed here
        const data = JSON.stringify(this.rows)
        writeFile(this.getFilePath(FileExtension.TABLE), data, () => {
            log(Type.INFO, Scope.TABLE, `Saved data for table ${this.name}`)
        })
        this.saveInfo()
    }

    getFilePath(ext: string) {
        return `${process.cwd()}/data/${this.dbName}.${this.name}.${ext}`
    }

    validateField(fieldType: RowType, field: any) {
        switch (fieldType) {
            case RowType.STRING:
                return typeof field === "string"
            case RowType.NUMBER:
                return typeof field === "number"
            case RowType.BOOLEAN:
                return typeof field === "boolean"
            case RowType.ARRAY:
                return field instanceof Array
            case RowType.OBJECT:
                return typeof field === "object"
            case RowType.DATE:
                // TODO: handle dates
                return typeof field === "string"
            case RowType.PRIMARY_KEY:
                return typeof field === "number"
            default:
                return false
        }
    }
}
