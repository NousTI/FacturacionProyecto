export enum EstadoRenovacion {
  PENDIENTE = 'PENDIENTE',
  ACEPTADA = 'ACEPTADA',
  RECHAZADA = 'RECHAZADA'
}

export interface SolicitudRenovacion {
  id: string;
  empresa_id: string;
  suscripcion_id: string;
  plan_id: string;
  vendedor_id?: string;
  estado: EstadoRenovacion;
  comprobante_url?: string;
  procesado_por?: string;
  motivo_rechazo?: string;
  fecha_solicitud: Date;
  fecha_procesamiento?: Date;
  created_at: Date;
  updated_at: Date;
  
  // Datos extendidos para la UI
  empresa_nombre?: string;
  plan_nombre?: string;
  vendedor_nombre?: string;
}

export interface SolicitudRenovacionCreate {
  empresa_id: string;
  plan_id: string;
  comprobante_url?: string;
}

export interface SolicitudRenovacionProcess {
  estado: 'ACEPTADA' | 'RECHAZADA';
  motivo_rechazo?: string;
}
