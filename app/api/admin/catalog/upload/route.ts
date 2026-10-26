import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/admin-auth"

const MAX_FILE_SIZE = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ninguna imagen" }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Formato no permitido. Usa JPG, PNG, WEBP o GIF" }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "La imagen no puede pesar más de 8 MB" }, { status: 400 })
  }

  try {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const blob = await put(`catalog/${crypto.randomUUID()}.${extension}`, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    })
    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Error subiendo imagen del catálogo:", error)
    return NextResponse.json({ error: "No se pudo subir la imagen" }, { status: 500 })
  }
}
