module.exports = {
    name: "stiker",
    command: [".stiker"],
    execute: async (sock, m) => {
        const from = m.key.remoteJid

        if (m.message.imageMessage) {
            await sock.sendMessage(from, {
                text: "🔥 Fitur stiker aktif (dummy dulu)"
            })
        } else {
            await sock.sendMessage(from, {
                text: "Kirim gambar + .stiker"
            })
        }
    }
}
