import express from "express"
import { manager } from "../classes/Manager"

var otherRouter = express.Router()

otherRouter.post("*", (req, res) => {
    // CREATE A DB
    manager.createDb(req.body.name)
    console.info(`Creating a database with name ${req.body.name}`)
    res.json(true)
})

otherRouter.get("*", (req, res) => {
    // GET ALL DBS
    console.info("Getting all databases")
    res.json(manager.allDbs())
})

otherRouter.put("*", (req, res) => {
    res.status(400).json("not in use")
})

otherRouter.patch("*", (req, res) => {
    // UPDATE A DB
    // IDK what you would update
    res.status(400).json("not in use")
})

otherRouter.delete("*", (req, res) => {
    // DELETE A DB
    manager.deleteDb(req.body.name)
    console.warn(`Deleting database ${req.body.name} permenantly and all tables within!`)
    res.json(true)
})

export default otherRouter