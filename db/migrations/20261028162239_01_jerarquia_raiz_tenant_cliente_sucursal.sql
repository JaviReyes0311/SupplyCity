-- ============================================================
-- Migración 1: Jerarquía raíz multitenant
-- tenant -> cliente -> sucursal
-- Regla: tenant_id en TODAS las tablas (frontera de aislamiento físico futuro)
-- Regla: unicidades siempre compuestas con tenant_id
-- ============================================================

-- Raíz de aislamiento. Mañana cada tenant puede moverse a su propia BD/RDS.
CREATE TABLE tenant (
    id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR(120) NOT NULL,
    slug           VARCHAR(60)  NOT NULL,
    plan           VARCHAR(30)  NOT NULL DEFAULT 'free',
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_tenant_slug UNIQUE (slug)
);

COMMENT ON TABLE tenant IS 'Empresa contratante. Frontera de aislamiento: mañana = 1 base de datos dedicada.';

-- Cliente: entidad de negocio dentro del tenant (consultorio, marca, razón social).
CREATE TABLE cliente (
    id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id      INT NOT NULL REFERENCES tenant(id),
    nombre         VARCHAR(120) NOT NULL,
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion timestamptz  NOT NULL DEFAULT now(),
    -- Unicidad compuesta: dos tenants pueden tener un cliente con el mismo nombre
    CONSTRAINT uq_cliente_tenant_nombre UNIQUE (tenant_id, nombre)
);

CREATE INDEX idx_cliente_tenant ON cliente (tenant_id);

COMMENT ON TABLE cliente IS 'Negocio/entidad dentro de un tenant. Agrupa sucursales.';

-- Sucursal: punto físico de operación. Aísla inventario y caja.
CREATE TABLE sucursal (
    id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id      INT NOT NULL REFERENCES tenant(id),
    cliente_id     INT NOT NULL REFERENCES cliente(id),
    nombre         VARCHAR(120) NOT NULL,
    direccion      TEXT,
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_sucursal_cliente_nombre UNIQUE (tenant_id, cliente_id, nombre)
);

CREATE INDEX idx_sucursal_tenant ON sucursal (tenant_id);
CREATE INDEX idx_sucursal_cliente ON sucursal (cliente_id);

COMMENT ON TABLE sucursal IS 'Punto de venta físico. Unidad operativa: inventario, turnos y ventas cuelgan de aquí.';
