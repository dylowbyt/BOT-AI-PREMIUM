const crypto = require('crypto')

function generateLicense(name = 'USER') {
    const random = crypto.randomBytes(3).toString('hex').toUpperCase()
    const time = Date.now().toString().slice(-4)

    return `XYA-${name.toUpperCase()}-${time}-${random}`
}

// contoh pakai
const key = generateLicense('ANDI')
console.log(key)
