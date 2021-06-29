import express from "express"
import { manager } from "../classes/Manager"

var otherRouter = express.Router()

otherRouter.post("*", (req, res) => {
    // CREATE A DB
    try {
        manager.createDb(req.body.name)
        res.json("ok")

    } catch (e) {
        res.json("fail")
    }
})

otherRouter.get("*", (req, res) => {
    // GET ALL DBS
    res.json(manager.allDbs())
})

otherRouter.put("*", (req, res) => {

})

otherRouter.patch("*", (req, res) => {
    // UPDATE A DB
    // IDK what you would update
})

otherRouter.delete("*", (req, res) => {
    // DELETE A DB
    const result = manager.deleteDb(req.body.name)
    if (result) {
        res.json("ok")
    } else {
        res.json("fail")
    }
})

export default otherRouter