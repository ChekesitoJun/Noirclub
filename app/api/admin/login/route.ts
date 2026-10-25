import { NextResponse } from "next/server"
import { checkPassword, adminToken, ADMIN_COOKIE } from "@/lib/admin-auth"

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "No se ha configurado ADMIN_PASSWORD en el servidor." },
      { status: 500 },
    )
  }

  const { password } = await request.json().catch(() => ({ password: "" }))

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
