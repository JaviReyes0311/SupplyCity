-- ============================================================
-- SupplyCity — Esquema consolidado (Postgres / Supabase)
-- Multitenant: tenant -> cliente -> sucursal
--
-- Estado FINAL del esquema (equivale a aplicar migrations/01..07 en orden).
-- Idempotente: usa IF NOT EXISTS / CREATE OR REPLACE / DROP IF EXISTS.
-- Pensado para levantar un entorno nuevo de un solo golpe.
--
-- NO incluye datos de prueba. Para seed: db/seed/seed_tenants_demo.sql
--
-- Principios:
--   1. tenant_id en TODAS las tablas (aislamiento físico futuro).
--   2. RLS por tenant_id (variable de sesión app.tenant_id).
--   3. Sin unicidades globales: todas compuestas con tenant_id.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Jerarquía raíz
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant (
    id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR(120) NOT NULL,
    slug           VARCHAR(60)  NOT NULL,
    plan           VARCHAR(30)  NOT NULL DEFAULT 'free',
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_tenant_slug UNIQUE (slug)
);
COMMENT ON TABLE tenant IS 'Empresa contratante. Frontera de aislamiento: mañana = 1 base de datos dedicada.';

CREATE TABLE IF NOT EXISTS cliente (
    id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id      INT NOT NULL REFERENCES tenant(id),
    nombre         VARCHAR(120) NOT NULL,
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_cliente_tenant_nombre UNIQUE (tenant_id, nombre)
);
CREATE INDEX IF NOT EXISTS idx_cliente_tenant ON cliente (tenant_id);
COMMENT ON TABLE cliente IS 'Negocio/entidad dentro de un tenant. Agrupa sucursales.';

CREATE TABLE IF NOT EXISTS sucursal (
    id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id      INT NOT NULL REFERENCES tenant(id),
    cliente_id     INT NOT NULL REFERENCES cliente(id),
    nombre         VARCHAR(120) NOT NULL,
    direccion      TEXT,
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_sucursal_cliente_nombre UNIQUE (tenant_id, cliente_id, nombre)
);
CREATE INDEX IF NOT EXISTS idx_sucursal_tenant ON sucursal (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sucursal_cliente ON sucursal (cliente_id);
COMMENT ON TABLE sucursal IS 'Punto de venta físico. Unidad operativa: inventario, turnos y ventas cuelgan de aquí.';

-- ------------------------------------------------------------
-- 2) Tablas core
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
    id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id      INT NOT NULL REFERENCES tenant(id),
    sucursal_id    INT NOT NULL REFERENCES sucursal(id),
    email          VARCHAR(100) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    nombre         VARCHAR(50)  NOT NULL,
    apellido       VARCHAR(50)  NOT NULL,
    tipo_usuario   VARCHAR(20)  NOT NULL DEFAULT 'Usuario'
                    CHECK (tipo_usuario IN ('Administrador','Usuario')),
    fecha_creacion timestamptz  NOT NULL DEFAULT now(),
    ultimo_login   timestamptz,
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_usuario_tenant_email UNIQUE (tenant_id, email)
);
CREATE INDEX IF NOT EXISTS idx_usuario_tenant ON usuario (tenant_id);
CREATE INDEX IF NOT EXISTS idx_usuario_sucursal ON usuario (sucursal_id);

CREATE TABLE IF NOT EXISTS categoria (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id   INT NOT NULL REFERENCES tenant(id),
    sucursal_id INT NOT NULL REFERENCES sucursal(id),
    nombre      VARCHAR(50) NOT NULL,
    descripcion TEXT,
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_categoria_sucursal_nombre UNIQUE (tenant_id, sucursal_id, nombre)
);
CREATE INDEX IF NOT EXISTS idx_categoria_tenant ON categoria (tenant_id);
CREATE INDEX IF NOT EXISTS idx_categoria_sucursal ON categoria (sucursal_id);

CREATE TABLE IF NOT EXISTS producto (
    id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id    INT NOT NULL REFERENCES tenant(id),
    sucursal_id  INT NOT NULL REFERENCES sucursal(id),
    nombre       VARCHAR(100) NOT NULL,
    descripcion  TEXT,
    precio       numeric(10,2) NOT NULL CHECK (precio >= 0),
    stock        INT NOT NULL DEFAULT 0,
    id_categoria INT NOT NULL REFERENCES categoria(id),
    activo       BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_producto_tenant ON producto (tenant_id);
CREATE INDEX IF NOT EXISTS idx_producto_sucursal ON producto (sucursal_id);
CREATE INDEX IF NOT EXISTS idx_producto_categoria ON producto (id_categoria);

CREATE TABLE IF NOT EXISTS turno (
    id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id      INT NOT NULL REFERENCES tenant(id),
    sucursal_id    INT NOT NULL REFERENCES sucursal(id),
    id_usuario     INT NOT NULL REFERENCES usuario(id),
    fecha_inicio   timestamptz NOT NULL DEFAULT now(),
    fecha_fin      timestamptz,
    fondo_caja     numeric(10,2) NOT NULL DEFAULT 0.00,
    total_efectivo numeric(10,2) NOT NULL DEFAULT 0.00,
    total_tarjeta  numeric(10,2) NOT NULL DEFAULT 0.00,
    estado         VARCHAR(10) NOT NULL DEFAULT 'Abierto'
                    CHECK (estado IN ('Abierto','Cerrado'))
);
CREATE INDEX IF NOT EXISTS idx_turno_tenant ON turno (tenant_id);
CREATE INDEX IF NOT EXISTS idx_turno_sucursal ON turno (sucursal_id);
CREATE INDEX IF NOT EXISTS idx_turno_usuario ON turno (id_usuario);

CREATE TABLE IF NOT EXISTS venta (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id   INT NOT NULL REFERENCES tenant(id),
    sucursal_id INT NOT NULL REFERENCES sucursal(id),
    id_turno    INT NOT NULL REFERENCES turno(id),
    fecha       timestamptz NOT NULL DEFAULT now(),
    total       numeric(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    metodo_pago VARCHAR(10) NOT NULL
                 CHECK (metodo_pago IN ('Efectivo','Tarjeta'))
);
CREATE INDEX IF NOT EXISTS idx_venta_tenant ON venta (tenant_id);
CREATE INDEX IF NOT EXISTS idx_venta_sucursal ON venta (sucursal_id);
CREATE INDEX IF NOT EXISTS idx_venta_turno ON venta (id_turno);

CREATE TABLE IF NOT EXISTS detalle_venta (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id       INT NOT NULL REFERENCES tenant(id),
    sucursal_id     INT NOT NULL REFERENCES sucursal(id),
    id_venta        INT NOT NULL REFERENCES venta(id),
    id_producto     INT NOT NULL REFERENCES producto(id),
    cantidad        INT NOT NULL CHECK (cantidad > 0),
    precio_unitario numeric(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal        numeric(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);
CREATE INDEX IF NOT EXISTS idx_detalle_tenant ON detalle_venta (tenant_id);
CREATE INDEX IF NOT EXISTS idx_detalle_venta ON detalle_venta (id_venta);
CREATE INDEX IF NOT EXISTS idx_detalle_producto ON detalle_venta (id_producto);

CREATE TABLE IF NOT EXISTS carrito_temporal (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id   INT NOT NULL REFERENCES tenant(id),
    sucursal_id INT NOT NULL REFERENCES sucursal(id),
    usuario_id  INT NOT NULL REFERENCES usuario(id),
    producto_id INT NOT NULL REFERENCES producto(id),
    cantidad    INT NOT NULL CHECK (cantidad > 0),
    CONSTRAINT uq_carrito_usuario_producto UNIQUE (usuario_id, producto_id)
);
CREATE INDEX IF NOT EXISTS idx_carrito_tenant ON carrito_temporal (tenant_id);
CREATE INDEX IF NOT EXISTS idx_carrito_usuario ON carrito_temporal (usuario_id);

-- ------------------------------------------------------------
-- 3) Funciones y triggers
-- ------------------------------------------------------------

-- Descuento de stock (única fuente de verdad del stock).
CREATE OR REPLACE FUNCTION fn_actualizar_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_actual INT;
BEGIN
    SELECT stock INTO v_stock_actual
    FROM producto WHERE id = NEW.id_producto
    FOR UPDATE;

    IF v_stock_actual IS NULL THEN
        RAISE EXCEPTION 'Producto % no existe', NEW.id_producto;
    END IF;
    IF v_stock_actual < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para producto %: disponible %, solicitado %',
            NEW.id_producto, v_stock_actual, NEW.cantidad;
    END IF;

    UPDATE producto SET stock = stock - NEW.cantidad WHERE id = NEW.id_producto;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_actualizar_stock ON detalle_venta;
CREATE TRIGGER trg_actualizar_stock
AFTER INSERT ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_stock();

-- Iniciar turno (valida que el usuario no tenga otro abierto).
CREATE OR REPLACE FUNCTION iniciar_turno(
    p_usuario_id INT,
    p_fondo_caja numeric DEFAULT 0
)
RETURNS INT AS $$
DECLARE
    v_tenant_id   INT;
    v_sucursal_id INT;
    v_turno_id    INT;
BEGIN
    SELECT tenant_id, sucursal_id INTO v_tenant_id, v_sucursal_id
    FROM usuario WHERE id = p_usuario_id;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Usuario % no existe', p_usuario_id;
    END IF;
    IF EXISTS (SELECT 1 FROM turno WHERE id_usuario = p_usuario_id AND estado = 'Abierto') THEN
        RAISE EXCEPTION 'El usuario % ya tiene un turno abierto', p_usuario_id;
    END IF;

    INSERT INTO turno (tenant_id, sucursal_id, id_usuario, fondo_caja, estado)
    VALUES (v_tenant_id, v_sucursal_id, p_usuario_id, p_fondo_caja, 'Abierto')
    RETURNING id INTO v_turno_id;

    RETURN v_turno_id;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- Cerrar turno (corte de caja: suma ventas reales por método de pago).
CREATE OR REPLACE FUNCTION cerrar_turno(p_turno_id INT)
RETURNS TABLE (
    turno_id       INT,
    total_efectivo numeric,
    total_tarjeta  numeric,
    total_general  numeric,
    num_ventas     BIGINT
) AS $$
DECLARE
    v_estado TEXT;
    v_efectivo numeric;
    v_tarjeta  numeric;
BEGIN
    SELECT estado INTO v_estado FROM turno WHERE id = p_turno_id FOR UPDATE;

    IF v_estado IS NULL THEN
        RAISE EXCEPTION 'Turno % no existe', p_turno_id;
    END IF;
    IF v_estado = 'Cerrado' THEN
        RAISE EXCEPTION 'El turno % ya está cerrado', p_turno_id;
    END IF;

    SELECT
        COALESCE(SUM(total) FILTER (WHERE metodo_pago = 'Efectivo'), 0),
        COALESCE(SUM(total) FILTER (WHERE metodo_pago = 'Tarjeta'),  0)
    INTO v_efectivo, v_tarjeta
    FROM venta WHERE id_turno = p_turno_id;

    UPDATE turno
    SET total_efectivo = v_efectivo,
        total_tarjeta  = v_tarjeta,
        estado         = 'Cerrado',
        fecha_fin      = now()
    WHERE id = p_turno_id;

    RETURN QUERY
    SELECT p_turno_id, v_efectivo, v_tarjeta, (v_efectivo + v_tarjeta),
           (SELECT count(*) FROM venta WHERE id_turno = p_turno_id);
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- ------------------------------------------------------------
-- 4) Row Level Security
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS INT AS $$
    SELECT COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::INT, -1);
$$ LANGUAGE sql STABLE SET search_path = public, pg_temp;

DO $$
DECLARE
    t TEXT;
    tablas TEXT[] := ARRAY[
        'tenant','cliente','sucursal','usuario','categoria',
        'producto','turno','venta','detalle_venta','carrito_temporal'
    ];
BEGIN
    FOREACH t IN ARRAY tablas LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', t);

        IF t = 'tenant' THEN
            EXECUTE format($f$
                CREATE POLICY tenant_isolation ON %I
                USING (id = current_tenant_id())
                WITH CHECK (id = current_tenant_id());
            $f$, t);
        ELSE
            EXECUTE format($f$
                CREATE POLICY tenant_isolation ON %I
                USING (tenant_id = current_tenant_id())
                WITH CHECK (tenant_id = current_tenant_id());
            $f$, t);
        END IF;
    END LOOP;
END $$;
