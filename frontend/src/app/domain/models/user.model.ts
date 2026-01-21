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
    rol_id?: string;
    role?: UserRole | string;
}
