export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/autenticacion/iniciar-sesion',
        LOGOUT: '/autenticacion/cerrar-sesion',
        PERFIL: '/autenticacion/perfil',
    },
    ROLES: {
        LISTAR: '/roles',
        USUARIO: (userId: string) => `/roles/usuario/${userId}`,
        ASIGNAR: '/roles/asignar',
        REMOVER: '/roles/remover',
    },
    SUPERADMIN: {
        ME: '/superadmin/me',
    }
};
