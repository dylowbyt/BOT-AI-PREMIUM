const fs = require("fs")
const path = require("path")

const levelFile = path.join(__dirname, "..", "session", "levels.json")

function loadData() {
  try {
    if (fs.existsSync(levelFile)) return JSON.parse(fs.readFileSync(levelFile, "utf8"))
  } catch {}
  return {}
}

function saveData(data) {
  try { fs.writeFileSync(levelFile, JSON.stringify(data, null, 2)) } catch {}
}

module.exports = {
  name: "level",
  alias: ["xp", "rank", "skor", "profile"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || from
    const sub = args[0]?.toLowerCase()
    const data = loadData()

    if (!data[sender]) {
      data[sender] = { xp: 0, level: 1, messages: 0, lastDaily: null, streak: 0, name: m.pushName || "User" }
    }

    const user = data[sender]

    if (sub === "daily") {
      const today = new Date().toDateString()
      if (user.lastDaily === today) {
        return sock.sendMessage(from, { text: `⏰ Kamu sudah claim daily XP hari ini!\nCoba lagi besok 🕐` })
      }
      const bonus = 100 + (user.streak || 0) * 10
      user.xp += bonus
      user.lastDaily = today
      user.streak = (user.streak || 0) + 1
      user.level = Math.floor(user.xp / 500) + 1
      saveData(data)
      return sock.sendMessage(from, {
        text: `✨ *DAILY XP*\n+${bonus} XP diterima!\n🔥 Streak: ${user.streak} hari\n📊 Total XP: ${user.xp}`
      })
    }

    if (sub === "leaderboard" || sub === "top") {
      const sorted = Object.entries(data)
        .sort(([, a], [, b]) => b.xp - a.xp)
        .slice(0, 10)
      const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
      let msg = "🏆 *LEADERBOARD TOP 10*\n━━━━━━━━━━━━━━━\n"
      sorted.forEach(([id, u], i) => {
        msg += `${medals[i]} ${u.name || "User"} — Lv.${u.level} (${u.xp} XP)\n`
      })
      return sock.sendMessage(from, { text: msg })
    }

    const levelEmoji = ["", "🌱", "🌿", "🌳", "⭐", "🌟", "💫", "🔥", "⚡", "💎", "👑"]
    const emoji = levelEmoji[Math.min(user.level, 10)] || "👑"

    await sock.sendMessage(from, {
      text: `👤 *PROFIL: ${user.name}*
━━━━━━━━━━━━━━━
${emoji} Level: ${user.level}
⭐ XP: ${user.xp}
📨 Pesan: ${user.messages}
🔥 Streak: ${user.streak} hari

📈 XP ke level berikutnya: ${(user.level * 500) - user.xp}

.level daily → Klaim XP harian
.level leaderboard → Lihat top 10`
    })
  }
}
