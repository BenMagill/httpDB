import express from "express"
import { decode } from "rison"

var tableRouter = express.Router()

// for adding data
tableRouter.post("*", (req, res) => {

    const row = req.body
    // TODO: ADD to table
    req.options.table?.addOne(row)
    res.send("INSERT INTO A table")
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
        req.options.table?.find(conditions)
    )

    
})

tableRouter.delete("*", (req, res) => {
    // DELETE ROWS FROM TABLE
    var query = req.body
    req.options.table?.delete(query)
    res.json("ok")
})

tableRouter.patch("*", (req, res) => {
    // UPDATE ROWS
    // GET ROWS FROM TABLE
    var query = req.body
    req.options.table?.update(query)
    res.json("ok")
})

export default tableRouter