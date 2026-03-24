import { UserRole } from "../enums/role.enum";
import { Permiso } from "./perfil.model";
import { Empresa } from "./empresa.model";

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
    is_superadmin?: boolean;

    telefono?: string;
    empresa_id?: string;
    empresa_suscripcion_estado?: string;
    empresa_rol_id?: string;
    rol_nombre?: string;
    rol_codigo?: string;
    role?: UserRole | string;
    ultimo_acceso?: string;

    // Permisos Vendedor
    puede_crear_empresas?: boolean;
    puede_gestionar_planes?: boolean;
    puede_acceder_empresas?: boolean;
    puede_ver_reportes?: boolean;

    // Permisos Granulares (Nuevo Sistema)
    // Puede venir como string[] (token) o Permiso[] (perfil completo)
    permisos?: string[] | Permiso[];

    activo?: boolean;
    empresa?: Empresa;
    empresa_activa?: boolean;
}
