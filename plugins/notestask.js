const fs = require("fs")
const path = require("path")

const notesFile = path.join(__dirname, "..", "session", "notes.json")

function loadNotes() {
  try {
    if (fs.existsSync(notesFile)) return JSON.parse(fs.readFileSync(notesFile, "utf8"))
  } catch {}
  return {}
}

function saveNotes(data) {
  try {
    fs.writeFileSync(notesFile, JSON.stringify(data, null, 2))
  } catch {}
}

module.exports = {
  name: "catat",
  alias: ["note", "notes", "catatan", "todo"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || from
    const sub = args[0]?.toLowerCase()
    const notes = loadNotes()
    if (!notes[sender]) notes[sender] = []

    if (!sub || sub === "list") {
      if (!notes[sender].length) return sock.sendMessage(from, { text: "📭 Belum ada catatan. Gunakan .catat <teks>" })
      let msg = "📝 *CATATANMU:*\n━━━━━━━━━━━\n"
      notes[sender].forEach((n, i) => {
        const done = n.done ? "✅" : "⬜"
        msg += `${i + 1}. ${done} ${n.text}\n`
      })
      msg += `\n📌 Total: ${notes[sender].length} catatan`
      return sock.sendMessage(from, { text: msg })
    }

    if (sub === "hapus") {
      const idx = parseInt(args[1]) - 1
      if (isNaN(idx) || !notes[sender][idx]) return sock.sendMessage(from, { text: "❌ Nomor catatan tidak valid." })
      const removed = notes[sender].splice(idx, 1)[0]
      saveNotes(notes)
      return sock.sendMessage(from, { text: `🗑️ Catatan dihapus: "${removed.text}"` })
    }

    if (sub === "selesai") {
      const idx = parseInt(args[1]) - 1
      if (isNaN(idx) || !notes[sender][idx]) return sock.sendMessage(from, { text: "❌ Nomor catatan tidak valid." })
      notes[sender][idx].done = !notes[sender][idx].done
      const status = notes[sender][idx].done ? "✅ Selesai" : "⬜ Belum selesai"
      saveNotes(notes)
      return sock.sendMessage(from, { text: `${status}: "${notes[sender][idx].text}"` })
    }

    if (sub === "hapussemua") {
      notes[sender] = []
      saveNotes(notes)
      return sock.sendMessage(from, { text: "🗑️ Semua catatan dihapus." })
    }

    const text = args.join(" ")
    notes[sender].push({ text, done: false, time: new Date().toISOString() })
    saveNotes(notes)

    await sock.sendMessage(from, {
      text: `✅ *Catatan ditambahkan:*\n"${text}"\n\nTotal catatan: ${notes[sender].length}`
    })
  }
}
