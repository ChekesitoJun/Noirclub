import { pgTable, text, integer, boolean, jsonb, bigint } from "drizzle-orm/pg-core"

// Single-row table (id = 1) holding the whole site configuration blob.
export const settings = pgTable("settings", {
  id: integer("id").primaryKey(),
  data: jsonb("data").notNull(),
})

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  visible: boolean("visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
})

export const products = pgTable("products", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  price: integer("price").notNull().default(0),
  size: text("size").default(""),
  model: text("model").default(""),
  description: text("description").default(""),
  image: text("image").default(""),
  sold: boolean("sold").notNull().default(false),
  isNew: boolean("is_new").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
})
