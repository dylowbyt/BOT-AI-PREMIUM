const axios = require("axios")

module.exports = {
  name: "paketdata",
  alias: ["kuota", "internet", "paket"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const operator = args[0]?.toLowerCase()

    const info = {
      telkomsel: {
        nama: "Telkomsel",
        paket: [
          "📦 1GB - Rp 10.000/3 hari",
          "📦 2GB - Rp 20.000/7 hari",
          "📦 6GB - Rp 50.000/30 hari",
          "📦 14GB - Rp 100.000/30 hari",
          "📦 50GB - Rp 200.000/30 hari",
          "📦 Unlimited - mulai Rp 250.000/30 hari"
        ],
        cek: "*888#",
        beli: "*363#"
      },
      xl: {
        nama: "XL / AXIS",
        paket: [
          "📦 1.5GB - Rp 15.000/7 hari",
          "📦 5GB - Rp 50.000/30 hari",
          "📦 10GB - Rp 80.000/30 hari",
          "📦 20GB - Rp 120.000/30 hari",
          "📦 Unlimited - mulai Rp 200.000/30 hari"
        ],
        cek: "*123#",
        beli: "*123#"
      },
      indosat: {
        nama: "Indosat Ooredoo",
        paket: [
          "📦 2GB - Rp 20.000/7 hari",
          "📦 8GB - Rp 50.000/30 hari",
          "📦 16GB - Rp 100.000/30 hari",
          "📦 Unlimited - mulai Rp 180.000/30 hari"
        ],
        cek: "*363#",
        beli: "*363#"
      },
      smartfren: {
        nama: "Smartfren",
        paket: [
          "📦 1GB - Rp 8.000/3 hari",
          "📦 5GB - Rp 45.000/30 hari",
          "📦 10GB - Rp 80.000/30 hari",
          "📦 Unlimited - mulai Rp 150.000/30 hari"
        ],
        cek: "*995#",
        beli: "*999#"
      }
    }

    if (!operator || !info[operator]) {
      const list = Object.entries(info).map(([k, v]) => `• .paketdata ${k} → ${v.nama}`).join("\n")
      return sock.sendMessage(from, {
        text: `📶 *INFO PAKET DATA*

Pilih operator:
${list}

Contoh: .paketdata telkomsel`
      })
    }

    const d = info[operator]
    const paketList = d.paket.join("\n")

    await sock.sendMessage(from, {
      text: `📶 *PAKET DATA ${d.nama.toUpperCase()}*
━━━━━━━━━━━━━━━
${paketList}

📲 Cek Sisa Kuota: ${d.cek}
🛒 Beli Paket: ${d.beli}

⚠️ Harga dapat berubah sewaktu-waktu. Konfirmasi via aplikasi/UMB operator.`
    })
  }
}
