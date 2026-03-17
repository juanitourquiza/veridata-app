import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdpToolsService } from '../pdp-tools.service';

// Officer Qualification Component - Calificación de Encargados del Tratamiento

@Component({
  selector: 'app-officer-qualification',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <header class="tools-header">
        <h1>⭐ Calificación de Encargados del Tratamiento</h1>
        <p class="tools-subtitle">Evaluación de proveedores y encargados según matriz de calificación LOPDP Ecuador</p>
      </header>

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
          <div class="form-group">
            <label class="vd-label">Tipo de datos</label>
            <select class="vd-select" [(ngModel)]="provider().data_type">
              <option value="generales">Datos generales</option>
              <option value="financieros">Datos financieros</option>
              <option value="sensibles">Datos sensibles</option>
              <option value="menores">Datos de niños/adolescentes</option>
            </select>
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
            <span class="total-score">{{ calculateTotalScore() }}/{{ maxScore }}</span>
            <span class="score-percentage">{{ calculatePercentage() }}%</span>
            <span class="vd-badge" [class]="'vd-badge-' + getQualificationLevel()">{{ getQualificationLevel() | uppercase }}</span>
          </div>
        </div>

        <div class="matrix-container">
          <table class="vd-table qualification-table">
            <thead>
              <tr>
                <th style="width: 60px">ID</th>
                <th style="width: 100px">Bloque</th>
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
                  <td><span class="vd-badge" [class]="'vd-badge-' + control.criticality">{{ control.criticality | uppercase }}</span></td>
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
                  <td><span class="score">{{ control.score }}</span></td>
                  <td>
                    @if (control.blocks && control.response === 'no') {
                      <span class="blocking-indicator">🚫</span>
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
                <span class="result-value vd-badge" [class]="'vd-badge-' + getQualificationLevel()">{{ getQualificationLevel() | uppercase }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Puntaje:</span>
                <span class="result-value">{{ calculateTotalScore() }} / {{ maxScore }} ({{ calculatePercentage() }}%)</span>
              </div>
              <div class="result-item">
                <span class="result-label">Controles críticos sin cumplir:</span>
                <span class="result-value" [class.warning]="getBlockingControls() > 0">{{ getBlockingControls() }}</span>
              </div>
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
          <button class="vd-btn vd-btn-primary" (click)="generateReport()">📄 Generar Informe</button>
          <button class="vd-btn vd-btn-secondary" (click)="saveQualification()">💾 Guardar Calificación</button>
        </div>
      </div>

      <!-- History -->
      <div class="vd-card">
        <h3>📚 Histórico de Calificaciones</h3>
        <div class="history-list">
          @for (item of qualificationHistory(); track item.id) {
            <div class="history-item">
              <div class="history-info">
                <strong>{{ item.provider_name }}</strong>
                <span class="history-service">{{ item.service }}</span>
              </div>
              <div class="history-meta">
                <span class="vd-badge" [class]="'vd-badge-' + item.result">{{ item.result | uppercase }}</span>
                <span>{{ item.score }}%</span>
                <span>{{ item.date | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="history-actions">
                <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="viewQualification(item.id)">Ver</button>
                <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="compareQualification(item.id)">Comparar</button>
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
    .tools-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0 0 0.5rem; }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; }
    .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
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
    .vd-badge-alto { background: rgba(239,68,68,0.1); color: #dc2626; }
    .vd-badge-critico { background: rgba(127,29,29,0.15); color: #991b1b; font-weight: 600; }
    .vd-badge-medio { background: rgba(245,158,11,0.1); color: #d97706; }
    .vd-badge-mayor { background: rgba(86,135,243,0.1); color: #5687f3; }
    .vd-badge-aprobado { background: rgba(34,197,94,0.1); color: #16a34a; }
    .vd-badge-condicional { background: rgba(245,158,11,0.1); color: #d97706; }
    .vd-badge-rechazado { background: rgba(239,68,68,0.1); color: #dc2626; }
    .score { font-weight: 600; color: #5687f3; }
    .blocking-indicator { font-size: 1.25rem; }
    .qualification-results { margin-top: 1.5rem; padding: 1.5rem; background: #f8fafc; border-radius: 8px; }
    .result-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
    .result-item { display: flex; flex-direction: column; }
    .result-label { font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem; }
    .result-value { font-size: 1.125rem; font-weight: 600; }
    .warning { color: #dc2626; }
    .alert { padding: 1rem; border-radius: 8px; margin-top: 1rem; }
    .alert-success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); color: #16a34a; }
    .alert-warning { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #d97706; }
    .alert-danger { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #dc2626; }
    .action-buttons { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
    .history-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .history-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 8px; flex-wrap: wrap; gap: 0.5rem; }
    .history-info { display: flex; flex-direction: column; flex: 1; }
    .history-service { font-size: 0.75rem; color: #64748b; }
    .history-meta { display: flex; gap: 0.75rem; align-items: center; }
    .history-actions { display: flex; gap: 0.5rem; }
    @media (max-width: 1024px) { .form-grid { grid-template-columns: repeat(2, 1fr); } .result-summary { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class OfficerQualificationComponent implements OnInit {
  provider = signal<any>({
    name: '',
    service: '',
    requesting_area: '',
    data_type: 'generales',
    international_transfer: false,
    uses_subprocessors: false
  });

  controls = signal<any[]>([
    { id: 1, code: 'C-01', block: 'Gobierno', name: 'Mantiene una política de protección de datos personales vigente.', evidence: 'Política, manual o lineamiento formal.', criticality: 'mayor', response: '', observation: '', score: 0, blocks: false },
    { id: 2, code: 'C-02', block: 'Gobierno', name: 'Mantiene un acuerdo de encargo de tratamiento o acepta suscribirlo antes de contratar.', evidence: 'Contrato, DPA, cláusula aceptada o correo formal.', criticality: 'critico', response: '', observation: '', score: 0, blocks: true },
    { id: 3, code: 'C-03', block: 'Confidencialidad', name: 'Mantiene acuerdos o cláusulas de confidencialidad con sus empleados o personal con acceso a datos.', evidence: 'NDA, cláusula laboral, reglamento o compromiso firmado.', criticality: 'critico', response: '', observation: '', score: 0, blocks: true },
    { id: 4, code: 'C-04', block: 'Derechos', name: 'Tiene política o procedimiento para atención de derechos de titulares y apoyo al responsable.', evidence: 'Procedimiento, política o instructivo.', criticality: 'mayor', response: '', observation: '', score: 0, blocks: false },
    { id: 5, code: 'C-05', block: 'Seguridad', name: 'Tiene política o procedimiento de notificación y gestión de brechas de seguridad.', evidence: 'Procedimiento de incidentes, playbook o política.', criticality: 'critico', response: '', observation: '', score: 0, blocks: true },
    { id: 6, code: 'C-06', block: 'Acceso', name: 'Tiene control de accesos para que solo personal autorizado trate los datos.', evidence: 'Procedimiento, matriz de accesos o configuración del sistema.', criticality: 'critico', response: '', observation: '', score: 0, blocks: true },
    { id: 7, code: 'C-07', block: 'Acceso', name: 'Mantiene registro básico de usuarios, perfiles o trazabilidad de accesos.', evidence: 'Matriz, registro de usuarios, bitácora o evidencia del sistema.', criticality: 'mayor', response: '', observation: '', score: 0, blocks: false },
  ]);

  totalScore = signal(0);
  qualificationResult = signal<'aprobado' | 'condicional' | 'rechazado' | null>(null);
  qualificationHistory = signal<any[]>([]);

  private pdpToolsService = inject(PdpToolsService);

  maxScore = 100;

  ngOnInit(): void {
    this.loadHistory();
  }

  calculateScore(control: any): void {
    const scores: any = { 'si': 100, 'parcial': 50, 'no': 0, 'na': 100 };
    control.score = scores[control.response] || 0;
  }

  calculateTotalScore(): number {
    const applicable = this.controls().filter(c => c.response !== 'na' && c.response !== '');
    if (applicable.length === 0) return 0;
    const total = applicable.reduce((sum, c) => sum + c.score, 0);
    return Math.round(total / applicable.length);
  }

  calculatePercentage(): number {
    return this.calculateTotalScore();
  }

  getQualificationLevel(): string {
    const score = this.calculateTotalScore();
    const blocking = this.getBlockingControls();

    if (blocking > 0) return 'rechazado';
    if (score >= 90) return 'aprobado';
    if (score >= 70) return 'condicional';
    return 'rechazado';
  }

  getBlockingControls(): number {
    return this.controls().filter(c => c.blocks && c.response === 'no').length;
  }

  isApproved(): boolean {
    return this.getQualificationLevel() !== 'rechazado';
  }

  generateReport(): void {
    alert('Generando informe de calificación...');
    // TODO: Generate PDF with detailed analysis
  }

  saveQualification(): void {
    const data = {
      provider_name: this.provider().name,
      service: this.provider().service,
      requesting_area: this.provider().requesting_area,
      data_type: this.provider().data_type,
      controls: this.controls()
    };

    this.pdpToolsService.createOfficerQualification(data).subscribe({
      next: () => {
        alert('Calificación guardada');
        this.loadHistory();
      },
      error: (err: any) => alert('Error al guardar: ' + err.message)
    });
  }

  loadHistory(): void {
    this.pdpToolsService.getOfficerQualifications().subscribe({
      next: (res: any) => {
        this.qualificationHistory.set(res.data || []);
      },
      error: (err: any) => console.error('Error loading qualifications:', err)
    });
  }

  viewQualification(id: number): void {
    this.pdpToolsService.getOfficerQualification(id).subscribe({
      next: (res: any) => {
        this.provider.set({
          name: res.provider_name,
          service: res.service,
          requesting_area: res.requesting_area,
          data_type: res.data_type
        });
        this.controls.set(res.controls || []);
      },
      error: (err: any) => alert('Error al cargar: ' + err.message)
    });
  }

  compareQualification(id: number): void {
    // TODO: Show comparison
  }

  updateControl(controlId: number, field: string, value: any): void {
    this.controls.update(ctrls =>
      ctrls.map(c => c.id === controlId ? { ...c, [field]: value } : c)
    );
  }
}
