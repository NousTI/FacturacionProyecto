-- =========================================
-- TABLA: UNIDADES DE MEDIDA
-- =========================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.unidades_medida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Sigla corta (u, kg, l) para el XML y reportes compactos
    abreviatura VARCHAR(10) NOT NULL UNIQUE,
    
    -- Nombre completo para la interfaz de usuario
    nombre VARCHAR(50) NOT NULL,
    
    -- Define si permite decimales (Ej: Kg permite 1.5, Unidad no)
    permite_decimales BOOLEAN NOT NULL DEFAULT TRUE,

    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- DATOS INICIALES (Estándares Ecuador)
-- =========================================
INSERT INTO sistema_facturacion.unidades_medida (abreviatura, nombre, permite_decimales) VALUES
('u', 'Unidad', FALSE),
('kg', 'Kilogramo', TRUE),
('g', 'Gramo', TRUE),
('lb', 'Libra', TRUE),
('m', 'Metro', TRUE),
('m2', 'Metro Cuadrado', TRUE),
('l', 'Litro', TRUE),
('cj', 'Caja', FALSE),
('pq', 'Paquete', FALSE),
('doc', 'Docena', FALSE),
('serv', 'Servicio', FALSE);