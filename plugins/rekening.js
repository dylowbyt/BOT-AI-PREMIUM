const axios = require("axios")

module.exports = {
  name: "cekrekening",
  alias: ["rekening", "ceknomor", "cekbank"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    if (args.length < 2) {
      return sock.sendMessage(from, {
        text: `⚠️ Format: .cekrekening <bank> <nomor_rekening>
Contoh: .cekrekening bca 1234567890

Bank yang didukung:
bca, bni, bri, mandiri, cimb, danamon, permata, btn, bsm, muamalat, btpn, sinarmas, ocbc, mega`
      })
    }

    const bank = args[0].toLowerCase()
    const norek = args[1]

    const bankCodes = {
      bca: "014", bni: "009", bri: "002", mandiri: "008",
      cimb: "022", danamon: "011", permata: "013", btn: "200",
      bsm: "451", muamalat: "147", btpn: "213", sinarmas: "153",
      ocbc: "028", mega: "426"
    }

    const bankCode = bankCodes[bank]
    if (!bankCode) {
      return sock.sendMessage(from, { text: `❌ Bank *${bank}* tidak dikenal. Gunakan: bca, bni, bri, mandiri, dll.` })
    }

    try {
      await sock.sendMessage(from, { text: "🏦 Mengecek rekening..." })

      const res = await axios.get(
        `https://api.siputzx.my.id/api/rekening/cek?bank=${bankCode}&rekening=${norek}`,
        { timeout: 12000 }
      )

      const data = res.data
      if (!data?.data?.nama) {
        return sock.sendMessage(from, {
          text: `🏦 *CEK REKENING*\n━━━━━━━━━━━\n❌ Rekening tidak ditemukan atau tidak valid.`
        })
      }

      await sock.sendMessage(from, {
        text: `🏦 *CEK REKENING*
━━━━━━━━━━━━━━━
🏛️ Bank: ${bank.toUpperCase()}
🔢 No. Rekening: ${norek}
👤 Nama: *${data.data.nama}*

✅ Rekening Valid`
      })
    } catch {
      await sock.sendMessage(from, {
        text: `🏦 *CEK REKENING*
━━━━━━━━━━━
⚠️ Tidak dapat memverifikasi rekening saat ini.
Pastikan nomor rekening dan nama bank sudah benar.`
      })
    }
  }
}
