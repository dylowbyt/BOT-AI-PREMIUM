const axios = require("axios")

module.exports = {
  name: "motivasi",
  alias: ["quotes", "quote", "semangat", "inspirasi"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const tipe = args[0]?.toLowerCase()

    const quotesByType = {
      sukses: [
        "Kesuksesan bukanlah akhir, kegagalan bukanlah fatal: yang penting adalah keberanian untuk terus melanjutkan. — Winston Churchill",
        "Satu-satunya cara untuk melakukan pekerjaan yang hebat adalah dengan mencintai apa yang kamu lakukan. — Steve Jobs",
        "Jangan menunggu. Waktu tidak pernah tepat. — Napoleon Hill",
        "Sukses adalah totalitas dari pilihan-pilihan kecil yang kamu buat setiap hari. — Jeff Olson",
        "Keberhasilan datang kepada mereka yang berani bermimpi besar dan terus berjuang."
      ],
      belajar: [
        "Pendidikan adalah senjata paling ampuh yang bisa kamu gunakan untuk mengubah dunia. — Nelson Mandela",
        "Belajar tidak pernah melelahkan pikiran. — Leonardo da Vinci",
        "Investasi terbaik yang bisa kamu lakukan adalah investasi pada dirimu sendiri. — Warren Buffett",
        "Ilmu yang bermanfaat lebih berharga dari seribu kebaikan. — Ali bin Abi Thalib",
        "Orang yang berhenti belajar adalah orang yang sudah tua. Orang yang terus belajar tetap muda."
      ],
      hidup: [
        "Hidup bukan tentang menemukan dirimu sendiri, tapi tentang menciptakan dirimu sendiri. — George Bernard Shaw",
        "Anda tidak bisa kembali dan mengubah awal, tapi Anda bisa mulai sekarang dan mengubah akhirnya. — C.S. Lewis",
        "Kebahagiaan bukan sesuatu yang siap pakai. Itu datang dari tindakanmu sendiri. — Dalai Lama",
        "Hiduplah seolah kamu akan mati besok, belajarlah seolah kamu akan hidup selamanya. — Mahatma Gandhi",
        "Jadilah perubahan yang kamu ingin lihat di dunia. — Mahatma Gandhi"
      ],
      kerja: [
        "Cara terbaik untuk memprediksi masa depan adalah dengan menciptakannya. — Peter Drucker",
        "Kerja keras hari ini, menikmati hasilnya esok hari.",
        "Semua pencapaian besar dimulai dari seorang yang berani bermimpi dan tidak takut bekerja keras.",
        "Jangan biarkan apa yang tidak bisa kamu lakukan mengganggu apa yang bisa kamu lakukan. — John Wooden",
        "Kamu tidak harus menjadi hebat untuk memulai, tapi kamu harus memulai untuk menjadi hebat."
      ]
    }

    const allQuotes = Object.values(quotesByType).flat()

    let selectedQuotes
    if (tipe && quotesByType[tipe]) {
      selectedQuotes = quotesByType[tipe]
    } else {
      selectedQuotes = allQuotes
    }

    const randomQuote = selectedQuotes[Math.floor(Math.random() * selectedQuotes.length)]

    await sock.sendMessage(from, {
      text: `✨ *QUOTES MOTIVASI*
━━━━━━━━━━━━━━━
💬 "${randomQuote}"

━━━━━━━━━━━━━━━
Kategori: .motivasi sukses / belajar / hidup / kerja`
    })
  }
}
