-- ============================================================
-- SEED (datos de prueba) — NO es parte del esquema.
-- 2 tenants aislados para validar RLS y el flujo de POS.
--
-- Contraseñas con SHA-256 (hex) para compatibilidad con el login PHP actual.
-- En la API .NET se migrará a BCrypt/PBKDF2.
--
-- Requiere la extensión pgcrypto (digest). En Supabase ya está disponible.
-- Ejecutar con un rol que pueda saltar RLS (p.ej. desde el SQL Editor / service role).
-- ============================================================

-- ===== TENANT A: SupplyCity Norte =====
WITH t AS (
    INSERT INTO tenant (nombre, slug, plan)
    VALUES ('SupplyCity Norte', 'supplycity-norte', 'pro')
    RETURNING id
),
cl AS (
    INSERT INTO cliente (tenant_id, nombre)
    SELECT id, 'Abarrotes Norte' FROM t
    RETURNING id, tenant_id
),
su AS (
    INSERT INTO sucursal (tenant_id, cliente_id, nombre, direccion)
    SELECT tenant_id, id, 'Sucursal Centro', 'Av. Principal 100' FROM cl
    RETURNING id, tenant_id
),
u AS (
    INSERT INTO usuario (tenant_id, sucursal_id, email, password_hash, nombre, apellido, tipo_usuario)
    SELECT tenant_id, id, 'admin@norte.com', encode(digest('admin123','sha256'),'hex'),
           'Juan', 'Pérez', 'Administrador' FROM su
    RETURNING id, tenant_id, sucursal_id
),
cat AS (
    INSERT INTO categoria (tenant_id, sucursal_id, nombre, descripcion)
    SELECT tenant_id, sucursal_id, 'Alimentos', 'Productos comestibles' FROM u
    RETURNING id, tenant_id, sucursal_id
)
INSERT INTO producto (tenant_id, sucursal_id, nombre, descripcion, precio, stock, id_categoria)
SELECT tenant_id, sucursal_id, 'Refresco 600ml', 'Bebida', 25.50, 100, id FROM cat;

-- ===== TENANT B: SupplyCity Sur =====
WITH t AS (
    INSERT INTO tenant (nombre, slug, plan)
    VALUES ('SupplyCity Sur', 'supplycity-sur', 'free')
    RETURNING id
),
cl AS (
    INSERT INTO cliente (tenant_id, nombre)
    SELECT id, 'Electrónica Sur' FROM t
    RETURNING id, tenant_id
),
su AS (
    INSERT INTO sucursal (tenant_id, cliente_id, nombre, direccion)
    SELECT tenant_id, id, 'Sucursal Plaza', 'Blvd. Sur 200' FROM cl
    RETURNING id, tenant_id
),
u AS (
    INSERT INTO usuario (tenant_id, sucursal_id, email, password_hash, nombre, apellido, tipo_usuario)
    SELECT tenant_id, id, 'admin@sur.com', encode(digest('admin123','sha256'),'hex'),
           'María', 'Gómez', 'Administrador' FROM su
    RETURNING id, tenant_id, sucursal_id
),
cat AS (
    INSERT INTO categoria (tenant_id, sucursal_id, nombre, descripcion)
    SELECT tenant_id, sucursal_id, 'Electrónica', 'Dispositivos' FROM u
    RETURNING id, tenant_id, sucursal_id
)
INSERT INTO producto (tenant_id, sucursal_id, nombre, descripcion, precio, stock, id_categoria)
SELECT tenant_id, sucursal_id, 'Laptop Gamer', 'Alto rendimiento', 15000.00, 10, id FROM cat;
