import { existsSync, readFileSync } from "fs"

var removeContainer = (str: string) => {
    return str.substr(1, str.length-2)
}

export const parse = (filePath: string) => {
    var parsedRows = []
    if (existsSync(filePath)) {
        var fileText = readFileSync(filePath, {encoding: "utf-8"})
        var logRows = fileText.split("\n")
        for (let i = 0; i < logRows.length; i++) {
            const logRow = logRows[i];
            if (logRow != "") {
                var split = logRow.split(" ")
                var time = removeContainer(split[0])
                var type = removeContainer(split[1])
                var scope = removeContainer(split[2])
                split.splice(0, 3)
                var message = split.join(" ")
                parsedRows.push({time, type, scope, message})
            }
        }

    }
    return parsedRows
}

// parse(process.cwd() + "/logs/2021-06-30T15.log")

export default parse