import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { PrivateLayoutComponent } from './layouts/private-layout/private-layout.component';
import { ToastComponent } from './components/toast/toast.component';

@NgModule({
    declarations: [
        NavbarComponent,
        SidebarComponent,
        PublicLayoutComponent,
        PrivateLayoutComponent
    ],
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        ToastComponent
    ],
    exports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        NavbarComponent,
        SidebarComponent,
        PublicLayoutComponent,
        PrivateLayoutComponent,
        ToastComponent
    ]
})
export class SharedModule { }
