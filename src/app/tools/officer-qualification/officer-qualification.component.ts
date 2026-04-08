import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PdpToolsService } from '../pdp-tools.service';
import { ModalService } from '../../shared/modal.service';

// Officer Qualification Component - Calificación de Encargados del Tratamiento

interface DataTypeOption {
  value: string;
  label: string;
  category?: string;
}

@Component({
  selector: 'app-officer-qualification',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <div class="tools-header">
        <div class="header-title">
          <h1>👤 Habilitación de Encargados</h1>
          @if (projectId()) {
            <div class="project-badge">📁 Proyecto #{{ projectId() }}</div>
          }
        </div>
        <p class="tools-subtitle">Calificación de proveedores según Art. 9 LOPDP</p>
      </div>

      <!-- Provider Info -->
      <div class="vd-card">
        <h3>📋 Información del Proveedor/Encargado</h3>
        <div class="form-grid">
          <div class="form-group">
            <label class="vd-label">Razón social / Nombre</label>
            <input class="vd-input" [(ngModel)]="provider().name" placeholder="Nombre del proveedor">
          </div>
          <div class="form-group">
            <label class="vd-label">Servicio contratado</label>
            <input class="vd-input" [(ngModel)]="provider().service" placeholder="Ej: Hosting, CRM, etc.">
          </div>
          <div class="form-group">
            <label class="vd-label">Área solicitante</label>
            <input class="vd-input" [(ngModel)]="provider().requesting_area" placeholder="Área que solicita">
          </div>
          <div class="form-group form-group-full">
            <label class="vd-label">Tipo de datos tratados</label>
            <div class="checkbox-grid">
              @for (dt of dataTypeOptions; track dt.value) {
                <label class="checkbox-item" [class.special]="dt.category === 'especial'">
                  <input type="checkbox"
                    [checked]="isDataTypeSelected(dt.value)"
                    (change)="toggleDataType(dt.value)">
                  <span class="checkbox-label">{{ dt.label }}</span>
                  @if (dt.category === 'especial') {
                    <span class="category-tag">categoría especial</span>
                  }
                </label>
              }
            </div>
          </div>
          <div class="form-group">
            <label class="vd-label">¿Hay transferencia internacional?</label>
            <select class="vd-select" [(ngModel)]="provider().international_transfer">
              <option [ngValue]="false">No</option>
              <option [ngValue]="true">Sí</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">¿Usa subencargados?</label>
            <select class="vd-select" [(ngModel)]="provider().uses_subprocessors">
              <option [ngValue]="false">No</option>
              <option [ngValue]="true">Sí</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Qualification Matrix -->
      <div class="vd-card">
        <div class="section-header">
          <h3>📊 Matriz de Calificación de Encargados</h3>
          <div class="score-display">
            <span class="total-score">{{ calculateTotalScore() }}/{{ calculateMaxPossible() }}</span>
            <span class="score-percentage">{{ calculatePercentage() }}%</span>
            <span class="vd-badge" [class]="'vd-badge-' + getQualificationLevel()">{{ getQualificationLabel() }}</span>
          </div>
        </div>

        <div class="matrix-container">
          <table class="vd-table qualification-table">
            <thead>
              <tr>
                <th style="width: 60px">ID</th>
                <th style="width: 110px">Bloque</th>
                <th>Control puntual</th>
                <th style="width: 200px">Evidencia mínima esperada</th>
                <th style="width: 100px">Criticidad</th>
                <th style="width: 120px">Respuesta</th>
                <th>Observación</th>
                <th style="width: 80px">Puntaje</th>
                <th style="width: 80px">Bloquea</th>
              </tr>
            </thead>
            <tbody>
              @for (control of controls(); track control.id) {
                <tr [class.blocking]="control.blocks && control.response === 'no'">
                  <td><strong>{{ control.code }}</strong></td>
                  <td>{{ control.block }}</td>
                  <td>{{ control.name }}</td>
                  <td><small>{{ control.evidence }}</small></td>
                  <td><span class="vd-badge" [class]="'vd-badge-' + control.criticality">{{ getCriticalityLabel(control.criticality) }}</span></td>
                  <td>
                    <select class="vd-select" [ngModel]="control.response" (ngModelChange)="updateControl(control.id, 'response', $event); calculateScore(control)">
                      <option value="">Seleccionar...</option>
                      <option value="si">✅ Sí cumple</option>
                      <option value="no">❌ No cumple</option>
                      <option value="na">⚪ No aplica</option>
                      <option value="parcial">⚠️ Parcial</option>
                    </select>
                  </td>
                  <td><input class="vd-input" [ngModel]="control.observation" (ngModelChange)="updateControl(control.id, 'observation', $event)" placeholder="Notas..."></td>
                  <td><span class="score">{{ control.score }}/{{ control.max_points }}</span></td>
                  <td>
                    @if (control.blocks && control.response === 'no') {
                      <span class="blocking-indicator">🚫</span>
                    } @else if (control.blocks) {
                      <span class="blocking-indicator-potential">⚠️</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Results -->
        <div class="qualification-results">
          <div class="result-section" [class.approved]="isApproved()">
            <h4>📋 Resultado de la Calificación</h4>
            <div class="result-summary">
              <div class="result-item">
                <span class="result-label">Calificación:</span>
                <span class="result-value vd-badge" [class]="'vd-badge-' + getQualificationLevel()">{{ getQualificationLabel() }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Puntaje:</span>
                <span class="result-value">{{ calculateTotalScore() }} / {{ calculateMaxPossible() }} ({{ calculatePercentage() }}%)</span>
              </div>
              <div class="result-item">
                <span class="result-label">Controles críticos sin cumplir:</span>
                <span class="result-value" [class.warning]="getBlockingControls() > 0">{{ getBlockingControls() }}</span>
              </div>
            </div>
            <div class="result-counts">
              <span class="count-item">NO Críticos: <strong [class.warning]="getNoCriticos() > 0">{{ getNoCriticos() }}</strong></span>
              <span class="count-item">NO Mayores: <strong [class.warning-medium]="getNoMayores() > 0">{{ getNoMayores() }}</strong></span>
              <span class="count-item">NO Menores: <strong>{{ getNoMenores() }}</strong></span>
            </div>

            @if (getQualificationLevel() === 'rechazado') {
              <div class="alert alert-danger">
                <strong>🚫 PROVEEDOR NO APROBADO</strong>
                <p>No se puede contratar hasta que remedie los puntos críticos señalados.</p>
              </div>
            } @else if (getQualificationLevel() === 'condicional') {
              <div class="alert alert-warning">
                <strong>⚠️ APROBACIÓN CONDICIONAL</strong>
                <p>Puede contratarse solo con plan de acción y plazo de cierre.</p>
              </div>
            } @else if (getQualificationLevel() === 'aprobado') {
              <div class="alert alert-success">
                <strong>✅ PROVEEDOR APROBADO</strong>
                <p>Cumple con los requisitos mínimos para el tratamiento.</p>
              </div>
            }
          </div>
        </div>

        <div class="action-buttons">
          <button class="vd-btn vd-btn-primary" (click)="saveQualification()" [disabled]="saving()">
            {{ saving() ? '💾 Guardando...' : '💾 Guardar Calificación' }}
          </button>
          <button class="vd-btn vd-btn-secondary" (click)="generateReport()" [disabled]="!currentQualificationId() || generatingReport()">
            {{ generatingReport() ? '📄 Generando...' : '📄 Generar Informe' }}
          </button>
        </div>
      </div>

      <!-- History -->
      <div class="vd-card">
        <h3>📚 Histórico de Calificaciones</h3>
        <div class="history-list">
          @if (qualificationHistory().length === 0) {
            <div class="empty-state">
              <p>No hay calificaciones guardadas aún. Complete la evaluación y haga clic en "Guardar Calificación".</p>
            </div>
          }
          @for (item of qualificationHistory(); track item.id) {
            <div class="history-item" [class.active]="currentQualificationId() === item.id">
              <div class="history-info">
                <strong>{{ item.provider_name }}</strong>
                <span class="history-service">{{ item.service }}</span>
              </div>
              <div class="history-meta">
                <span class="vd-badge" [class]="'vd-badge-' + item.result">{{ (item.result || 'pendiente') | uppercase }}</span>
                <span>{{ item.total_score }}/{{ item.max_score }}</span>
                <span>{{ item.created_at | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="history-actions">
                <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="viewQualification(item.id)">Ver</button>
                <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="downloadHistoryReport(item.id)">📄 Informe</button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tools-container { max-width: 1400px; margin: 0 auto; }
    .tools-header { margin-bottom: 1.5rem; }
    .header-title { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .tools-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0; }
    .project-badge { background: rgba(86,135,243,0.1); color: #5687f3; padding: 0.375rem 0.75rem; border-radius: 20px; font-size: 0.875rem; font-weight: 500; border: 1px solid rgba(86,135,243,0.2); }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 0.5rem; }
    .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group-full { grid-column: 1 / -1; }
    .checkbox-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
    .checkbox-item {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer;
      font-size: 0.875rem; transition: all 0.15s ease;
    }
    .checkbox-item:hover { background: #edf2f7; border-color: #cbd5e0; }
    .checkbox-item.special { border-left: 3px solid #e53e3e; }
    .checkbox-item input[type="checkbox"] { accent-color: #5687f3; width: 16px; height: 16px; }
    .checkbox-label { flex: 1; color: #2d3748; }
    .category-tag {
      font-size: 0.65rem; background: rgba(239,68,68,0.1); color: #dc2626;
      padding: 2px 6px; border-radius: 4px; white-space: nowrap;
    }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
    .section-header h3 { margin: 0; }
    .score-display { display: flex; align-items: center; gap: 1rem; }
    .total-score { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .score-percentage { font-size: 1.25rem; color: #5687f3; font-weight: 600; }
    .matrix-container { overflow-x: auto; }
    .qualification-table { min-width: 1200px; }
    .qualification-table th { font-size: 0.75rem; background: #f8fafc; }
    .qualification-table td { padding: 0.75rem; font-size: 0.875rem; }
    .qualification-table tr.blocking { background: rgba(239,68,68,0.05); }
    .vd-badge-critico { background: rgba(127,29,29,0.15); color: #991b1b; font-weight: 600; }
    .vd-badge-mayor { background: rgba(86,135,243,0.1); color: #5687f3; }
    .vd-badge-menor { background: rgba(100,116,139,0.1); color: #64748b; }
    .vd-badge-aprobado { background: rgba(34,197,94,0.1); color: #16a34a; }
    .vd-badge-condicional { background: rgba(245,158,11,0.1); color: #d97706; }
    .vd-badge-rechazado { background: rgba(239,68,68,0.1); color: #dc2626; }
    .vd-badge-pendiente { background: rgba(100,116,139,0.1); color: #64748b; }
    .score { font-weight: 600; color: #5687f3; }
    .blocking-indicator { font-size: 1.25rem; }
    .blocking-indicator-potential { font-size: 1rem; opacity: 0.5; }
    .qualification-results { margin-top: 1.5rem; padding: 1.5rem; background: #f8fafc; border-radius: 8px; }
    .result-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
    .result-item { display: flex; flex-direction: column; }
    .result-label { font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem; }
    .result-value { font-size: 1.125rem; font-weight: 600; }
    .result-counts { display: flex; gap: 1.5rem; padding: 0.75rem 0; border-top: 1px solid #e2e8f0; margin-top: 0.5rem; }
    .count-item { font-size: 0.875rem; color: #64748b; }
    .warning { color: #dc2626; }
    .warning-medium { color: #d97706; }
    .alert { padding: 1rem; border-radius: 8px; margin-top: 1rem; }
    .alert-success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); color: #16a34a; }
    .alert-warning { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #d97706; }
    .alert-danger { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #dc2626; }
    .action-buttons { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
    .history-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .history-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 8px; flex-wrap: wrap; gap: 0.5rem; border: 2px solid transparent; transition: border-color 0.2s; }
    .history-item.active { border-color: #5687f3; background: rgba(86,135,243,0.05); }
    .history-info { display: flex; flex-direction: column; flex: 1; }
    .history-service { font-size: 0.75rem; color: #64748b; }
    .history-meta { display: flex; gap: 0.75rem; align-items: center; }
    .history-actions { display: flex; gap: 0.5rem; }
    .empty-state { padding: 2rem; text-align: center; color: #94a3b8; font-size: 0.875rem; }
    @media (max-width: 1024px) { .form-grid { grid-template-columns: repeat(2, 1fr); } .result-summary { grid-template-columns: 1fr; } .checkbox-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .checkbox-grid { grid-template-columns: 1fr; } }
  `],
})
export class OfficerQualificationComponent implements OnInit {
  projectId = signal<number | null>(null);
  provider = signal<any>({
    name: '',
    service: '',
    requesting_area: '',
    data_types: [] as string[],
    international_transfer: false,
    uses_subprocessors: false
  });

  dataTypeOptions: DataTypeOption[] = [
    { value: 'identificativos', label: 'Datos identificativos' },
    { value: 'contacto', label: 'Datos de contacto (identificativos)' },
    { value: 'financieros', label: 'Datos financieros' },
    { value: 'laborales', label: 'Datos laborales o profesionales' },
    { value: 'academicos', label: 'Datos académicos' },
    { value: 'comportamiento_digital', label: 'Datos de comportamiento digital' },
    { value: 'sensibles', label: 'Datos sensibles', category: 'especial' },
    { value: 'salud', label: 'Datos de salud', category: 'especial' },
    { value: 'biometricos', label: 'Datos biométricos', category: 'especial' },
    { value: 'menores', label: 'Datos de niños, niñas o adolescentes' },
    { value: 'judiciales', label: 'Datos judiciales o infracciones' },
    { value: 'dataset_mixto', label: 'Conjunto de datos personales (dataset mixto)' },
  ];

  controls = signal<any[]>([
    { id: 1, code: 'C-01', block: 'Gobierno', name: 'Mantiene una política de protección de datos personales vigente.', evidence: 'Política, manual o lineamiento formal.', criticality: 'mayor', max_points: 15, response: '', observation: '', score: 0, blocks: false },
    { id: 2, code: 'C-02', block: 'Gobierno', name: 'Mantiene un acuerdo de encargo de tratamiento o acepta suscribirlo antes de contratar.', evidence: 'Contrato, DPA, cláusula aceptada o correo formal.', criticality: 'critico', max_points: 30, response: '', observation: '', score: 0, blocks: true },
    { id: 3, code: 'C-03', block: 'Confidencialidad', name: 'Mantiene acuerdos o cláusulas de confidencialidad con sus empleados o personal con acceso a datos.', evidence: 'NDA, cláusula laboral, reglamento o compromiso firmado.', criticality: 'critico', max_points: 30, response: '', observation: '', score: 0, blocks: true },
    { id: 4, code: 'C-04', block: 'Derechos', name: 'Tiene política o procedimiento para atención de derechos de titulares y apoyo al responsable.', evidence: 'Procedimiento, política o instructivo.', criticality: 'mayor', max_points: 15, response: '', observation: '', score: 0, blocks: false },
    { id: 5, code: 'C-05', block: 'Incidentes', name: 'Tiene política o procedimiento de notificación y gestión de brechas de seguridad.', evidence: 'Procedimiento de incidentes, playbook o política.', criticality: 'critico', max_points: 30, response: '', observation: '', score: 0, blocks: true },
    { id: 6, code: 'C-06', block: 'Acceso', name: 'Tiene control de accesos para que solo personal autorizado trate los datos.', evidence: 'Procedimiento, matriz de accesos o configuración del sistema.', criticality: 'critico', max_points: 30, response: '', observation: '', score: 0, blocks: true },
    { id: 7, code: 'C-07', block: 'Acceso', name: 'Mantiene registro básico de usuarios, perfiles o trazabilidad de accesos.', evidence: 'Matriz, registro de usuarios, bitácora o evidencia del sistema.', criticality: 'mayor', max_points: 15, response: '', observation: '', score: 0, blocks: false },
    { id: 8, code: 'C-08', block: 'Continuidad', name: 'Realiza respaldos o cuenta con medidas básicas de continuidad y recuperación.', evidence: 'Procedimiento, evidencia de backup o servicio contratado.', criticality: 'mayor', max_points: 15, response: '', observation: '', score: 0, blocks: false },
    { id: 9, code: 'C-09', block: 'Terceros', name: 'Regula el uso de subencargados y no los utiliza sin autorización o control del responsable.', evidence: 'Cláusula contractual, procedimiento o listado controlado.', criticality: 'critico', max_points: 30, response: '', observation: '', score: 0, blocks: true },
    { id: 10, code: 'C-10', block: 'Ciclo de vida', name: 'Puede devolver, eliminar o bloquear los datos al finalizar el servicio.', evidence: 'Procedimiento, cláusula contractual o respuesta formal.', criticality: 'critico', max_points: 30, response: '', observation: '', score: 0, blocks: true },
    { id: 11, code: 'C-11', block: 'Ciclo de vida', name: 'Define plazo o criterio de conservación de la información que trata por cuenta del responsable.', evidence: 'Política, matriz de conservación o procedimiento.', criticality: 'mayor', max_points: 15, response: '', observation: '', score: 0, blocks: false },
    { id: 12, code: 'C-12', block: 'Transferencias', name: 'Identifica transferencias internacionales y puede aplicar salvaguardas cuando correspondan.', evidence: 'Mapa de hosting, contrato, DPA o respuesta formal.', criticality: 'critico', max_points: 30, response: '', observation: '', score: 0, blocks: true },
    { id: 13, code: 'C-13', block: 'Gestión', name: 'Tiene un punto de contacto responsable para privacidad, seguridad o incidentes.', evidence: 'Nombre, cargo y correo del contacto.', criticality: 'menor', max_points: 5, response: '', observation: '', score: 0, blocks: false },
    { id: 14, code: 'C-14', block: 'Capacitación', name: 'Capacita o instruye al personal con acceso a datos sobre confidencialidad y manejo de información.', evidence: 'Registro de capacitación, inducción o política firmada.', criticality: 'mayor', max_points: 15, response: '', observation: '', score: 0, blocks: false },
  ]);

  qualificationHistory = signal<any[]>([]);
  currentQualificationId = signal<number | null>(null);
  saving = signal(false);
  generatingReport = signal(false);

  private pdpToolsService = inject(PdpToolsService);
  private route = inject(ActivatedRoute);
  private modal = inject(ModalService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const pid = params['project_id'];
      if (pid) this.projectId.set(parseInt(pid, 10));
    });
    this.loadHistory();
  }

  // Data Type multiselect
  isDataTypeSelected(value: string): boolean {
    return (this.provider().data_types || []).includes(value);
  }

  toggleDataType(value: string): void {
    const current = [...(this.provider().data_types || [])];
    const index = current.indexOf(value);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(value);
    }
    this.provider.update(p => ({ ...p, data_types: current }));
  }

  // Scoring
  calculateScore(control: any): void {
    const maxPts = control.max_points || 15;
    const newScore = control.response === 'si' ? maxPts
      : control.response === 'parcial' ? Math.round(maxPts / 2)
      : 0;

    // Update the control in the signal with new score
    this.controls.update(ctrls =>
      ctrls.map(c => c.id === control.id ? { ...c, score: newScore } : c)
    );
  }

  recalculateAllScores(): void {
    this.controls.update(ctrls =>
      ctrls.map(c => {
        if (c.response === 'na' || c.response === '') {
          return { ...c, score: 0 };
        }
        const maxPts = c.max_points || 15;
        const newScore = c.response === 'si' ? maxPts
          : c.response === 'parcial' ? Math.round(maxPts / 2)
          : 0;
        return { ...c, score: newScore };
      })
    );
  }

  calculateTotalScore(): number {
    const applicable = this.controls().filter(c => c.response !== 'na' && c.response !== '');
    return applicable.reduce((sum, c) => sum + c.score, 0);
  }

  calculateMaxPossible(): number {
    const applicable = this.controls().filter(c => c.response !== 'na' && c.response !== '');
    if (applicable.length === 0) return 305;
    return applicable.reduce((sum, c) => sum + c.max_points, 0);
  }

  calculatePercentage(): number {
    const max = this.calculateMaxPossible();
    if (max === 0) return 0;
    return Math.round((this.calculateTotalScore() / max) * 100);
  }

  getQualificationLevel(): string {
    const percentage = this.calculatePercentage();
    const noCriticos = this.getNoCriticos();

    if (noCriticos > 0) return 'rechazado';
    if (percentage >= 80) return 'aprobado';
    if (percentage >= 60) return 'condicional';
    return 'rechazado';
  }

  getQualificationLabel(): string {
    const level = this.getQualificationLevel();
    return level === 'aprobado' ? 'APROBADO'
      : level === 'condicional' ? 'CONDICIONAL'
      : 'RECHAZADO';
  }

  getCriticalityLabel(criticality: string): string {
    return criticality === 'critico' ? 'CRÍTICO'
      : criticality === 'mayor' ? 'MAYOR'
      : criticality === 'menor' ? 'MENOR'
      : criticality.toUpperCase();
  }

  getBlockingControls(): number {
    return this.controls().filter(c => c.blocks && c.response === 'no').length;
  }

  getNoCriticos(): number {
    return this.controls().filter(c => c.criticality === 'critico' && c.response === 'no').length;
  }

  getNoMayores(): number {
    return this.controls().filter(c => c.criticality === 'mayor' && c.response === 'no').length;
  }

  getNoMenores(): number {
    return this.controls().filter(c => c.criticality === 'menor' && c.response === 'no').length;
  }

  isApproved(): boolean {
    return this.getQualificationLevel() !== 'rechazado';
  }

  // Save & History
  saveQualification(): void {
    if (!this.provider().name || !this.provider().service) {
      this.modal.warning('Campos requeridos', 'Debe completar al menos el nombre del proveedor y servicio contratado.');
      return;
    }
    if (!this.provider().data_types || this.provider().data_types.length === 0) {
      this.modal.warning('Campos requeridos', 'Debe seleccionar al menos un tipo de datos.');
      return;
    }

    this.saving.set(true);

    // Recalculate all scores before saving
    this.recalculateAllScores();

    const data = {
      provider_name: this.provider().name,
      service: this.provider().service,
      requesting_area: this.provider().requesting_area,
      data_types: this.provider().data_types,
      international_transfer: this.provider().international_transfer,
      uses_subprocessors: this.provider().uses_subprocessors,
      controls: this.controls().map(c => ({
        code: c.code,
        response: c.response,
        observation: c.observation,
        score: c.score,
      }))
    };

    this.pdpToolsService.createOfficerQualification(data).subscribe({
      next: (res: any) => {
        this.currentQualificationId.set(res.id);
        // Update controls with server data including scores
        if (res.controls) {
          this.controls.set(res.controls.map((c: any) => ({
            ...c,
            blocks: !!c.blocks,
            score: typeof c.score === 'number' ? c.score : 0,
          })));
        }
        this.modal.success('Calificación guardada', 'La calificación del encargado se guardó exitosamente.');
        this.loadHistory();
        this.saving.set(false);
      },
      error: (err: any) => {
        this.modal.error('Error al guardar', err.error?.message || err.message);
        this.saving.set(false);
      }
    });
  }

  loadHistory(): void {
    const params: any = {};
    if (this.projectId()) {
      params.project_id = this.projectId();
    }
    this.pdpToolsService.getOfficerQualifications(params).subscribe({
      next: (res: any) => {
        this.qualificationHistory.set(res.data || []);
      },
      error: (err: any) => console.error('Error loading qualifications:', err)
    });
  }

  viewQualification(id: number): void {
    this.pdpToolsService.getOfficerQualification(id).subscribe({
      next: (res: any) => {
        this.currentQualificationId.set(res.id);
        this.provider.set({
          name: res.provider_name,
          service: res.service,
          requesting_area: res.requesting_area,
          data_types: res.data_types || [],
          international_transfer: !!res.international_transfer,
          uses_subprocessors: !!res.uses_subprocessors,
        });
        // Map controls and ensure scores are numbers
        const mappedControls = (res.controls || []).map((c: any) => ({
          ...c,
          blocks: !!c.blocks,
          score: typeof c.score === 'number' ? c.score : 0,
        }));
        this.controls.set(mappedControls);
        // Recalculate to ensure UI is in sync
        this.recalculateAllScores();
      },
      error: (err: any) => this.modal.error('Error al cargar', err.error?.message || err.message)
    });
  }

  generateReport(): void {
    const id = this.currentQualificationId();
    if (!id) {
      this.modal.warning('Guardar primero', 'Debe guardar la calificación antes de generar el informe.');
      return;
    }
    this.generatingReport.set(true);
    this.pdpToolsService.generateQualificationReport(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Calificacion_Encargado_${this.provider().name || 'reporte'}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.generatingReport.set(false);
      },
      error: (err: any) => {
        this.modal.error('Error al generar informe', err.error?.message || err.message);
        this.generatingReport.set(false);
      }
    });
  }

  downloadHistoryReport(id: number): void {
    this.pdpToolsService.generateQualificationReport(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Calificacion_Encargado_${id}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => this.modal.error('Error al generar informe', err.error?.message || err.message)
    });
  }

  updateControl(controlId: number, field: string, value: any): void {
    this.controls.update(ctrls =>
      ctrls.map(c => c.id === controlId ? { ...c, [field]: value } : c)
    );
  }
}
