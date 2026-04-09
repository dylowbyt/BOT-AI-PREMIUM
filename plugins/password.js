module.exports = {
  name: "password",
  alias: ["passgen", "genpass", "buatpassword"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const length = parseInt(args[0]) || 16
    const type = args[1]?.toLowerCase() || "strong"

    if (length < 4 || length > 128) {
      return sock.sendMessage(from, {
        text: "⚠️ Panjang password antara 4-128 karakter.\nContoh: .password 16 strong"
      })
    }

    const sets = {
      simple: "abcdefghijklmnopqrstuvwxyz0123456789",
      medium: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      strong: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?",
      pin: "0123456789",
      symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?"
    }

    const charset = sets[type] || sets.strong

    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNum = /[0-9]/.test(password)
    const hasSymbol = /[^a-zA-Z0-9]/.test(password)
    const score = [hasUpper, hasLower, hasNum, hasSymbol].filter(Boolean).length
    const strength = ["", "Lemah", "Cukup", "Kuat", "Sangat Kuat"][score]

    await sock.sendMessage(from, {
      text: `🔐 *PASSWORD GENERATOR*
━━━━━━━━━━━━━━━
🔑 Password: \`${password}\`
📏 Panjang: ${length} karakter
🛡️ Kekuatan: ${strength}
🏷️ Tipe: ${type}

⚠️ Jangan bagikan password ini ke siapapun!`
    })
  }
}
