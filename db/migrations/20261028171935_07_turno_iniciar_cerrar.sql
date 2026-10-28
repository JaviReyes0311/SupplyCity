-- ============================================================
-- Migración 7: Flujo de turno (iniciar / cerrar con corte de caja)
-- Reemplaza el trigger por-venta por un cálculo único al cerrar.
-- ============================================================

-- 1) Quitar el trigger que corría en cada venta (causaba total en 0).
DROP TRIGGER IF EXISTS trg_actualizar_turno ON venta;
DROP FUNCTION IF EXISTS fn_actualizar_turno();

-- 2) Iniciar turno: valida que el usuario no tenga ya uno abierto.
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

    IF EXISTS (
        SELECT 1 FROM turno
        WHERE id_usuario = p_usuario_id AND estado = 'Abierto'
    ) THEN
        RAISE EXCEPTION 'El usuario % ya tiene un turno abierto', p_usuario_id;
    END IF;

    INSERT INTO turno (tenant_id, sucursal_id, id_usuario, fondo_caja, estado)
    VALUES (v_tenant_id, v_sucursal_id, p_usuario_id, p_fondo_caja, 'Abierto')
    RETURNING id INTO v_turno_id;

    RETURN v_turno_id;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- 3) Cerrar turno: corte de caja. Suma las ventas reales por método de pago,
--    congela los totales, marca Cerrado y pone fecha_fin.
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

    -- Corte: la fuente de verdad son las ventas del turno
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
