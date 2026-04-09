const axios = require("axios")

module.exports = {
  name: "statuswebsite",
  alias: ["cekweb", "webstatus", "isdown"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const url = args[0]

    if (!url) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.statuswebsite google.com\n.cekweb tokopedia.com"
      })
    }

    const fullUrl = url.startsWith("http") ? url : "https://" + url

    try {
      await sock.sendMessage(from, { text: "🌐 Mengecek status website..." })

      const start = Date.now()
      const res = await axios.get(fullUrl, {
        timeout: 10000,
        validateStatus: () => true,
        headers: { "User-Agent": "Mozilla/5.0" }
      })
      const elapsed = Date.now() - start

      const status = res.status
      const isUp = status >= 200 && status < 400
      const speedLabel = elapsed < 500 ? "⚡ Sangat Cepat" : elapsed < 1500 ? "🟢 Cepat" : elapsed < 3000 ? "🟡 Normal" : "🔴 Lambat"

      await sock.sendMessage(from, {
        text: `🌐 *STATUS WEBSITE*
━━━━━━━━━━━━━━━
🔗 URL: ${fullUrl}
${isUp ? "✅ ONLINE" : "❌ MASALAH/OFFLINE"}
📊 HTTP Status: ${status} ${res.statusText || ""}
⚡ Response Time: ${elapsed}ms — ${speedLabel}
📦 Content-Type: ${res.headers?.["content-type"]?.split(";")[0] || "N/A"}`
      })
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ *Website tidak dapat diakses:* ${fullUrl}\n\nKemungkinan: offline, timeout, atau domain tidak valid.`
      })
    }
  }
}
