const axios = require("axios")

module.exports = {
  name: "domain",
  alias: ["cekdomain", "whois", "domaininfo"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const domain = args[0]?.replace(/https?:\/\//, "").split("/")[0]

    if (!domain) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.domain google.com\n.whois github.com"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🌐 Mengecek domain..." })

      const res = await axios.get(
        `https://api.whoisjsonapi.com/v1/${domain}`,
        { timeout: 10000, headers: { "accept": "application/json" } }
      )
      const d = res.data

      const created = d.creation_date ? new Date(d.creation_date).toLocaleDateString("id-ID") : "N/A"
      const expires = d.expiration_date ? new Date(d.expiration_date).toLocaleDateString("id-ID") : "N/A"
      const updated = d.updated_date ? new Date(d.updated_date).toLocaleDateString("id-ID") : "N/A"

      await sock.sendMessage(from, {
        text: `🌐 *INFO DOMAIN*
━━━━━━━━━━━━━━━
🔗 Domain: ${domain}
📛 Registrar: ${d.registrar || "N/A"}
📅 Dibuat: ${created}
📅 Kedaluwarsa: ${expires}
🔄 Update: ${updated}
📊 Status: ${Array.isArray(d.status) ? d.status[0] : (d.status || "N/A")}
🏢 Registrant: ${d.registrant_organization || d.registrant_name || "N/A"}
🌍 Negara: ${d.registrant_country || "N/A"}`
      })
    } catch {
      try {
        const dnsRes = await axios.get(
          `https://dns.google/resolve?name=${domain}&type=A`,
          { timeout: 8000 }
        )
        const ips = dnsRes.data?.Answer?.map(a => a.data).join(", ") || "Tidak ditemukan"
        await sock.sendMessage(from, {
          text: `🌐 *INFO DOMAIN*\n━━━━━━━━━━━\n🔗 Domain: ${domain}\n📡 IP: ${ips}\n\n⚠️ Info WHOIS lengkap tidak tersedia.`
        })
      } catch {
        await sock.sendMessage(from, { text: `❌ Gagal mengecek domain *${domain}*.` })
      }
    }
  }
}
