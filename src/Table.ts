import { readFile, writeFile } from "fs/promises"
import { FileExtension } from "./FileTypes"

export enum RowType {
    STRING,
    NUMBER,
    OBJECT,
    ARRAY,
    BOOLEAN,
    DATE,
    PRIMARY_KEY
}

interface Row {
    // Hacky solution
    type: RowType,
    index?: boolean
    required?: boolean
    default?: any // Can't be used with PRIMARY_KEY. Works only when required false
    currentMax?: number // Used with PRIMARY_KEY. Only in Schema when on disk
}
 
export interface Schema {
    // key is the name of the row 
    [key: string]: Row     
}

interface SchemaFromFile extends Schema {
    [key: string]: {
        type: RowType.PRIMARY_KEY,
        currentMax: number
    }
}

export class Table {
    name: string
    dbName: string

    primaryKeyMax: number

    schema: Schema // The structure of the table
    
    rows: Array<any> // All rows in the db
    rowCount: number // Number of rows. 

    // indexes: array

    constructor (name: string, dbName: string, schema?: Schema) {
        this.name = name
        this.dbName = dbName
        
        if (schema) { // If schema then means new table

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
            writeFile(this.getFilePath("sch"), this.serialiseSchema())
    

        } else { // Load from file
            // TODO
            this.schema = {}
            this.rows = []
            this.rowCount = 0
            this.primaryKeyMax = 0
        }
    }

    static validateSchema (schema: Schema): Schema | null {

        var hasPrimary = false

        for (const fieldName in schema) {
            if (Object.prototype.hasOwnProperty.call(schema, fieldName)) {
                const fieldProperties = schema[fieldName];

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
    addOne(row: {[key: string]: any}) {
        // Check if inputted rows match schema options
        for (const field in this.schema) {
            if (Object.prototype.hasOwnProperty.call(this.schema, field)) {
                const fieldInfo = this.schema[field];

                if (fieldInfo.type === RowType.PRIMARY_KEY) {
                    row[field] = this.primaryKeyMax + 1                    
                } else {
                    // If required make sure inputted
                    if (fieldInfo.required) {
                        if (row[field] === undefined) {
                            throw new Error(`Field "${field} required on table ${this.name}"`)
                        }
                    } 
                    // If default provided and not inputted
                    if (fieldInfo.default && row[field] === undefined) {
                        row[field] = fieldInfo.default
                    }
                    
                    // Check type
                    if (!this.validateField(fieldInfo.type, row[field])) {
                        throw new Error(`Type of field "${field}" does not match input (${typeof row[field]}) `)
                    }

                }
            }
        }

        console.log(row)

        this.rows.push(row)
        
        this.primaryKeyMax += 1
    }

    delete() {

    }

    update() {

    }

    save() {
        // Saves the row data
        // Schema only saved when saved so not needed here
        const data = JSON.stringify(this.rows)
        writeFile(this.getFilePath("tbl"), data)
    }

    async load() {
        // Load schema from file
        const schemaDataSerialised = await readFile(this.getFilePath(FileExtension.SCHEMA),{encoding: "utf-8"}) 
        const [schemaData, primaryMax] = this.deserialiseSchema(schemaDataSerialised)
        this.schema = schemaData
        this.primaryKeyMax = primaryMax

        // Load data from file
        const dataSerialised = await readFile(this.getFilePath(FileExtension.TABLE),{encoding: "utf-8"})
        const data: Array<any> = JSON.parse(dataSerialised)
        this.rows = data
        this.rowCount = data.length
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

    serialiseSchema() {
        var data = {...this.schema}
        // Add Current Primary key max to correct field
        for (const field in data) {
            if (Object.prototype.hasOwnProperty.call(data, field)) {
                const fieldInfo = data[field];
                if (fieldInfo.type === RowType.PRIMARY_KEY) {
                    fieldInfo.currentMax = this.primaryKeyMax
                }
            }
        }
        var serialised = JSON.stringify(data)
        return serialised
    }

    deserialiseSchema(data: string): [Schema, number] {
        var deserialised: SchemaFromFile = JSON.parse(data)

        var primaryMax = 0

        // Find primary
        for (const field in deserialised) {
            if (Object.prototype.hasOwnProperty.call(deserialised, field)) {
                const fieldInfo = deserialised[field];
                if (fieldInfo.type === RowType.PRIMARY_KEY) {
                    primaryMax = fieldInfo.currentMax
                }
            }
        }

        var a: Schema = deserialised
        
        return [a, primaryMax]
    }

}