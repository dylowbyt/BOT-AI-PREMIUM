module.exports = {
  name: "aksara",
  alias: ["tulisarab", "latin2arab", "arab", "jawa", "alfabet"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const tipe = args[0]?.toLowerCase()
    const text = args.slice(1).join(" ")

    if (!tipe || !text) {
      return sock.sendMessage(from, {
        text: `✍️ *KONVERSI AKSARA*

Perintah:
.aksara morse <teks>       → Konversi ke kode Morse
.aksara -morse <morse>     → Decode kode Morse
.aksara nato <teks>        → Alfabet NATO
.aksara balik <teks>       → Balik teks (mirror)
.aksara kapital <teks>     → KAPITAL SEMUA
.aksara kecil <teks>       → kecil semua
.aksara judul <teks>       → Judul Setiap Kata

Contoh:
.aksara morse SOS
.aksara nato ABCD`
      })
    }

    const morseMap = {
      A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.",
      H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.",
      O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-",
      V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
      "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
      "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----."
    }

    const natoAlphabet = {
      A: "Alpha", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo",
      F: "Foxtrot", G: "Golf", H: "Hotel", I: "India", J: "Juliet",
      K: "Kilo", L: "Lima", M: "Mike", N: "November", O: "Oscar",
      P: "Papa", Q: "Quebec", R: "Romeo", S: "Sierra", T: "Tango",
      U: "Uniform", V: "Victor", W: "Whiskey", X: "X-ray", Y: "Yankee", Z: "Zulu"
    }

    let result = ""

    if (tipe === "morse") {
      result = text.toUpperCase().split("").map(c => c === " " ? "/" : (morseMap[c] || c)).join(" ")
      await sock.sendMessage(from, { text: `📡 *KODE MORSE*\n━━━━━━━━━━━\n📝 Asli: ${text}\n📻 Morse: ${result}` })
    } else if (tipe === "-morse") {
      const reverseMorse = Object.fromEntries(Object.entries(morseMap).map(([k, v]) => [v, k]))
      result = text.split(" ").map(c => c === "/" ? " " : (reverseMorse[c] || "?")).join("")
      await sock.sendMessage(from, { text: `📡 *DECODE MORSE*\n━━━━━━━━━━━\n📻 Morse: ${text}\n📝 Teks: ${result}` })
    } else if (tipe === "nato") {
      result = text.toUpperCase().split("").map(c => c === " " ? " | " : (natoAlphabet[c] || c)).join(" ")
      await sock.sendMessage(from, { text: `🪖 *ALFABET NATO*\n━━━━━━━━━━━\n📝 Asli: ${text}\n🔤 NATO: ${result}` })
    } else if (tipe === "balik") {
      result = text.split("").reverse().join("")
      await sock.sendMessage(from, { text: `🔄 *TEKS DIBALIK*\n━━━━━━━━━━━\n📝 Asli: ${text}\n🔃 Balik: ${result}` })
    } else if (tipe === "kapital") {
      result = text.toUpperCase()
      await sock.sendMessage(from, { text: `🔡 KAPITAL: ${result}` })
    } else if (tipe === "kecil") {
      result = text.toLowerCase()
      await sock.sendMessage(from, { text: `🔡 kecil: ${result}` })
    } else if (tipe === "judul") {
      result = text.replace(/\b\w/g, c => c.toUpperCase())
      await sock.sendMessage(from, { text: `🔡 Judul: ${result}` })
    } else {
      await sock.sendMessage(from, { text: "❌ Tipe tidak dikenal. Ketik .aksara untuk daftar." })
    }
  }
}
