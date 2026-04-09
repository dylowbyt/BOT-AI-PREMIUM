const axios = require("axios")

module.exports = {
  name: "archive",
  alias: ["ww1", "ww2", "perang"],

  async run(sock, m) {
    const from = m.key.remoteJid

    let text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text

    text = text.toLowerCase()

    try {
      await sock.sendMessage(from, {
        text: "📦 Mengambil arsip sejarah..."
      })

      // ===== DATABASE VIDEO =====
      const db = {
        ww1: [
          {
            url: "https://www.youtube.com/watch?v=ycJ1U_6XrOA",
            title: "⚔️ WW1 Battlefield Footage"
          }
        ],
        ww2: [
          {
            url: "https://www.youtube.com/watch?v=_0Z6O_eaLys",
            title: "💣 WW2 Combat Footage"
          }
        ],
        tank: [
          {
            url: "https://www.youtube.com/watch?v=Jp9Eo2y7t-Y",
            title: "🪖 Tank Battle Archive"
          }
        ],
        nazi: [
          {
            url: "https://www.youtube.com/watch?v=8H9r7XzY9Xk",
            title: "⚠️ Nazi Germany Archive"
          }
        ],
        japan: [
          {
            url: "https://www.youtube.com/watch?v=3Y1w6L8G0fM",
            title: "🎌 Imperial Japan Footage"
          }
        ]
      }

      // ===== LIST =====
      if (text.includes("list")) {
        return sock.sendMessage(from, {
          text: `📜 Kategori tersedia:
- ww1
- ww2
- tank
- nazi
- japan

Gunakan:
.archive search tank`
        })
      }

      // ===== SEARCH =====
      if (text.includes("search")) {
        const keyword = text.split("search")[1].trim()

        if (!keyword) {
          return sock.sendMessage(from, {
            text: "⚠️ Contoh: .archive search tank"
          })
        }

        const data = db[keyword]

        if (!data) {
          return sock.sendMessage(from, {
            text: "❌ Data tidak ditemukan"
          })
        }

        const pick = data[Math.floor(Math.random() * data.length)]

        return sock.sendMessage(from, {
          video: { url: pick.url },
          caption: pick.title
        })
      }

      // ===== WW1 =====
      if (text.includes("1") || text.includes("ww1")) {
        const pick = db.ww1[0]

        return sock.sendMessage(from, {
          video: { url: pick.url },
          caption: pick.title
        })
      }

      // ===== WW2 =====
      if (text.includes("2") || text.includes("ww2")) {
        const pick = db.ww2[0]

        return sock.sendMessage(from, {
          video: { url: pick.url },
          caption: pick.title
        })
      }

      // ===== RANDOM =====
      const all = [
        ...db.ww1,
        ...db.ww2,
        ...db.tank,
        ...db.nazi,
        ...db.japan
      ]

      const pick = all[Math.floor(Math.random() * all.length)]

      await sock.sendMessage(from, {
        video: { url: pick.url },
        caption: pick.title
      })

    } catch (err) {
      console.log("ARCHIVE ERROR:", err)

      await sock.sendMessage(from, {
        text: "❌ Gagal mengambil arsip"
      })
    }
  }
}
