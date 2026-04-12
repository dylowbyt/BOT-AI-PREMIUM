/**
 * ownerHelper.js — Helper terpusat untuk cek admin/owner
 * Support format @s.whatsapp.net DAN @lid (WhatsApp versi baru)
 */

// ✅ NOMOR OWNER & ADMIN
const OWNER_NUMBER = "6283866344919"
const ADMIN_NUMBER = "6283866344919"

// ✅ LID OWNER & ADMIN (format baru WA untuk pesan grup)
// Didapat dari Railway logs: sender raw "213013684609202@lid"
const OWNER_LID = "213013684609202@lid"
const ADMIN_LID = "213013684609202@lid"

function cleanNumber(sender) {
  let num = (sender || "")
    .replace(/@s\.whatsapp\.net$/, "")
    .replace(/@c\.us$/, "")
    .replace(/:\d+$/, "")
    .trim()

  if (num.startsWith("0")) {
    num = "62" + num.slice(1)
  }

  return num
}

function isOwner(sender) {
  // Cek format @lid (grup WA versi baru)
  if ((sender || "").includes("@lid")) {
    const match = sender === OWNER_LID
    console.log(`[OWNER LID CHECK] "${sender}" === "${OWNER_LID}" → ${match}`)
    return match
  }
  // Cek format nomor biasa
  const cleaned = cleanNumber(sender)
  const match = cleaned === OWNER_NUMBER
  console.log(`[OWNER CHECK] "${cleaned}" === "${OWNER_NUMBER}" → ${match}`)
  return match
}

function isAdmin(sender) {
  // Cek format @lid (grup WA versi baru)
  if ((sender || "").includes("@lid")) {
    const match = sender === ADMIN_LID
    console.log(`[ADMIN LID CHECK] "${sender}" === "${ADMIN_LID}" → ${match}`)
    return match
  }
  // Cek format nomor biasa
  const cleaned = cleanNumber(sender)
  const match = cleaned === ADMIN_NUMBER
  console.log(`[ADMIN CHECK] "${cleaned}" === "${ADMIN_NUMBER}" → ${match}`)
  return match
}

function isAdminOrOwner(sender) {
  return isOwner(sender) || isAdmin(sender)
}

module.exports = { cleanNumber, isOwner, isAdmin, isAdminOrOwner, OWNER_NUMBER, ADMIN_NUMBER }

