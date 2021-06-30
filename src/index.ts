import express, { ErrorRequestHandler } from "express"
import { manager } from "./classes/Manager"
import dbRouter from "./routes/dbRoutes"
import otherRouter from "./routes/otherRoutes"
import tableRouter from "./routes/tableRoutes"
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))

// TODO: add authentication middleware

// Handles routes affecting a table
app.use("/:db/:table", (req, res, next) => {
    const [db, table] = manager.findTable(req.params.db, req.params.table)
    if (db && table) {
        req.options = {
            database: db,
            table: table
        }
        next()
    } else {
        throw new Error("Table or database not found")
    }
}, tableRouter)

// Handles routes affecting the database
app.use("/:db/", (req, res, next) => {
 
    const db = manager.findDb(req.params.db)
    if (db) {
        req.options = {
            database: db,
        }
        next()
    } else {
        throw new Error("Database not found")
    }
}, dbRouter)

app.use("/", otherRouter)

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    const response = {error: "An error has occured"}
    if (err.message) {
        response.error = err.message
    } 
    res.json(response)
}
app.use(errorHandler)

app.listen(3000)