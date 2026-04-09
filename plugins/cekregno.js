module.exports = {
  name: "platno",
  alias: ["cekplat", "nopolisi", "platmobil"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const input = args.join(" ")?.toUpperCase()

    if (!input) {
      return sock.sendMessage(from, {
        text: "🚗 Contoh:\n.platno B 1234 ABC\n.platno D 4567 XY"
      })
    }

    const prefix = input.replace(/\s+/g, "").match(/^([A-Z]+)/)?.[1] || ""

    const regions = {
      A: "Banten (Serang, Cilegon, Lebak, Pandeglang)",
      B: "DKI Jakarta & Kep. Seribu",
      D: "Bandung, Kota & Kab Bandung",
      E: "Cirebon, Indramayu, Majalengka, Kuningan",
      F: "Bogor, Cianjur, Sukabumi",
      G: "Pekalongan, Batang, Pemalang",
      H: "Semarang Kota & Kab",
      K: "Pati, Kudus, Jepara, Rembang, Blora",
      L: "Surabaya",
      M: "Madura (Bangkalan, Sampang, Pamekasan, Sumenep)",
      N: "Malang, Batu, Pasuruan, Probolinggo",
      P: "Besuki (Situbondo, Bondowoso, Jember, Banyuwangi)",
      R: "Banyumas, Cilacap, Purbalingga, Banjarnegara",
      S: "Bojonegoro, Tuban, Lamongan, Mojokerto",
      T: "Purwakarta, Karawang, Subang",
      W: "Sidoarjo, Gresik",
      Z: "Garut, Tasikmalaya, Ciamis, Banjar",
      AA: "Magelang, Temanggung, Wonosobo, Purworejo",
      AB: "DI Yogyakarta",
      AD: "Solo, Karanganyar, Boyolali, Klaten, Sragen, Sukoharjo, Wonogiri",
      AE: "Madiun, Ngawi, Ponorogo, Pacitan",
      AG: "Kediri, Tulungagung, Blitar, Trenggalek, Nganjuk",
      BA: "Sumatera Barat (Padang)",
      BB: "Sumatera Utara Barat (Tapanuli)",
      BD: "Bengkulu",
      BE: "Lampung",
      BG: "Sumatera Selatan",
      BH: "Jambi",
      BK: "Sumatera Utara",
      BL: "Aceh",
      BM: "Riau (Pekanbaru)",
      BN: "Kep. Bangka Belitung",
      BP: "Kep. Riau (Batam, Tanjungpinang)",
      DA: "Kalimantan Selatan",
      DB: "Sulawesi Utara",
      DC: "Sulawesi Barat",
      DD: "Sulawesi Selatan",
      DE: "Maluku",
      DG: "Makassar (Gowa, Takalar, Jeneponto)",
      DH: "Maluku (Ternate, Halmahera)",
      DK: "Bali",
      DL: "Sulawesi Utara (Manado)",
      DM: "Gorontalo",
      DN: "Sulawesi Tengah",
      DR: "NTB (Lombok)",
      DS: "Papua",
      DT: "Sulawesi Tenggara",
      DW: "NTT (Kupang)",
      EB: "NTT (Ende, Flores)",
      ED: "NTT (Sumba)",
      KB: "Kalimantan Barat",
      KH: "Kalimantan Tengah",
      KT: "Kalimantan Timur",
      KU: "Kalimantan Utara",
      KS: "Kalimantan Selatan (Banjarmasin)",
      SA: "Sulawesi Utara (Sangihe)",
      PA: "Papua Barat",
      PB: "Papua Barat (Manokwari)"
    }

    const found = Object.entries(regions).find(([k]) => prefix.startsWith(k) && prefix.length <= k.length + 2)
    const region = found ? found[1] : "Tidak diketahui"

    await sock.sendMessage(from, {
      text: `🚗 *INFO PLAT NOMOR*
━━━━━━━━━━━━━━━
🔢 Plat: ${input}
📍 Kode Daerah: ${prefix}
🌍 Wilayah: ${region}

⚠️ Ini berdasarkan kode plat umum, bukan data Polri resmi.`
    })
  }
}
