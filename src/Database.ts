import { readFile, writeFile } from "fs/promises"
import { Schema, Table } from "./Table"


export class Database {
    name: string 
    tables: {[key: string]: Table}
    constructor (name: string) {
        // Name must have no spaces or use "."
        this.name = name

        this.tables = {}

    }

    // Must be run when db is not new 
    async load() {
        const tableNamesRaw = await readFile(`${process.cwd()}/data/${this.name}.db`, {"encoding": "utf-8"})
        const tableNames = JSON.parse(tableNamesRaw)

        for (let i = 0; i < tableNames.length; i++) {
            const tableName = tableNames[i];
            const table = new Table(tableName, this.name)
            this.tables[tableName] = table    
        }
    }

    async save() {
        // save contents and all tables

        const tableNames = []
        for (const tableName in this.tables) {
            if (Object.prototype.hasOwnProperty.call(this.tables, tableName)) {
                tableNames.push(tableName)                
                this.tables[tableName].save();
            }
        }

        const data = JSON.stringify(tableNames)
        await writeFile(`${process.cwd()}/data/${this.name}.db`, data)
    }

    createTable(name: string, schema: Schema) {
        const table = new Table(name, this.name, schema)
        this.tables[name] = table
        table.save()
    }
}