// En Angular, los 'hooks' suelen referirse a funciones de utilidad reactivas o decoradores personalizados.
// Ejemplo: Un operador de RxJS personalizado o una utilidad de ciclo de vida.

import { Observable, pipe } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { notify } from '../ui/notify';

/**
 * Operador personalizado para manejar errores globales en streams de RxJS
 */
export function handleError(message: string) {
    return pipe(
        (source: Observable<any>) => source.pipe(
            // Lógica de captura de error si es necesario
        ),
        finalize(() => {
            // Limpieza
        })
    );
}
