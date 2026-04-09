const fs = require("fs")
const path = require("path")
const identity = require("./identity")

const CONFIG_PATH = path.join(__dirname, "../owner-config.json")

function loadConfig() {
  try { if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) } catch {}
  return {}
}
function saveConfig(data) {
  try {
    const updated = { ...loadConfig(), ...data }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8")
    return true
  } catch (e) { console.log("saveConfig error:", e.message); return false }
}
function getNamaBot() {
  return loadConfig().nama || identity.nama
}

// FIX: Hitung plugin secara dinamis dari folder plugins
function countPlugins() {
  try {
    const pluginDir = path.join(__dirname)
    const files = fs.readdirSync(pluginDir).filter(f => f.endsWith(".js"))
    let total = 0
    const byKat = {}
    for (const f of files) {
      try {
        delete require.cache[require.resolve(path.join(pluginDir, f))]
        const p = require(path.join(pluginDir, f))
        if (p.name) {
          const kat = "Fitur"
          total++
          if (!byKat[kat]) byKat[kat] = []
          byKat[kat].push(`.${p.name}`)
        }
      } catch {}
    }
    return total
  } catch { return identity.plugins?.length || 80 }
}

module.exports = {
  name: "botinfo",
  alias: ["about", "tentangbot", "siapakamu", "whoami", "ownersetting"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const rawText = m.message?.conversation || m.message?.extendedTextMessage?.text || ""
    const command = rawText.trim().split(" ")[0].replace(".", "").toLowerCase()

    // ===== SETNAME — ganti nama bot (owner only) =====
    if (command === "setname") {
      const ownerNumber = identity.nomorPembuat + "@s.whatsapp.net"
      if (sender !== ownerNumber) {
        return sock.sendMessage(from, { text: "❌ Perintah ini hanya untuk owner bot." })
      }
      const namaBaru = args.join(" ").trim()
      if (!namaBaru) {
        return sock.sendMessage(from, {
          text: `⚠️ *Cara pakai .setname:*\n\`.setname <nama baru>\`\n\n📛 Nama sekarang: *${getNamaBot()}*`
        })
      }
      const berhasil = saveConfig({ nama: namaBaru })
      if (berhasil) {
        try { await sock.updateProfileName(namaBaru) } catch {}
        return sock.sendMessage(from, {
          text: `✅ Nama bot berhasil diubah!\n📛 *${getNamaBot()}* → *${namaBaru}*`
        })
      } else {
        return sock.sendMessage(from, { text: "❌ Gagal menyimpan nama." })
      }
    }

    // ===== OWNERSETTING — menu setting owner =====
    if (command === "ownersetting") {
      const ownerNumber = identity.nomorPembuat + "@s.whatsapp.net"
      if (sender !== ownerNumber) {
        return sock.sendMessage(from, { text: "❌ Perintah ini hanya untuk owner bot." })
      }
      return sock.sendMessage(from, {
        text: `⚙️ *OWNER SETTINGS*\n━━━━━━━━━━━━━━━━━━\n📛 Nama Bot : *${getNamaBot()}*\n📦 Versi    : ${identity.versi}\n👨‍💻 Pembuat  : ${identity.pembuat}\n\n🛠️ *Perintah Owner:*\n• \`.setname <nama>\` — ganti nama bot\n• \`.setbio <teks>\` — ganti bio bot\n• \`.setnama <nama>\` — alias setname\n• \`.setpp\` (reply foto) — ganti foto profil\n\n💾 Config: owner-config.json`
      })
    }

    // ===== BOTINFO — info lengkap bot =====
    const namaBot = getNamaBot()
    const totalPlugin = countPlugins()

    // Kelompokkan dari identity.plugins
    const byKategori = {}
    for (const p of (identity.plugins || [])) {
      if (!byKategori[p.kategori]) byKategori[p.kategori] = []
      byKategori[p.kategori].push(`.${p.cmd}`)
    }

    const kategoriText = Object.entries(byKategori)
      .map(([kat, cmds]) => `📌 *${kat}* (${cmds.length})\n${cmds.join(", ")}`)
      .join("\n\n")

    await sock.sendMessage(from, {
      text: `🤖 *TENTANG ${namaBot.toUpperCase()}*
━━━━━━━━━━━━━━━━━━
📛 Nama    : ${namaBot}
🔖 Versi   : ${identity.versi}
👨‍💻 Pembuat : ${identity.pembuat}
📱 Kontak  : wa.me/${identity.nomorPembuat}
🌐 Library : ${identity.library}
🗣️ Bahasa  : ${identity.bahasa}

📋 *Deskripsi:*
${identity.deskripsi}

━━━━━━━━━━━━━━━━━━
📦 *TOTAL PLUGIN: ${totalPlugin} Plugin*
━━━━━━━━━━━━━━━━━━

${kategoriText}

━━━━━━━━━━━━━━━━━━
💡 Ketik *.menu* untuk panduan lengkap
💬 Ketik *.ai <pertanyaan>* untuk tanya AI`
    })
  }
}
