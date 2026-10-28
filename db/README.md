# Base de datos — SupplyCity (Postgres / Supabase, multitenant)

Scripts versionados del esquema multitenant. Reflejan 1:1 lo aplicado en el
proyecto Supabase `kfjcqxzlyfpbryteycoo`.

## Estructura

```
db/
├── migrations/   # Esquema, en orden de aplicación (prefijo = version de Supabase)
├── seed/         # Datos de prueba (NO es parte del esquema)
└── README.md
```

## Orden de migraciones

| Version (timestamp) | Archivo | Qué hace |
|---------------------|---------|----------|
| 20261028162239 | `01_jerarquia_raiz_tenant_cliente_sucursal.sql` | Tablas raíz: `tenant`, `cliente`, `sucursal` |
| 20261028162306 | `02_tablas_core_multitenant.sql` | `usuario`, `categoria`, `producto`, `turno`, `venta`, `detalle_venta`, `carrito_temporal` |
| 20261028162325 | `03_triggers_stock_y_turno.sql` | Trigger de stock (+ trigger de turno histórico, luego revertido) |
| 20261028162339 | `04_rls_aislamiento_por_tenant.sql` | RLS por `tenant_id` en las 10 tablas + `current_tenant_id()` |
| 20261028162608 | `06_fix_function_search_path.sql` | Endurece `search_path` de las funciones (advisor de seguridad) |
| 20261028171935 | `07_turno_iniciar_cerrar.sql` | Reemplaza el trigger de turno por `iniciar_turno()` / `cerrar_turno()` |

> No existe una migración 05: el seed se corrió como datos, no como migración.
> Está en `seed/seed_tenants_demo.sql`.

## Principios de diseño multitenant

1. **`tenant_id` en TODAS las tablas.** Permite extraer una empresa completa con
   `WHERE tenant_id = X` el día que se mueva a su propia base de datos (RDS).
2. **RLS por `tenant_id`.** El tenant activo viaja en la variable de sesión
   `app.tenant_id`. La misma política sirve en BD compartida (hoy) y dedicada (mañana).
3. **Sin unicidades globales.** Todas son compuestas con `tenant_id`
   (p. ej. `UNIQUE(tenant_id, email)`), para que al separar tenants no choquen.

Jerarquía: `tenant → cliente → sucursal → (usuario, producto, turno, venta, ...)`.

## Cómo la API debe usar el aislamiento

En cada request, tras validar el JWT, la API fija el tenant del claim:

```sql
SET app.tenant_id = '<tenant_id del JWT>';
```

A partir de ahí, RLS filtra todo automáticamente. Sin ese `SET`,
`current_tenant_id()` devuelve `-1` y no se ve ninguna fila (fail-safe).

## Flujo de venta (orden correcto, dentro de una transacción)

1. `SELECT iniciar_turno(:usuario_id, :fondo_caja);`  → devuelve `turno_id`
2. Por cada ticket:
   1. `INSERT INTO venta (...) VALUES (..., total=0, metodo_pago) RETURNING id;`
   2. `INSERT INTO detalle_venta (...)` por cada línea  → el trigger descuenta stock
   3. `UPDATE venta SET total = (SELECT SUM(subtotal) FROM detalle_venta WHERE id_venta = :venta_id) WHERE id = :venta_id;`
3. Al cerrar la caja: `SELECT * FROM cerrar_turno(:turno_id);`
   → calcula totales por método de pago, marca el turno `Cerrado`, devuelve el corte.

**Importante:** el descuento de stock vive SOLO en el trigger `trg_actualizar_stock`.
La API NO debe volver a restar stock (el PHP original lo hacía y causaba doble descuento).

## Aplicar en un entorno nuevo

Orden: ejecutar los archivos de `migrations/` por version ascendente, luego
(opcional) `seed/seed_tenants_demo.sql` para datos de prueba.

Vía Supabase CLI:

```bash
supabase db push
```

O manualmente, pegando cada archivo en el SQL Editor en orden.

## Credenciales de prueba (solo seed demo)

| Tenant | Email | Password |
|--------|-------|----------|
| SupplyCity Norte | `admin@norte.com` | `admin123` |
| SupplyCity Sur | `admin@sur.com` | `admin123` |
