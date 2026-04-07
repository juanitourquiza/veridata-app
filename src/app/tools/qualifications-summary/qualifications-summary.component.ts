import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdpToolsService } from '../pdp-tools.service';

// Qualifications Summary Component - Resumen de Calificaciones (Dashboard)

@Component({
  selector: 'app-qualifications-summary',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <header class="tools-header">
        <h1>📊 Resumen de Calificaciones</h1>
        <p class="tools-subtitle">Dashboard consolidado de calificaciones de proveedores, encargados y transferencias internacionales</p>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <p>Cargando datos...</p>
        </div>
      } @else {
        <!-- Overview Cards -->
        <div class="metrics-grid">
          <div class="metric-card">
            <span class="metric-icon">⭐</span>
            <div class="metric-info">
              <span class="metric-value">{{ totalOfficers() }}</span>
              <span class="metric-label">Encargados calificados</span>
            </div>
          </div>
          <div class="metric-card">
            <span class="metric-icon">🌍</span>
            <div class="metric-info">
              <span class="metric-value">{{ totalTransfers() }}</span>
              <span class="metric-label">Transferencias evaluadas</span>
            </div>
          </div>
          <div class="metric-card approved">
            <span class="metric-icon">✅</span>
            <div class="metric-info">
              <span class="metric-value">{{ approvedCount() }}</span>
              <span class="metric-label">Aprobados</span>
            </div>
          </div>
          <div class="metric-card conditional">
            <span class="metric-icon">⚠️</span>
            <div class="metric-info">
              <span class="metric-value">{{ conditionalCount() }}</span>
              <span class="metric-label">Condicionales</span>
            </div>
          </div>
          <div class="metric-card rejected">
            <span class="metric-icon">🚫</span>
            <div class="metric-info">
              <span class="metric-value">{{ rejectedCount() }}</span>
              <span class="metric-label">Rechazados</span>
            </div>
          </div>
        </div>

        <!-- Officer Qualifications Table -->
        <div class="vd-card">
          <div class="section-header">
            <h3>⭐ Calificaciones de Encargados</h3>
          </div>
          <div class="table-container">
            @if (officerQualifications().length === 0) {
              <div class="empty-state"><p>No hay calificaciones de encargados registradas.</p></div>
            } @else {
              <table class="vd-table">
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Servicio</th>
                    <th>Tipo de datos</th>
                    <th>Calificación</th>
                    <th>Puntaje</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (officer of officerQualifications(); track officer.id) {
                    <tr>
                      <td><strong>{{ officer.provider_name }}</strong></td>
                      <td>{{ officer.service }}</td>
                      <td>{{ formatDataTypes(officer.data_types) }}</td>
                      <td><span class="vd-badge" [class]="'vd-badge-' + (officer.result || 'pendiente')">{{ (officer.result || 'pendiente') | uppercase }}</span></td>
                      <td>
                        <div class="score-bar">
                          <div class="score-fill" [style.width.%]="getOfficerPercentage(officer)" [class]="'score-' + (officer.result || 'pendiente')"></div>
                          <span>{{ getOfficerPercentage(officer) }}%</span>
                        </div>
                      </td>
                      <td>{{ officer.created_at | date:'dd/MM/yyyy' }}</td>
                      <td>
                        @if (officer.result === 'aprobado') {
                          <span class="status-badge active">🟢 Activo</span>
                        } @else if (officer.result === 'condicional') {
                          <span class="status-badge warning">🟡 Con plan de acción</span>
                        } @else {
                          <span class="status-badge inactive">🔴 No aprobado</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>

        <!-- Transfer Qualifications Table -->
        <div class="vd-card">
          <div class="section-header">
            <h3>🌍 Calificaciones de Transferencias Internacionales</h3>
          </div>
          <div class="table-container">
            @if (transferQualifications().length === 0) {
              <div class="empty-state"><p>No hay calificaciones de transferencias registradas.</p></div>
            } @else {
              <table class="vd-table">
                <thead>
                  <tr>
                    <th>País Destino</th>
                    <th>Receptor</th>
                    <th>Finalidad</th>
                    <th>Datos</th>
                    <th>Resultado</th>
                    <th>Criterios Cumplidos</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  @for (transfer of transferQualifications(); track transfer.id) {
                    <tr>
                      <td><strong>{{ transfer.destination_country }}</strong></td>
                      <td>{{ transfer.recipient }}</td>
                      <td>{{ transfer.purpose }}</td>
                      <td>{{ formatDataTypes(transfer.data_categories_list) }}</td>
                      <td><span class="vd-badge" [class]="'vd-badge-' + (transfer.result || 'pendiente')">{{ (transfer.result || 'pendiente') | uppercase }}</span></td>
                      <td>{{ transfer.criteria_met || 0 }} / {{ transfer.total_criteria || 15 }}</td>
                      <td>{{ transfer.created_at | date:'dd/MM/yyyy' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="vd-card">
          <h3>📈 Distribución de Resultados</h3>
          <div class="stats-grid">
            <div class="stat-section">
              <h4>Encargados por resultado</h4>
              <div class="stat-bars">
                @for (stat of officerStats(); track stat.label) {
                  <div class="stat-row">
                    <span class="stat-label">{{ stat.label }}</span>
                    <div class="stat-bar-container">
                      <div class="stat-bar-fill" [class]="stat.class" [style.width.%]="stat.percent"></div>
                    </div>
                    <span class="stat-count">{{ stat.count }}</span>
                  </div>
                }
              </div>
            </div>
            <div class="stat-section">
              <h4>Transferencias por resultado</h4>
              <div class="stat-bars">
                @for (stat of transferStats(); track stat.label) {
                  <div class="stat-row">
                    <span class="stat-label">{{ stat.label }}</span>
                    <div class="stat-bar-container">
                      <div class="stat-bar-fill" [class]="stat.class" [style.width.%]="stat.percent"></div>
                    </div>
                    <span class="stat-count">{{ stat.count }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tools-container { max-width: 1400px; margin: 0 auto; }
    .tools-header { margin-bottom: 1.5rem; }
    .tools-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0 0 0.5rem; }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; }
    .loading-state { padding: 3rem; text-align: center; color: #94a3b8; }
    .empty-state { padding: 2rem; text-align: center; color: #94a3b8; font-size: 0.875rem; }
    .metrics-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .metric-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 0.75rem; }
    .metric-card.approved { background: rgba(34,197,94,0.05); border-color: rgba(34,197,94,0.2); }
    .metric-card.conditional { background: rgba(245,158,11,0.05); border-color: rgba(245,158,11,0.2); }
    .metric-card.rejected { background: rgba(239,68,68,0.05); border-color: rgba(239,68,68,0.2); }
    .metric-icon { font-size: 1.5rem; }
    .metric-info { display: flex; flex-direction: column; }
    .metric-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .metric-label { font-size: 0.75rem; color: #64748b; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header h3 { margin: 0; font-size: 1rem; }
    .table-container { overflow-x: auto; }
    .vd-badge-aprobado { background: rgba(34,197,94,0.1); color: #16a34a; }
    .vd-badge-condicional { background: rgba(245,158,11,0.1); color: #d97706; }
    .vd-badge-rechazado { background: rgba(239,68,68,0.1); color: #dc2626; }
    .vd-badge-pendiente { background: rgba(100,116,139,0.1); color: #64748b; }
    .score-bar { display: flex; align-items: center; gap: 0.5rem; }
    .score-bar div { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .score-bar span { font-size: 0.75rem; font-weight: 600; min-width: 35px; }
    .score-fill { height: 100%; transition: width 0.3s; }
    .score-aprobado { background: #22c55e; }
    .score-condicional { background: #f59e0b; }
    .score-rechazado { background: #ef4444; }
    .score-pendiente { background: #94a3b8; }
    .status-badge { font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 4px; white-space: nowrap; }
    .status-badge.active { background: rgba(34,197,94,0.1); color: #16a34a; }
    .status-badge.warning { background: rgba(245,158,11,0.1); color: #d97706; }
    .status-badge.inactive { background: rgba(239,68,68,0.1); color: #dc2626; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .stat-section h4 { margin: 0 0 1rem; font-size: 0.875rem; color: #64748b; }
    .stat-bars { display: flex; flex-direction: column; gap: 0.75rem; }
    .stat-row { display: flex; align-items: center; gap: 0.75rem; }
    .stat-label { font-size: 0.8rem; width: 100px; color: #334155; }
    .stat-bar-container { flex: 1; height: 20px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .stat-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
    .stat-bar-fill.bar-approved { background: #22c55e; }
    .stat-bar-fill.bar-condicional { background: #f59e0b; }
    .stat-bar-fill.bar-rechazado { background: #ef4444; }
    .stat-bar-fill.bar-pendiente { background: #94a3b8; }
    .stat-count { font-size: 0.8rem; font-weight: 700; min-width: 20px; text-align: right; }
    @media (max-width: 1200px) { .metrics-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 768px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } .stats-grid { grid-template-columns: 1fr; } }
  `],
})
export class QualificationsSummaryComponent implements OnInit {
  officerQualifications = signal<any[]>([]);
  transferQualifications = signal<any[]>([]);
  loading = signal(true);

  private pdpToolsService = inject(PdpToolsService);

  private dataTypeLabels: Record<string, string> = {
    identificativos: 'Identificativos',
    contacto: 'Contacto',
    financieros: 'Financieros',
    laborales: 'Laborales',
    academicos: 'Académicos',
    comportamiento_digital: 'Comp. digital',
    sensibles: 'Sensibles',
    salud: 'Salud',
    biometricos: 'Biométricos',
    menores: 'Menores',
    judiciales: 'Judiciales',
    dataset_mixto: 'Dataset mixto',
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    let loaded = 0;
    const checkDone = () => { if (++loaded >= 2) this.loading.set(false); };

    this.pdpToolsService.getOfficerQualifications({ per_page: 100 }).subscribe({
      next: (res: any) => {
        this.officerQualifications.set(res.data || []);
        checkDone();
      },
      error: (err) => {
        console.error('Error loading officer qualifications:', err);
        checkDone();
      }
    });

    this.pdpToolsService.getTransferQualifications({ per_page: 100 }).subscribe({
      next: (res: any) => {
        this.transferQualifications.set(res.data || []);
        checkDone();
      },
      error: (err) => {
        console.error('Error loading transfer qualifications:', err);
        checkDone();
      }
    });
  }

  refreshData(): void {
    this.loadData();
  }

  formatDataTypes(types: any): string {
    if (!types) return '—';
    if (typeof types === 'string') return types;
    if (Array.isArray(types)) {
      return types.map(t => this.dataTypeLabels[t] || t).join(', ');
    }
    return '—';
  }

  getOfficerPercentage(officer: any): number {
    const max = officer.max_score || 305;
    const total = officer.total_score || 0;
    if (max === 0) return 0;
    return Math.round((total / max) * 100);
  }

  totalOfficers(): number { return this.officerQualifications().length; }
  totalTransfers(): number { return this.transferQualifications().length; }

  approvedCount(): number {
    return this.officerQualifications().filter(o => o.result === 'aprobado').length +
           this.transferQualifications().filter(t => t.result === 'aprobado').length;
  }

  conditionalCount(): number {
    return this.officerQualifications().filter(o => o.result === 'condicional').length +
           this.transferQualifications().filter(t => t.result === 'condicional').length;
  }

  rejectedCount(): number {
    return this.officerQualifications().filter(o => o.result === 'rechazado').length +
           this.transferQualifications().filter(t => t.result === 'rechazado').length;
  }

  officerStats(): any[] {
    return this.buildStats(this.officerQualifications());
  }

  transferStats(): any[] {
    return this.buildStats(this.transferQualifications());
  }

  private buildStats(items: any[]): any[] {
    const total = items.length;
    if (total === 0) return [
      { label: 'Aprobados', count: 0, percent: 0, class: 'bar-approved' },
      { label: 'Condicionales', count: 0, percent: 0, class: 'bar-condicional' },
      { label: 'Rechazados', count: 0, percent: 0, class: 'bar-rechazado' },
      { label: 'Pendientes', count: 0, percent: 0, class: 'bar-pendiente' },
    ];

    const approved = items.filter(i => i.result === 'aprobado').length;
    const condicional = items.filter(i => i.result === 'condicional').length;
    const rechazado = items.filter(i => i.result === 'rechazado').length;
    const pendiente = items.filter(i => !i.result || i.result === 'pendiente').length;

    return [
      { label: 'Aprobados', count: approved, percent: (approved / total) * 100, class: 'bar-approved' },
      { label: 'Condicionales', count: condicional, percent: (condicional / total) * 100, class: 'bar-condicional' },
      { label: 'Rechazados', count: rechazado, percent: (rechazado / total) * 100, class: 'bar-rechazado' },
      { label: 'Pendientes', count: pendiente, percent: (pendiente / total) * 100, class: 'bar-pendiente' },
    ];
  }
}
