import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { PermissionsService } from '../auth/permissions.service';

/**
 * Directive to show/hide elements based on user permissions
 * Usage: <div *hasPermission="'CLIENTES_CREAR'">Contenido sensible</div>
 */
@Directive({
    selector: '[hasPermission]',
    standalone: true
})
export class HasPermissionDirective implements OnInit {
    private permission: string | string[] = '';

    @Input() set hasPermission(val: string | string[]) {
        this.permission = val;
        this.updateView();
    }

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private permissionsService: PermissionsService
    ) { }

    ngOnInit() {
        this.updateView();
    }

    private updateView() {
        if (this.permissionsService.hasPermission(this.permission)) {
            if (this.viewContainer.length === 0) {
                this.viewContainer.createEmbeddedView(this.templateRef);
            }
        } else {
            this.viewContainer.clear();
        }
    }
}
