import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { environment } from '../core/environment';

// Layout component with Tools & PDP Registers expandable menu

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-brand"><svg viewBox="0 0 40 40" fill="none" width="32" height="32"><path d="M20 4L6 12v16l14 8 14-8V12L20 4z" fill="#5687f3" opacity="0.2"/><path d="M20 4L6 12v16l14 8 14-8V12L20 4z" stroke="#5687f3" stroke-width="2" fill="none"/><path d="M14 20l4 4 8-8" stroke="#5687f3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="brand-info"><span class="brand-text">Veridata</span><span class="brand-version">v{{ version }}</span></div></div>
        <nav class="sidebar-nav">
          <a routerLink="/projects" routerLinkActive="active" class="nav-item"><span class="nav-icon">📁</span><span>Proyectos</span></a>
          <a routerLink="/subscription" routerLinkActive="active" class="nav-item"><span class="nav-icon">💳</span><span>Mi Suscripción</span></a>

          <!-- Herramientas y Registros PDP - Expandable Menu -->
          <div class="nav-group">
            <div class="nav-item nav-group-header" (click)="toggleToolsMenu()">
              <span class="nav-icon">🛠️</span>
              <span>Herramientas y Registros PDP</span>
              <span class="nav-arrow" [class.expanded]="toolsExpanded()">▶</span>
            </div>
            @if (toolsExpanded()) {
              <div class="nav-submenu">
                <!-- Registro de Actividades de Tratamiento, Riesgos e Impacto -->
                <div class="nav-subgroup">
                  <div class="nav-subheader">📋 RAT, Riesgos e Impacto</div>
                  <a routerLink="/tools/rat" routerLinkActive="active" class="nav-subitem">Registro de Actividades</a>
                  <a routerLink="/tools/impact-assessment" routerLinkActive="active" class="nav-subitem">Riesgos e Impacto</a>
                </div>

                <!-- Calificaciones de Proveedores -->
                <div class="nav-subgroup">
                  <div class="nav-subheader">⭐ Calificaciones</div>
                  <a routerLink="/tools/officer-qualification" routerLinkActive="active" class="nav-subitem">Calificación de Encargados</a>
                  <a routerLink="/tools/transfer-qualification" routerLinkActive="active" class="nav-subitem">Transferencias Internacionales</a>
                  <a routerLink="/tools/qualifications-summary" routerLinkActive="active" class="nav-subitem">Resumen de Calificaciones</a>
                </div>

                <!-- Registros -->
                <div class="nav-subgroup">
                  <div class="nav-subheader">📊 Registros</div>
                  <a routerLink="/tools/rights-exercise" routerLinkActive="active" class="nav-subitem">Ejercicio de Derechos</a>
                  <a routerLink="/tools/incidents" routerLinkActive="active" class="nav-subitem">Incidentes PDP</a>
                </div>

                <!-- Herramientas -->
                <div class="nav-subgroup">
                  <div class="nav-subheader">🔧 Herramientas</div>
                  <a routerLink="/tools/legitimacy-report" routerLinkActive="active" class="nav-subitem">Informe de Legitimación</a>
                  <a routerLink="/tools/sanctions-calculator" routerLinkActive="active" class="nav-subitem">Calculadora de Sanciones</a>
                  <a routerLink="/tools/large-scale-calculator" routerLinkActive="active" class="nav-subitem">Cálculo de Gran Escala</a>
                </div>
              </div>
            }
          </div>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info"><div class="user-avatar">{{ auth.currentUser()?.name?.charAt(0) || 'U' }}</div><div class="user-details"><span class="user-name">{{ auth.currentUser()?.name }}</span><span class="user-role">{{ auth.userRole() }}</span></div></div>
          <button class="logout-btn" (click)="auth.logout()" title="Salir">✕</button>
        </div>
      </aside>
      <main class="main-content">
        @if (!auth.hasActiveSubscription() && auth.userRole() !== 'admin') {
          <div class="sub-banner sub-banner-error">
            <span>⚠️ Tu suscripción ha vencido o no tienes una activa. Las funcionalidades están bloqueadas.</span>
            <a routerLink="/subscription" class="sub-banner-btn">Activar Plan</a>
          </div>
        } @else if (auth.subscriptionDaysRemaining() > 0 && auth.subscriptionDaysRemaining() <= 7 && auth.userRole() !== 'admin') {
          <div class="sub-banner sub-banner-warning">
            <span>⏳ Tu plan <strong>{{ auth.subscriptionPlanName() }}</strong> vence en {{ auth.subscriptionDaysRemaining() }} días.</span>
            <a routerLink="/subscription" class="sub-banner-btn">Renovar</a>
          </div>
        }
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 260px; background: linear-gradient(180deg, #0d1321, #121b30); color: white; display: flex; flex-direction: column; position: fixed; inset: 0; right: auto; z-index: 30; }
    .sidebar-brand { display: flex; align-items: center; gap: 0.625rem; padding: 1.25rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .brand-text { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; }
    .brand-info { display: flex; flex-direction: column; }
    .brand-version { font-size: 0.625rem; color: #5a6385; font-weight: 500; }
    .sidebar-nav { flex: 1; padding: 1rem 0.5rem; overflow-y: auto; }
    .nav-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 0.75rem; color: #8890a8; text-decoration: none; border-radius: 8px; font-size: 0.8125rem; transition: all 0.2s; margin-bottom: 0.25rem; cursor: pointer; }
    .nav-item:hover { background: rgba(86,135,243,0.1); color: #c4c8d6; }
    .nav-item.active { background: rgba(86,135,243,0.15); color: #5687f3; font-weight: 600; }
    .nav-icon { font-size: 1rem; width: 1.25rem; text-align: center; }
    .nav-arrow { margin-left: auto; font-size: 0.625rem; transition: transform 0.2s; }
    .nav-arrow.expanded { transform: rotate(90deg); }

    /* Expandable menu styles */
    .nav-group { margin-bottom: 0.5rem; }
    .nav-group-header { font-weight: 500; }
    .nav-submenu { padding-left: 0.5rem; border-left: 2px solid rgba(86,135,243,0.3); margin-left: 0.75rem; margin-top: 0.25rem; }
    .nav-subgroup { margin-bottom: 0.75rem; }
    .nav-subheader { font-size: 0.6875rem; color: #5687f3; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.375rem 0.5rem; border-bottom: 1px solid rgba(86,135,243,0.2); margin-bottom: 0.25rem; }
    .nav-subitem { display: block; padding: 0.375rem 0.5rem; color: #a0a8b8; text-decoration: none; border-radius: 6px; font-size: 0.75rem; transition: all 0.2s; margin-bottom: 0.125rem; }
    .nav-subitem:hover { background: rgba(86,135,243,0.08); color: #c4c8d6; }
    .nav-subitem.active { background: rgba(86,135,243,0.12); color: #5687f3; font-weight: 500; }

    .sidebar-footer { border-top: 1px solid rgba(255,255,255,0.08); padding: 1rem; display: flex; align-items: center; justify-content: space-between; }
    .user-info { display: flex; align-items: center; gap: 0.625rem; }
    .user-avatar { width: 32px; height: 32px; background: #5687f3; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8125rem; font-weight: 700; }
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-size: 0.8125rem; font-weight: 600; }
    .user-role { font-size: 0.6875rem; color: #8890a8; text-transform: capitalize; }
    .logout-btn { background: none; border: none; color: #8890a8; cursor: pointer; padding: 0.375rem 0.5rem; border-radius: 6px; font-size: 0.875rem; }
    .logout-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
    .main-content { flex: 1; margin-left: 260px; padding: 2rem; min-height: 100vh; }

    /* Subscription banners */
    .sub-banner { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; border-radius: 10px; margin-bottom: 1.5rem; font-size: 0.875rem; font-weight: 500; animation: fadeIn 0.3s ease; gap: 1rem; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    .sub-banner-error { background: linear-gradient(135deg, #fef2f2, #fee2e2); color: #991b1b; border: 1px solid #fecaca; }
    .sub-banner-warning { background: linear-gradient(135deg, #fffbeb, #fef3c7); color: #92400e; border: 1px solid #fde68a; }
    .sub-banner-btn { padding: 0.375rem 1rem; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 0.8125rem; white-space: nowrap; }
    .sub-banner-error .sub-banner-btn { background: #ef4444; color: white; }
    .sub-banner-error .sub-banner-btn:hover { background: #dc2626; }
    .sub-banner-warning .sub-banner-btn { background: #f59e0b; color: white; }
    .sub-banner-warning .sub-banner-btn:hover { background: #d97706; }

    @media (max-width: 768px) { .sidebar { display: none; } .main-content { margin-left: 0; } }
  `],
})
export class LayoutComponent {
  version = environment.version;
  toolsExpanded = signal(false);

  constructor(public auth: AuthService) {
    // Refresh subscription status on layout load
    if (auth.isAuthenticated()) {
      auth.refreshSubscription();
    }
  }

  toggleToolsMenu(): void {
    this.toolsExpanded.update(v => !v);
  }
}
