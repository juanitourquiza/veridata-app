import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdpToolsService } from '../pdp-tools.service';

// Transfer Qualification Component - Calificación de Transferencias Internacionales

@Component({
  selector: 'app-transfer-qualification',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <header class="tools-header">
        <h1>🌍 Calificación de Transferencias Internacionales</h1>
        <p class="tools-subtitle">Matriz mínima de calificación según LOPDP Ecuador para transferencias de datos personales fuera del país</p>
      </header>

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
          <div class="form-group">
            <label class="vd-label">Categorías de datos transferidos</label>
            <select class="vd-select" [ngModel]="transfer().data_category" (ngModelChange)="updateTransfer('data_category', $event)">
              <option value="generales">Datos generales</option>
              <option value="sensibles">Datos sensibles</option>
              <option value="mixtos">Mixtos</option>
            </select>
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
                <th style="width: 100px">Criticidad</th>
                <th style="width: 120px">Respuesta</th>
                <th>Evidencia mínima / nota</th>
                <th style="width: 120px">Resultado</th>
              </tr>
            </thead>
            <tbody>
              @for (criterion of criteria(); track criterion.id) {
                <tr [class.failed]="criterion.response === 'no' && criterion.criticality === 'critica'">
                  <td><strong>{{ criterion.number }}</strong></td>
                  <td>{{ criterion.description }}</td>
                  <td><span class="vd-badge" [class]="'vd-badge-' + criterion.criticality">{{ criterion.criticality | uppercase }}</span></td>
                  <td>
                    <select class="vd-select" [ngModel]="criterion.response" (ngModelChange)="updateCriterion(criterion.id, 'response', $event); evaluateTransfer()">
                      <option value="">Seleccionar...</option>
                      <option value="si">✅ Sí</option>
                      <option value="no">❌ No</option>
                      <option value="na">⚪ No aplica</option>
                    </select>
                  </td>
                  <td><input class="vd-input" [ngModel]="criterion.evidence" (ngModelChange)="updateCriterion(criterion.id, 'evidence', $event)" placeholder="Describa la evidencia..."></td>
                  <td>
                    @if (criterion.response) {
                      <span class="vd-badge" [class]="'vd-badge-' + getCriterionResult(criterion)">
                        {{ getCriterionResult(criterion) === 'cumple' ? '✅ CUMPLE' : getCriterionResult(criterion) === 'no-cumple' ? '❌ NO CUMPLE' : '⚪ N/A' }}
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
              <span class="result-label">Criterios cumplidos:</span>
              <span class="result-value success">{{ getPassedCount() }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">Criterios críticos fallidos:</span>
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
          } @else if (getOverallResult() === 'pendiente') {
            <div class="alert alert-warning">
              <strong>⚠️ EVALUACIÓN INCOMPLETA</strong>
              <p>Complete todos los criterios para obtener el resultado final.</p>
            </div>
          }
        </div>

        <div class="action-buttons">
          <button class="vd-btn vd-btn-primary" (click)="generateReport()">📄 Generar Informe</button>
          <button class="vd-btn vd-btn-secondary" (click)="saveQualification()">💾 Guardar Calificación</button>
        </div>
      </div>

      <!-- History -->
      <div class="vd-card">
        <h3>📚 Histórico de Transferencias Evaluadas</h3>
        <div class="history-list">
          @for (item of qualificationHistory(); track item.id) {
            <div class="history-item">
              <div class="history-info">
                <strong>{{ item.destination_country }}</strong>
                <span class="history-recipient">{{ item.recipient }}</span>
              </div>
              <div class="history-meta">
                <span class="vd-badge" [class]="'vd-badge-' + item.result">{{ item.result | uppercase }}</span>
                <span>{{ item.date | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="history-actions">
                <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="viewQualification(item.id)">Ver</button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tools-container { max-width: 1200px; margin: 0 auto; }
    .tools-header { margin-bottom: 1.5rem; }
    .tools-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0 0 0.5rem; }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
    .section-header h3 { margin: 0; }
    .score-display { display: flex; align-items: center; gap: 0.75rem; }
    .score-label { color: #64748b; font-size: 0.875rem; }
    .instruction-box { background: rgba(86,135,243,0.05); border-left: 4px solid #5687f3; padding: 1rem; margin-bottom: 1rem; border-radius: 0 8px 8px 0; }
    .instruction-box p { margin: 0; font-size: 0.875rem; color: #334155; }
    .matrix-container { overflow-x: auto; }
    .qualification-table { min-width: 900px; }
    .qualification-table th { font-size: 0.75rem; background: #f8fafc; }
    .qualification-table td { padding: 0.75rem; font-size: 0.875rem; }
    .qualification-table tr.failed { background: rgba(239,68,68,0.05); }
    .vd-badge-critica { background: rgba(127,29,29,0.15); color: #991b1b; font-weight: 600; }
    .vd-badge-alta { background: rgba(239,68,68,0.1); color: #dc2626; }
    .vd-badge-media { background: rgba(245,158,11,0.1); color: #d97706; }
    .vd-badge-aprobado { background: rgba(34,197,94,0.1); color: #16a34a; }
    .vd-badge-rechazado { background: rgba(239,68,68,0.1); color: #dc2626; }
    .vd-badge-cumple { background: rgba(34,197,94,0.1); color: #16a34a; }
    .vd-badge-no-cumple { background: rgba(239,68,68,0.1); color: #dc2626; }
    .qualification-results { margin-top: 1.5rem; padding: 1.5rem; background: #f8fafc; border-radius: 8px; }
    .result-aprobado { border-left: 4px solid #22c55e; }
    .result-rechazado { border-left: 4px solid #ef4444; }
    .result-pendiente { border-left: 4px solid #f59e0b; }
    .result-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
    .result-item { display: flex; flex-direction: column; }
    .result-label { font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem; }
    .result-value { font-size: 1.125rem; font-weight: 600; }
    .success { color: #16a34a; }
    .danger { color: #dc2626; }
    .alert { padding: 1rem; border-radius: 8px; margin-top: 1rem; }
    .alert-success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); color: #16a34a; }
    .alert-danger { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #dc2626; }
    .alert-warning { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #d97706; }
    .action-buttons { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
    .history-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .history-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 8px; flex-wrap: wrap; gap: 0.5rem; }
    .history-info { display: flex; flex-direction: column; flex: 1; }
    .history-recipient { font-size: 0.75rem; color: #64748b; }
    .history-meta { display: flex; gap: 0.75rem; align-items: center; }
  `],
})
export class TransferQualificationComponent implements OnInit {
  transfer = signal<any>({
    destination_country: '',
    recipient: '',
    purpose: '',
    data_category: 'generales'
  });

  totalCriteria = signal(13);
  criteriaMet = signal(0);
  qualificationHistory = signal<any[]>([]);

  private pdpToolsService = inject(PdpToolsService);

  criteria = signal<any[]>([
    { id: 1, number: 1, description: 'La transferencia está claramente identificada y delimitada.', criticality: 'critica', response: '', evidence: '' },
    { id: 2, number: 2, description: 'El país de destino y el receptor están identificados.', criticality: 'critica', response: '', evidence: '' },
    { id: 3, number: 3, description: 'La finalidad de la transferencia está documentada.', criticality: 'critica', response: '', evidence: '' },
    { id: 4, number: 4, description: 'La transferencia es necesaria y proporcional.', criticality: 'critica', response: '', evidence: '' },
    { id: 5, number: 5, description: 'Existe base jurídica válida para el tratamiento y la transferencia.', criticality: 'critica', response: '', evidence: '' },
    { id: 6, number: 6, description: 'El rol del receptor está delimitado (encargado, responsable, destinatario, etc.).', criticality: 'critica', response: '', evidence: '' },
    { id: 7, number: 7, description: 'Existe contrato o cláusula PDP aplicable antes de transferir.', criticality: 'critica', response: '', evidence: '' },
    { id: 8, number: 8, description: 'Se verificaron garantías mínimas del receptor.', criticality: 'critica', response: '', evidence: '' },
    { id: 9, number: 9, description: 'Existen medidas de seguridad adecuadas al riesgo.', criticality: 'alta', response: '', evidence: '' },
    { id: 10, number: 10, description: 'Se regulan subencargados o transferencias ulteriores.', criticality: 'alta', response: '', evidence: '' },
    { id: 11, number: 11, description: 'Existen reglas sobre conservación, retorno o eliminación.', criticality: 'media', response: '', evidence: '' },
    { id: 12, number: 12, description: 'Existe ruta de incidentes y notificación.', criticality: 'alta', response: '', evidence: '' },
    { id: 13, number: 13, description: 'Se informó o se puede informar al titular cuando corresponda.', criticality: 'alta', response: '', evidence: '' },
  ]);

  ngOnInit(): void {
    this.loadHistory();
  }

  getCriterionResult(criterion: any): string {
    if (!criterion.response) return '';
    if (criterion.response === 'si' || criterion.response === 'na') return 'cumple';
    return 'no-cumple';
  }

  getOverallResult(): string {
    const evaluated = this.criteria().filter(c => c.response !== '');
    if (evaluated.length === 0) return 'pendiente';

    const failedCritical = this.criteria().filter(c => c.criticality === 'critica' && c.response === 'no').length;
    if (failedCritical > 0) return 'rechazado';

    const allPassed = this.criteria().filter(c => c.criticality === 'critica').every(c => c.response === 'si' || c.response === 'na');
    if (allPassed && evaluated.length >= 8) return 'aprobado';

    return 'pendiente';
  }

  getEvaluatedCount(): number {
    return this.criteria().filter(c => c.response !== '').length;
  }

  getPassedCount(): number {
    return this.criteria().filter(c => c.response === 'si' || c.response === 'na').length;
  }

  getFailedCriticalCount(): number {
    return this.criteria().filter(c => c.criticality === 'critica' && c.response === 'no').length;
  }

  evaluateTransfer(): void {
    // Auto-evaluation logic runs when response changes
  }

  generateReport(): void {
    alert('Generando informe de calificación de transferencia...');
  }

  saveQualification(): void {
    this.pdpToolsService.createTransferQualification({
      destination_country: this.transfer().destination_country,
      recipient: this.transfer().recipient,
      purpose: this.transfer().purpose,
      data_category: this.transfer().data_category,
      criteria: this.criteria()
    }).subscribe({
      next: (res: any) => {
        alert('Calificación guardada con éxito');
        this.loadHistory();
      },
      error: (err: any) => alert('Error al guardar calificación: ' + err.message)
    });
  }

  loadHistory(): void {
    this.pdpToolsService.getTransferQualifications().subscribe({
      next: (res: any) => {
        this.qualificationHistory.set(res.data || []);
      },
      error: (err: any) => console.error('Error loading transfers:', err)
    });
  }

  viewQualification(id: number): void {
    this.pdpToolsService.getTransferQualification(id).subscribe({
      next: (res: any) => {
        this.transfer.set({
          destination_country: res.destination_country,
          recipient: res.recipient,
          purpose: res.purpose,
          data_category: res.data_category
        });
        this.criteria.set(res.criteria || []);
      },
      error: (err: any) => alert('Error al cargar: ' + err.message)
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
