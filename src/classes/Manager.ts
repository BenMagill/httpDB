import { existsSync, readFileSync, unlink, writeFileSync } from "fs"
import { writeFile } from "fs/promises"
import { Database } from "./Database"
import { Table } from "./Table"

interface ManagerFile {
    databases: Array<any>
}

class Manager {
    // Used to handle all databases and loading of them
    path = `${process.cwd()}/data/manager.cfg`

    databases: {
        [key: string]: Database
    }
    
    constructor() {
        this.databases = {}
        console.log("Loading all databases")
        if (!existsSync(this.path)) {
            console.log("No main file found. Creating...")
            writeFileSync(this.path, JSON.stringify({databases: []}))
            
        } else {
            console.log("Reading data")
            const dataS = readFileSync(this.path, {encoding: "utf-8"}) 
            const data: ManagerFile = JSON.parse(dataS)
    
            for (let i = 0; i < data.databases.length; i++) {
                const dbName = data.databases[i];
                const db = new Database(dbName, true)
                this.databases[dbName] = db
            }
        }
        console.log(this)
    }

    async save() {
        const dbNames = []
        for (const dbName in this.databases) {
            if (Object.prototype.hasOwnProperty.call(this.databases, dbName)) {
                dbNames.push(dbName)                
                this.databases[dbName].save();
            }
        }

        const data = JSON.stringify({databases: dbNames})
        await writeFile(this.path, data)

    }

    createDb(name: string) {
        if (name === "" || name === undefined || name === null) {
            throw new Error("Invalid name")
        }
        const db = new Database(name, false)
        this.databases[name] = db
        this.save()
    }

    deleteDb(name: string) {
        // Must delete the db and all tables
        const foundDb = this.findDb(name)
        if (!foundDb) {
            throw new Error(`Database with name ${name} not found`)
        }

        // Go through and delete each table
        for (const tableName in foundDb.tables) {
            if (Object.prototype.hasOwnProperty.call(foundDb.tables, tableName)) {
                foundDb.deleteTable(tableName)                
            }
        }

        unlink(foundDb.path, (e) => {if (e) throw new Error(e.message)})

        delete this.databases[name]

        return true
    }

    allDbs() {
        const dbs = []
        for (const dbName in this.databases) {
            if (Object.prototype.hasOwnProperty.call(this.databases, dbName)) {
                dbs.push(dbName)
            }
        }
        return dbs
    }

    findDb(name: string) {
        var dbFound = this.databases[name]
        return dbFound ? dbFound : null
    }

    findTable(database: string, table: string): [Database, Table] | [null, null] {
        const db = this.findDb(database)
        if (db) {
            const tbl = db.findTable(table)
            if (tbl) {
                return [db, tbl]
            }
        }
        return [null, null]
    }
}

export const manager = new Manager()
 