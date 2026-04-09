const axios = require("axios")

async function mediafireDl(url) {
  try {
    const res = await axios.get(url, { timeout: 15000 })
    const match = res.data.match(/href="(https?:\/\/download[^"]+)"/)
    if (!match) throw new Error("Link download tidak ditemukan")
    const link = match[1]
    const nama = link.split("/").pop()
    const mime = nama.split(".").pop()

    const sizeMatch = res.data.match(/class="dl-btn-label"[^>]*>([^<]+)/)
    const size = sizeMatch ? sizeMatch[1].replace(/Download|\(|\)|\n/g, "").trim() : "Unknown"

    return { nama, mime, size, link }
  } catch (err) {
    throw err
  }
}

module.exports = {
  name: "mediafire",
  alias: ["mf"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const url = args[0]

    if (!url) {
      return sock.sendMessage(from, {
        text: "📥 Masukkan link MediaFire!\nContoh: .mediafire https://mediafire.com/xxxx"
      })
    }

    if (!url.includes("mediafire.com")) {
      return sock.sendMessage(from, { text: "❌ Itu bukan link MediaFire" })
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Sedang mengambil file..." })

      const data = await mediafireDl(url)

      let caption = `📦 *MEDIAFIRE DOWNLOADER*\n\n`
      caption += `📄 Nama: ${data.nama}\n`
      caption += `📦 Size: ${data.size}\n`
      caption += `📁 Type: ${data.mime}\n`

      await sock.sendMessage(from, { text: caption })

      const file = await axios.get(data.link, {
        responseType: "arraybuffer",
        timeout: 60000
      })

      await sock.sendMessage(from, {
        document: Buffer.from(file.data),
        fileName: data.nama,
        mimetype: "application/octet-stream"
      })

    } catch (err) {
      console.log("MEDIAFIRE ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal mengambil file dari MediaFire" })
    }
  }
}
