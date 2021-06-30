export default (name: string) => {
    if (name === "" || name === undefined || name === null) {
        return false
    }
    return true
}