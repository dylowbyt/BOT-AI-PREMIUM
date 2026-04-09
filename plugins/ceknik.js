module.exports = {
  name: "ceknik",
  alias: ["nik", "ktp", "validatenik"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const nik = args[0]?.trim()

    if (!nik) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh: .ceknik 3271012345670001"
      })
    }

    if (!/^\d{16}$/.test(nik)) {
      return sock.sendMessage(from, { text: "❌ NIK harus 16 digit angka." })
    }

    const provinces = {
      "11": "Aceh", "12": "Sumatera Utara", "13": "Sumatera Barat", "14": "Riau",
      "15": "Jambi", "16": "Sumatera Selatan", "17": "Bengkulu", "18": "Lampung",
      "19": "Kep. Bangka Belitung", "21": "Kep. Riau", "31": "DKI Jakarta",
      "32": "Jawa Barat", "33": "Jawa Tengah", "34": "DI Yogyakarta",
      "35": "Jawa Timur", "36": "Banten", "51": "Bali", "52": "NTB",
      "53": "NTT", "61": "Kalimantan Barat", "62": "Kalimantan Tengah",
      "63": "Kalimantan Selatan", "64": "Kalimantan Timur", "65": "Kalimantan Utara",
      "71": "Sulawesi Utara", "72": "Sulawesi Tengah", "73": "Sulawesi Selatan",
      "74": "Sulawesi Tenggara", "75": "Gorontalo", "76": "Sulawesi Barat",
      "81": "Maluku", "82": "Maluku Utara", "91": "Papua Barat", "94": "Papua"
    }

    const provCode = nik.slice(0, 2)
    const kabCode = nik.slice(2, 4)
    const kecCode = nik.slice(4, 6)
    let day = parseInt(nik.slice(6, 8))
    const month = parseInt(nik.slice(8, 10))
    const year2digit = parseInt(nik.slice(10, 12))
    const uniq = nik.slice(12, 16)

    const isFemale = day > 40
    if (isFemale) day -= 40

    const currentYear = new Date().getFullYear()
    const century = year2digit + 2000 > currentYear ? 1900 : 2000
    const fullYear = century + year2digit

    const months = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    const province = provinces[provCode] || "Tidak Diketahui"

    const dob = `${day.toString().padStart(2, "0")} ${months[month] || "?"} ${fullYear}`

    await sock.sendMessage(from, {
      text: `🪪 *VALIDASI NIK / KTP*
━━━━━━━━━━━━━━━
🔢 NIK: ${nik}
✅ Format: Valid (16 digit)

📊 Informasi:
🌍 Provinsi: ${province}
🏙️ Kab/Kota: ${provCode}${kabCode}
🏘️ Kecamatan: ${provCode}${kabCode}${kecCode}
🎂 Tgl Lahir: ${dob}
👤 Jenis Kelamin: ${isFemale ? "Perempuan ♀️" : "Laki-laki ♂️"}
🔑 No. Urut: ${uniq}

⚠️ Data ini hanya berdasarkan format NIK, bukan verifikasi ke Dukcapil.`
    })
  }
}
