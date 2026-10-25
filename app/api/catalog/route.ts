import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { settings, categories, products } from "@/lib/db/schema"
import { asc } from "drizzle-orm"

export const dynamic = "force-dynamic"

function parseImages(value: string | null) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((image) => typeof image === "string") : [value]
  } catch {
    return [value]
  }
}

export async function GET() {
  const [settingsRows, categoryRows, productRows] = await Promise.all([
    db.select().from(settings),
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(products).orderBy(asc(products.sortOrder)),
  ])

  return NextResponse.json({
    settings: settingsRows[0]?.data ?? {},
    categories: categoryRows.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? "",
      visible: c.visible,
    })),
    products: productRows.map((p) => ({
      id: Number(p.id),
      category: p.category,
      name: p.name,
      price: p.price,
      size: p.size ?? "",
      model: p.model ?? "",
      desc: p.description ?? "",
      image: p.image ?? "",
      images: parseImages(p.image),
      sold: p.sold,
      isNew: p.isNew,
    })),
  })
}
