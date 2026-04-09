const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const fs = require("fs")
const path = require("path")

const ARSIP_DIR = path.join(__dirname, "../arsip-data")
const ARSIP_INDEX = path.join(ARSIP_DIR, "index.json")

function ensureDir() {
  if (!fs.existsSync(ARSIP_DIR)) fs.mkdirSync(ARSIP_DIR, { recursive: true })
}

function loadIndex() {
  try {
    if (fs.existsSync(ARSIP_INDEX)) return JSON.parse(fs.readFileSync(ARSIP_INDEX, "utf-8"))
  } catch {}
  return {}
}

function saveIndex(data) {
  try { fs.writeFileSync(ARSIP_INDEX, JSON.stringify(data, null, 2), "utf-8") } catch {}
}

module.exports = {
  name: "arsip",
  alias: ["archive", "simpan", "savemsg"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const sub = args[0]?.toLowerCase()

    ensureDir()

    // ===== LIST — tampilkan arsip =====
    if (sub === "list" || sub === "daftar") {
      const index = loadIndex()
      const userArsip = Object.entries(index).filter(([, v]) => v.owner === sender || v.grup === from)

      if (!userArsip.length) {
        return sock.sendMessage(from, {
          text: `📦 *ARSIP PESAN*\n\nBelum ada yang diarsipkan.\n\nCara arsip:\n• Reply pesan/foto lalu ketik *.arsip simpan <label>*\n• Lihat daftar: *.arsip list*\n• Lihat isi: *.arsip lihat <id>*\n• Hapus: *.arsip hapus <id>*`
        })
      }

      let txt = `📦 *ARSIP PESAN* (${userArsip.length} item)\n━━━━━━━━━━━━━━━\n`
      userArsip.forEach(([id, v], i) => {
        const tgl = new Date(v.timestamp).toLocaleString("id-ID")
        txt += `\n${i + 1}. 🏷️ *${v.label || "Tanpa label"}*\n   📌 ID: \`${id}\`\n   📅 ${tgl}\n   📂 Tipe: ${v.type}`
      })
      txt += `\n\n💡 Ketik *.arsip lihat <id>* untuk melihat isinya`
      return sock.sendMessage(from, { text: txt })
    }

    // ===== LIHAT — tampilkan isi arsip =====
    if (sub === "lihat" || sub === "view") {
      const id = args[1]
      if (!id) return sock.sendMessage(from, { text: "⚠️ Format: .arsip lihat <id>" })

      const index = loadIndex()
      const item = index[id]
      if (!item) return sock.sendMessage(from, { text: `❌ Arsip dengan ID *${id}* tidak ditemukan` })

      const filePath = path.join(ARSIP_DIR, item.file)
      if (item.type === "teks") {
        const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : item.content
        return sock.sendMessage(from, {
          text: `📦 *ARSIP: ${item.label || "Tanpa label"}*\n━━━━━━━━━━━━━━━\n\n${content}\n\n━━━━━━━━━━━━━━━\n📅 ${new Date(item.timestamp).toLocaleString("id-ID")}`
        })
      }

      if (!fs.existsSync(filePath)) {
        return sock.sendMessage(from, { text: "❌ File arsip sudah tidak tersedia (mungkin sudah dihapus dari server)" })
      }

      const fileBuffer = fs.readFileSync(filePath)
      if (item.type === "gambar") {
        await sock.sendMessage(from, { image: fileBuffer, caption: `📦 Arsip: *${item.label || "Tanpa label"}*` })
      } else if (item.type === "video") {
        await sock.sendMessage(from, { video: fileBuffer, caption: `📦 Arsip: *${item.label || "Tanpa label"}*` })
      } else if (item.type === "audio") {
        await sock.sendMessage(from, { audio: fileBuffer, mimetype: "audio/mpeg" })
      } else {
        await sock.sendMessage(from, { document: fileBuffer, fileName: item.file, mimetype: "application/octet-stream" })
      }
      return
    }

    // ===== HAPUS =====
    if (sub === "hapus" || sub === "delete") {
      const id = args[1]
      if (!id) return sock.sendMessage(from, { text: "⚠️ Format: .arsip hapus <id>" })

      const index = loadIndex()
      const item = index[id]
      if (!item) return sock.sendMessage(from, { text: `❌ ID *${id}* tidak ditemukan` })

      // Hapus file jika ada
      try {
        const fp = path.join(ARSIP_DIR, item.file)
        if (fs.existsSync(fp)) fs.unlinkSync(fp)
      } catch {}

      delete index[id]
      saveIndex(index)
      return sock.sendMessage(from, { text: `✅ Arsip *${item.label || id}* berhasil dihapus` })
    }

    // ===== SIMPAN — reply pesan/media =====
    if (sub === "simpan" || sub === "save" || !sub) {
      const label = args.slice(1).join(" ") || `Arsip ${Date.now()}`
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const teks = quoted
        ? (quoted.conversation || quoted.extendedTextMessage?.text || "")
        : ""

      const hasImage = m.message?.imageMessage || quoted?.imageMessage
      const hasVideo = m.message?.videoMessage || quoted?.videoMessage
      const hasAudio = m.message?.audioMessage || quoted?.audioMessage

      if (!quoted && !hasImage && !hasVideo && !hasAudio) {
        return sock.sendMessage(from, {
          text: `📦 *PANDUAN ARSIP*\n━━━━━━━━━━━━━━━\n\nReply pesan/foto/video/audio dengan:\n\n✅ *.arsip simpan <label>* — Arsipkan\n📋 *.arsip list* — Lihat semua arsip\n👁️ *.arsip lihat <id>* — Buka arsip\n🗑️ *.arsip hapus <id>* — Hapus arsip\n\nContoh:\n.arsip simpan Catatan penting meeting\n.arsip simpan Foto lucu tadi`
        })
      }

      await sock.sendMessage(from, { text: "⏳ Mengarsipkan..." })

      const id = `ARS${Date.now()}`
      const index = loadIndex()
      let type = "teks"
      let fileName = `${id}.txt`

      if (hasImage || hasVideo || hasAudio) {
        try {
          const targetMsg = (quoted?.imageMessage || quoted?.videoMessage || quoted?.audioMessage)
            ? { key: m.key, message: quoted }
            : m

          const buffer = await downloadMediaMessage(targetMsg, "buffer", {}, {
            logger: console, reuploadRequest: sock.updateMediaMessage
          })

          if (hasImage) { type = "gambar"; fileName = `${id}.jpg` }
          else if (hasVideo) { type = "video"; fileName = `${id}.mp4` }
          else if (hasAudio) { type = "audio"; fileName = `${id}.ogg` }

          fs.writeFileSync(path.join(ARSIP_DIR, fileName), buffer)
        } catch (e) {
          return sock.sendMessage(from, { text: `❌ Gagal mengarsipkan media: ${e.message}` })
        }
      } else {
        fs.writeFileSync(path.join(ARSIP_DIR, fileName), teks, "utf-8")
      }

      index[id] = {
        id, label, type, file: fileName,
        owner: sender, grup: from,
        timestamp: Date.now(),
        content: type === "teks" ? teks.slice(0, 200) : null
      }
      saveIndex(index)

      await sock.sendMessage(from, {
        text: `✅ *Berhasil diarsipkan!*\n\n🏷️ Label: *${label}*\n📌 ID: \`${id}\`\n📂 Tipe: ${type}\n\n💡 Gunakan *.arsip lihat ${id}* untuk membukanya kembali`
      })
    }
  }
}
