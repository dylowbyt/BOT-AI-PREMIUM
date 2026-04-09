module.exports = {
  name: "ping",
  run: async (sock, m) => {
    await sock.sendMessage(m.key.remoteJid, {
      text: "hidup 24jam gw gak usah ping ping pong segala!"
    })
  }
}
