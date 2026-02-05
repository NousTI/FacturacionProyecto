export interface Permiso {
    id: string;
    codigo: string;
    nombre: string;
    modulo: string;
    tipo: string;
    descripcion?: string;
    concedido: boolean;
}

export interface EmpresaInfo {
    id: string;
    ruc: string;
    razon_social: string;
    nombre_comercial?: string;
    email: string;
    direccion: string;
    logo_url?: string;
}

export interface PerfilUsuario {
    // Datos del Usuario (Perfil)
    id: string;
    user_id: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    avatar_url?: string;
    activo: boolean; // Estado en la empresa

    // Datos de Autenticación (Sistema)
    email: string;
    system_role: string;
    system_estado: string;
    ultimo_acceso?: string;
    created_at: string;
    updated_at: string;

    // Datos de la Empresa
    empresa: EmpresaInfo;

    // Datos del Rol y Permisos
    rol_nombre: string;
    rol_codigo: string;
    permisos: Permiso[];
}
