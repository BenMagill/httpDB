import express from "express"
import { decode } from "rison"

var tableRouter = express.Router()

// for adding data
tableRouter.post("*", (req, res) => {
    const row = req.body
    req.options.table?.addOne(row)
    res.json(row)
})

tableRouter.get("*", (req, res) => {
	// Move to Table Class
    
    // GET ROWS FROM TABLE
    var query = req.query.q
    var conditions = {}
    if (query) {
        conditions = decode(decodeURIComponent(String(query)))
    }
    res.json(
        req.options.table?.find(conditions, req.options.database)
    )

    
})

tableRouter.delete("*", (req, res) => {
    // DELETE ROWS FROM TABLE
    var query = req.body
    res.json(req.options.table?.delete(query))
})

tableRouter.patch("*", (req, res) => {
    // UPDATE ROWS
    // GET ROWS FROM TABLE
    var query = req.body
    res.json(req.options.table?.update(query))
})

export default tableRouter
