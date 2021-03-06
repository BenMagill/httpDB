import { Database } from "../../src/classes/Database";
import { Table } from "../../src/classes/Table";

declare  global {
    namespace Express {
        export interface Request {
            options: {
                database: Database
                table?: Table
            }
        }
    }

    namespace NodeJS {
        export interface ProcessEnv {
            USERNAME: string
            PASSWORD: string
        }
    }

}