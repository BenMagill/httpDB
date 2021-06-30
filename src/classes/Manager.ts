import { existsSync, readFileSync, unlink, writeFileSync } from "fs"
import { writeFile } from "fs/promises"
import validName from "../funcs/validName"
import { log, Scope, Type } from "../logger"
import { Database } from "./Database"
import { Table } from "./Table"

interface ManagerFile {
    databases: Array<any>,
    authentication: {
        username: string, 
        password: string
    }
}

class Manager {
    // Used to handle all databases and loading of them
    path = `${process.cwd()}/data/manager.cfg`

    databases: {
        [key: string]: Database
    }

    username = process.env.username?process.env.username:"ADMIN" 
    password = process.env.password?process.env.password:"ADMIN"

    constructor() {
        this.databases = {}

        log(Type.INFO, Scope.MANAGER, "Loading all databases")
        if (!existsSync(this.path)) {
            log(Type.INFO, Scope.MANAGER, "No main file found. Creating...")
            var initialData = {
                databases: [],
            }
            writeFileSync(this.path, JSON.stringify(initialData))
        } else {
            log(Type.INFO, Scope.MANAGER, "Reading data from file")
            const dataS = readFileSync(this.path, { encoding: "utf-8" })
            const data: ManagerFile = JSON.parse(dataS)
 
            for (let i = 0; i < data.databases.length; i++) {
                const dbName = data.databases[i]
                const db = new Database(dbName, true)
                this.databases[dbName] = db
            }
        }
    }

    async save() {
        const oldFile = readFileSync(this.path, {encoding: "utf-8"})
        var managerData: ManagerFile = JSON.parse(oldFile)
        const dbNames = []
        for (const dbName in this.databases) {
            if (Object.prototype.hasOwnProperty.call(this.databases, dbName)) {
                dbNames.push(dbName)
                this.databases[dbName].save()
            }
        }

        managerData.databases = dbNames 

        const data = JSON.stringify(managerData)
        await writeFile(this.path, data)
    }

    createDb(name: string) {
        if (this.findDb(name)) throw new Error(`Database ${name} already exists`)
        if (!validName(name)) {
            throw new Error("Invalid name for a database")
        }
        const db = new Database(name, false)
        this.databases[name] = db
        this.save()

        return db.name
    }

    deleteDb(name: string) {
        // Must delete the db and all tables
        const foundDb = this.findDb(name)
        if (!foundDb) {
            throw new Error(`Database with name ${name} not found`)
        }

        // Go through and delete each table
        for (const tableName in foundDb.tables) {
            if (
                Object.prototype.hasOwnProperty.call(foundDb.tables, tableName)
            ) {
                foundDb.deleteTable(tableName)
            }
        }

        unlink(foundDb.path, (e) => {
            if (e) throw new Error(e.message)
        })

        delete this.databases[name]

        // Update config 
        this.save()

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

    findTable(
        database: string,
        table: string
    ): [Database, Table] | [null, null] {
        const db = this.findDb(database)
        if (db) {
            const tbl = db.findTable(table)
            if (tbl) {
                return [db, tbl]
            }
        }
        return [null, null]
    }

    authenticate(username: string, password: string) {
        if (this.username === username && this.password === password) return true
        return false
    }
}

export const manager = new Manager()
