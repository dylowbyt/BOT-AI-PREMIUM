module.exports = {
  name: "random",
  alias: ["pilihkan", "acak", "pilih"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const input = args.join(" ")

    if (!input) {
      return sock.sendMessage(from, {
        text: `🎲 *RANDOM PILIH*\n━━━━━━━━━━━━━━━\nFormat: .random <pilihan1> | <pilihan2> | ...\n\nContoh:\n.random makan | tidur | main game\n.random nasi goreng | mie ayam | soto\n.random A | B | C | D\n\nMode lain:\n🎲 .random dice      — lempar dadu\n🪙 .random coin      — lempar koin\n🔢 .random angka 1 100  — angka acak 1-100`
      })
    }

    // ===== DADU =====
    if (input.toLowerCase() === "dice" || input.toLowerCase() === "dadu") {
      const result = Math.floor(Math.random() * 6) + 1
      const faces = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]
      return sock.sendMessage(from, {
        text: `🎲 *LEMPAR DADU*\n━━━━━━━━━━━\n${faces[result]} Hasil: *${result}*`
      })
    }

    // ===== KOIN =====
    if (input.toLowerCase() === "coin" || input.toLowerCase() === "koin") {
      const result = Math.random() > 0.5 ? "🦅 HEADS (Gambar)" : "🔢 TAILS (Angka)"
      return sock.sendMessage(from, {
        text: `🪙 *LEMPAR KOIN*\n━━━━━━━━━━━\n🎯 Hasil: *${result}*`
      })
    }

    // ===== ANGKA ACAK =====
    if (input.toLowerCase().startsWith("angka")) {
      const parts = input.split(/\s+/)
      const min = parseInt(parts[1]) || 1
      const max = parseInt(parts[2]) || 100
      if (min >= max) return sock.sendMessage(from, { text: "❌ Angka min harus lebih kecil dari max." })
      const result = Math.floor(Math.random() * (max - min + 1)) + min
      return sock.sendMessage(from, {
        text: `🔢 *ANGKA ACAK*\n━━━━━━━━━━━\nRange: ${min} - ${max}\n🎯 Hasil: *${result}*`
      })
    }

    // ===== PILIH DARI DAFTAR =====
    // FIX: Support pemisah | atau koma
    let choices = []
    if (input.includes("|")) {
      choices = input.split("|").map(c => c.trim()).filter(Boolean)
    } else if (input.includes(",")) {
      choices = input.split(",").map(c => c.trim()).filter(Boolean)
    } else {
      choices = input.split(" ").filter(Boolean)
    }

    if (choices.length < 2) {
      return sock.sendMessage(from, {
        text: "⚠️ Minimal 2 pilihan!\n\nGunakan | atau , sebagai pemisah:\n.random A | B | C\n.random pilihan1, pilihan2, pilihan3"
      })
    }

    const result = choices[Math.floor(Math.random() * choices.length)]
    const list = choices.map((c, i) => `${i + 1}. ${c}${c === result ? " ✅" : ""}`).join("\n")

    await sock.sendMessage(from, {
      text: `🎲 *PILIHAN ACAK*\n━━━━━━━━━━━━━━━\n📋 Pilihan:\n${list}\n\n🎯 Terpilih: *${result}*`
    })
  }
}
