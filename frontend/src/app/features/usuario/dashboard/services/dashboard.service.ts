import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, finalize, tap } from 'rxjs';
import { DashboardService, DashboardOverview } from '../../../../shared/services/dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardFeatureService {
  private _overview$ = new BehaviorSubject<DashboardOverview | null>(null);
  private _loading$ = new BehaviorSubject<boolean>(false);

  overview$ = this._overview$.asObservable();
  loading$ = this._loading$.asObservable();

  constructor(private dashboardService: DashboardService) {}

  loadOverview(period: 'day' | 'week' | 'month' = 'month') {
    this._loading$.next(true);
    return this.dashboardService.getOverview(period).pipe(
      tap(data => this._overview$.next(data)),
      finalize(() => this._loading$.next(false))
    );
  }
}
