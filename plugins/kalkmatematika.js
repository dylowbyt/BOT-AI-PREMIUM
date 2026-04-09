module.exports = {
  name: "matematika",
  alias: ["mtk", "pangkat", "akar", "faktorial"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sub = args[0]?.toLowerCase()
    const nums = args.slice(1).map(Number)

    if (!sub) {
      return sock.sendMessage(from, {
        text: `📐 *MATEMATIKA LANJUTAN*

Perintah:
.matematika kpk 12 18
.matematika fpb 48 36
.matematika pangkat 2 10
.matematika akar 144
.matematika faktorial 10
.matematika prima 97
.matematika fibonacci 10
.matematika konversiangka 255 10 2  (desimal ke biner)
.matematika statistik 5 8 3 9 1`
      })
    }

    if (sub === "kpk") {
      if (nums.length < 2 || nums.some(isNaN)) return sock.sendMessage(from, { text: "⚠️ Format: .matematika kpk 12 18 24" })
      const gcd = (a, b) => b === 0 ? a : gcd(b, a % b)
      const lcm = (a, b) => (a * b) / gcd(a, b)
      const result = nums.reduce(lcm)
      return sock.sendMessage(from, { text: `📐 KPK dari ${nums.join(", ")} = *${result}*` })
    }

    if (sub === "fpb") {
      if (nums.length < 2 || nums.some(isNaN)) return sock.sendMessage(from, { text: "⚠️ Format: .matematika fpb 48 36" })
      const gcd = (a, b) => b === 0 ? a : gcd(b, a % b)
      const result = nums.reduce(gcd)
      return sock.sendMessage(from, { text: `📐 FPB dari ${nums.join(", ")} = *${result}*` })
    }

    if (sub === "pangkat") {
      const [base, exp] = nums
      if (isNaN(base) || isNaN(exp)) return sock.sendMessage(from, { text: "⚠️ Format: .matematika pangkat 2 10" })
      return sock.sendMessage(from, { text: `📐 ${base}^${exp} = *${Math.pow(base, exp)}*` })
    }

    if (sub === "akar") {
      if (isNaN(nums[0])) return sock.sendMessage(from, { text: "⚠️ Format: .matematika akar 144" })
      return sock.sendMessage(from, { text: `📐 √${nums[0]} = *${Math.sqrt(nums[0]).toFixed(6).replace(/\.?0+$/, "")}*` })
    }

    if (sub === "faktorial") {
      const n = nums[0]
      if (isNaN(n) || n < 0 || n > 20) return sock.sendMessage(from, { text: "⚠️ Format: .matematika faktorial 10 (max 20)" })
      let result = 1
      for (let i = 2; i <= n; i++) result *= i
      return sock.sendMessage(from, { text: `📐 ${n}! = *${result}*` })
    }

    if (sub === "prima") {
      const n = nums[0]
      if (isNaN(n) || n < 2) return sock.sendMessage(from, { text: "⚠️ Format: .matematika prima 97" })
      let isPrime = true
      for (let i = 2; i <= Math.sqrt(n); i++) { if (n % i === 0) { isPrime = false; break } }
      return sock.sendMessage(from, { text: `📐 ${n} adalah bilangan ${isPrime ? "*prima* ✅" : "*bukan prima* ❌"}` })
    }

    if (sub === "fibonacci") {
      const n = Math.min(nums[0] || 10, 30)
      let fib = [0, 1]
      for (let i = 2; i < n; i++) fib.push(fib[i - 1] + fib[i - 2])
      return sock.sendMessage(from, { text: `📐 Fibonacci ${n} suku pertama:\n${fib.slice(0, n).join(", ")}` })
    }

    if (sub === "statistik") {
      if (!nums.length || nums.some(isNaN)) return sock.sendMessage(from, { text: "⚠️ Format: .matematika statistik 5 8 3 9 1" })
      const sorted = [...nums].sort((a, b) => a - b)
      const mean = nums.reduce((a, b) => a + b) / nums.length
      const mid = Math.floor(sorted.length / 2)
      const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
      const variance = nums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / nums.length
      const std = Math.sqrt(variance).toFixed(3)
      return sock.sendMessage(from, {
        text: `📊 *STATISTIK*\nData: ${nums.join(", ")}\nMin: ${sorted[0]}\nMax: ${sorted[sorted.length-1]}\nRata-rata: ${mean.toFixed(3)}\nMedian: ${median}\nStd Deviasi: ${std}`
      })
    }

    await sock.sendMessage(from, { text: "❌ Perintah tidak dikenal. Ketik .matematika untuk daftar perintah." })
  }
}
