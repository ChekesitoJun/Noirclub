import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (body.paymentMethod !== 'card') {
      return NextResponse.json({ error: 'Configura la URL de pago de PayPal o Mercado Pago desde Administrar.' }, { status: 400 })
    }
    const items = body.items && typeof body.items === 'object' ? body.items : {}
    const catalogResponse = await fetch(new URL('/api/catalog', request.url), { cache: 'no-store' })
    const catalog = await catalogResponse.json()
    const products = Array.isArray(catalog.products) ? catalog.products : []
    const lineItems = Object.entries(items).map(([productId, quantity]) => {
      const product = products.find((entry: { id: number | string }) => String(entry.id) === productId)
      return { product, quantity: Number(quantity) }
    })
    if (!lineItems.length || lineItems.some((item) => !item.product || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) {
      return NextResponse.json({ error: 'El carrito no es válido.' }, { status: 400 })
    }
    const secret = process.env.STRIPE_SECRET_KEY
    if (!secret) return NextResponse.json({ error: 'Stripe todavía no está configurado para este proyecto.' }, { status: 503 })

    const origin = request.headers.get('origin') ?? new URL(request.url).origin
    const form = new URLSearchParams({ mode: 'payment', success_url: `${origin}/?payment=success`, cancel_url: `${origin}/?payment=cancelled` })
    lineItems.forEach((item, index) => {
      form.set(`line_items[${index}][price_data][currency]`, 'mxn')
      form.set(`line_items[${index}][price_data][unit_amount]`, String(Math.round(Number(item.product.price) * 100)))
      form.set(`line_items[${index}][price_data][product_data][name]`, String(item.product.name))
      form.set(`line_items[${index}][price_data][product_data][description]`, String(item.product.desc ?? ''))
      form.set(`line_items[${index}][quantity]`, String(item.quantity))
    })
    if (body.buyer?.email) form.set('customer_email', String(body.buyer.email))
    form.set('metadata[buyerPhone]', String(body.buyer?.phone ?? ''))
    form.set('metadata[buyerName]', String(body.buyer?.name ?? ''))

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    })
    const session = await response.json()
    if (!response.ok || !session.url) return NextResponse.json({ error: 'Stripe no pudo iniciar el pago.' }, { status: 502 })
    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json({ error: 'No se pudo iniciar el pago.' }, { status: 400 })
  }
}
