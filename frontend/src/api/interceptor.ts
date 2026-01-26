import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from './types';
import { notify } from '../shared/ui/notify';

// Nota: Para Angular, el acceso al 'store' o 'localStorage' debe ser consistente.
// Usaremos localStorage directamente para evitar dependencias circulares complejas en este nivel base.
const TOKEN_KEY = 'auth_token';

export const setupInterceptors = (axiosInstance: AxiosInstance) => {
    // Request Interceptor
    axiosInstance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const token = localStorage.getItem(TOKEN_KEY);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response Interceptor
    axiosInstance.interceptors.response.use(
        (response) => response,
        (error: AxiosError<ApiError>) => {
            const status = error.response?.status;
            const data = error.response?.data;

            if (status === 401) {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem('auth_user');

                // Si no estamos en login, redirigir por sesión expirada
                if (!window.location.pathname.includes('/login')) {
                    notify.error('Tu sesión ha expirado', 'Por favor ingresa nuevamente.');
                    setTimeout(() => window.location.href = '/login', 1500);
                } else {
                    // Si ya estamos en login, mostrar el mensaje específico del servidor (ej: credenciales inválidas)
                    const errorMsg = data?.mensaje || 'Credenciales inválidas';
                    notify.error(errorMsg);
                }
            } else if (status === 403) {
                const errorMsg = data?.mensaje || 'Acceso denegado';
                notify.warning(errorMsg, data?.mensaje ? '' : 'No tienes permisos para esta acción.');
            } else if (data?.mensaje) {
                notify.error(data.mensaje);
            } else {
                notify.error('Error de conexión', 'Ocurrió un error inesperado al conectar con el servidor.');
            }

            return Promise.reject(error);
        }
    );
};
