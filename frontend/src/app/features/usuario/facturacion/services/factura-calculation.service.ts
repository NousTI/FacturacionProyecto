import { Injectable } from '@angular/core';
import { GET_IVA_PERCENTAGE } from '../../../../core/constants/sri-iva.constants';

export interface FacturaTotals {
  subtotal_sin_iva: number;
  subtotal_con_iva: number;
  subtotal_no_objeto_iva: number;
  subtotal_exento_iva: number;
  descuento: number;
  iva: number;
  ice: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class FacturaCalculationService {

  getIvaRate(code: string): number {
    const percentage = GET_IVA_PERCENTAGE(code);
    return percentage / 100;
  }

  calculateRowTotal(detalle: any): number {
    const cantidad = parseFloat(detalle.cantidad) || 0;
    const precio = parseFloat(detalle.precio_unitario) || 0;
    const descuento = parseFloat(detalle.descuento) || 0;
    const subtotal = (cantidad * precio) - descuento;
    return subtotal > 0 ? subtotal : 0;
  }

  calculateTotals(detalles: any[], iceValue: number): FacturaTotals {
    let sub_sin_iva = 0;
    let sub_con_iva = 0;
    let sub_no_objeto = 0;
    let sub_exento = 0;
    let total_desc = 0;
    let total_iva = 0;

    detalles.forEach(val => {
      const cantidad = parseFloat(val.cantidad) || 0;
      const precio = parseFloat(val.precio_unitario) || 0;
      const descuento_linea = parseFloat(val.descuento) || 0;

      const subtotal_linea_gross = (cantidad * precio);
      const base_imponible = Math.max(0, subtotal_linea_gross - descuento_linea);
      const ivaRate = this.getIvaRate(val.tipo_iva);

      if (ivaRate > 0) {
        sub_con_iva += subtotal_linea_gross;
        total_iva += (base_imponible * ivaRate);
      } else if (val.tipo_iva === '0') {
        sub_sin_iva += subtotal_linea_gross;
      } else if (val.tipo_iva === '6') {
        sub_no_objeto += subtotal_linea_gross;
      } else if (val.tipo_iva === '7') {
        sub_exento += subtotal_linea_gross;
      } else {
        sub_sin_iva += subtotal_linea_gross;
      }

      total_desc += descuento_linea;
    });

    const subtotal_sin_iva = Number(sub_sin_iva.toFixed(2));
    const subtotal_con_iva = Number(sub_con_iva.toFixed(2));
    const subtotal_no_objeto_iva = Number(sub_no_objeto.toFixed(2));
    const subtotal_exento_iva = Number(sub_exento.toFixed(2));
    const descuento = Number(total_desc.toFixed(2));
    const iva = Number(total_iva.toFixed(2));
    const ice = Number(iceValue.toFixed(2));

    const grand_total = (
      subtotal_sin_iva + 
      subtotal_con_iva + 
      subtotal_no_objeto_iva + 
      subtotal_exento_iva + 
      iva + 
      ice
    ) - descuento;
    
    const total = Number(grand_total.toFixed(2));

    return {
      subtotal_sin_iva,
      subtotal_con_iva,
      subtotal_no_objeto_iva,
      subtotal_exento_iva,
      descuento,
      iva,
      ice,
      total
    };
  }
}
