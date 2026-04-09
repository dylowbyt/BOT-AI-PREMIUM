module.exports = {
  name: "diskon",
  alias: ["hitungdiskon", "promo", "sale"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    if (args.length < 2) {
      return sock.sendMessage(from, {
        text: `🏷️ *KALKULATOR DISKON*

Format: .diskon <harga_asal> <diskon%>
Contoh: .diskon 250000 30

Multiple diskon:
.diskon 500000 20 10  (diskon 20% + 10% tambahan)`
      })
    }

    const harga = parseFloat(args[0])
    const diskon1 = parseFloat(args[1])
    const diskon2 = parseFloat(args[2]) || 0

    if (isNaN(harga) || isNaN(diskon1)) {
      return sock.sendMessage(from, { text: "❌ Nilai tidak valid." })
    }

    if (diskon1 < 0 || diskon1 > 100) {
      return sock.sendMessage(from, { text: "❌ Diskon harus antara 0-100%." })
    }

    const setelahDiskon1 = harga * (1 - diskon1 / 100)
    const setelahDiskon2 = diskon2 ? setelahDiskon1 * (1 - diskon2 / 100) : setelahDiskon1
    const hemat = harga - setelahDiskon2
    const totalDiskon = ((hemat / harga) * 100).toFixed(1)

    let msg = `🏷️ *KALKULATOR DISKON*
━━━━━━━━━━━━━━━
💰 Harga Asal: Rp ${harga.toLocaleString("id-ID")}
🎫 Diskon: ${diskon1}%`

    if (diskon2) {
      msg += `\n🎫 Diskon Tambahan: ${diskon2}%`
      msg += `\n\n📊 Setelah diskon ${diskon1}%: Rp ${setelahDiskon1.toLocaleString("id-ID")}`
    }

    msg += `\n\n💳 *Harga Akhir: Rp ${Math.round(setelahDiskon2).toLocaleString("id-ID")}*
💵 Kamu Hemat: Rp ${Math.round(hemat).toLocaleString("id-ID")}
📉 Total Diskon: ${totalDiskon}%`

    await sock.sendMessage(from, { text: msg })
  }
}
