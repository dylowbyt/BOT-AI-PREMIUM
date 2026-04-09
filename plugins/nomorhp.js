const axios = require("axios")

module.exports = {
  name: "ceknomor",
  alias: ["nohp", "cekno", "nomorhp"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    let nomor = args[0]

    if (!nomor) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.ceknomor 08123456789\n.ceknomor +6281234567"
      })
    }

    nomor = nomor.replace(/\D/g, "")
    if (nomor.startsWith("62")) nomor = "0" + nomor.slice(2)
    if (!nomor.startsWith("0")) nomor = "0" + nomor

    const prefixes = {
      "0811": "Telkomsel", "0812": "Telkomsel", "0813": "Telkomsel",
      "0821": "Telkomsel", "0822": "Telkomsel", "0823": "Telkomsel",
      "0851": "Telkomsel", "0852": "Telkomsel", "0853": "Telkomsel",
      "0814": "Indosat", "0815": "Indosat", "0816": "Indosat",
      "0855": "Indosat", "0856": "Indosat", "0857": "Indosat",
      "0858": "Indosat",
      "0817": "XL Axiata", "0818": "XL Axiata", "0819": "XL Axiata",
      "0859": "XL Axiata", "0877": "XL Axiata", "0878": "XL Axiata",
      "0895": "XL Axiata", "0896": "XL Axiata", "0897": "XL Axiata",
      "0898": "XL Axiata", "0899": "XL Axiata",
      "0831": "AXIS", "0832": "AXIS", "0833": "AXIS", "0838": "AXIS",
      "0881": "Smartfren", "0882": "Smartfren", "0883": "Smartfren",
      "0884": "Smartfren", "0885": "Smartfren", "0886": "Smartfren",
      "0887": "Smartfren", "0888": "Smartfren", "0889": "Smartfren",
      "0876": "By.U (Telkomsel)", "0827": "CIOT/Indosat"
    }

    const prefix = nomor.slice(0, 4)
    const operator = prefixes[prefix] || "Tidak Diketahui"
    const isValid = nomor.length >= 10 && nomor.length <= 13

    const msg = `📱 *CEK NOMOR HP*
━━━━━━━━━━━━━━━
📞 Nomor: ${nomor}
🏢 Operator: *${operator}*
✅ Valid: ${isValid ? "Ya" : "Tidak (panjang tidak wajar)"}
📏 Panjang: ${nomor.length} digit`

    await sock.sendMessage(from, { text: msg })
  }
}
