const axios = require("axios")

module.exports = {
  name: "jenisdarah",
  alias: ["goldar", "golongandarah", "bloodtype"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const input = args[0]?.toUpperCase()

    const data = {
      "A": {
        positif: "A+", negatif: "A-",
        donor: ["A+", "AB+"], donorNeg: ["A+", "A-", "AB+", "AB-"],
        resipien: ["A+", "A-", "O+", "O-"], resipienNeg: ["A-", "O-"],
        karakter: "Perfeksionis, bertanggung jawab, serius, sabar, introvert",
        cocok: "A, AB"
      },
      "B": {
        positif: "B+", negatif: "B-",
        donor: ["B+", "AB+"], donorNeg: ["B+", "B-", "AB+", "AB-"],
        resipien: ["B+", "B-", "O+", "O-"], resipienNeg: ["B-", "O-"],
        karakter: "Kreatif, bebas, mandiri, spontan, ekstrovert",
        cocok: "B, AB"
      },
      "O": {
        positif: "O+", negatif: "O-",
        donor: ["O+", "A+", "B+", "AB+"], donorNeg: ["semua golongan"],
        resipien: ["O+", "O-"], resipienNeg: ["O-"],
        karakter: "Pemimpin, percaya diri, ambisius, sosial",
        cocok: "Semua golongan"
      },
      "AB": {
        positif: "AB+", negatif: "AB-",
        donor: ["AB+"], donorNeg: ["AB+", "AB-"],
        resipien: ["semua golongan"], resipienNeg: ["AB-", "A-", "B-", "O-"],
        karakter: "Rasional, analitis, dua kepribadian, kreatif",
        cocok: "AB, A, B"
      }
    }

    if (!input || !data[input]) {
      return sock.sendMessage(from, {
        text: "🩸 Format: .jenisdarah <golongan>\nContoh: .jenisdarah A\n.jenisdarah AB\n.jenisdarah O\n.jenisdarah B"
      })
    }

    const d = data[input]
    await sock.sendMessage(from, {
      text: `🩸 *GOLONGAN DARAH ${input}*
━━━━━━━━━━━━━━━
💉 Bisa donor ke: ${d.donor.join(", ")} (Positif)
💉 Bisa donor ke: ${d.donorNeg.join(", ")} (Negatif)

🏥 Bisa terima dari: ${d.resipien.join(", ")} (Positif)
🏥 Bisa terima dari: ${d.resipienNeg.join(", ")} (Negatif)

💕 Cocok dengan: ${d.cocok}
🧠 Karakter: ${d.karakter}`
    })
  }
}
