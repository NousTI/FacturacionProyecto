import { Directive, Input, TemplateRef, ViewContainerRef, effect } from '@angular/core';
import { PermissionsService } from '../../core/auth/permissions.service';

@Directive({
    selector: '[appHasPermission]',
    standalone: true
})
export class HasPermissionDirective {
    private permissions: string | string[] = '';

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private permissionsService: PermissionsService
    ) { }

    @Input()
    set appHasPermission(val: string | string[]) {
        this.permissions = val;
        this.updateView();
    }

    private updateView() {
        let hasPerm = false;

        if (Array.isArray(this.permissions)) {
            hasPerm = this.permissions.some(p => this.permissionsService.hasPermission(p));
        } else {
            hasPerm = this.permissionsService.hasPermission(this.permissions);
        }

        this.viewContainer.clear();
        if (hasPerm) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        }
    }
}
