module.exports = {
  name: "encode",
  alias: ["enkode", "cipher"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const tipe = args[0]?.toLowerCase()
    const text = args.slice(1).join(" ")

    if (!tipe || !text) {
      return sock.sendMessage(from, {
        text: `🔐 *ENCODE/DECODE TEKS*

Format: .encode <tipe> <teks>

Encode:
.encode base64 Halo dunia
.encode hex Halo dunia
.encode binary Halo

Decode:
.encode -base64 SGFsbyBkdW5pYQ==
.encode -hex 48616c6f

Caesar cipher:
.encode caesar3 Halo dunia
.encode -caesar3 Kdor gxqld

ROT13:
.encode rot13 Hello world`
      })
    }

    try {
      let result = ""
      let label = ""

      if (tipe === "base64") {
        result = Buffer.from(text, "utf8").toString("base64")
        label = "BASE64 ENCODE"
      } else if (tipe === "-base64") {
        result = Buffer.from(text, "base64").toString("utf8")
        label = "BASE64 DECODE"
      } else if (tipe === "hex") {
        result = Buffer.from(text, "utf8").toString("hex")
        label = "HEX ENCODE"
      } else if (tipe === "-hex") {
        result = Buffer.from(text, "hex").toString("utf8")
        label = "HEX DECODE"
      } else if (tipe === "binary") {
        result = text.split("").map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ")
        label = "BINARY ENCODE"
      } else if (tipe === "-binary") {
        result = text.split(" ").map(b => String.fromCharCode(parseInt(b, 2))).join("")
        label = "BINARY DECODE"
      } else if (tipe === "rot13") {
        result = text.replace(/[a-zA-Z]/g, c => {
          const base = c <= "Z" ? 65 : 97
          return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base)
        })
        label = "ROT13"
      } else if (tipe.startsWith("caesar") || tipe.startsWith("-caesar")) {
        const shift = parseInt(tipe.replace("-caesar", "").replace("caesar", "")) || 3
        const decode = tipe.startsWith("-")
        result = text.replace(/[a-zA-Z]/g, c => {
          const base = c <= "Z" ? 65 : 97
          const s = decode ? (26 - shift) % 26 : shift
          return String.fromCharCode(((c.charCodeAt(0) - base + s) % 26) + base)
        })
        label = `CAESAR ${Math.abs(shift)} ${decode ? "DECODE" : "ENCODE"}`
      } else {
        return sock.sendMessage(from, { text: "❌ Tipe tidak dikenal. Gunakan: base64, hex, binary, rot13, caesar3" })
      }

      await sock.sendMessage(from, {
        text: `🔐 *${label}*
━━━━━━━━━━━━━━━
📝 Input: ${text.slice(0, 200)}
✅ Output: ${result.slice(0, 1000)}`
      })
    } catch {
      await sock.sendMessage(from, { text: "❌ Terjadi error saat enkode/dekode." })
    }
  }
}
