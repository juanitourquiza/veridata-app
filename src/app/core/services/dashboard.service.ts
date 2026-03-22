import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environment';

export interface DashboardSummary {
  subscription: {
    status: string;
    plan_name: string;
    is_trial: boolean;
    days_remaining: number;
    end_date: string;
    companies_count: number;
    max_companies: number;
    usage_percentage: number;
  };
  usage: {
    projects: number;
    evaluations: number;
    tools_usage: {
      rat: number;
      dpia: number;
      officer_qualifications: number;
      transfer_qualifications: number;
      rights_exercises: number;
      incidents: number;
    };
    total_tools_records: number;
  };
  compliance: {
    maturity_level: number | null;
    compliance_percentage: number;
    total_controls: number;
    implemented_controls: number;
    gaps_count: number;
  };
  recent_activity: Array<{
    type: string;
    title: string;
    date: string;
    time: string;
    score?: number;
  }>;
  alerts: Array<{
    type: string;
    title: string;
    message: string;
    action?: string;
  }>;
}

export interface DashboardCharts {
  maturity_over_time: {
    labels: string[];
    data: number[];
  };
  controls_by_domain: {
    labels: string[];
    implemented: number[];
    pending: number[];
  };
  gap_analysis: {
    labels: string[];
    data: number[];
  };
  monthly_activity: {
    labels: string[];
    projects: number[];
    evaluations: number[];
    tools_usage: number[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Signals para estado
  summary = signal<DashboardSummary | null>(null);
  charts = signal<DashboardCharts | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  getSummary(): Observable<DashboardSummary> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<DashboardSummary>(`${this.apiUrl}/dashboard/summary`).pipe(
      catchError(error => {
        this.error.set('Error al cargar el resumen del dashboard');
        this.loading.set(false);
        return throwError(() => error);
      })
    );
  }

  getCharts(): Observable<DashboardCharts> {
    return this.http.get<DashboardCharts>(`${this.apiUrl}/dashboard/charts`).pipe(
      catchError(error => {
        this.error.set('Error al cargar los gráficos');
        return throwError(() => error);
      })
    );
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.loading.set(false);
      }
    });

    this.getCharts().subscribe({
      next: (data) => {
        this.charts.set(data);
      },
      error: (err) => {
        console.error('Error loading charts:', err);
      }
    });
  }
}
