// ─── .tutorial ──────────────────────────────────────────────
if (command === "tutorial") {
  return sock.sendMessage(from, {
    text:
      `📖 *TUTORIAL NANO BANANA EDIT*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 *TUJUAN*\n` +
      `Fitur ini digunakan untuk *mengedit foto dengan AI* sesuai instruksi yang kamu kirim.\n\n` +

      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚙️ *CARANYA*\n\n` +

      `🖼️ *1. Edit 1 Foto*\n` +
      `Kirim 1 foto + caption:\n` +
      `👉 *.nanoedit <instruksi>*\n\n` +
      `Contoh:\n` +
      `👉 .nanoedit isi promt kamu atau .nanopro isi promt kamu\n\n` +

      `━━━━━━━━━━━━━━━━━━━━\n` +

      `🖼️ *2. Edit 2 Foto (Gabung / Referensi)*\n` +
      `• Kirim foto 1 dengan caption:\n` +
      `👉 *.nanoedit atau pakai nanopro <instruksi>*\n` +
      `• Lalu *reply* ke pesan yang ada foto ke-2\n\n` +

      `Contoh:\n` +
      `👉 Kirim foto kamu\n` +
      `👉 Reply ke foto lain + caption:\n` +
      `👉 .nanoedit atau nanopro gabungkan jadi satu gambar\n\n` +

      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 *TIPS*\n` +
      `• Gunakan instruksi yang jelas\n` +
      `• Bisa ubah ke nanopro untuk lebih baik, background, objek, dll\n` +
      `• Semakin detail, hasil makin bagus\n\n` +

      `🚀 Selamat mencoba!`
  })
}
