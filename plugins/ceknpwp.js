module.exports = {
  name: "ceknpwp",
  alias: ["npwp", "validasinpwp"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const npwp = args[0]?.replace(/[.\-\s]/g, "")

    if (!npwp) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh: .ceknpwp 12.345.678.9-123.456\nAtau: .ceknpwp 123456789123456"
      })
    }

    if (!/^\d{15}$/.test(npwp)) {
      return sock.sendMessage(from, { text: "❌ NPWP harus 15 digit angka." })
    }

    const jenis = npwp[0] === "0" ? "Badan/Perusahaan" : npwp[0] === "9" ? "NPWP Non-Efektif" : "Orang Pribadi"
    const kpp = npwp.slice(6, 9)
    const cabang = npwp.slice(12)

    const formatted = `${npwp.slice(0, 2)}.${npwp.slice(2, 5)}.${npwp.slice(5, 8)}.${npwp[8]}-${npwp.slice(9, 12)}.${npwp.slice(12)}`

    await sock.sendMessage(from, {
      text: `🆔 *VALIDASI NPWP*
━━━━━━━━━━━━━━━
🔢 NPWP: ${formatted}
✅ Format: Valid (15 digit)

📊 Informasi:
👤 Jenis WP: ${jenis}
🏢 Kode KPP: ${kpp}
🔖 Kode Cabang: ${cabang === "000" ? "Pusat" : `Cabang ${cabang}`}

⚠️ Ini validasi format saja, bukan verifikasi ke DJP.
Untuk verifikasi resmi kunjungi: https://ereg.pajak.go.id`
    })
  }
}
