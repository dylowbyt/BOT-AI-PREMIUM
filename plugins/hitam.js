const axios = require("axios")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const FormData = require("form-data")

async function uploadImage(buffer) {
  try {
    const form = new FormData()
    form.append("file", buffer, { filename: "image.jpg", contentType: "image/jpeg" })
    const r = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
      headers: form.getHeaders(), timeout: 20000
    })
    const raw = r.data?.data?.url
    if (raw?.startsWith("http")) return raw.replace("tmpfiles.org/", "tmpfiles.org/dl/")
  } catch {}

  try {
    const form = new FormData()
    form.append("file", buffer, { filename: "image.jpg", contentType: "image/jpeg" })
    const r = await axios.post("https://0x0.st", form, {
      headers: form.getHeaders(), timeout: 20000
    })
    const url = r.data?.trim()
    if (url?.startsWith("http")) return url
  } catch {}

  return null
}

// FIX: Validasi response benar-benar gambar
function isValidImageBuffer(data) {
  if (!data || data.length < 100) return false
  const buf = Buffer.from(data)
  return (buf[0] === 0xFF && buf[1] === 0xD8) ||
         (buf[0] === 0x89 && buf[1] === 0x50) ||
         (buf[0] === 0x47 && buf[1] === 0x49) ||
         (buf[0] === 0x52 && buf[1] === 0x49)
}

module.exports = {
  name: "hitam",
  alias: ["bw", "grayscale", "greyscale"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const hasImage = m.message?.imageMessage || quoted?.imageMessage

      if (!hasImage) {
        return sock.sendMessage(from, {
          text: "⚠️ *Cara pakai .hitam:*\nReply foto dengan .hitam\n\n🖤 Foto akan diubah jadi hitam putih!"
        })
      }

      await sock.sendMessage(from, { text: "🖤 Mengubah foto jadi hitam putih... ⏳" })

      // FIX: Gunakan key quoted yang benar
      let targetMsg
      if (quoted?.imageMessage) {
        const stanzaId = m.message?.extendedTextMessage?.contextInfo?.stanzaId
        const participant = m.message?.extendedTextMessage?.contextInfo?.participant
        targetMsg = {
          key: { remoteJid: from, id: stanzaId, participant: participant || from },
          message: quoted
        }
      } else {
        targetMsg = m
      }

      const buffer = await downloadMediaMessage(targetMsg, "buffer", {}, {
        logger: console,
        reuploadRequest: sock.updateMediaMessage
      })

      if (!buffer || buffer.length < 100) throw new Error("Gagal download gambar")

      const imageUrl = await uploadImage(buffer)
      if (!imageUrl) throw new Error("Gagal upload gambar ke server")

      let resultBuffer = null

      // API 1: popcat.xyz
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.popcat.xyz/greyscale?image=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (isValidImageBuffer(r.data)) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 2: siputzx
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.siputzx.my.id/api/edit/greyscale?url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (isValidImageBuffer(r.data)) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 3: betabotz
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.betabotz.eu.org/api/filter/bw?url=${encodeURIComponent(imageUrl)}&apikey=beta`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (isValidImageBuffer(r.data)) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 4: nexoracle
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.nexoracle.com/filter/greyscale?apikey=free&url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (isValidImageBuffer(r.data)) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 5: ryzendesu
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.ryzendesu.vip/api/image/filter/greyscale?url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (isValidImageBuffer(r.data)) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 6: agatz (fallback tambahan)
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.agatz.xyz/api/bw?url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (isValidImageBuffer(r.data)) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      if (!resultBuffer) throw new Error("Semua server API sedang down, coba lagi nanti")

      await sock.sendMessage(from, {
        image: resultBuffer,
        caption: "🖤 *Foto Hitam Putih* — Sukses!"
      })

    } catch (err) {
      console.log("HITAM ERROR:", err?.message)
      sock.sendMessage(from, { text: `❌ Gagal edit foto hitam putih\n_${err?.message || "Coba lagi nanti"}_` })
    }
  }
}
