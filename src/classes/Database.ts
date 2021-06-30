import { readFileSync, unlink } from "fs"
import { writeFile } from "fs/promises"
import { FileExtension } from "../enums/FileTypes"
import { Schema, Table } from "./Table"


export class Database {
    name: string 
    tables: {[key: string]: Table}
    path: string
    constructor (name: string, fromDisk: boolean) {
        // Name must have no spaces or use "."
        this.name = name
        this.path = `${process.cwd()}/data/${this.name}.${FileExtension.DATABASE}`
        this.tables = {}
        
        if (fromDisk) {
            const tableNamesRaw = readFileSync(`${process.cwd()}/data/${this.name}.db`, {"encoding": "utf-8"})
            const tableNames = JSON.parse(tableNamesRaw)
        
            for (let i = 0; i < tableNames.length; i++) {
                const tableName = tableNames[i];
                const table = new Table(tableName, this.name)
                this.tables[tableName] = table    
            }

        }

    }

    async save() {
        // save contents and all tables
        const tableNames = []
        for (const tableName in this.tables) {
            if (Object.prototype.hasOwnProperty.call(this.tables, tableName)) {
                tableNames.push(tableName)                
                this.tables[tableName].saveData();
            }
        }

        const data = JSON.stringify(tableNames)
        await writeFile(`${process.cwd()}/data/${this.name}.db`, data)
    }

    createTable(name: string, schema: Schema) {
        const table = new Table(name, this.name, schema)
        this.tables[name] = table
        this.save()
        return table.name
    }

    deleteTable(name: string) {
        // Deletes a table from its name
        const foundTable = this.findTable(name)
        if (foundTable) {
            delete this.tables[name]
            unlink(foundTable.getFilePath(FileExtension.TABLE), (e) => {if (e) throw new Error(e.message)})
            unlink(foundTable.getFilePath(FileExtension.TABLE_INFO), (e) => {if (e) throw new Error(e.message)})
            unlink(foundTable.getFilePath(FileExtension.TABLE_SCHEMA), (e) => {if (e) throw new Error(e.message)})
            this.save()
            return true
        } else {
            throw new Error(`Table with name ${name} not found.`)
        }
    }

    findTable(name: string) {
        var tblFound = this.tables[name]
        return tblFound ? tblFound : null
    }

    getTables() {
        var tables = []
        for (const tableName in this.tables) {
            if (Object.prototype.hasOwnProperty.call(this.tables, tableName)) {
                tables.push(tableName)
            }
        }
        return tables
    }
}