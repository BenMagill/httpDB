import express from "express"
import { writeFile } from "fs"

var otherRouter = express.Router()

otherRouter.post("*", (req, res) => {
    // CREATE A DB
    console.log(process.cwd())
    const dbName = req.body.name
    console.log(dbName)

    if (!dbName) res.json(false)

    // TODO: add reference to new db in a overall file used to knowing what dbs exist

    writeFile(`${process.cwd()} ${dbName}.db`, JSON.stringify({}), () => {})
})

otherRouter.get("*", (req, res) => {
    // GET ALL DBS
})

otherRouter.put("*", (req, res) => {

})

otherRouter.patch("*", (req, res) => {
    // UPDATE A DB
})

otherRouter.delete("*", (req, res) => {
    // DELETE A DB
})

export default otherRouter