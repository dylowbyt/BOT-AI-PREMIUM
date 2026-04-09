module.exports = {
  name: "fun",
  alias: ["game", "random"],

  async run(sock, m) {
    const from = m.key.remoteJid

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""

    const args = text.split(" ")
    const cmd = args[1]?.toLowerCase()

    if (!cmd) {
      return sock.sendMessage(from, {
        text: `🎮 FUN MENU

.fun ganteng
.fun cantik
.fun rate <nama>
.fun ship <nama1>|<nama2>
.fun truth
.fun dare
.fun fakta
.fun hoki
`
      })
    }

    // ===== GANTENG =====
    if (cmd === "ganteng") {
      return reply(sock, from, randomPersen("Tingkat kegantengan kamu"))
    }

    // ===== CANTIK =====
    if (cmd === "cantik") {
      return reply(sock, from, randomPersen("Tingkat kecantikan kamu"))
    }

    // ===== RATE =====
    if (cmd === "rate") {
      const name = args.slice(2).join(" ")
      if (!name) return reply(sock, from, "⚠️ Contoh: .fun rate Budi")

      return reply(sock, from, `📊 ${name} : ${random(1, 100)}%`)
    }

    // ===== SHIP =====
    if (cmd === "ship") {
      const data = text.split(" ").slice(2).join(" ").split("|")

      if (data.length < 2) {
        return reply(sock, from, "⚠️ Contoh: .fun ship kamu|dia")
      }

      const persen = random(1, 100)

      return reply(sock, from,
        `💘 Kecocokan:\n${data[0]} ❤️ ${data[1]}\n\n${persen}%`
      )
    }

    // ===== TRUTH =====
    if (cmd === "truth") {
      return reply(sock, from, randomList(truthList))
    }

    // ===== DARE =====
    if (cmd === "dare") {
      return reply(sock, from, randomList(dareList))
    }

    // ===== FAKTA =====
    if (cmd === "fakta") {
      return reply(sock, from, randomList(faktaList))
    }

    // ===== HOKI =====
    if (cmd === "hoki") {
      return reply(sock, from,
        `🍀 Keberuntungan kamu hari ini: ${random(1, 100)}%`
      )
    }

    return reply(sock, from, "❌ Command tidak ditemukan")
  }
}

// ===== HELPER =====

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomPersen(text) {
  return `✨ ${text}: ${random(1, 100)}%`
}

function randomList(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function reply(sock, from, text) {
  return sock.sendMessage(from, { text })
}

// ===== DATA =====

const truthList = [
  "Siapa yang kamu suka diam-diam?",
  "Pernah bohong ke orang tua?",
  "Hal paling memalukan kamu?",
  "Pernah ngechat mantan lagi?",
  "Siapa orang terakhir yang kamu stalk?"
]

const dareList = [
  "Kirim voice note nyanyi sekarang",
  "Spam teman kamu 5x 😂",
  "Ganti foto profil lucu 1 jam",
  "Tag orang yang kamu suka",
  "Kirim emoji 🐸 ke crush kamu"
]

const faktaList = [
  "Otak manusia lebih aktif saat tidur daripada nonton TV 😴",
  "Kucing bisa mimpi seperti manusia 🐱",
  "Air panas bisa membeku lebih cepat dari air dingin ❄️",
  "Gurita punya 3 jantung 🐙",
  "Manusia bisa ketagihan chat 😈"
]
