-- ============================================================
-- Migración 3: Triggers PL/pgSQL
-- Reemplazan los triggers MySQL originales.
-- FIX: el descuento de stock vive SOLO aquí (antes el PHP también
--      lo hacía -> doble descuento). La API .NET NO debe volver a restar.
--
-- NOTA: el trigger de totales de turno (fn_actualizar_turno) que se
-- creaba aquí fue ELIMINADO en la migración 07. Ver 07_turno_iniciar_cerrar.
-- Este archivo se conserva tal como se aplicó originalmente para mantener
-- la historia fiel; 07 revierte la parte del turno.
-- ============================================================

-- 1) Descontar stock al insertar un detalle de venta.
--    Valida stock suficiente dentro de la misma transacción.
CREATE OR REPLACE FUNCTION fn_actualizar_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_actual INT;
BEGIN
    SELECT stock INTO v_stock_actual
    FROM producto
    WHERE id = NEW.id_producto
    FOR UPDATE;  -- bloquea la fila para evitar sobreventa en concurrencia

    IF v_stock_actual IS NULL THEN
        RAISE EXCEPTION 'Producto % no existe', NEW.id_producto;
    END IF;

    IF v_stock_actual < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para producto %: disponible %, solicitado %',
            NEW.id_producto, v_stock_actual, NEW.cantidad;
    END IF;

    UPDATE producto
    SET stock = stock - NEW.cantidad
    WHERE id = NEW.id_producto;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_stock
AFTER INSERT ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_stock();

-- 2) [HISTÓRICO] Acumular totales del turno según método de pago.
--    Este trigger fue reemplazado por el flujo iniciar_turno/cerrar_turno
--    en la migración 07 (causaba total en 0 porque corría antes de calcular
--    el total real de la venta).
CREATE OR REPLACE FUNCTION fn_actualizar_turno()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.metodo_pago = 'Efectivo' THEN
        UPDATE turno
        SET total_efectivo = total_efectivo + NEW.total
        WHERE id = NEW.id_turno;
    ELSE
        UPDATE turno
        SET total_tarjeta = total_tarjeta + NEW.total
        WHERE id = NEW.id_turno;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_turno
AFTER INSERT ON venta
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_turno();
