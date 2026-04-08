export type TipoFrecuencia = 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL';

export interface FacturaProgramada {
  id: string;
  empresa_id: string;
  cliente_id: string;
  cliente_nombre?: string;
  usuario_id: string;
  tipo_frecuencia: TipoFrecuencia;
  dia_emision?: number;
  monto: number;
  concepto: string;
  fecha_inicio: string;
  fecha_fin?: string;
  ultima_emision?: string;
  proxima_emision?: string;
  total_emisiones: number;
  emisiones_exitosas: number;
  emisiones_fallidas: number;
  activo: boolean;
  enviar_email: boolean;
  configuracion?: any;
  created_at: string;
  updated_at: string;
}

export interface HistorialProgramacion {
  fecha: string;
  numero_factura?: string;
  estado: string;
  detalle?: string;
  sri_mensajes?: any;
  showJson?: boolean;
}

export interface FacturaProgramadaCreacion {
  cliente_id: string;
  tipo_frecuencia: TipoFrecuencia;
  dia_emision?: number;
  monto: number;
  concepto: string;
  fecha_inicio: string;
  fecha_fin?: string;
  activo?: boolean;
  enviar_email?: boolean;
}
