import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdpToolsService } from '../pdp-tools.service';

// Legitimacy Report Component - Informe de Legitimación (Resolución 041)

@Component({
  selector: 'app-legitimacy-report',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <header class="tools-header">
        <h1>📋 Informe de Legitimación</h1>
        <p class="tools-subtitle">Generación de informe de legitimación según Resolución No. 041 de la Superintendencia de Protección de Datos del Ecuador</p>
      </header>

      <!-- Form Info -->
      <div class="vd-card">
        <div class="form-header-grid">
          <div class="form-group">
            <label class="vd-label">Responsable del tratamiento *</label>
            <input class="vd-input" [(ngModel)]="report().responsible_name" placeholder="Nombre de la entidad">
          </div>
          <div class="form-group">
            <label class="vd-label">RUC / Identificación</label>
            <input class="vd-input" [(ngModel)]="report().ruc" placeholder="RUC">
          </div>
          <div class="form-group">
            <label class="vd-label">Representante legal</label>
            <input class="vd-input" [(ngModel)]="report().legal_rep" placeholder="Nombre del representante">
          </div>
          <div class="form-group">
            <label class="vd-label">Fecha del informe</label>
            <input type="date" class="vd-input" [(ngModel)]="report().date">
          </div>
        </div>
      </div>

      <!-- Legitimacy Analysis -->
      <div class="vd-card">
        <h3>⚖️ Análisis de Legitimidad del Tratamiento</h3>
        <p class="section-desc">Evaluación de las bases legítimas para el tratamiento de datos personales según Art. 8 de la LOPDP</p>

        <div class="legitimacy-grid">
          @for (basis of legitimacyBases(); track basis.id) {
            <div class="legitimacy-card" [class.selected]="basis.selected" (click)="toggleBasis(basis.id)">
              <div class="card-header">
                <input type="checkbox" [(ngModel)]="basis.selected" (click)="$event.stopPropagation()">
                <span class="basis-number">{{ basis.id }}</span>
                <span class="vd-badge" [class]="'vd-badge-' + basis.type">{{ basis.type_label }}</span>
              </div>
              <h4>{{ basis.name }}</h4>
              <p>{{ basis.description }}</p>

              @if (basis.selected) {
                <div class="justification">
                  <label class="vd-label">Justificación específica *</label>
                  <textarea class="vd-input" rows="3" [ngModel]="basis.justification" (ngModelChange)="updateBasisJustification(basis.id, $event)" placeholder="Explique por qué esta base legítima aplica a su tratamiento..."></textarea>

                  <label class="vd-label">Evidencia documental</label>
                  <input class="vd-input" [ngModel]="basis.evidence" (ngModelChange)="updateBasisEvidence(basis.id, $event)" placeholder="Ej: Contratos, consentimientos firmados, normativa aplicable...">
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Purpose Analysis -->
      <div class="vd-card">
        <h3>🎯 Análisis de Finalidad y Proporcionalidad</h3>
        <div class="form-section">
          <div class="form-row">
            <div class="form-group full">
              <label class="vd-label">Finalidad principal del tratamiento *</label>
              <textarea class="vd-input" rows="2" [ngModel]="report().purpose" (ngModelChange)="updateReport('purpose', $event)" placeholder="Describa la finalidad específica del tratamiento de datos"></textarea>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="vd-label">¿La finalidad es lícita?</label>
              <select class="vd-select" [ngModel]="report().purpose_licit" (ngModelChange)="updateReport('purpose_licit', $event)">
                <option [ngValue]="true">Sí, es lícita</option>
                <option [ngValue]="false">No es lícita</option>
              </select>
            </div>
            <div class="form-group">
              <label class="vd-label">¿Los datos son necesarios para la finalidad?</label>
              <select class="vd-select" [ngModel]="report().data_necessary" (ngModelChange)="updateReport('data_necessary', $event)">
                <option [ngValue]="true">Sí, son necesarios y proporcionales</option>
                <option [ngValue]="false">No son necesarios</option>
              </select>
            </div>
            <div class="form-group">
              <label class="vd-label">¿Existe otro medio menos invasivo?</label>
              <select class="vd-select" [ngModel]="report().less_invasive_alternative" (ngModelChange)="updateReport('less_invasive_alternative', $event)">
                <option [ngValue]="false">No existe alternativa menos invasiva</option>
                <option [ngValue]="true">Sí existe alternativa</option>
              </select>
            </div>
            <div class="form-group">
              <label class="vd-label">Impacto en derechos fundamentales</label>
              <select class="vd-select" [ngModel]="report().rights_impact" (ngModelChange)="updateReport('rights_impact', $event)">
                <option value="ninguno">Ninguno</option>
                <option value="bajo">Bajo</option>
                <option value="medio">Medio</option>
                <option value="alto">Alto</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Balance Test -->
      <div class="vd-card">
        <h3>⚖️ Test de Proporcionalidad (Balance de Intereses)</h3>
        <p class="section-desc">Requerido cuando la base legítima es "interés legítimo" o "interés público"</p>

        <div class="balance-test">
          <div class="test-section">
            <h4>Intereses del Responsable</h4>
            <textarea class="vd-input" rows="3" [ngModel]="report().controller_interests" (ngModelChange)="updateReport('controller_interests', $event)" placeholder="Describa los intereses legítimos del responsable del tratamiento..."></textarea>
          </div>

          <div class="test-section">
            <h4>Impacto en derechos de titulares</h4>
            <textarea class="vd-input" rows="3" [ngModel]="report().data_subjects_impact" (ngModelChange)="updateReport('data_subjects_impact', $event)" placeholder="Describa el impacto potencial en los derechos y libertades de los titulares..."></textarea>
          </div>

          <div class="test-section">
            <h4>Expectativas razonables de los titulares</h4>
            <textarea class="vd-input" rows="3" [ngModel]="report().reasonable_expectations" (ngModelChange)="updateReport('reasonable_expectations', $event)" placeholder="¿Los titulares esperan razonablemente este tratamiento de sus datos?"></textarea>
          </div>

          <div class="balance-result" [class]="'balance-' + getBalanceResult()">
            <strong>Resultado del balance: {{ getBalanceResult() | uppercase }}</strong>
            <p>{{ getBalanceReason() }}</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="vd-btn vd-btn-primary" (click)="generateReport()">📄 Generar Informe de Legitimación</button>
        <button class="vd-btn vd-btn-secondary" (click)="saveDraft()">💾 Guardar borrador</button>
        <button class="vd-btn vd-btn-secondary" (click)="viewResolution()">📚 Ver Resolución 041</button>
      </div>
    </div>
  `,
  styles: [`
    .tools-container { max-width: 1200px; margin: 0 auto; }
    .tools-header { margin-bottom: 1.5rem; }
    .tools-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0 0 0.5rem; }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; }
    .form-header-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .section-desc { color: #64748b; font-size: 0.875rem; margin: 0.5rem 0 1rem; }
    .legitimacy-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .legitimacy-card { border: 2px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; cursor: pointer; transition: all 0.2s; }
    .legitimacy-card:hover { border-color: #5687f3; }
    .legitimacy-card.selected { border-color: #5687f3; background: rgba(86,135,243,0.05); }
    .card-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .basis-number { width: 28px; height: 28px; background: #5687f3; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; }
    .legitimacy-card h4 { margin: 0 0 0.5rem; font-size: 0.9375rem; }
    .legitimacy-card > p { margin: 0 0 0.75rem; font-size: 0.75rem; color: #64748b; }
    .justification { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(86,135,243,0.2); }
    .vd-badge-libre { background: rgba(34,197,94,0.1); color: #16a34a; }
    .vd-badge-condicional { background: rgba(245,158,11,0.1); color: #d97706; }
    .vd-badge-sensible { background: rgba(239,68,68,0.1); color: #dc2626; }
    .form-section { margin-top: 1rem; }
    .form-row { display: flex; gap: 1rem; }
    .form-row .full { flex: 1; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem; }
    .balance-test { display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1rem; }
    .test-section h4 { margin: 0 0 0.5rem; font-size: 0.875rem; color: #64748b; }
    .balance-result { padding: 1rem; border-radius: 8px; margin-top: 1rem; }
    .balance-result.balance-favorable { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); color: #16a34a; }
    .balance-result.balance-desfavorable { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #dc2626; }
    .balance-result.balance-condicional { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: #d97706; }
    .action-buttons { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
    @media (max-width: 768px) { .form-header-grid { grid-template-columns: repeat(2, 1fr); } .legitimacy-grid { grid-template-columns: 1fr; } .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class LegitimacyReportComponent implements OnInit {
  report = signal<any>({
    responsible_name: '', ruc: '', legal_rep: '', date: new Date().toISOString().split('T')[0],
    purpose: '', purpose_licit: true, data_necessary: true, less_invasive_alternative: false, rights_impact: 'ninguno',
    controller_interests: '', data_subjects_impact: '', reasonable_expectations: ''
  });

  legitimacyBases = signal<any[]>([
    { id: 1, name: 'Consentimiento del titular', type: 'libre', type_label: 'Libre', description: 'El titular ha dado su consentimiento libre, específico, informado e inequívoco.', selected: false, justification: '', evidence: '' },
    { id: 2, name: 'Ejecución de contrato', type: 'libre', type_label: 'Libre', description: 'El tratamiento es necesario para la ejecución de un contrato con el titular.', selected: false, justification: '', evidence: '' },
    { id: 3, name: 'Obligación legal', type: 'libre', type_label: 'Libre', description: 'El tratamiento es necesario para cumplir una obligación legal.', selected: false, justification: '', evidence: '' },
    { id: 4, name: 'Interés vital', type: 'condicional', type_label: 'Condicional', description: 'Protección de intereses vitales del titular u otra persona física.', selected: false, justification: '', evidence: '' },
    { id: 5, name: 'Interés público', type: 'condicional', type_label: 'Condicional', description: 'Ejercicio de autoridad pública o interés público.', selected: false, justification: '', evidence: '' },
    { id: 6, name: 'Interés legítimo', type: 'condicional', type_label: 'Condicional', description: 'Intereses legítimos del responsable o terceros (requiere balance).', selected: false, justification: '', evidence: '' },
  ]);

  ngOnInit(): void {
    this.loadDraft();
  }

  toggleBasis(id: number): void {
    this.legitimacyBases.update(bases =>
      bases.map(b => b.id === id ? { ...b, selected: !b.selected } : b)
    );
  }

  getBalanceResult(): string {
    const report = this.report();
    const selectedBases = this.legitimacyBases().filter(b => b.selected);

    if (!report.data_necessary || !report.purpose_licit) return 'desfavorable';
    if (selectedBases.some(b => b.type === 'libre')) return 'favorable';
    if (selectedBases.some(b => b.type === 'condicional')) {
      if (report.rights_impact === 'alto') return 'desfavorable';
      if (report.rights_impact === 'medio') return 'condicional';
      return 'favorable';
    }
    return 'desfavorable';
  }

  getBalanceReason(): string {
    const result = this.getBalanceResult();
    const reasons: any = {
      'favorable': 'El tratamiento cumple con los requisitos de legitimidad y proporcionalidad.',
      'desfavorable': 'El tratamiento NO cumple con los requisitos de legitimidad. Se recomienda no proceder o buscar otra base legal.',
      'condicional': 'El tratamiento puede proceder con medidas adicionales de salvaguarda y control.'
    };
    return reasons[result];
  }

  generateReport(): void { alert('Generando Informe de Legitimación según Resolución 041...'); }
  loadDraft(): void {
    // TODO: Load from localStorage or API
  }
  saveDraft(): void { alert('Borrador guardado'); }
  viewResolution(): void { window.open('https://spdp.gob.ec/resolucion_041/', '_blank'); }

  updateReport(field: string, value: any): void {
    this.report.update(r => ({ ...r, [field]: value }));
  }

  updateBasisJustification(id: number, value: string): void {
    this.legitimacyBases.update(bases =>
      bases.map(b => b.id === id ? { ...b, justification: value } : b)
    );
  }

  updateBasisEvidence(id: number, value: string): void {
    this.legitimacyBases.update(bases =>
      bases.map(b => b.id === id ? { ...b, evidence: value } : b)
    );
  }

  private pdpToolsService = inject(PdpToolsService);
}
