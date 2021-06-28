import express from "express"

var dbRouter = express.Router()

dbRouter.post("*", (req, res) => {
    res.send(`ADD TABLE TO DB ${req.options.database} `)
})

dbRouter.get("*", (req, res) => {
    // GET ALL TABLES IN DB
})

dbRouter.put("*", (req, res) => {

})

dbRouter.patch("*", (req, res) => {
    // UPDATE TABLE  INFO / COLUMNS
})

dbRouter.delete("*", (req, res) => {
    // DELETE A TABLE
})




export default dbRouter