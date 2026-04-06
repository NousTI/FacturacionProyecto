# Configuración de Sesiones y Seguridad
SESSION_TIMEOUT_MINUTES = 60
SESSION_MAX_RETRY_ATTEMPTS = 5
SESSION_RETRY_WINDOW_MINUTES = 15

# Mensajes de Error de Autenticación
AUTH_ERR_INVALID_CREDENTIALS = "El correo o la contraseña son incorrectos."
AUTH_ERR_ACCOUNT_INACTIVE = "Tu cuenta está inactiva. Contacta a soporte."
AUTH_ERR_SESSION_ACTIVE = "Ya tienes una sesión activa en otro dispositivo."
AUTH_ERR_SESSION_EXPIRED = "Tu sesión ha expirado. Por favor, inicia sesión de nuevo."
AUTH_ERR_TOKEN_INVALID = "Token de autenticación inválido o alterado."

# Eventos de Auditoría
EVT_LOGIN_SUCCESS = "LOGIN_OK"
EVT_LOGIN_FAILED = "LOGIN_FAIL"
EVT_LOGOUT = "LOGOUT"
EVT_PASSWORD_CHANGE = "PASS_CHANGE"
EVT_ACCOUNT_BLOCK = "ACCOUNT_BLOCK"
