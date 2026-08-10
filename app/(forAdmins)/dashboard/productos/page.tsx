import { prisma } from "@/lib/prisma"
import { ProductosTabs } from "@/components/productos/ProductosTabs"
import { ProductosInventarioPanel } from "@/components/productos/ProductosInventarioPanel"
import { ProductosProveedoresPanel } from "@/components/productos/ProductosProveedoresPanel"
import { ProductosHistorialPanel } from "@/components/productos/ProductosHistorialPanel"

export default async function ProductosPage() {
  const [suppliers, products, priceLogs] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { supplier: { select: { id: true, name: true } } },
    }),
    prisma.supplierPriceLog.findMany({
      take: 50,
      orderBy: { recordedAt: "desc" },
      include: {
        product: { select: { name: true, sku: true } },
        supplier: { select: { name: true } },
      },
    }),
  ])

  const lowStock = products.filter(
    (p) => p.active && Number(p.stockQty) <= Number(p.reorderLevel) && Number(p.reorderLevel) > 0
  )

  const supplierOptions = suppliers.map((s) => ({ id: s.id, name: s.name, active: s.active }))
  const productOptions = products.map((p) => ({ id: p.id, name: p.name, sku: p.sku }))

  return (
    <section className="text-foreground">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Productos e inventario</h1>
          <p className="mt-2 text-sm text-foreground/55">
            Inventario, precios, proveedores e historial de costos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {products.filter((p) => p.active).length} activos
          </span>
          {lowStock.length > 0 ? (
            <span className="rounded-full border border-amber-500/35 bg-amber-50/80 px-3 py-1 font-medium text-amber-800">
              {lowStock.length} stock bajo
            </span>
          ) : null}
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {suppliers.filter((s) => s.active).length} proveedores
          </span>
        </div>
      </div>

      <div className="mt-6">
        <ProductosTabs
          suppliers={suppliers.length}
          products={products.length}
          priceLogs={priceLogs.length}
          panels={[
            <ProductosInventarioPanel key="inventario" products={products as unknown as React.ComponentProps<typeof ProductosInventarioPanel>["products"]} suppliers={supplierOptions} />,
            <ProductosProveedoresPanel key="proveedores" suppliers={suppliers as unknown as React.ComponentProps<typeof ProductosProveedoresPanel>["suppliers"]} />,
            <ProductosHistorialPanel
              key="historial"
              priceLogs={priceLogs as unknown as React.ComponentProps<typeof ProductosHistorialPanel>["priceLogs"]}
              products={productOptions}
              suppliers={suppliers as unknown as React.ComponentProps<typeof ProductosHistorialPanel>["suppliers"]}
            />,
          ]}
        />
      </div>
    </section>
  )
}
