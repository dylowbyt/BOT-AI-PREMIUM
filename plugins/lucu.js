const axios = require("axios")

const jokesList = [
  "Kenapa programmer tidak suka alam terbuka?\nKarena banyak bug! 🐛",
  "Apa bedanya AC dengan mantan?\nAC kalau dimatiin masih dingin, mantan kalau dimatiin masih nyakitin 😂",
  "Dokter: Bapak harus diet\nPasien: Makanan apa yg boleh dok?\nDokter: Makanan yg tidak enak\nPasien: Berarti masakan istri saya boleh dong dok 😭",
  "Kenapa orang stress pergi ke pantai?\nKarena disana bisa curhat ke ombak... udah curhat panjang, ombaknya malah pergi 🌊",
  "Guru: Kenapa kamu telat?\nMurid: Tadi ada tanda 'School Ahead, Go Slow'\nGuru: Itu untuk mobil!\nMurid: Iya bu, saya naik motor 🏍️",
  "Apa persamaan jomblo dan wifi?\nDua-duanya sering dicari kalau lagi dibutuhin, abis itu dilupain 📶",
  "Kenapa kucing tidak bisa main komputer?\nKarena takut sama mouse 🐭",
  "Kenapa buku matematika selalu sedih?\nKarena penuh dengan masalah 😂",
  "Suami: Yah, kamu cantik banget hari ini\nIstri: Biasanya kamu ga pernah bilang gitu\nSuami: Biasanya kamu ga bawa setrika 🤣",
  "Kenapa orang gemuk selalu happy?\nKarena susah untuk down 😂",
  "Tukang becak: Mau kemana mas?\nPenumpang: Ke kantor\nTukang becak: Jauh ga?\nPenumpang: Ya jauh lah, makanya naik becak 😂",
  "Apa yang bisa terbang tapi tidak punya sayap?\nWaktu... 🕐",
  "Kenapa lebah tidak pernah ujian?\nKarena sudah punya bee-diploma 🐝",
  "Pasien: Dok, gigi saya sakit.\nDokter: Mana yang sakit?\nPasien: Yang paling mahal dok 😭",
  "Apa bedanya politisi dengan pisang?\nKalau pisang makin tua makin manis, kalau politisi makin tua makin... bikin pusing 🍌",
  "Kenapa tukang bakso selalu semangat?\nKarena hidupnya penuh dengan 'Baso' 💪",
  "A: Eh, kamu tau tidak? Semut bisa angkat beban 50x berat badannya!\nB: Wah hebat ya... tapi tetep kalah sama ibu-ibu yang angkat belanjaan sendiri 🛍️",
  "Istri: Mas, aku hamil...\nSuami: Serius?!\nIstri: Iya, aku mau hamil sambil serius aja 😂"
]

async function getJokeOnline() {
  const apis = [
    async () => {
      const r = await axios.get("https://api.betabotz.eu.org/api/fun/jokes?apikey=beta", { timeout: 8000 })
      return r.data?.result || r.data?.joke || null
    },
    async () => {
      const r = await axios.get("https://api.nexoracle.com/fun/jokes?apikey=free", { timeout: 8000 })
      return r.data?.result || r.data?.joke || null
    },
    async () => {
      const r = await axios.get("https://api.siputzx.my.id/api/random/jokes", { timeout: 8000 })
      return r.data?.data || r.data?.joke || null
    },
    async () => {
      const r = await axios.get("https://api.surabaya.eu.org/api/random/jokes", { timeout: 8000 })
      return r.data?.data || r.data?.result || null
    },
    // FIX: Tambah fallback API baru
    async () => {
      const r = await axios.get("https://api.ryzendesu.vip/api/random/jokes", { timeout: 8000 })
      return r.data?.data || r.data?.result || null
    },
    async () => {
      const r = await axios.get("https://api.agatz.xyz/api/jokes", { timeout: 8000 })
      return r.data?.data || r.data?.result || null
    }
  ]

  for (const api of apis) {
    try {
      const joke = await api()
      if (joke && typeof joke === "string" && joke.length > 10) return joke
    } catch {}
  }
  return null
}

module.exports = {
  name: "lucu",
  alias: ["jokes", "ketawa", "humor"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      await sock.sendMessage(from, { text: "😂 Loading jokes..." })

      let joke = await getJokeOnline()
      if (!joke) {
        joke = jokesList[Math.floor(Math.random() * jokesList.length)]
      }

      // FIX: Pastikan format teks bersih
      const cleanJoke = String(joke).trim().replace(/\\n/g, "\n")

      await sock.sendMessage(from, {
        text: `😂 *JOKES OF THE DAY*\n━━━━━━━━━━━━━━━\n\n${cleanJoke}\n\n━━━━━━━━━━━━━━━\n😁 Kirim *.lucu* lagi untuk jokes lainnya!`
      })

    } catch (err) {
      console.log("LUCU ERROR:", err?.message)
      const fallback = jokesList[Math.floor(Math.random() * jokesList.length)]
      sock.sendMessage(from, {
        text: `😂 *JOKES*\n━━━━━━━━━━━━━━━\n\n${fallback}\n\n😁 Kirim *.lucu* lagi untuk jokes lainnya!`
      })
    }
  }
}
