import re

def validar_ruc(ruc: str) -> bool:
    """
    Valida un RUC de Ecuador (13 dígitos) siguiendo las normas del SRI.
    """
    if not ruc or not re.match(r"^[0-9]{13}$", ruc):
        return False

    # Los últimos 3 dígitos deben ser 001 o superior (establecimiento)
    if ruc[10:] == "000":
        return False

    provincia = int(ruc[0:2])
    if provincia < 1 or provincia > 24:
        return False

    tercer_digito = int(ruc[2])
    
    if tercer_digito < 6:
        # Persona Natural (Basado en Cédula)
        return _validar_cedula(ruc[0:10])
    elif tercer_digito == 6:
        # Entidades Públicas
        weights = [3, 2, 7, 6, 5, 4, 3, 2]
        check_digit = int(ruc[8])
        sum_total = 0
        for i in range(8):
            sum_total += int(ruc[i]) * weights[i]
        
        res = 11 - (sum_total % 11)
        res = 0 if res == 11 else res
        return res == check_digit
    elif tercer_digito == 9:
        # Personas Jurídicas / Extranjeros
        weights = [4, 3, 2, 7, 6, 5, 4, 3, 2]
        check_digit = int(ruc[9])
        sum_total = 0
        for i in range(9):
            sum_total += int(ruc[i]) * weights[i]
        
        res = 11 - (sum_total % 11)
        res = 0 if res == 11 else res
        return res == check_digit
        
    return False

def _validar_cedula(cedula: str) -> bool:
    """
    Valida una cédula de Ecuador (10 dígitos).
    """
    if not cedula or not re.match(r"^[0-9]{10}$", cedula):
        return False

    provincia = int(cedula[0:2])
    if provincia < 1 or provincia > 24:
        return False
    
    # Algoritmo de resolución Modulo 10
    sum_total = 0
    for i in range(9):
        val = int(cedula[i])
        if i % 2 == 0:
            val = val * 2
            if val > 9:
                val -= 9
        sum_total += val
    
    check_digit = int(cedula[9])
    res = (10 - (sum_total % 10)) % 10
    return res == check_digit

def validar_identificacion(identificacion: str) -> bool:
    """
    Valida si una identificación es una Cédula (10 dígitos) o RUC (13 dígitos) válidos en Ecuador.
    """
    if not identificacion:
        return False
    
    length = len(identificacion)
    if length == 10:
        return _validar_cedula(identificacion)
    elif length == 13:
        return validar_ruc(identificacion)
    
    return False
