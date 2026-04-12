-- Migración para añadir columnas de snapshots y metadata a la tabla facturas
-- Estas columnas son necesarias para garantizar la inmutabilidad de los datos según normativa SRI.

ALTER TABLE sistema_facturacion.facturas 
ADD COLUMN IF NOT EXISTS snapshot_empresa JSONB,
ADD COLUMN IF NOT EXISTS snapshot_cliente JSONB,
ADD COLUMN IF NOT EXISTS snapshot_establecimiento JSONB,
ADD COLUMN IF NOT EXISTS snapshot_punto_emision JSONB,
ADD COLUMN IF NOT EXISTS snapshot_usuario JSONB,
ADD COLUMN IF NOT EXISTS mensajes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS client_info JSONB DEFAULT '{}'::jsonb;

-- Comentario para auditoría
COMMENT ON COLUMN sistema_facturacion.facturas.snapshot_empresa IS 'Copia inmutable de datos de la empresa al momento de la factura';
COMMENT ON COLUMN sistema_facturacion.facturas.snapshot_cliente IS 'Copia inmutable de datos del cliente al momento de la factura';
COMMENT ON COLUMN sistema_facturacion.facturas.snapshot_establecimiento IS 'Copia inmutable de datos del establecimiento al momento de la factura';
COMMENT ON COLUMN sistema_facturacion.facturas.snapshot_punto_emision IS 'Copia inmutable de datos del punto de emisión al momento de la factura';
COMMENT ON COLUMN sistema_facturacion.facturas.snapshot_usuario IS 'Copia inmutable de datos del usuario que creó la factura';
