const fs = require('fs')
const path = './data/license.json'

function loadDB() {
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, '{}')
    }
    return JSON.parse(fs.readFileSync(path))
}

function saveDB(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

module.exports = { loadDB, saveDB }
