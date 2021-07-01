import { readdir, unlink } from "fs"
import path from "path"

console.log("Deleting logs")
var folderPath = process.cwd() + "/logs/"
readdir(folderPath, (err, files) => {
    if (err) throw err

    for (const file of files) {
        unlink(path.join(folderPath, file), (err) => {
            if (err) throw err
        })
    }
})
