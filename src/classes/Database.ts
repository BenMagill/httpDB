import { readFileSync, unlink } from "fs"
import { writeFile } from "fs/promises"
import { FileExtension } from "../enums/FileTypes"
import validName from "../funcs/validName"
import { log, Scope, Type } from "../logger"
import { Schema, Table } from "./Table"


export class Database {
    name: string 
    tables: {[key: string]: Table}
    path: string
    constructor (name: string, fromDisk: boolean) {
        // TODO Name must have no spaces or use "."
        if (!validName(name)) throw new Error(`Name of db "${name}" is not valid`)

        this.name = name
        this.path = `${process.cwd()}/data/${this.name}.${FileExtension.DATABASE}`
        this.tables = {}
        
        if (fromDisk) {
            log(Type.INFO, Scope.DATABASE, `Loading Database ${name} from disk`)
            const tableNamesRaw = readFileSync(`${process.cwd()}/data/${this.name}.db`, {"encoding": "utf-8"})
            const tableNames = JSON.parse(tableNamesRaw)
        
            for (let i = 0; i < tableNames.length; i++) {
                const tableName = tableNames[i];
                const table = new Table(tableName, this.name)
                this.tables[tableName] = table    
            }

        } else {
            log(Type.INFO, Scope.DATABASE, `Creating Database ${name}`)

        }

    }

    async save() {
        // save contents and all tables
        log(Type.INFO, Scope.DATABASE, `Saving Database ${this.name}`)
        const tableNames = []
        for (const tableName in this.tables) {
            if (Object.prototype.hasOwnProperty.call(this.tables, tableName)) {
                tableNames.push(tableName)                
                this.tables[tableName].saveData();
            }
        }

        const data = JSON.stringify(tableNames)
        await writeFile(`${process.cwd()}/data/${this.name}.db`, data)
        log(Type.INFO, Scope.DATABASE, `Saved Database ${this.name}`)
    }

    createTable(name: string, schema: Schema) {
        if (this.findTable(name)) throw new Error(`Table of name ${name} already exists in database ${this.name}`)
        const table = new Table(name, this.name, schema, this)
        this.tables[name] = table
        this.save()
        return table.name
    }

    deleteTable(name: string) {
        // Deletes a table from its name
        log(Type.WARN, Scope.DATABASE, `Deleting table ${name}`)

        const foundTable = this.findTable(name)
        if (foundTable) {
            delete this.tables[name]
            unlink(foundTable.getFilePath(FileExtension.TABLE), (e) => {if (e) throw new Error(e.message)})
            unlink(foundTable.getFilePath(FileExtension.TABLE_INFO), (e) => {if (e) throw new Error(e.message)})
            unlink(foundTable.getFilePath(FileExtension.TABLE_SCHEMA), (e) => {if (e) throw new Error(e.message)})
            this.save()
            log(Type.INFO, Scope.DATABASE, `Deleted table ${name}`)
            return true

        } else {
            throw new Error(`Table with name ${name} not found in database ${this.name}.`)
        }
    }

    findTable(name: string) {
        var tblFound = this.tables[name]
        return tblFound ? tblFound : null
    }

    getTables() {
        log(Type.INFO, Scope.DATABASE, `Getting all tables in database ${this.name}`)
        
        var tables = []
        for (const tableName in this.tables) {
            if (Object.prototype.hasOwnProperty.call(this.tables, tableName)) {
                tables.push(tableName)
            }
        }
        return tables
    }
}