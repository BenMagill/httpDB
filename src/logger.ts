import { createWriteStream } from "fs"

export enum Type {
    INFO = "INFO",
    WARN = "WARNING",
    ERROR = "ERROR",
}

export enum Scope {
    MANAGER = "MANAGER",
    DATABASE = "DATABASE",
    TABLE = "TABLE",
    OTHER = "OTHER",
    UNKNOWN = "UNKNOWN"
}

var currDay = new Date().toISOString().split(":")[0]
var stream = createWriteStream(`${process.cwd()}/logs/${currDay}.log`, {flags: "a"})

export const log = (type: Type, scope: Scope, message: string) => {
    const date = new Date().toISOString()
    const text = `[${date}] [${type}] [${scope}] ${message}`
    console.log(text)
    
    const day = date.split(":")[0]
    if (currDay !== day) {
        // need to swap stream to new file
        currDay = day
        stream.end()
        stream = createWriteStream(`${process.cwd()}/logs/${day}.log`, {flags: "a"})
    } 

    stream.write(text + "\n")
}

