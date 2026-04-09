module.exports = {
  name: "zodiak",
  alias: ["horoscope", "ramalan", "bintang", "horoskop"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const input = args[0]?.toLowerCase()

    const zodiak = {
      aries: { symbol: "♈", date: "21 Mar - 19 Apr", element: "Api 🔥", planet: "Mars", lucky: ["Selasa", "Sabtu"], color: "Merah & Kuning" },
      taurus: { symbol: "♉", date: "20 Apr - 20 Mei", element: "Tanah 🌍", planet: "Venus", lucky: ["Senin", "Jumat"], color: "Hijau & Merah Muda" },
      gemini: { symbol: "♊", date: "21 Mei - 20 Jun", element: "Udara 💨", planet: "Merkurius", lucky: ["Rabu", "Kamis"], color: "Kuning & Hijau" },
      cancer: { symbol: "♋", date: "21 Jun - 22 Jul", element: "Air 💧", planet: "Bulan", lucky: ["Senin", "Kamis"], color: "Putih & Silver" },
      leo: { symbol: "♌", date: "23 Jul - 22 Ags", element: "Api 🔥", planet: "Matahari", lucky: ["Minggu", "Selasa"], color: "Gold & Oranye" },
      virgo: { symbol: "♍", date: "23 Ags - 22 Sep", element: "Tanah 🌍", planet: "Merkurius", lucky: ["Rabu", "Sabtu"], color: "Biru & Putih" },
      libra: { symbol: "♎", date: "23 Sep - 22 Okt", element: "Udara 💨", planet: "Venus", lucky: ["Jumat", "Selasa"], color: "Merah Muda & Biru" },
      scorpio: { symbol: "♏", date: "23 Okt - 21 Nov", element: "Air 💧", planet: "Pluto & Mars", lucky: ["Selasa", "Jumat"], color: "Hitam & Merah" },
      sagittarius: { symbol: "♐", date: "22 Nov - 21 Des", element: "Api 🔥", planet: "Jupiter", lucky: ["Kamis", "Minggu"], color: "Ungu & Biru" },
      capricorn: { symbol: "♑", date: "22 Des - 19 Jan", element: "Tanah 🌍", planet: "Saturnus", lucky: ["Sabtu", "Rabu"], color: "Cokelat & Hijau" },
      aquarius: { symbol: "♒", date: "20 Jan - 18 Feb", element: "Udara 💨", planet: "Uranus", lucky: ["Sabtu", "Rabu"], color: "Biru Muda & Biru" },
      pisces: { symbol: "♓", date: "19 Feb - 20 Mar", element: "Air 💧", planet: "Neptunus", lucky: ["Kamis", "Senin"], color: "Aqua & Ungu" }
    }

    const fortunes = [
      "Hari ini adalah saat yang tepat untuk memulai sesuatu yang baru.",
      "Kesabaran adalah kuncimu hari ini. Jangan terburu-buru.",
      "Rezeki datang dari arah yang tidak terduga. Tetap waspada.",
      "Hubunganmu dengan orang-orang tersayang akan semakin erat.",
      "Peluang besar menanti, percayai instingmu.",
      "Fokuslah pada tujuan jangka panjang, jangan tergiur hal kecil.",
      "Kebaikanmu akan dibalas berlipat ganda.",
      "Jaga kesehatanmu, tubuh yang sehat membawa pikiran yang jernih.",
      "Kerjasama tim akan membawa hasil luar biasa hari ini.",
      "Kreativitasmu sedang di puncaknya, manfaatkan sebaik mungkin."
    ]

    if (!input || !zodiak[input]) {
      const list = Object.entries(zodiak).map(([k, v]) => `${v.symbol} ${k.charAt(0).toUpperCase() + k.slice(1)} (${v.date})`).join("\n")
      return sock.sendMessage(from, {
        text: `♈ *CARI INFO ZODIAK*\nContoh: .zodiak aries\n\n${list}`
      })
    }

    const z = zodiak[input]
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)]
    const love = fortunes[Math.floor(Math.random() * fortunes.length)]
    const career = fortunes[Math.floor(Math.random() * fortunes.length)]
    const luckyNum = Math.floor(Math.random() * 99) + 1

    await sock.sendMessage(from, {
      text: `${z.symbol} *${input.toUpperCase()}*
━━━━━━━━━━━━━━━
📅 Tanggal: ${z.date}
🌍 Elemen: ${z.element}
🪐 Planet: ${z.planet}
🎨 Warna Hoki: ${z.color}
📆 Hari Hoki: ${z.lucky.join(" & ")}
🔢 Angka Hoki: ${luckyNum}

✨ *RAMALAN HARI INI*
💫 Umum: ${fortune}
❤️ Cinta: ${love}
💼 Karir: ${career}`
    })
  }
}
