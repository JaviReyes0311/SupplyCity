-- ============================================================
-- Migración 6: Endurecer funciones (advisor: function_search_path_mutable)
-- Fijar search_path evita secuestro de resolución de nombres.
-- ============================================================

ALTER FUNCTION public.fn_actualizar_stock()  SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_actualizar_turno()   SET search_path = public, pg_temp;

-- current_tenant_id lee una GUC; no toca tablas, pero la fijamos igual.
ALTER FUNCTION public.current_tenant_id()     SET search_path = public, pg_temp;
