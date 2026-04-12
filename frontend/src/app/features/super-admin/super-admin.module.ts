import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperAdminRoutingModule } from './super-admin-routing.module';

import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { RenovacionesAdminPage } from './renovaciones/renovaciones-admin.page';

@NgModule({
    declarations: [
    ],
    imports: [
        CommonModule,
        FormsModule,
        SuperAdminRoutingModule,
        SharedModule,
        RenovacionesAdminPage
    ]
})
export class SuperAdminModule { }
