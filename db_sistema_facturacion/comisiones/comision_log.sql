CREATE TABLE IF NOT EXISTS public.comision_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relación principal
    comision_id UUID NOT NULL REFERENCES public.comision(id) ON DELETE CASCADE,

    -- Quién hizo el cambio (puede ser NULL si fue el sistema automático)
    responsable_id UUID REFERENCES public.superadmin(id), 
    rol_responsable TEXT, -- 'SUPERADMIN', 'SISTEMA', 'VENDEDOR'

    -- El cambio de estado | PENDIENTE, APROBADO, RECHAZADO, PAGADO
    estado_anterior TEXT,
    estado_nuevo TEXT NOT NULL,

    -- El Snapshot (Aquí guardas la "foto" del momento)
    -- Ejemplo: { 
    --    "vendedor": { "id": "...", "nombre": "Juan Perez", "ruc": "123..." }, 
    --    "monto_calculado": 100.50 
    -- }
    datos_snapshot JSONB,

    -- Motivo del cambio (importante para rechazos)
    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);