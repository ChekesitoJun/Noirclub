import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { settings, categories, products } from "@/lib/db/schema"
import { isAdmin } from "@/lib/admin-auth"

function serializeImages(value: unknown) {
  if (Array.isArray(value)) return JSON.stringify(value.filter((image) => typeof image === "string"))
  return String(value ?? "")
}

export async function GET() {
  return NextResponse.json({ admin: await isAdmin() })
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const incomingSettings = body.settings ?? {}
  const incomingCategories = Array.isArray(body.categories) ? body.categories : []
  const incomingProducts = Array.isArray(body.products) ? body.products : []

  await db.transaction(async (tx) => {
    await tx
      .insert(settings)
      .values({ id: 1, data: incomingSettings })
      .onConflictDoUpdate({ target: settings.id, set: { data: incomingSettings } })

    await tx.delete(categories)
    await tx.delete(products)

    if (incomingCategories.length) {
      await tx.insert(categories).values(
        incomingCategories.map((c: any, i: number) => ({
          id: String(c.id),
          name: String(c.name ?? ""),
          description: String(c.description ?? ""),
          visible: Boolean(c.visible),
          sortOrder: i,
        })),
      )
    }

    if (incomingProducts.length) {
      await tx.insert(products).values(
        incomingProducts.map((p: any, i: number) => ({
          id: Number(p.id),
          category: String(p.category ?? ""),
          name: String(p.name ?? ""),
          price: Math.max(0, Math.round(Number(p.price) || 0)),
          size: String(p.size ?? ""),
          model: String(p.model ?? ""),
          description: String(p.desc ?? ""),
          image: serializeImages(p.images ?? p.image),
          sold: Boolean(p.sold),
          isNew: Boolean(p.isNew),
          sortOrder: i,
        })),
      )
    }
  })

  return NextResponse.json({ ok: true })
}

export const dynamic = "force-dynamic"
