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

const getFileName = (dateISO: string) => {
    return dateISO.split(":")[0]
}

const getPath = () => {
    return `${process.cwd()}/logs/${getFileName(new Date().toISOString())}.log`
}

var currDay = getFileName(new Date().toISOString())
var stream = createWriteStream(getPath(), {flags: "a"})

export const log = (type: Type, scope: Scope, message: string) => {
    const date = new Date().toISOString()
    const text = `[${date}] [${type}] [${scope}] ${message}`
    console.log(text)
    
    const day = getFileName(date)
    if (currDay !== day) {
        // need to swap stream to new file
        currDay = day
        stream.end()
        stream = createWriteStream(getPath(), {flags: "a"})
    } 

    stream.write(text + "\n")
}

