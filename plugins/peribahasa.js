const axios = require("axios")

module.exports = {
  name: "peribahasa",
  alias: ["pribahasa", "pb", "proverbIndo"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const query = args.join(" ")

    const data = [
      { pb: "Air susu dibalas air tuba", arti: "Kebaikan dibalas dengan kejahatan" },
      { pb: "Bagai air di daun talas", arti: "Tidak dapat dipegang perkataannya; tidak berpendirian tetap" },
      { pb: "Seperti katak dalam tempurung", arti: "Orang yang wawasannya sempit dan tidak mau tahu keadaan luar" },
      { pb: "Habis manis sepah dibuang", arti: "Setelah tidak berguna lagi lalu dibuang/ditinggalkan" },
      { pb: "Tak ada rotan akar pun jadi", arti: "Kalau tidak ada yang baik, yang biasa pun jadilah" },
      { pb: "Sekali merengkuh dayung, dua tiga pulau terlampaui", arti: "Satu pekerjaan dapat menghasilkan beberapa tujuan" },
      { pb: "Bersatu kita teguh bercerai kita runtuh", arti: "Kalau kita bersatu akan kuat, kalau berpisah akan lemah" },
      { pb: "Padi semakin berisi semakin merunduk", arti: "Orang yang semakin pandai semakin rendah hati" },
      { pb: "Tong kosong nyaring bunyinya", arti: "Orang yang bodoh/sombong banyak omong" },
      { pb: "Di mana bumi dipijak di situ langit dijunjung", arti: "Di mana kita tinggal kita harus mengikuti adat setempat" },
      { pb: "Seperti pinang dibelah dua", arti: "Dua orang yang wajahnya sangat mirip" },
      { pb: "Ada udang di balik batu", arti: "Ada maksud tersembunyi di balik sesuatu" },
      { pb: "Berakit-rakit ke hulu, berenang-renang ke tepian", arti: "Bersakit-sakit dahulu, bersenang-senang kemudian" },
      { pb: "Bisa karena biasa", arti: "Kepandaian diperoleh melalui kebiasaan/latihan" },
      { pb: "Nasi sudah menjadi bubur", arti: "Sesuatu yang sudah terjadi tidak bisa diubah lagi" },
    ]

    if (query) {
      const found = data.filter(d => d.pb.toLowerCase().includes(query.toLowerCase()) || d.arti.toLowerCase().includes(query.toLowerCase()))
      if (!found.length) {
        return sock.sendMessage(from, { text: `❌ Peribahasa dengan kata *${query}* tidak ditemukan.` })
      }
      let msg = `📜 *HASIL PENCARIAN: "${query}"*\n━━━━━━━━━━━━━━━\n`
      found.slice(0, 5).forEach(p => {
        msg += `\n📌 *${p.pb}*\n💡 Arti: ${p.arti}\n`
      })
      return sock.sendMessage(from, { text: msg })
    }

    const random = data[Math.floor(Math.random() * data.length)]
    await sock.sendMessage(from, {
      text: `📜 *PERIBAHASA INDONESIA*
━━━━━━━━━━━━━━━
📌 *${random.pb}*
💡 Arti: ${random.arti}

Cari: .peribahasa <kata kunci>`
    })
  }
}
