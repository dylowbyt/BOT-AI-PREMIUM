const axios = require("axios")

module.exports = {
  name: "ceklink",
  alias: ["linkcheck", "safebrowsing", "cekurl"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const url = args[0]

    if (!url) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.ceklink https://google.com\n.ceklink bit.ly/abc123"
      })
    }

    const fullUrl = url.startsWith("http") ? url : "https://" + url

    try {
      await sock.sendMessage(from, { text: "🔍 Memeriksa link..." })

      let resolvedUrl = fullUrl
      try {
        const headRes = await axios.head(fullUrl, {
          maxRedirects: 10,
          timeout: 8000,
          headers: { "User-Agent": "Mozilla/5.0" },
          validateStatus: () => true
        })
        resolvedUrl = headRes.request?.res?.responseUrl || headRes.config?.url || fullUrl
      } catch {}

      const parsed = new URL(resolvedUrl)
      const domain = parsed.hostname

      const suspiciousTLDs = [".xyz", ".top", ".tk", ".ml", ".ga", ".cf", ".gq"]
      const isSuspiciousTLD = suspiciousTLDs.some(tld => domain.endsWith(tld))
      const isHttps = resolvedUrl.startsWith("https")
      const isShortUrl = ["bit.ly", "tinyurl.com", "goo.gl", "ow.ly", "t.co", "short.io"].some(s => url.includes(s))

      const warnings = []
      if (!isHttps) warnings.push("❌ Tidak menggunakan HTTPS")
      if (isSuspiciousTLD) warnings.push("⚠️ TLD mencurigakan")
      if (isShortUrl) warnings.push("ℹ️ URL dipersingkat")

      const risk = warnings.filter(w => w.startsWith("❌") || w.startsWith("⚠️")).length
      const riskLabel = risk === 0 ? "✅ Tampak Aman" : risk === 1 ? "⚠️ Perlu Waspada" : "🔴 Berisiko"

      await sock.sendMessage(from, {
        text: `🔍 *CEK KEAMANAN LINK*
━━━━━━━━━━━━━━━
🔗 URL Asli: ${url}
🔗 URL Final: ${resolvedUrl.slice(0, 100)}
🌐 Domain: ${domain}
🔒 HTTPS: ${isHttps ? "✅ Ya" : "❌ Tidak"}

📊 Penilaian: ${riskLabel}
${warnings.length ? "\n⚠️ Peringatan:\n" + warnings.join("\n") : ""}

💡 Untuk verifikasi lebih lanjut:
🔗 VirusTotal: https://www.virustotal.com/gui/url/${Buffer.from(resolvedUrl).toString("base64").replace(/=/g, "")}

⚠️ Ini analisis dasar, bukan jaminan keamanan penuh.`
      })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal memeriksa link. Pastikan URL valid." })
    }
  }
}
