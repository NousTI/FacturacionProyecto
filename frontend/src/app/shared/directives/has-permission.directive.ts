import { Directive, Input, TemplateRef, ViewContainerRef, effect, OnInit, OnDestroy } from '@angular/core';
import { PermissionsService } from '../../core/auth/permissions.service';
import { AuthFacade } from '../../core/auth/auth.facade';
import { Subscription } from 'rxjs';

@Directive({
    selector: '[appHasPermission]',
    standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
    private permissions: string | string[] = '';
    private userSubscription: Subscription | null = null;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private permissionsService: PermissionsService,
        private authFacade: AuthFacade
    ) { }

    @Input()
    set appHasPermission(val: string | string[]) {
        this.permissions = val;
        this.updateView();
    }

    ngOnInit() {
        // Suscribirse a cambios del usuario para reactualizar permisos
        this.userSubscription = this.authFacade.user$.subscribe(() => {
            this.updateView();
        });
    }

    ngOnDestroy() {
        this.userSubscription?.unsubscribe();
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
