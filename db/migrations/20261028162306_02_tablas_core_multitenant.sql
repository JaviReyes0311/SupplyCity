-- ============================================================
-- Migración 2: Tablas core
-- Cada tabla lleva tenant_id (regla de aislamiento físico futuro)
-- y sucursal_id donde la operación es por sucursal.
-- ============================================================

-- ===== Usuario ===== (un empleado = una sucursal)
CREATE TABLE usuario (
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
    -- Email único POR tenant (no global): dos empresas pueden reusar un email
    CONSTRAINT uq_usuario_tenant_email UNIQUE (tenant_id, email)
);
CREATE INDEX idx_usuario_tenant ON usuario (tenant_id);
CREATE INDEX idx_usuario_sucursal ON usuario (sucursal_id);

-- ===== Categoria ===== (catálogo por sucursal)
CREATE TABLE categoria (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id   INT NOT NULL REFERENCES tenant(id),
    sucursal_id INT NOT NULL REFERENCES sucursal(id),
    nombre      VARCHAR(50) NOT NULL,
    descripcion TEXT,
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_categoria_sucursal_nombre UNIQUE (tenant_id, sucursal_id, nombre)
);
CREATE INDEX idx_categoria_tenant ON categoria (tenant_id);
CREATE INDEX idx_categoria_sucursal ON categoria (sucursal_id);

-- ===== Producto ===== (inventario por sucursal)
CREATE TABLE producto (
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
CREATE INDEX idx_producto_tenant ON producto (tenant_id);
CREATE INDEX idx_producto_sucursal ON producto (sucursal_id);
CREATE INDEX idx_producto_categoria ON producto (id_categoria);

-- ===== Turno ===== (caja por sucursal)
CREATE TABLE turno (
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
CREATE INDEX idx_turno_tenant ON turno (tenant_id);
CREATE INDEX idx_turno_sucursal ON turno (sucursal_id);
CREATE INDEX idx_turno_usuario ON turno (id_usuario);

-- ===== Venta =====
CREATE TABLE venta (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id   INT NOT NULL REFERENCES tenant(id),
    sucursal_id INT NOT NULL REFERENCES sucursal(id),
    id_turno    INT NOT NULL REFERENCES turno(id),
    fecha       timestamptz NOT NULL DEFAULT now(),
    total       numeric(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    metodo_pago VARCHAR(10) NOT NULL
                 CHECK (metodo_pago IN ('Efectivo','Tarjeta'))
);
CREATE INDEX idx_venta_tenant ON venta (tenant_id);
CREATE INDEX idx_venta_sucursal ON venta (sucursal_id);
CREATE INDEX idx_venta_turno ON venta (id_turno);

-- ===== DetalleVenta ===== (subtotal como columna generada)
CREATE TABLE detalle_venta (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id       INT NOT NULL REFERENCES tenant(id),
    sucursal_id     INT NOT NULL REFERENCES sucursal(id),
    id_venta        INT NOT NULL REFERENCES venta(id),
    id_producto     INT NOT NULL REFERENCES producto(id),
    cantidad        INT NOT NULL CHECK (cantidad > 0),
    precio_unitario numeric(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal        numeric(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);
CREATE INDEX idx_detalle_tenant ON detalle_venta (tenant_id);
CREATE INDEX idx_detalle_venta ON detalle_venta (id_venta);
CREATE INDEX idx_detalle_producto ON detalle_venta (id_producto);

-- ===== CarritoTemporal ===== (reconstruida desde el uso en PHP + multitenant)
CREATE TABLE carrito_temporal (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id   INT NOT NULL REFERENCES tenant(id),
    sucursal_id INT NOT NULL REFERENCES sucursal(id),
    usuario_id  INT NOT NULL REFERENCES usuario(id),
    producto_id INT NOT NULL REFERENCES producto(id),
    cantidad    INT NOT NULL CHECK (cantidad > 0),
    CONSTRAINT uq_carrito_usuario_producto UNIQUE (usuario_id, producto_id)
);
CREATE INDEX idx_carrito_tenant ON carrito_temporal (tenant_id);
CREATE INDEX idx_carrito_usuario ON carrito_temporal (usuario_id);
