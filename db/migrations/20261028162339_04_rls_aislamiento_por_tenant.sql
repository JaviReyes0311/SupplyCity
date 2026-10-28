-- ============================================================
-- Migración 4: Row Level Security por tenant_id
-- El tenant activo viaja en la GUC app.tenant_id, que la API .NET
-- setea por request:  SET app.tenant_id = '<claim del JWT>';
-- Fail-safe: si no está seteada, current_tenant_id() devuelve -1 y no ve nada.
-- Esta misma política sirve en BD dedicada (siempre un solo tenant).
-- ============================================================

-- Helper: lee el tenant actual de la sesión de forma segura.
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS INT AS $$
    SELECT COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::INT, -1);
$$ LANGUAGE sql STABLE;

-- Aplica RLS a todas las tablas con tenant_id de forma uniforme.
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

        IF t = 'tenant' THEN
            -- La tabla tenant se filtra por su propia PK (id), no por tenant_id.
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
