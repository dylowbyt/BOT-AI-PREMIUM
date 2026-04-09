module.exports = {
  name: "pbb",
  alias: ["kalkulasipbb", "hitungpbb", "pajaktanah"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    if (args.length < 2) {
      return sock.sendMessage(from, {
        text: `🏠 *KALKULATOR PBB*

Format: .pbb <NJOP_tanah_per_m2> <luas_tanah_m2> [luas_bangunan_m2] [NJOP_bangunan_per_m2]

Contoh:
.pbb 2000000 200
.pbb 3000000 150 100 1500000

Keterangan:
- NJOP = Nilai Jual Objek Pajak
- PBB dikenakan 0.5% dari NJKP (20-100% dari NJOP)`
      })
    }

    const njopTanah = parseFloat(args[0])
    const luasTanah = parseFloat(args[1])
    const luasBangunan = parseFloat(args[2]) || 0
    const njopBangunan = parseFloat(args[3]) || 0

    if (isNaN(njopTanah) || isNaN(luasTanah)) {
      return sock.sendMessage(from, { text: "❌ Nilai tidak valid." })
    }

    const totalNJOP = (njopTanah * luasTanah) + (njopBangunan * luasBangunan)
    const NJOPTKP = 12000000
    const kenaKena = Math.max(0, totalNJOP - NJOPTKP)
    const NJKP = kenaKena * 0.20
    const pbbTerutang = NJKP * 0.005

    await sock.sendMessage(from, {
      text: `🏠 *KALKULATOR PBB*
━━━━━━━━━━━━━━━
📏 Luas Tanah: ${luasTanah} m²
💰 NJOP Tanah: Rp ${njopTanah.toLocaleString("id-ID")}/m²
${luasBangunan ? `🏗️ Luas Bangunan: ${luasBangunan} m²\n💰 NJOP Bangunan: Rp ${njopBangunan.toLocaleString("id-ID")}/m²` : ""}

📊 Total NJOP: Rp ${totalNJOP.toLocaleString("id-ID")}
📉 NJOP-TKP: Rp 12.000.000
📈 NJOP Kena Pajak: Rp ${kenaKena.toLocaleString("id-ID")}
🏛️ NJKP (20%): Rp ${NJKP.toLocaleString("id-ID")}

💳 *PBB Terutang (0.5%): Rp ${Math.ceil(pbbTerutang).toLocaleString("id-ID")}*

⚠️ Ini adalah estimasi. Hubungi kantor pajak untuk nilai resmi.`
    })
  }
}
