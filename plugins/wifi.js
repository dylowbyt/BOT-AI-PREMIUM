module.exports = {
  name: "wifiqr",
  alias: ["qrwifi", "buatwifi", "wificode"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    if (args.length < 2) {
      return sock.sendMessage(from, {
        text: `📶 *SHARE WIFI VIA QR*
Format: .wifiqr <nama_wifi> <password> [tipe]
Tipe: WPA (default), WEP, nopass

Contoh:
.wifiqr "RumahKu 2.4G" "password123"
.wifiqr Kantor Qwerty123 WPA`
      })
    }

    const ssid = args[0]
    const password = args[1]
    const auth = args[2]?.toUpperCase() || "WPA"

    const wifiString = auth === "nopass"
      ? `WIFI:T:nopass;S:${ssid};;`
      : `WIFI:T:${auth};S:${ssid};P:${password};;`

    const QRCode = require("qrcode")
    try {
      const qrBuffer = await QRCode.toBuffer(wifiString, { type: "png", width: 400, margin: 2 })
      await sock.sendMessage(from, {
        image: qrBuffer,
        caption: `📶 *QR CODE WIFI*
━━━━━━━━━━━━━━━
📡 SSID: ${ssid}
🔑 Password: ${password}
🔒 Enkripsi: ${auth}

📲 Scan untuk connect WiFi otomatis!`
      })
    } catch {
      await sock.sendMessage(from, {
        text: `📶 *INFO WIFI*\n━━━━━━━━━━\n📡 SSID: ${ssid}\n🔑 Password: ${password}\n\nString WiFi:\n${wifiString}`
      })
    }
  }
}
