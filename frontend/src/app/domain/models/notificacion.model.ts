export interface Notificacion {
  id: string;
  user_id: string;
  titulo: string;
  mensaje: string;
  tipo: 'RENOVACION' | 'PAGO' | 'SISTEMA' | 'OTRO';
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  metadata: any;
  leido: boolean;
  leido_at?: Date;
  created_at: Date;
  updated_at: Date;
}
