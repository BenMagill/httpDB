import express from "express"

var dbRouter = express.Router()

dbRouter.post("*", (req, res) => {
    req.options.database.createTable(req.body.name, req.body.schema)
    res.json(true)
    
})

dbRouter.get("*", (req, res) => {
    // GET ALL TABLES IN DB
    res.json(req.options.database.getTables())
        
})

dbRouter.put("*", (req, res) => {

})

dbRouter.patch("*", (req, res) => {
    // TODO: UPDATE TABLE SCHEMA
})

dbRouter.delete("*", (req, res) => {
    // DELETE A TABLE
    req.options.database.deleteTable(req.body.name)
    res.json(true)
})




export default dbRouter