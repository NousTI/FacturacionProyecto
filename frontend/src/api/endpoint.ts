export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/autenticacion/iniciar-sesion',
        LOGOUT: '/autenticacion/cerrar-sesion',
        PERFIL: '/autenticacion/perfil',
    },
    SUPERADMIN: {
        ME: '/superadmin/me',
        USUARIOS: '/usuarios/admin',
    },
    CLIENTES: {
        BASE: '/clientes',
        STATS: '/clientes/stats',
    },
    USUARIOS: {
        BASE: '/usuarios',
        PERFIL: '/usuarios/perfil',
    },
    ROLES: {
        BASE: '/roles',
        PERMISOS: '/roles/permisos',
    }
};
