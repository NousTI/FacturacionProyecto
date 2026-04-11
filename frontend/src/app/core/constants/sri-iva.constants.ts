/**
 * Mapeo de porcentajes de IVA según el SRI de Ecuador.
 * Sincronizado con el backend.
 */
export const SRI_IVA_TARIFAS = [
    { code: '0', label: 'Tarifa 0%', percentage: 0, description: 'Productos de la canasta básica, medicamentos, insumos agrícolas y servicios de transporte/educación.' },
    { code: '2', label: 'Tarifa 12% (Histórica)', percentage: 12, description: 'Tarifa general previa a cambios recientes. Útil para notas de crédito de facturas emitidas antes de 2024.' },
    { code: '3', label: 'Tarifa 14% (Histórica)', percentage: 14, description: 'Tarifa temporal histórica utilizada tras eventos de emergencia (Solidaridad).' },
    { code: '4', label: 'Tarifa 15% (General Vigente)', percentage: 15, description: 'Tarifa general aplicada a la mayoría de bienes y servicios gravados desde abril 2024.' },
    { code: '5', label: 'Tarifa 5% (Construcción/Canasta)', percentage: 5, description: 'Tarifa reducida para transferencias locales de materiales de construcción y ciertos servicios básicos.' },
    { code: '6', label: 'No objeto de Impuesto', percentage: 0, description: 'Ventas que no están sujetas al pago de IVA (ej: venta de negocios completos o herencias).' },
    { code: '7', label: 'Exento de IVA', percentage: 0, description: 'Servicios de salud, alquiler de vivienda para vivienda, transporte público, entre otros.' },
    { code: '8', label: 'Tarifa 8% (Feriados Turísticos)', percentage: 8, description: 'Tarifa reducida aplicada exclusivamente a servicios turísticos durante feriados nacionales decretados.' },
    { code: '10', label: 'Tarifa 13% (Materiales de Construcción)', percentage: 13, description: 'Tarifa temporal previo al incremento al 15% o aplicada a esquemas específicos de materiales.' },
];

export const GET_IVA_PERCENTAGE = (code: string): number => {
    const tarifa = SRI_IVA_TARIFAS.find(t => t.code === code);
    return tarifa ? tarifa.percentage : 0;
};

/**
 * Tipos de identificación según el SRI.
 */
export const SRI_TIPOS_IDENTIFICACION = [
    { code: '04', label: 'RUC' },
    { code: '05', label: 'Cédula' },
    { code: '06', label: 'Pasaporte' },
    { code: '07', label: 'Consumidor Final' },
    { code: '08', label: 'Identificación del Exterior' },
];

/**
 * Obtiene el nombre legible de un tipo de identificación por su código SRI.
 */
export const GET_IDENTIFICACION_LABEL = (code: string): string => {
    const tipo = SRI_TIPOS_IDENTIFICACION.find(t => t.code === code);
    return tipo ? tipo.label : (code || 'Desconocido');
};
/**
 * Clasificación de tipo de persona para empresas.
 */
export const SRI_TIPOS_PERSONA = [
    { code: 'NATURAL', label: 'Persona Natural' },
    { code: 'JURIDICA', label: 'Persona Jurídica' },
];

/**
 * Regímenes tributarios vigentes para empresas en Ecuador.
 */
export const SRI_TIPOS_CONTRIBUYENTE = [
    { code: 'REGIMEN_GENERAL', label: 'Régimen General' },
    { code: 'RIMPE_EMPRENDEDOR', label: 'RIMPE - Emprendedor' },
    { code: 'RIMPE_POPULAR', label: 'RIMPE - Negocio Popular' },
];

export const GET_PERSONA_LABEL = (code: string): string => {
    const tipo = SRI_TIPOS_PERSONA.find(t => t.code === code);
    return tipo ? tipo.label : (code || 'N/A');
};

export const GET_CONTRIBUYENTE_LABEL = (code: string): string => {
    const tipo = SRI_TIPOS_CONTRIBUYENTE.find(t => t.code === code);
    return tipo ? tipo.label : (code || 'No Definido');
};
