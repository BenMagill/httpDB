import express from "express"

var tableRouter = express.Router()

// for adding data
tableRouter.post("*", (req, res) => {
    console.log(req.options)
    res.send("INSERT INTO A table")
})

tableRouter.get("*", (req, res) => {
    // GET ROWS FROM TABLE
})

export default tableRouter