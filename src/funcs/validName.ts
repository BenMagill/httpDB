export default (name: string) => {
    if (
        name === "" ||
        name === undefined ||
        name === null ||
        name.includes(" ") ||
        name.includes(".")
    ) {
        return false
    }
    return true
}
