var repeat = 100000

var f1 = () => {}
var f2 = () => {}
console.time("find")
for (let i = 0; i < repeat; i++) {
    f1()
}
console.timeEnd("find")

console.time("find2")
for (let i = 0; i < repeat; i++) {
    f2()
}
console.timeEnd("find2")
