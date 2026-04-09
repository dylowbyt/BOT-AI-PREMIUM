module.exports = {
  name: "warna",
  alias: ["colorhex", "hexcolor", "rgb"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const input = args[0]

    if (!input) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.warna #ff5733\n.warna rgb(255,87,51)\n.warna red"
      })
    }

    const namedColors = {
      red: "#FF0000", green: "#008000", blue: "#0000FF", white: "#FFFFFF",
      black: "#000000", yellow: "#FFFF00", orange: "#FFA500", purple: "#800080",
      pink: "#FFC0CB", cyan: "#00FFFF", brown: "#A52A2A", gray: "#808080",
      silver: "#C0C0C0", gold: "#FFD700", navy: "#000080", teal: "#008080",
      lime: "#00FF00", maroon: "#800000", olive: "#808000", coral: "#FF7F50"
    }

    let hex = ""
    let r = 0, g = 0, b = 0

    if (input.startsWith("#")) {
      hex = input.replace("#", "").toUpperCase()
      if (hex.length === 3) hex = hex.split("").map(c => c + c).join("")
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
    } else if (input.toLowerCase().startsWith("rgb")) {
      const match = input.match(/(\d+),\s*(\d+),\s*(\d+)/)
      if (!match) return sock.sendMessage(from, { text: "❌ Format RGB salah. Contoh: rgb(255,0,0)" })
      r = parseInt(match[1]); g = parseInt(match[2]); b = parseInt(match[3])
      hex = [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase()
    } else {
      const named = namedColors[input.toLowerCase()]
      if (!named) return sock.sendMessage(from, { text: "❌ Warna tidak dikenali." })
      hex = named.replace("#", "")
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
    }

    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    const isDark = brightness < 128

    const h = rgbToHsl(r, g, b)

    await sock.sendMessage(from, {
      text: `🎨 *INFO WARNA*
━━━━━━━━━━━━━━━
HEX: #${hex}
RGB: rgb(${r}, ${g}, ${b})
HSL: hsl(${h[0]}°, ${h[1]}%, ${h[2]}%)
Gelap/Terang: ${isDark ? "🌙 Warna Gelap" : "☀️ Warna Terang"}

🔗 Preview: https://www.color-hex.com/color/${hex.toLowerCase()}`
    })

    function rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255
      const max = Math.max(r, g, b), min = Math.min(r, g, b)
      let h, s, l = (max + min) / 2
      if (max === min) { h = s = 0 }
      else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
          case g: h = ((b - r) / d + 2) / 6; break
          case b: h = ((r - g) / d + 4) / 6; break
        }
      }
      return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
    }
  }
}
