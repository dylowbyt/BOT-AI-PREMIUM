const axios = require("axios")

module.exports = {
  name: "hotel",
  alias: ["carihotel", "infohotel", "booking"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const kota = args.join(" ")

    if (!kota) {
      return sock.sendMessage(from, {
        text: "🏨 Contoh:\n.hotel Bali\n.hotel Yogyakarta\n.hotel Bandung"
      })
    }

    const encoded = encodeURIComponent(kota)
    await sock.sendMessage(from, {
      text: `🏨 *CARI HOTEL DI ${kota.toUpperCase()}*
━━━━━━━━━━━━━━━
Temukan hotel terbaik di:

🟢 Booking.com:
https://www.booking.com/search.html?ss=${encoded}

🟠 Traveloka:
https://www.traveloka.com/id-id/hotel/search?spec=${encoded}

🔵 Tiket.com:
https://www.tiket.com/hotel?q=${encoded}

🟡 Agoda:
https://www.agoda.com/search?city=${encoded}

💡 Bandingkan harga di beberapa platform untuk mendapatkan deal terbaik!`
    })
  }
}
