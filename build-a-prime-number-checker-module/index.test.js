const assert = require("node:assert/strict");
const primerNumberChecker = require("./index");

assert.strictEqual(
    primerNumberChecker.isPrime(11),
    true
)

assert.strictEqual(
    primerNumberChecker.isPrime(4),
    false
)
