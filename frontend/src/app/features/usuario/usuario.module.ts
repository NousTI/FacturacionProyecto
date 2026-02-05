import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioRoutingModule } from './usuario-routing.module';
import { CertificadoSriPage } from './certificado-sri/certificado-sri.page';

@NgModule({
    declarations: [
    ],
    imports: [
        CommonModule,
        FormsModule,
        UsuarioRoutingModule
    ]
})
export class UsuarioModule { }
