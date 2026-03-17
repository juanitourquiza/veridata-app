import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Qualifications Summary Component - Resumen de Calificaciones

@Component({
  selector: 'app-qualifications-summary',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <header class="tools-header">
        <h1>📊 Resumen de Calificaciones</h1>
        <p class="tools-subtitle">Dashboard consolidado de calificaciones de proveedores, encargados y transferencias internacionales</p>
      </header>
      
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
          <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="exportOfficers()">📥 Exportar</button>
        </div>
        <div class="table-container">
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
                  <td><strong>{{ officer.name }}</strong></td>
                  <td>{{ officer.service }}</td>
                  <td>{{ officer.data_type }}</td>
                  <td><span class="vd-badge" [class]="'vd-badge-' + officer.result">{{ officer.result | uppercase }}</span></td>
                  <td>
                    <div class="score-bar">
                      <div class="score-fill" [style.width.%]="officer.score" [class]="'score-' + officer.result"></div>
                      <span>{{ officer.score }}%</span>
                    </div>
                  </td>
                  <td>{{ officer.date | date:'dd/MM/yyyy' }}</td>
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
        </div>
      </div>
      
      <!-- Transfer Qualifications Table -->
      <div class="vd-card">
        <div class="section-header">
          <h3>🌍 Calificaciones de Transferencias Internacionales</h3>
          <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="exportTransfers()">📥 Exportar</button>
        </div>
        <div class="table-container">
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
                  <td>{{ transfer.data_category }}</td>
                  <td><span class="vd-badge" [class]="'vd-badge-' + transfer.result">{{ transfer.result | uppercase }}</span></td>
                  <td>{{ transfer.criteria_met }} / {{ transfer.total_criteria }}</td>
                  <td>{{ transfer.date | date:'dd/MM/yyyy' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Comparison Charts -->
      <div class="vd-card">
        <h3>📈 Análisis Comparativo</h3>
        <div class="comparison-grid">
          <div class="comparison-section">
            <h4>Por Tipo de Datos</h4>
            <div class="chart-data">
              @for (item of byDataType(); track item.type) {
                <div class="chart-row">
                  <span class="chart-label">{{ item.type }}</span>
                  <div class="chart-bar">
                    <div class="bar-segment approved" [style.width.%]="item.approvedPercent" title="Aprobados"></div>
                    <div class="bar-segment conditional" [style.width.%]="item.conditionalPercent" title="Condicionales"></div>
                    <div class="bar-segment rejected" [style.width.%]="item.rejectedPercent" title="Rechazados"></div>
                  </div>
                  <span class="chart-value">{{ item.total }}</span>
                </div>
              }
            </div>
          </div>
          <div class="comparison-section">
            <h4>Tendencia Temporal</h4>
            <div class="trend-data">
              @for (month of monthlyTrend(); track month.month) {
                <div class="trend-row">
                  <span class="trend-month">{{ month.month }}</span>
                  <div class="trend-bars">
                    <div class="trend-bar approved" [style.height.%]="month.approved">{{ month.approved }}</div>
                    <div class="trend-bar conditional" [style.height.%]="month.conditional">{{ month.conditional }}</div>
                    <div class="trend-bar rejected" [style.height.%]="month.rejected">{{ month.rejected }}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tools-container { max-width: 1400px; margin: 0 auto; }
    .tools-header { margin-bottom: 1.5rem; }
    .tools-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0 0 0.5rem; }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; }
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
    .score-bar { display: flex; align-items: center; gap: 0.5rem; }
    .score-bar div { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .score-bar span { font-size: 0.75rem; font-weight: 600; min-width: 35px; }
    .score-fill { height: 100%; transition: width 0.3s; }
    .score-aprobado { background: #22c55e; }
    .score-condicional { background: #f59e0b; }
    .score-rechazado { background: #ef4444; }
    .status-badge { font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .status-badge.active { background: rgba(34,197,94,0.1); color: #16a34a; }
    .status-badge.warning { background: rgba(245,158,11,0.1); color: #d97706; }
    .status-badge.inactive { background: rgba(239,68,68,0.1); color: #dc2626; }
    .comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .comparison-section h4 { margin: 0 0 1rem; font-size: 0.875rem; color: #64748b; }
    .chart-data { display: flex; flex-direction: column; gap: 0.75rem; }
    .chart-row { display: flex; align-items: center; gap: 0.75rem; }
    .chart-label { font-size: 0.75rem; width: 100px; color: #334155; }
    .chart-bar { flex: 1; height: 24px; display: flex; border-radius: 4px; overflow: hidden; }
    .bar-segment.approved { background: #22c55e; }
    .bar-segment.conditional { background: #f59e0b; }
    .bar-segment.rejected { background: #ef4444; }
    .chart-value { font-size: 0.75rem; font-weight: 600; min-width: 30px; text-align: right; }
    .trend-data { display: flex; align-items: flex-end; gap: 0.5rem; height: 150px; }
    .trend-row { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
    .trend-month { font-size: 0.625rem; color: #64748b; transform: rotate(-45deg); }
    .trend-bars { display: flex; gap: 2px; height: 120px; align-items: flex-end; }
    .trend-bar { width: 20px; font-size: 0.5rem; color: white; text-align: center; padding-top: 2px; }
    .trend-bar.approved { background: #22c55e; }
    .trend-bar.conditional { background: #f59e0b; }
    .trend-bar.rejected { background: #ef4444; }
    @media (max-width: 1200px) { .metrics-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 768px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } .comparison-grid { grid-template-columns: 1fr; } }
  `],
})
export class QualificationsSummaryComponent implements OnInit {
  officerQualifications = signal<any[]>([]);
  transferQualifications = signal<any[]>([]);
  
  ngOnInit(): void {
    this.loadData();
  }
  
  loadData(): void {
    this.officerQualifications.set([
      { id: 1, name: 'Amazon Web Services', service: 'Cloud Hosting', data_type: 'Mixtos', result: 'aprobado', score: 95, date: '2026-03-15' },
      { id: 2, name: 'Salesforce', service: 'CRM', data_type: 'Generales', result: 'condicional', score: 78, date: '2026-02-20' },
      { id: 3, name: 'Microsoft Azure', service: 'Cloud Services', data_type: 'Sensibles', result: 'aprobado', score: 92, date: '2026-01-10' },
      { id: 4, name: 'Proveedor Local S.A.', service: 'Desarrollo', data_type: 'Generales', result: 'rechazado', score: 45, date: '2025-12-05' },
    ]);
    
    this.transferQualifications.set([
      { id: 1, destination_country: 'Estados Unidos', recipient: 'AWS', purpose: 'Hosting', data_category: 'Mixtos', result: 'aprobado', criteria_met: 13, total_criteria: 13, date: '2026-03-10' },
      { id: 2, destination_country: 'Irlanda', recipient: 'Salesforce EU', purpose: 'CRM', data_category: 'Generales', result: 'aprobado', criteria_met: 12, total_criteria: 13, date: '2026-02-15' },
    ]);
  }
  
  totalOfficers(): number { return this.officerQualifications().length; }
  totalTransfers(): number { return this.transferQualifications().length; }
  approvedCount(): number {
    return this.officerQualifications().filter(o => o.result === 'aprobado').length +
           this.transferQualifications().filter(t => t.result === 'aprobado').length;
  }
  conditionalCount(): number {
    return this.officerQualifications().filter(o => o.result === 'condicional').length;
  }
  rejectedCount(): number {
    return this.officerQualifications().filter(o => o.result === 'rechazado').length +
           this.transferQualifications().filter(t => t.result === 'rechazado').length;
  }
  
  byDataType(): any[] {
    const types = ['Generales', 'Sensibles', 'Mixtos', 'Financieros', 'Menores'];
    return types.map(type => {
      const items = this.officerQualifications().filter(o => o.data_type === type);
      const total = items.length;
      if (total === 0) return { type, total: 0, approvedPercent: 0, conditionalPercent: 0, rejectedPercent: 0 };
      const approved = items.filter(i => i.result === 'aprobado').length;
      const conditional = items.filter(i => i.result === 'condicional').length;
      const rejected = items.filter(i => i.result === 'rechazado').length;
      return {
        type,
        total,
        approvedPercent: (approved / total) * 100,
        conditionalPercent: (conditional / total) * 100,
        rejectedPercent: (rejected / total) * 100
      };
    }).filter(t => t.total > 0);
  }
  
  monthlyTrend(): any[] {
    return [
      { month: 'Ene', approved: 2, conditional: 0, rejected: 1 },
      { month: 'Feb', approved: 1, conditional: 1, rejected: 0 },
      { month: 'Mar', approved: 2, conditional: 0, rejected: 0 },
    ];
  }
  
  exportOfficers(): void { alert('Exportando calificaciones de encargados...'); }
  exportTransfers(): void { alert('Exportando calificaciones de transferencias...'); }
}
