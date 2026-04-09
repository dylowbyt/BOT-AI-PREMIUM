module.exports = {
  name: "bmi",
  alias: ["imtubuh", "imt"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    if (args.length < 2) {
      return sock.sendMessage(from, {
        text: "⚠️ Format: .bmi <berat_kg> <tinggi_cm>\nContoh: .bmi 65 170"
      })
    }

    const berat = parseFloat(args[0])
    const tinggi = parseFloat(args[1])

    if (isNaN(berat) || isNaN(tinggi) || berat <= 0 || tinggi <= 0) {
      return sock.sendMessage(from, { text: "❌ Masukkan angka yang valid." })
    }

    const tinggim = tinggi / 100
    const bmi = berat / (tinggim * tinggim)
    const bmiFixed = bmi.toFixed(1)

    let status, saran, emoji
    if (bmi < 17.0) { status = "Sangat Kurus"; emoji = "😰"; saran = "Perlu konsultasi dokter, tingkatkan asupan nutrisi." }
    else if (bmi < 18.5) { status = "Kurus"; emoji = "😟"; saran = "Tambah porsi makan bergizi dan protein." }
    else if (bmi < 25.0) { status = "Normal/Ideal"; emoji = "😊"; saran = "Pertahankan pola makan sehat dan olahraga rutin." }
    else if (bmi < 27.0) { status = "Overweight"; emoji = "😐"; saran = "Kurangi makanan berlemak, tambah aktivitas fisik." }
    else if (bmi < 30.0) { status = "Obesitas I"; emoji = "😬"; saran = "Konsultasi dokter, ubah pola makan dan olahraga." }
    else { status = "Obesitas II"; emoji = "⚠️"; saran = "Segera konsultasi dokter spesialis gizi." }

    const beratIdealMin = (18.5 * tinggim * tinggim).toFixed(1)
    const beratIdealMax = (24.9 * tinggim * tinggim).toFixed(1)

    await sock.sendMessage(from, {
      text: `⚖️ *CEK BMI / INDEKS MASSA TUBUH*
━━━━━━━━━━━━━━━━━━
📊 Berat: ${berat} kg
📏 Tinggi: ${tinggi} cm
🔢 Nilai BMI: *${bmiFixed}*

${emoji} Status: *${status}*

💡 Berat Ideal Kamu: ${beratIdealMin} – ${beratIdealMax} kg

📝 Saran: ${saran}`
    })
  }
}
