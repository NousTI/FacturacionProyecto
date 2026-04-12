import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendedorRoutingModule } from './vendedor-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { RenovacionesVendedorPage } from './renovaciones/renovaciones-vendedor.page';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        VendedorRoutingModule,
        SharedModule,
        RenovacionesVendedorPage
    ]
})
export class VendedorModule { }
