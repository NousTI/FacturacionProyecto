-- ===================================================================
-- MIGRACIÓN: ACATAMIENTO SRI - IMPUESTOS DETALLADOS
-- ===================================================================

-- 1. Actualizar tabla de detalles con parámetros explícitos de impuestos
ALTER TABLE sistema_facturacion.facturas_detalle 
ADD COLUMN IF NOT EXISTS codigo_impuesto VARCHAR(1) DEFAULT '2' COMMENT 'Código de impuesto (2=IVA por defecto SRI)',
ADD COLUMN IF NOT EXISTS tarifa_iva NUMERIC(5,2) DEFAULT 0 COMMENT 'Porcentaje de la tarifa aplicada (ej: 15.00)',
ADD COLUMN IF NOT EXISTS base_imponible NUMERIC(12,2) DEFAULT 0 COMMENT 'Base sobre la cual se calcula el IVA';

-- 2. Actualizar tabla de facturas con el campo global totalSinImpuestos
ALTER TABLE sistema_facturacion.facturas
ADD COLUMN IF NOT EXISTS total_sin_impuestos NUMERIC(12,2) DEFAULT 0 COMMENT 'Suma de todas las bases imponibles antes de impuestos';

-- Comentarios adicionales para auditoría
COMMENT ON COLUMN sistema_facturacion.facturas_detalle.codigo_impuesto IS 'Código SRI: 2=IVA, 3=ICE, 5=IRBPNR';
COMMENT ON COLUMN sistema_facturacion.facturas_detalle.tarifa_iva IS 'Tarifa real del impuesto (ej: 0.00, 15.00, 10.00)';
