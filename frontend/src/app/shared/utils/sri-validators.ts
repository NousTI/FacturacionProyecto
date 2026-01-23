import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class SriValidators {
    /**
     * Validador de RUC ecuatoriano para Angular Reactive Forms
     */
    static rucEcuador(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const ruc = control.value;
            if (!ruc) return null;

            // Longitud básica
            if (!/^[0-9]{13}$/.test(ruc)) {
                return { rucInvalid: true, message: 'El RUC debe tener 13 dígitos numéricos' };
            }

            // Los últimos 3 dígitos deben ser 001 o superior
            if (ruc.substring(10) === '000') {
                return { rucInvalid: true, message: 'Los últimos dígitos deben ser 001 o superior' };
            }

            const provincia = parseInt(ruc.substring(0, 2), 10);
            if (provincia < 1 || provincia > 24) {
                return { rucInvalid: true, message: 'Provincia inválida (primeros 2 dígitos)' };
            }

            const tercerDigito = parseInt(ruc[2], 10);

            if (tercerDigito < 6) {
                // Persona Natural (Basado en Cédula)
                if (!this.validarCedula(ruc.substring(0, 10))) {
                    return { rucInvalid: true, message: 'Cédula base del RUC inválida' };
                }
            } else if (tercerDigito === 6) {
                // Entidades Públicas
                const weights = [3, 2, 7, 6, 5, 4, 3, 2];
                const checkDigit = parseInt(ruc[8], 10);
                let sum = 0;
                for (let i = 0; i < 8; i++) {
                    sum += parseInt(ruc[i], 10) * weights[i];
                }
                let res = 11 - (sum % 11);
                res = res === 11 ? 0 : res;
                if (res !== checkDigit) {
                    return { rucInvalid: true, message: 'Dígito verificador de RUC público inválido' };
                }
            } else if (tercerDigito === 9) {
                // Personas Jurídicas / Extranjeros
                const weights = [4, 3, 2, 7, 6, 5, 4, 3, 2];
                const checkDigit = parseInt(ruc[9], 10);
                let sum = 0;
                for (let i = 0; i < 9; i++) {
                    sum += parseInt(ruc[i], 10) * weights[i];
                }
                let res = 11 - (sum % 11);
                res = res === 11 ? 0 : res;
                if (res !== checkDigit) {
                    return { rucInvalid: true, message: 'Dígito verificador de RUC jurídico inválido' };
                }
            } else {
                return { rucInvalid: true, message: 'Tercer dígito inválido' };
            }

            return null;
        };
    }

    /**
     * Validador genérico para Cédula (10) o RUC (13) en Ecuador
     */
    static identificacionEcuador(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            if (!value) return null;

            const length = value.length;

            if (length === 10) {
                if (!this.validarCedula(value)) {
                    return { identificacionInvalid: true, message: 'Cédula inválida' };
                }
            } else if (length === 13) {
                const rucError = this.rucEcuador()(control);
                if (rucError) {
                    return { identificacionInvalid: true, message: rucError['message'] };
                }
            } else {
                return { identificacionInvalid: true, message: 'Debe tener 10 (Cédula) o 13 (RUC) dígitos' };
            }

            return null;
        };
    }

    private static validarCedula(cedula: string): boolean {
        if (!cedula || !/^[0-9]{10}$/.test(cedula)) return false;

        const provincia = parseInt(cedula.substring(0, 2), 10);
        if (provincia < 1 || provincia > 24) return false;

        let sum = 0;
        for (let i = 0; i < 9; i++) {
            let val = parseInt(cedula[i], 10);
            if (i % 2 === 0) {
                val *= 2;
                if (val > 9) val -= 9;
            }
            sum += val;
        }

        const checkDigit = parseInt(cedula[9], 10);
        const res = (10 - (sum % 10)) % 10;
        return res === checkDigit;
    }
}
