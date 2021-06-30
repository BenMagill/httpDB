import { Schema } from "../classes/Table"
import arrayOfRange from "./arrayOfRange"
import { isEmptyObject } from "./isEmptyObject"

/**
 * {var:{$eq:value}}
 * {var:{$lt:12}}
 * {var:{$gt:12}}
 * {var:{$lte:12}}
 * {var:{$gte:12}}
 * {var:{$ne:12}}
 * {var:{$in:[12,13,41]}}
 * {var:{$btwn:[1,2]}}
 * {$or:[var:1,var2:b]}
 * {var:a,var2:b}
 */

enum Operator {
    "$eq" = "$eq",
    "$lt" = "$lt",
    "$gt" = "$gt",
    "$lte" = "$lte",
    "$gte" = "$gte",
    "$ne" = "$ne",
    "$in" = "$in",
    "$btwn" = "$btwn",
}
// TODO: use types as broken atm
type Query = {
    [field: string]: 
        { [key in Operator]: any }
        | { $in: Array<any> }
        | { $btwn: [any, any] }
}
    |{"$or"?: [Query, Query]}
    |{"$and"?: [Query, Query]}


type QueryExecutorResponse = [any[], number[]]

// TODO: improve readability and add better checks for invalid input
// Could return location of rows for fast update and delete
export function queryExecutor(array: Array<any>, query: any, schema: Schema): QueryExecutorResponse {
    const joins = ["$and", "$or"]
    console.log({ query, array, schema })
    if (isEmptyObject(query)) {
        console.log("no query")
        return [array , [...arrayOfRange(array.length)]]
    }
	var locations: number[] = []
    for (const key in query) {
        if (Object.prototype.hasOwnProperty.call(query, key)) {
            const element = query[key]
            const variableName = key
            console.log({ variableName })
            if (joins.includes(key)) {
                console.log("and or or ")
                var leftQ = element[0]
                var rightQ = element[1]
                console.log({ leftQ, rightQ })
                const [leftResult, leftLocations]: QueryExecutorResponse = queryExecutor([...array], leftQ, schema)
                const [rightResult, rightLocations]: QueryExecutorResponse = queryExecutor([...array], rightQ, schema)
                if (key === "$and") {
                    return [andCombine(leftResult, rightResult), leftLocations.filter(value => rightLocations.includes(value))]
                } else {
                    // OR
					return [orCombine(leftResult, rightResult), Array.from(new Set(leftLocations.concat(rightLocations)))]
                }
            } else {
                // Key is the var name
                var rowData = schema[key]
                if (!rowData) throw new Error(`Column ${key} does not exist`)

                // Do looking through based on conditions
                for (const operator in element) {
                    if (
                        Object.prototype.hasOwnProperty.call(element, operator)
                    ) {
                        const match = element[operator]
						var i = -1
                        array = array.filter((row) => {
							i++
							var result = keepRow(row, variableName, operator, match)
							if (result) locations.push(i)
                            return result
                        })
                        console.log(array)
						console.log(locations)
                    }
                }
            }

            // Only use first item in object. also ignore $set as used in updating not finding
            if (key != "$set") break
        }
    }
    return [array, locations]
}

const keepRow = (
    row: any,
    variable: string,
    operator: string,
    match: string | Array<any>
) => {
    switch (operator) {
        case "$eq":
            return row[variable] == match
        case "$lt":
            return row[variable] < match
        case "$lte":
            return row[variable] <= match
        case "$gt":
            return row[variable] > match
        case "$gte":
            return row[variable] >= match
        case "$ne":
            return row[variable] != match
        case "$in":
            return Array.isArray(match)
                ? !!match.find((i) => i === row[variable])
                : false
        case "$btn":
            return row[variable] > match[0] && row[variable] < match[1]
        default:
            return false
    }
}

const andCombine = (a1: Array<any>, a2: Array<any>) => {
    // Combine two arrays if item in both
    // TODO: use binary search as items ids stored in order
    var result = []
    for (let index = 0; index < a1.length; index++) {
        const elem = a1[index]
        const id = elem.id

        for (let index2 = 0; index2 < a2.length; index2++) {
            const id2 = a2[index2].id
            if (id === id2) result.push(elem)
        }
    }
	return result
}

const orCombine = (a1: Array<any>, a2: Array<any>) => {
    // Combine two arrays if item in either (do not produce duplicates)
	var result = []
	var idsFound: any = {}

	// Add all of first array
	for (let i = 0; i < a1.length; i++) {
		const item = a1[i];
		result.push(item)
		idsFound[item.id] = true
	}

	for (let i = 0; i < a2.length; i++) {
		const item = a2[i];
		if (!idsFound[item.id]) {
			result.push(item)
		}
	}

	return result
}
