module.exports = {
  name: "gejalacovid",
  alias: ["checkcovid", "checkkesehatan", "selfcheck"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || from

    const questions = [
      "1️⃣ Apakah kamu demam di atas 37.5°C?",
      "2️⃣ Apakah kamu batuk kering?",
      "3️⃣ Apakah kamu sesak napas?",
      "4️⃣ Apakah kamu kehilangan penciuman/rasa?",
      "5️⃣ Apakah kamu sakit tenggorokan?",
      "6️⃣ Apakah kamu sakit kepala?",
      "7️⃣ Apakah kamu kontak dengan pasien COVID?",
      "8️⃣ Apakah kamu bepergian ke daerah risiko tinggi?"
    ]

    const yesCount = args.filter(a => ["ya", "y", "yes", "iya"].includes(a.toLowerCase())).length
    const noCount = args.filter(a => ["tidak", "t", "no", "n"].includes(a.toLowerCase())).length

    if (args.length >= 8) {
      const total = yesCount

      let risiko, saran, emoji
      if (total <= 1) {
        risiko = "RENDAH"; emoji = "✅"
        saran = "Pertahankan protokol kesehatan. Tetap pakai masker di tempat umum."
      } else if (total <= 3) {
        risiko = "SEDANG"; emoji = "⚠️"
        saran = "Isolasi mandiri 5-7 hari, pantau gejala. Hubungi dokter jika memburuk."
      } else if (total <= 5) {
        risiko = "TINGGI"; emoji = "🔴"
        saran = "Segera lakukan tes PCR/Antigen. Isolasi mandiri dan konsultasi dokter."
      } else {
        risiko = "SANGAT TINGGI"; emoji = "🆘"
        saran = "SEGERA ke fasilitas kesehatan atau hubungi 119 ext 9 (hotline COVID)."
      }

      return sock.sendMessage(from, {
        text: `🏥 *HASIL CEK GEJALA COVID*
━━━━━━━━━━━━━━━
✅ Jawaban Ya: ${yesCount} dari 8 pertanyaan

${emoji} Tingkat Risiko: *${risiko}*

📋 Saran:
${saran}

📞 Hotline COVID-19: 119 ext 9
🏥 BPJS: 1500-400

⚠️ Ini bukan diagnosis medis. Selalu konsultasikan dengan tenaga kesehatan.`
      })
    }

    await sock.sendMessage(from, {
      text: `🏥 *CEK GEJALA COVID-19*
━━━━━━━━━━━━━━━
Jawab dengan: ya/tidak (pisahkan spasi)

Pertanyaan:
${questions.join("\n")}

Format jawab:
.selfcheck ya tidak ya tidak tidak tidak tidak tidak

(urutan sesuai nomor pertanyaan)`
    })
  }
}
