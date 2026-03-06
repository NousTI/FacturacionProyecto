import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

export interface ReporteLectura {
  id: string;
  nombre: string;
  tipo: string;
  parametros?: any;
  url_descarga?: string;
  estado: string;
  empresa_id: string;
  usuario_id: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private apiUrl = `${environment.apiUrl}/reportes/superadmin`;

  constructor(private http: HttpClient) {}

  generarReporte(tipo: string, nombre: string, parametros?: any): Observable<ReporteLectura> {
    return this.http.post<ReporteLectura>(this.apiUrl, {
      tipo,
      nombre,
      parametros
    });
  }

  // Para la previsualización (simulada o vía endpoint si existiera, 
  // pero el backend ya hace el filtrado y devuelve el archivo. 
  // El usuario pidió previsualización en pantalla como tabla sencilla.
  // Podríamos agregar un endpoint de 'preview' o usar el mismo de generación 
  // pero para este caso el backend devuelve el objeto del reporte.
  // Implementaremos una lógica donde al "Generar" se obtienen los datos 
  // para mostrar en la tabla antes de descargar.)
  
  obtenerDatosPreview(tipo: string, parametros?: any): Observable<any[]> {
    // Nota: Como el backend actual genera archivos directamente, 
    // idealmente tendríamos un endpoint de previsualización. 
    // Por ahora, para cumplir con el requerimiento de "previsualización en pantalla"
    // simularemos o pediremos los datos si el backend lo soporta.
    // Dado que el backend fue modificado solo para generar archivos, 
    // voy a agregar un método de preview en el servicio para que el frontend 
    // pueda mostrar algo antes de exportar si el backend se extiende.
    return this.http.post<any[]>(`${environment.apiUrl}/reportes/preview`, {
        tipo,
        nombre: 'PREVIEW',
        parametros
    });
  }
}
