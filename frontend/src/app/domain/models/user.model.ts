import { UserRole } from "../enums/role.enum";

export interface User {
    id: string;
    nombre?: string;
    apellido?: string;
    correo?: string;

    // Campos específicos para Superadmin
    nombres?: string;
    apellidos?: string;
    email?: string;
    last_login?: string;

    telefono?: string;
    empresa_id?: string;
    role?: UserRole | string;

    // Permisos Vendedor
    puede_crear_empresas?: boolean;
    puede_gestionar_planes?: boolean;
    puede_acceder_empresas?: boolean;
    puede_ver_reportes?: boolean;
}
