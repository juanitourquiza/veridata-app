import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardSummary, DashboardCharts } from '../core/services/dashboard.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <p class="subtitle">Resumen de tu organización</p>
      </div>

      <!-- Loading -->
      @if (dashboardService.loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando dashboard...</p>
        </div>
      }

      <!-- Error -->
      @if (dashboardService.error()) {
        <div class="error-state">
          <p>{{ dashboardService.error() }}</p>
          <button (click)="loadDashboard()">Reintentar</button>
        </div>
      }

      @if (summary(); as data) {
        <!-- Alerts -->
        @if (data.alerts.length > 0) {
          <div class="alerts-section">
            @for (alert of data.alerts; track alert.title) {
              <div class="alert-card" [class]="'alert-' + alert.type">
                <div class="alert-icon">
                  @switch (alert.type) {
                    @case ('urgent') { ⚠️ }
                    @case ('warning') { ⚡ }
                    @default { ℹ️ }
                  }
                </div>
                <div class="alert-content">
                  <h3>{{ alert.title }}</h3>
                  <p>{{ alert.message }}</p>
                </div>
                @if (alert.action) {
                  <a [routerLink]="alert.action" class="alert-action">
                    Ver más →
                  </a>
                }
              </div>
            }
          </div>
        }

        <!-- Stats Grid -->
        <div class="stats-grid">
          <!-- Subscription Card -->
          <div class="stat-card subscription-card">
            <div class="card-header">
              <h3>Tu Suscripción</h3>
              <span class="badge" [class]="'badge-' + data.subscription.status">
                {{ data.subscription.status === 'trial' ? 'Trial' : 'Activa' }}
              </span>
            </div>
            <div class="card-body">
              <div class="plan-name">{{ data.subscription.plan_name }}</div>
              <div class="days-remaining">
                <span class="number">{{ data.subscription.days_remaining }}</span>
                <span class="label">días restantes</span>
              </div>
              <div class="progress-bar">
                <div class="progress" [style.width.%]="data.subscription.usage_percentage"></div>
              </div>
              <p class="usage-text">
                {{ data.subscription.companies_count }} de {{ data.subscription.max_companies }} empresas
              </p>
            </div>
          </div>

          <!-- Compliance Card -->
          <div class="stat-card compliance-card">
            <div class="card-header">
              <h3>Cumplimiento</h3>
            </div>
            <div class="card-body">
              <div class="compliance-score">
                <span class="percentage">{{ data.compliance.compliance_percentage }}%</span>
                <span class="label">Implementado</span>
              </div>
              <div class="compliance-details">
                <div class="detail-item">
                  <span class="value">{{ data.compliance.implemented_controls }}</span>
                  <span class="label">Controles OK</span>
                </div>
                <div class="detail-item">
                  <span class="value">{{ data.compliance.gaps_count }}</span>
                  <span class="label">Brechas</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Projects Card -->
          <div class="stat-card">
            <div class="card-header">
              <h3>Proyectos</h3>
            </div>
            <div class="card-body">
              <div class="big-number">{{ data.usage.projects }}</div>
              <p>Proyectos activos</p>
            </div>
          </div>

          <!-- Evaluations Card -->
          <div class="stat-card">
            <div class="card-header">
              <h3>Evaluaciones</h3>
            </div>
            <div class="card-body">
              <div class="big-number">{{ data.usage.evaluations }}</div>
              <p>Evaluaciones completadas</p>
            </div>
          </div>
        </div>

        <!-- Tools Usage -->
        <div class="tools-section">
          <h2>Herramientas PDP</h2>
          <div class="tools-grid">
            <div class="tool-item">
              <div class="tool-icon">📋</div>
              <div class="tool-info">
                <span class="tool-name">RAT</span>
                <span class="tool-count">{{ data.usage.tools_usage.rat }}</span>
              </div>
            </div>
            <div class="tool-item">
              <div class="tool-icon">🔍</div>
              <div class="tool-info">
                <span class="tool-name">DPIA</span>
                <span class="tool-count">{{ data.usage.tools_usage.dpia }}</span>
              </div>
            </div>
            <div class="tool-item">
              <div class="tool-icon">👤</div>
              <div class="tool-info">
                <span class="tool-name">Oficiales</span>
                <span class="tool-count">{{ data.usage.tools_usage.officer_qualifications }}</span>
              </div>
            </div>
            <div class="tool-item">
              <div class="tool-icon">🔄</div>
              <div class="tool-info">
                <span class="tool-name">Transferencias</span>
                <span class="tool-count">{{ data.usage.tools_usage.transfer_qualifications }}</span>
              </div>
            </div>
            <div class="tool-item">
              <div class="tool-icon">✋</div>
              <div class="tool-info">
                <span class="tool-name">Derechos</span>
                <span class="tool-count">{{ data.usage.tools_usage.rights_exercises }}</span>
              </div>
            </div>
            <div class="tool-item">
              <div class="tool-icon">⚠️</div>
              <div class="tool-info">
                <span class="tool-name">Incidentes</span>
                <span class="tool-count">{{ data.usage.tools_usage.incidents }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="activity-section">
          <h2>Actividad Reciente</h2>
          <div class="activity-list">
            @for (activity of data.recent_activity; track activity.title + activity.date) {
              <div class="activity-item">
                <div class="activity-icon">
                  @switch (activity.type) {
                    @case ('project_created') { 📁 }
                    @case ('evaluation_completed') { ✅ }
                    @default { 📝 }
                  }
                </div>
                <div class="activity-content">
                  <p class="activity-title">{{ activity.title }}</p>
                  <p class="activity-meta">
                    {{ activity.time }}
                    @if (activity.score) {
                      <span class="score"> - {{ activity.score }}%</span>
                    }
                  </p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <h2>Acciones Rápidas</h2>
          <div class="actions-grid">
            <a routerLink="/projects/new" class="action-card">
              <span class="action-icon">➕</span>
              <span class="action-text">Nuevo Proyecto</span>
            </a>
            <a routerLink="/tools/rat" class="action-card">
              <span class="action-icon">📋</span>
              <span class="action-text">Registrar RAT</span>
            </a>
            <a routerLink="/tools/impact-assessment" class="action-card">
              <span class="action-icon">🔍</span>
              <span class="action-text">Nueva DPIA</span>
            </a>
            <a routerLink="/subscription" class="action-card">
              <span class="action-icon">💳</span>
              <span class="action-text">Gestionar Suscripción</span>
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 24px;
    }

    .dashboard-header h1 {
      margin: 0 0 8px 0;
      color: #1e293b;
      font-size: 28px;
    }

    .subtitle {
      color: #64748b;
      margin: 0;
    }

    .loading-state {
      text-align: center;
      padding: 48px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #5687f3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .alerts-section {
      margin-bottom: 24px;
    }

    .alert-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .alert-urgent {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .alert-warning {
      background: #fffbeb;
      border: 1px solid #fcd34d;
    }

    .alert-info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
    }

    .alert-icon {
      font-size: 24px;
    }

    .alert-content h3 {
      margin: 0 0 4px 0;
      font-size: 16px;
      color: #1e293b;
    }

    .alert-content p {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }

    .alert-action {
      margin-left: auto;
      color: #5687f3;
      text-decoration: none;
      font-weight: 500;
      white-space: nowrap;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .card-header h3 {
      margin: 0;
      font-size: 16px;
      color: #64748b;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-trial {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .badge-active {
      background: #dcfce7;
      color: #166534;
    }

    .plan-name {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .days-remaining {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 16px;
    }

    .days-remaining .number {
      font-size: 36px;
      font-weight: 700;
      color: #5687f3;
    }

    .days-remaining .label {
      color: #64748b;
    }

    .progress-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress {
      height: 100%;
      background: #5687f3;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .usage-text {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }

    .compliance-score {
      text-align: center;
      margin-bottom: 20px;
    }

    .compliance-score .percentage {
      display: block;
      font-size: 48px;
      font-weight: 700;
      color: #22c55e;
    }

    .compliance-score .label {
      color: #64748b;
    }

    .compliance-details {
      display: flex;
      justify-content: space-around;
      text-align: center;
    }

    .detail-item .value {
      display: block;
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
    }

    .detail-item .label {
      font-size: 14px;
      color: #64748b;
    }

    .big-number {
      font-size: 48px;
      font-weight: 700;
      color: #5687f3;
      text-align: center;
      margin-bottom: 8px;
    }

    .tools-section, .activity-section, .quick-actions {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .tools-section h2, .activity-section h2, .quick-actions h2 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: #1e293b;
    }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }

    .tool-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .tool-icon {
      font-size: 24px;
    }

    .tool-info {
      display: flex;
      flex-direction: column;
    }

    .tool-name {
      font-size: 14px;
      color: #64748b;
    }

    .tool-count {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .activity-icon {
      font-size: 20px;
    }

    .activity-content {
      flex: 1;
    }

    .activity-title {
      margin: 0 0 4px 0;
      font-weight: 500;
      color: #1e293b;
    }

    .activity-meta {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }

    .score {
      color: #22c55e;
      font-weight: 600;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      text-decoration: none;
      color: #1e293b;
      transition: all 0.2s ease;
    }

    .action-card:hover {
      background: #e0f2fe;
      transform: translateY(-2px);
    }

    .action-icon {
      font-size: 24px;
    }

    .action-text {
      font-weight: 500;
    }
  `]
})
export class DashboardComponent implements OnInit {
  dashboardService = inject(DashboardService);
  summary = this.dashboardService.summary;
  charts = this.dashboardService.charts;

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.dashboardService.loadDashboard();
  }
}
