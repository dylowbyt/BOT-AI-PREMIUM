const fs = require("fs")
const { searchGithub } = require("./github")
const { cleanCode } = require("./cleaner")

async function installFeature(nama) {

  if (nama === "stiker") {
    const code = fs.readFileSync("./templates/stiker.js", "utf-8")
    fs.writeFileSync("./plugins/stiker.js", code)
    return "✅ stiker siap dipakai"
  }

  const raw = await searchGithub(nama)
  if (!raw) return "❌ fitur tidak ditemukan"

  const cleaned = await cleanCode(raw)

  fs.writeFileSync(`./plugins/${nama}.js`, cleaned)

  return `✅ fitur ${nama} berhasil ditambahkan`
}

module.exports = { installFeature }
