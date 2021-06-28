declare namespace Express {
    export interface Request {
        options: {
            database? : string
            table? : string
        }
    }
}