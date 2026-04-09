module.exports = {
  name: "kalkulator",
  alias: ["calc", "hitung", "math"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const expr = args.join(" ")

    if (!expr) {
      return sock.sendMessage(from, {
        text: `🔢 *KALKULATOR*\n\nContoh:\n.hitung 25 * 4 + 10\n.hitung (100 / 5) ^ 2\n.hitung 15% dari 200\n\nOperator: + - * / ^ % ()\nFungsi: sqrt() round() floor() ceil()`
      })
    }

    try {
      let cleaned = expr
        .replace(/dari/gi, "* 0.01 *")
        .replace(/\^/g, "**")
        .replace(/sqrt\(/g, "Math.sqrt(")
        .replace(/round\(/g, "Math.round(")
        .replace(/floor\(/g, "Math.floor(")
        .replace(/ceil\(/g, "Math.ceil(")
        .replace(/pi/gi, "Math.PI")
        .replace(/[^0-9+\-*/()., Math.sqrtrounceilflPIe%\s]/g, "")

      if (/[a-zA-Z]/.test(cleaned.replace(/Math\./g, "").replace(/PI/g, "").replace(/sqrt|round|floor|ceil/g, ""))) {
        return sock.sendMessage(from, { text: "❌ Ekspresi tidak valid!" })
      }

      const result = eval(cleaned)

      if (result === undefined || result === null || isNaN(result)) {
        return sock.sendMessage(from, { text: "❌ Hasil tidak valid." })
      }

      const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(6).replace(/\.?0+$/, "")

      await sock.sendMessage(from, {
        text: `🔢 *KALKULATOR*\n━━━━━━━━━━━━━━━\n📝 Ekspresi: ${expr}\n✅ Hasil: *${formatted}*`
      })
    } catch (e) {
      await sock.sendMessage(from, { text: "❌ Ekspresi matematika tidak valid." })
    }
  }
}
