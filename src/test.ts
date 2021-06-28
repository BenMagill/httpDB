import { existsSync, mkdirSync } from "fs";
import { Database } from "./Database";
import { RowType } from "./Table";

// NEEDED IN PROPER SERVER
const dir = process.cwd() + "/data"
if (!existsSync(dir)){
    mkdirSync(dir);
}

const db = new Database("111")
db.createTable("na", {
    id: {
        "type": RowType.PRIMARY_KEY
    },
    name: {
        type: RowType.STRING,
    }
})

db.tables["na"].addOne({"name": "ben"})
db.save()


console.log(db)
console.log(db
    .tables["na"])
