-- ========================================================
-- MIGRACIÓN: ESTABLECIMIENTOS Y PUNTOS DE EMISIÓN V2
-- Enfoque: Secuenciales Independientes y es_matriz
-- ========================================================

BEGIN;

-- 1. Actualizar ESTABLECIMIENTOS
-- Añadir columna es_matriz si no existe
ALTER TABLE sistema_facturacion.establecimientos 
ADD COLUMN IF NOT EXISTS es_matriz BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sistema_facturacion.establecimientos.es_matriz IS 'Identificador de Matriz para lógica de XML y comprobantes electrónicos.';

-- 2. Actualizar PUNTOS_EMISION
-- Añadir columna telefono si no existe
ALTER TABLE sistema_facturacion.puntos_emision
ADD COLUMN IF NOT EXISTS telefono TEXT;

-- Añadir nuevos secuenciales independientes
ALTER TABLE sistema_facturacion.puntos_emision
ADD COLUMN IF NOT EXISTS secuencial_factura INT NOT NULL DEFAULT 1 CHECK (secuencial_factura > 0),
ADD COLUMN IF NOT EXISTS secuencial_nota_credito INT NOT NULL DEFAULT 1 CHECK (secuencial_nota_credito > 0),
ADD COLUMN IF NOT EXISTS secuencial_nota_debito INT NOT NULL DEFAULT 1 CHECK (secuencial_nota_debito > 0),
ADD COLUMN IF NOT EXISTS secuencial_retencion INT NOT NULL DEFAULT 1 CHECK (secuencial_retencion > 0),
ADD COLUMN IF NOT EXISTS secuencial_guia_remision INT NOT NULL DEFAULT 1 CHECK (secuencial_guia_remision > 0);

-- Migración de datos: Preservar el secuencial actual en la columna de facturas
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'sistema_facturacion' 
        AND table_name = 'puntos_emision' 
        AND column_name = 'secuencial_actual'
    ) THEN
        UPDATE sistema_facturacion.puntos_emision 
        SET secuencial_factura = secuencial_actual;
        
        -- Eliminar la columna antigua
        ALTER TABLE sistema_facturacion.puntos_emision DROP COLUMN secuencial_actual;
    END IF;
END $$;

-- Comentarios
COMMENT ON COLUMN sistema_facturacion.puntos_emision.telefono IS 'Teléfono opcional específico para este punto de emisión/caja.';
COMMENT ON COLUMN sistema_facturacion.puntos_emision.secuencial_factura IS 'Siguiente número secuencial para Facturas.';
COMMENT ON COLUMN sistema_facturacion.puntos_emision.secuencial_nota_credito IS 'Siguiente número secuencial para Notas de Crédito.';

-- Actualizar timestamp
UPDATE sistema_facturacion.establecimientos SET updated_at = NOW();
UPDATE sistema_facturacion.puntos_emision SET updated_at = NOW();

COMMIT;
