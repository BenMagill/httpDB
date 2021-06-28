import express from "express"
import dbRouter from "./dbRoutes"
import otherRouter from "./otherRoutes"
import tableRouter from "./tableRoutes"
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))

// TODO: add authentication middleware

// Handles routes affecting a table
app.use("/:db/:table", (req, res, next) => {
    req.options = {
        database: req.params.db,
        table: req.params.table
    }
    next()
}, tableRouter)

// Handles routes affecting the database
app.use("/:db/", (req, res, next) => {
    req.options = {
        database: req.params.db,
    }
    next()
}, dbRouter)

app.use("/", otherRouter)

app.listen(8080)