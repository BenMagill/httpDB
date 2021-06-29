import { readFileSync } from "fs"
import { writeFile } from "fs/promises"
import { FileExtension } from "../enums/FileTypes"
import { RowType } from "../enums/RowType"
import { queryExecutor } from "../queryExecutor"

export type ValidTypes = string | number | object | boolean | any[] | Date

interface Row {
    // Hacky solution
    type: RowType
    index?: boolean
    required?: boolean
    default?: any // Can't be used with PRIMARY_KEY. Works only when required false
    currentMax?: number // Used with PRIMARY_KEY. Only in Schema when on disk
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

    constructor(name: string, dbName: string, schema?: Schema) {
        this.name = name
        this.dbName = dbName

        if (schema) {
            // If schema then means new table

            this.rows = []
            this.rowCount = 0
            this.primaryKeyMax = 0

            const parsedSchema = Table.validateSchema(schema)

            if (!parsedSchema) {
                throw new Error("Invalid Table data")
            } else {
                this.schema = parsedSchema
            }

            // Save schema to disk
            this.saveSchema()

            this.saveData()
            this.saveInfo()
        } else {
            // Load from files
            // TODO
            // Load schema from file
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

    static validateSchema(schema: Schema): Schema | null {
        var hasPrimary = false

        for (const fieldName in schema) {
            if (Object.prototype.hasOwnProperty.call(schema, fieldName)) {
                const fieldProperties = schema[fieldName]

                if (fieldProperties.type === RowType.PRIMARY_KEY) {
                    // If already a primary key then error
                    if (hasPrimary) return null

                    hasPrimary = true
                }
            }
        }

        if (!hasPrimary) return null

        return schema
    }

    // TODO add type somehow
    addOne(row: { [key: string]: any }) {
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
                    if (fieldInfo.default && row[field] === undefined) {
                        row[field] = fieldInfo.default
                    }

                    // Check type
                    if (!this.validateField(fieldInfo.type, row[field])) {
                        throw new Error(
                            `Type of field "${field}" does not match input (${typeof row[
                                field
                            ]}) `
                        )
                    }
                }
            }
        }

        console.log(row)

        this.rows.push(row)
        
        this.primaryKeyMax += 1
        
        this.saveData()
        this.saveInfo()
    }

    find(query: any) {
        return queryExecutor(this.rows, query, this.schema)[0]
    }
    
    delete(query: any) {
        // TODO
        // Delete rows based on conditions
        const [rows, locations] = queryExecutor(this.rows, query, this.schema)
        console.log({rows, locations})
        for (let i = 0; i < locations.length; i++) {
            const index = locations[i];
            this.rows.splice(index, 1)
        }
        this.saveData()
        this.rowCount -= locations.length
    }   

    update(query: any) {
        // TODO
        // Update based on options
        const [rows, locations] = queryExecutor(this.rows, query, this.schema)
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
        this.saveData()

    }

    saveSchema() {
        var serialised = JSON.stringify(this.schema)
        writeFile(this.getFilePath(FileExtension.TABLE_SCHEMA), serialised)
    }

    saveInfo() {
        var data = {
            primary: this.primaryKeyMax,
        }
        writeFile(
            this.getFilePath(FileExtension.TABLE_INFO),
            JSON.stringify(data)
        )
    }

    saveData() {
        // Saves the row data
        // Schema only saved when saved so not needed here
        const data = JSON.stringify(this.rows)
        writeFile(this.getFilePath(FileExtension.TABLE), data)
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
