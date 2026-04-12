import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PdpToolsService } from '../pdp-tools.service';
import { ModalService } from '../../shared/modal.service';

// Transfer Qualification Component - Calificación de Transferencias Internacionales

interface DataTypeOption {
  value: string;
  label: string;
  category?: string;
}

@Component({
  selector: 'app-transfer-qualification',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <div class="tools-header">
        <div class="header-title">
          <h1>🌍 Transferencias Internacionales</h1>
          @if (projectId()) {
            <div class="project-badge">📁 Proyecto #{{ projectId() }}</div>
          }
        </div>
        <p class="tools-subtitle">Evaluación de transferencias según Art. 13 LOPDP</p>
      </div>

      <!-- Transfer Info -->
      <div class="vd-card">
        <h3>📋 Información de la Transferencia</h3>
        <div class="form-grid">
          <div class="form-group">
            <label class="vd-label">País de destino</label>
            <input class="vd-input" [ngModel]="transfer().destination_country" (ngModelChange)="updateTransfer('destination_country', $event)" placeholder="Ej: Estados Unidos, Colombia">
          </div>
          <div class="form-group">
            <label class="vd-label">Receptor / Encargado destino</label>
            <input class="vd-input" [ngModel]="transfer().recipient" (ngModelChange)="updateTransfer('recipient', $event)" placeholder="Nombre del receptor">
          </div>
          <div class="form-group">
            <label class="vd-label">Finalidad de la transferencia</label>
            <input class="vd-input" [ngModel]="transfer().purpose" (ngModelChange)="updateTransfer('purpose', $event)" placeholder="Ej: Hosting, procesamiento">
          </div>
          <div class="form-group form-group-full">
            <label class="vd-label">Categorías de datos transferidos</label>
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
        </div>
      </div>

      <!-- Qualification Matrix -->
      <div class="vd-card">
        <div class="section-header">
          <h3>📊 Matriz de Calificación de Transferencias Internacionales</h3>
          <div class="score-display">
            <span class="score-label">Resultado:</span>
            <span class="vd-badge" [class]="'vd-badge-' + getOverallResult()">{{ getOverallResult() | uppercase }}</span>
          </div>
        </div>

        <div class="instruction-box">
          <p><strong>Instrucción:</strong> Marcar Sí/No/No aplica y completar evidencia breve cuando sea necesario. <strong>Si falla un criterio crítico, la transferencia no se aprueba.</strong></p>
        </div>

        <div class="matrix-container">
          <table class="vd-table qualification-table">
            <thead>
              <tr>
                <th style="width: 50px">N°</th>
                <th>Criterio mínimo</th>
                <th style="width: 120px">Criticidad</th>
                <th style="width: 120px">Respuesta</th>
                <th>Evidencia mínima / nota</th>
                <th>Observación</th>
                <th style="width: 120px">Resultado</th>
              </tr>
            </thead>
            <tbody>
              @for (criterion of criteria(); track criterion.id) {
                <tr [class.failed]="criterion.response === 'no' && criterion.criticality === 'critica'">
                  <td><strong>{{ criterion.number }}</strong></td>
                  <td>{{ criterion.description }}</td>
                  <td>
                    <select class="vd-select criticality-select" [ngModel]="criterion.criticality" (ngModelChange)="updateCriterion(criterion.id, 'criticality', $event)">
                      <option value="critica">CRÍTICA</option>
                      <option value="alta">ALTA</option>
                      <option value="media">MEDIA</option>
                    </select>
                  </td>
                  <td>
                    <select class="vd-select" [ngModel]="criterion.response" (ngModelChange)="updateCriterion(criterion.id, 'response', $event)">
                      <option value="">Seleccionar...</option>
                      <option value="si">✅ Sí</option>
                      <option value="no">❌ No</option>
                      <option value="na">⚪ No aplica</option>
                    </select>
                  </td>
                  <td><input class="vd-input" [ngModel]="criterion.evidence" (ngModelChange)="updateCriterion(criterion.id, 'evidence', $event)" placeholder="Describa la evidencia..."></td>
                  <td><input class="vd-input" [ngModel]="criterion.observation" (ngModelChange)="updateCriterion(criterion.id, 'observation', $event)" placeholder="Observación..."></td>
                  <td>
                    @if (criterion.response) {
                      <span class="vd-badge" [class]="'vd-badge-' + getCriterionResult(criterion)">
                        {{ getCriterionResultLabel(criterion) }}
                      </span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Results -->
        <div class="qualification-results" [class]="'result-' + getOverallResult()">
          <h4>📋 Resultado de la Evaluación</h4>

          <div class="result-summary">
            <div class="result-item">
              <span class="result-label">Total criterios evaluados:</span>
              <span class="result-value">{{ getEvaluatedCount() }} / {{ criteria().length }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">Criterios cumplidos (Sí):</span>
              <span class="result-value success">{{ getPassedSiCount() }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">No aplica:</span>
              <span class="result-value">{{ getNaCount() }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">Criterios fallidos (No):</span>
              <span class="result-value" [class.danger]="getFailedCount() > 0">{{ getFailedCount() }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">Críticos fallidos:</span>
              <span class="result-value" [class.danger]="getFailedCriticalCount() > 0">{{ getFailedCriticalCount() }}</span>
            </div>
          </div>

          @if (getOverallResult() === 'aprobado') {
            <div class="alert alert-success">
              <strong>✅ TRANSFERENCIA APROBADA</strong>
              <p>La transferencia cumple con los requisitos mínimos establecidos en la LOPDP.</p>
            </div>
          } @else if (getOverallResult() === 'rechazado') {
            <div class="alert alert-danger">
              <strong>🚫 TRANSFERENCIA NO APROBADA</strong>
              <p>No se puede realizar la transferencia hasta que se subsanen los criterios críticos marcados en rojo.</p>
            </div>
          } @else if (getOverallResult() === 'condicional') {
            <div class="alert alert-warning">
              <strong>⚠️ APROBACIÓN CONDICIONAL</strong>
              <p>La transferencia puede realizarse con un plan de acción y plazo de cierre para los criterios no cumplidos.</p>
            </div>
          } @else {
            <div class="alert alert-info">
              <strong>⚠️ EVALUACIÓN INCOMPLETA</strong>
              <p>Complete todos los criterios para obtener el resultado final.</p>
            </div>
          }
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
        <h3>📚 Histórico de Transferencias Evaluadas</h3>
        <div class="history-list">
          @if (qualificationHistory().length === 0) {
            <div class="empty-state">
              <p>No hay calificaciones de transferencia guardadas. Complete la evaluación y haga clic en "Guardar Calificación".</p>
            </div>
          }
          @for (item of qualificationHistory(); track item.id) {
            <div class="history-item" [class.active]="currentQualificationId() === item.id">
              <div class="history-info">
                <strong>{{ item.destination_country }}</strong>
                <span class="history-recipient">{{ item.recipient }}</span>
              </div>
              <div class="history-meta">
                <span class="vd-badge" [class]="'vd-badge-' + (item.result || 'pendiente')">{{ (item.result || 'pendiente') | uppercase }}</span>
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
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem; }
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
    .score-display { display: flex; align-items: center; gap: 0.75rem; }
    .score-label { color: #64748b; font-size: 0.875rem; }
    .instruction-box { background: rgba(86,135,243,0.05); border-left: 4px solid #5687f3; padding: 1rem; margin-bottom: 1rem; border-radius: 0 8px 8px 0; }
    .instruction-box p { margin: 0; font-size: 0.875rem; color: #334155; }
    .matrix-container { overflow-x: auto; }
    .qualification-table { min-width: 1100px; }
    .qualification-table th { font-size: 0.75rem; background: #f8fafc; }
    .qualification-table td { padding: 0.75rem; font-size: 0.875rem; }
    .qualification-table tr.failed { background: rgba(239,68,68,0.05); }
    .criticality-select { font-size: 0.75rem; padding: 0.25rem 0.5rem; font-weight: 600; }
    .vd-badge-critica { background: rgba(127,29,29,0.15); color: #991b1b; font-weight: 600; }
    .vd-badge-alta { background: rgba(239,68,68,0.1); color: #dc2626; }
    .vd-badge-media { background: rgba(245,158,11,0.1); color: #d97706; }
    .vd-badge-aprobado { background: rgba(34,197,94,0.1); color: #16a34a; }
    .vd-badge-rechazado { background: rgba(239,68,68,0.1); color: #dc2626; }
    .vd-badge-condicional { background: rgba(245,158,11,0.1); color: #d97706; }
    .vd-badge-pendiente { background: rgba(100,116,139,0.1); color: #64748b; }
    .vd-badge-cumple { background: rgba(34,197,94,0.1); color: #16a34a; }
    .vd-badge-no-cumple { background: rgba(239,68,68,0.1); color: #dc2626; }
    .vd-badge-no-aplica { background: rgba(100,116,139,0.1); color: #64748b; }
    .qualification-results { margin-top: 1.5rem; padding: 1.5rem; background: #f8fafc; border-radius: 8px; }
    .result-aprobado { border-left: 4px solid #22c55e; }
    .result-rechazado { border-left: 4px solid #ef4444; }
    .result-condicional { border-left: 4px solid #f59e0b; }
    .result-pendiente { border-left: 4px solid #94a3b8; }
    .result-summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 1rem; }
    .result-item { display: flex; flex-direction: column; }
    .result-label { font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem; }
    .result-value { font-size: 1.125rem; font-weight: 600; }
    .success { color: #16a34a; }
    .danger { color: #dc2626; }
    .alert { padding: 1rem; border-radius: 8px; margin-top: 1rem; }
    .alert-success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); color: #16a34a; }
    .alert-danger { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #dc2626; }
    .alert-warning { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #d97706; }
    .alert-info { background: rgba(100,116,139,0.1); border: 1px solid rgba(100,116,139,0.2); color: #64748b; }
    .action-buttons { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
    .history-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .history-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 8px; flex-wrap: wrap; gap: 0.5rem; border: 2px solid transparent; transition: border-color 0.2s; }
    .history-item.active { border-color: #5687f3; background: rgba(86,135,243,0.05); }
    .history-info { display: flex; flex-direction: column; flex: 1; }
    .history-recipient { font-size: 0.75rem; color: #64748b; }
    .history-meta { display: flex; gap: 0.75rem; align-items: center; }
    .history-actions { display: flex; gap: 0.5rem; }
    .empty-state { padding: 2rem; text-align: center; color: #94a3b8; font-size: 0.875rem; }
    @media (max-width: 1024px) { .result-summary { grid-template-columns: repeat(3, 1fr); } .checkbox-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .checkbox-grid { grid-template-columns: 1fr; } .result-summary { grid-template-columns: 1fr; } }
  `],
})
export class TransferQualificationComponent implements OnInit {
  projectId = signal<number | null>(null);
  transfer = signal<any>({
    destination_country: '',
    recipient: '',
    purpose: '',
    data_categories_list: [] as string[]
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

  criteria = signal<any[]>([
    { id: 1, number: 1, description: 'La transferencia está claramente identificada y delimitada.', criticality: 'critica', response: '', evidence: '', observation: '' },
    { id: 2, number: 2, description: 'El país de destino y el receptor están identificados.', criticality: 'critica', response: '', evidence: '', observation: '' },
    { id: 3, number: 3, description: 'La finalidad de la transferencia está documentada.', criticality: 'critica', response: '', evidence: '', observation: '' },
    { id: 4, number: 4, description: 'La transferencia es necesaria y proporcional.', criticality: 'critica', response: '', evidence: '', observation: '' },
    { id: 5, number: 5, description: 'Existe base jurídica válida para el tratamiento y la transferencia.', criticality: 'critica', response: '', evidence: '', observation: '' },
    { id: 6, number: 6, description: 'El rol del receptor está delimitado (encargado, responsable, destinatario, etc.).', criticality: 'critica', response: '', evidence: '', observation: '' },
    { id: 7, number: 7, description: 'Existe contrato o cláusula PDP aplicable antes de transferir.', criticality: 'critica', response: '', evidence: '', observation: '' },
    { id: 8, number: 8, description: 'Se verificaron garantías mínimas del receptor.', criticality: 'critica', response: '', evidence: '', observation: '' },
    { id: 9, number: 9, description: 'Existen medidas de seguridad adecuadas al riesgo.', criticality: 'alta', response: '', evidence: '', observation: '' },
    { id: 10, number: 10, description: 'Se regulan subencargados o transferencias ulteriores.', criticality: 'alta', response: '', evidence: '', observation: '' },
    { id: 11, number: 11, description: 'Existen reglas sobre conservación, retorno o eliminación.', criticality: 'media', response: '', evidence: '', observation: '' },
    { id: 12, number: 12, description: 'Existe ruta de incidentes y notificación.', criticality: 'alta', response: '', evidence: '', observation: '' },
    { id: 13, number: 13, description: 'Se informó o se puede informar al titular cuando corresponda.', criticality: 'alta', response: '', evidence: '', observation: '' },
    { id: 14, number: 14, description: 'Se prevé ejercicio de derechos y cooperación del receptor.', criticality: 'alta', response: '', evidence: '', observation: '' },
    { id: 15, number: 15, description: 'Se evaluó si requiere riesgos reforzados o EIPD.', criticality: 'critica', response: '', evidence: '', observation: '' },
  ]);

  qualificationHistory = signal<any[]>([]);
  currentQualificationId = signal<number | null>(null);
  saving = signal(false);
  generatingReport = signal(false);

  private pdpToolsService = inject(PdpToolsService);
  private modalService = inject(ModalService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const pid = params['project_id'];
      if (pid) this.projectId.set(parseInt(pid, 10));
    });
    this.loadHistory();
  }

  // Data Type multiselect
  isDataTypeSelected(value: string): boolean {
    return (this.transfer().data_categories_list || []).includes(value);
  }

  toggleDataType(value: string): void {
    const current = [...(this.transfer().data_categories_list || [])];
    const index = current.indexOf(value);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(value);
    }
    this.transfer.update(t => ({ ...t, data_categories_list: current }));
  }

  // Criterion result — N/A is now "No aplica", not "Cumple"
  getCriterionResult(criterion: any): string {
    if (!criterion.response) return '';
    if (criterion.response === 'si') return 'cumple';
    if (criterion.response === 'na') return 'no-aplica';
    return 'no-cumple';
  }

  getCriterionResultLabel(criterion: any): string {
    const result = this.getCriterionResult(criterion);
    if (!criterion.response) return '';
    return result === 'cumple' ? '✅ CUMPLE'
      : result === 'no-aplica' ? '⚪ NO APLICA'
      : '❌ NO CUMPLE';
  }

  getOverallResult(): string {
    const evaluated = this.criteria().filter(c => c.response !== '');
    if (evaluated.length === 0) return 'pendiente';

    const failedCritical = this.criteria().filter(c => c.criticality === 'critica' && c.response === 'no').length;
    if (failedCritical > 0) return 'rechazado';

    const failedAlta = this.criteria().filter(c => c.criticality === 'alta' && c.response === 'no').length;
    if (failedAlta > 0) return 'condicional';

    const failedAny = this.criteria().filter(c => c.response === 'no').length;
    if (failedAny > 0) return 'condicional';

    // All evaluated criteria are si or na
    return 'aprobado';
  }

  getEvaluatedCount(): number {
    return this.criteria().filter(c => c.response !== '').length;
  }

  getPassedSiCount(): number {
    return this.criteria().filter(c => c.response === 'si').length;
  }

  getNaCount(): number {
    return this.criteria().filter(c => c.response === 'na').length;
  }

  getFailedCount(): number {
    return this.criteria().filter(c => c.response === 'no').length;
  }

  getFailedCriticalCount(): number {
    return this.criteria().filter(c => c.criticality === 'critica' && c.response === 'no').length;
  }

  // Save
  saveQualification(): void {
    if (!this.transfer().destination_country || !this.transfer().recipient) {
      this.modalService.warning('Validación', 'Debe completar al menos el país de destino y receptor.');
      return;
    }
    if (!this.transfer().data_categories_list || this.transfer().data_categories_list.length === 0) {
      this.modalService.warning('Validación', 'Debe seleccionar al menos una categoría de datos.');
      return;
    }

    this.saving.set(true);

    const data = {
      project_id: this.projectId(),
      destination_country: this.transfer().destination_country,
      recipient: this.transfer().recipient,
      purpose: this.transfer().purpose,
      data_categories_list: this.transfer().data_categories_list,
      criteria: this.criteria().map(c => ({
        number: c.number,
        criticality: c.criticality,
        response: c.response || null,
        evidence: c.evidence,
        observation: c.observation,
      }))
    };

    this.pdpToolsService.createTransferQualification(data).subscribe({
      next: (res: any) => {
        this.currentQualificationId.set(res.id);
        if (res.criteria) {
          this.criteria.set(res.criteria);
        }
        this.modalService.success('Éxito', 'Calificación guardada exitosamente');
        this.loadHistory();
        this.saving.set(false);
      },
      error: (err: any) => {
        this.modalService.error('Error', 'Error al guardar: ' + (err.error?.message || err.message));
        this.saving.set(false);
      }
    });
  }

  loadHistory(): void {
    const params: any = {};
    if (this.projectId()) {
      params.project_id = this.projectId();
    }
    this.pdpToolsService.getTransferQualifications(params).subscribe({
      next: (res: any) => {
        this.qualificationHistory.set(res.data || []);
      },
      error: (err: any) => console.error('Error loading qualifications:', err)
    });
  }

  viewQualification(id: number): void {
    this.pdpToolsService.getTransferQualification(id).subscribe({
      next: (res: any) => {
        this.currentQualificationId.set(res.id);
        this.transfer.set({
          destination_country: res.destination_country,
          recipient: res.recipient,
          purpose: res.purpose,
          data_categories_list: res.data_categories_list || [],
        });
        this.criteria.set(res.criteria || []);
      },
      error: (err: any) => this.modalService.error('Error', 'Error al cargar: ' + (err.error?.message || err.message))
    });
  }

  generateReport(): void {
    const id = this.currentQualificationId();
    if (!id) {
      this.modalService.warning('Atención', 'Debe guardar la calificación primero.');
      return;
    }
    this.generatingReport.set(true);
    this.pdpToolsService.generateTransferReport(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Calificacion_Transferencia_${this.transfer().destination_country || 'reporte'}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.generatingReport.set(false);
      },
      error: (err: any) => {
        this.modalService.error('Error', 'Error al generar informe: ' + (err.error?.message || err.message));
        this.generatingReport.set(false);
      }
    });
  }

  downloadHistoryReport(id: number): void {
    this.pdpToolsService.generateTransferReport(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Calificacion_Transferencia_${id}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => this.modalService.error('Error', 'Error al generar informe: ' + (err.error?.message || err.message))
    });
  }

  updateTransfer(field: string, value: any): void {
    this.transfer.update(t => ({ ...t, [field]: value }));
  }

  updateCriterion(id: number, field: string, value: any): void {
    this.criteria.update(crits =>
      crits.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  }
}
