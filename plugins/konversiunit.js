module.exports = {
  name: "konversi",
  alias: ["convert", "ubah", "satuan"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    if (args.length < 3) {
      return sock.sendMessage(from, {
        text: `⚖️ *KONVERSI SATUAN*

Format: .konversi <nilai> <dari> <ke>

Contoh:
.konversi 5 km m
.konversi 100 c f
.konversi 1 kg lb
.konversi 10 liter galon

Kategori:
📏 Panjang: mm, cm, m, km, inch, ft, yard, mile
⚖️ Berat: mg, g, kg, ton, lb, oz
🌡️ Suhu: c, f, k
📦 Volume: ml, liter, galon, cup
📐 Luas: cm2, m2, km2, hectare, acre`
      })
    }

    const val = parseFloat(args[0])
    const from_unit = args[1].toLowerCase()
    const to_unit = args[2].toLowerCase()

    if (isNaN(val)) return sock.sendMessage(from, { text: "❌ Nilai harus angka." })

    const conversions = {
      mm: 0.001, cm: 0.01, m: 1, km: 1000, inch: 0.0254,
      ft: 0.3048, yard: 0.9144, mile: 1609.34,
      mg: 0.000001, g: 0.001, kg: 1, ton: 1000, lb: 0.453592, oz: 0.0283495,
      ml: 0.001, liter: 1, galon: 3.78541, cup: 0.236588,
      cm2: 0.0001, m2: 1, km2: 1000000, hectare: 10000, acre: 4046.86
    }

    if (from_unit === "c" || from_unit === "f" || from_unit === "k") {
      let result
      let fromLabel = from_unit === "c" ? "°C" : from_unit === "f" ? "°F" : "K"
      let toLabel = to_unit === "c" ? "°C" : to_unit === "f" ? "°F" : "K"

      if (from_unit === "c" && to_unit === "f") result = (val * 9/5) + 32
      else if (from_unit === "f" && to_unit === "c") result = (val - 32) * 5/9
      else if (from_unit === "c" && to_unit === "k") result = val + 273.15
      else if (from_unit === "k" && to_unit === "c") result = val - 273.15
      else if (from_unit === "f" && to_unit === "k") result = (val - 32) * 5/9 + 273.15
      else if (from_unit === "k" && to_unit === "f") result = (val - 273.15) * 9/5 + 32
      else result = val

      return sock.sendMessage(from, {
        text: `🌡️ *KONVERSI SUHU*\n━━━━━━━━━━━\n${val} ${fromLabel} = *${result.toFixed(4)} ${toLabel}*`
      })
    }

    if (!conversions[from_unit] || !conversions[to_unit]) {
      return sock.sendMessage(from, { text: `❌ Satuan *${from_unit}* atau *${to_unit}* tidak dikenali.` })
    }

    const result = (val * conversions[from_unit]) / conversions[to_unit]
    const formatted = result.toFixed(6).replace(/\.?0+$/, "")

    await sock.sendMessage(from, {
      text: `⚖️ *KONVERSI SATUAN*\n━━━━━━━━━━━\n📊 ${val} ${from_unit} = *${formatted} ${to_unit}*`
    })
  }
}
