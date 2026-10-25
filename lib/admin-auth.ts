import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

export const ADMIN_COOKIE = "ncmx_admin"

function getPassword() {
  return process.env.ADMIN_PASSWORD || ""
}

// Token derived from the admin password. Rotating the password invalidates
// every existing session automatically.
export function adminToken() {
  return createHmac("sha256", getPassword()).update("ncmx-admin-session").digest("hex")
}

export function checkPassword(input: string) {
  const pass = getPassword()
  if (!pass) return false
  const a = Buffer.from(input || "")
  const b = Buffer.from(pass)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function isAdmin() {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  if (!token || !getPassword()) return false
  const expected = adminToken()
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
