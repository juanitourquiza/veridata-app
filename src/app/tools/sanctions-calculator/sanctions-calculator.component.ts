import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Sanctions Calculator - Based on ECIJA GPA reference model
// Uses VDN (Volumen de Negocio) as base, scenario selection, and maturity questions

@Component({
  selector: 'app-sanctions-calculator',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <header class="tools-header">
        <h1>💰 Simulador de Multas por Infracciones de Datos Personales</h1>
        <p class="tools-subtitle">Estime el impacto de una sanción bajo la LOPDP Ecuador</p>
      </header>

      <!-- Progress Bar -->
      <div class="progress-bar">
        @for (s of [1,2,3]; track s) {
          <div class="progress-step" [class.active]="step() >= s" [class.current]="step() === s">
            <span class="step-number">{{ s }}</span>
            <span class="step-label">{{ s === 1 ? 'Dimensión' : s === 2 ? 'Escenario' : 'Factores' }}</span>
          </div>
        }
      </div>

      <!-- Step 1: Business Dimension -->
      @if (step() === 1) {
        <div class="vd-card step-card">
          <h3>Paso 1: Dimensión de su Empresa</h3>
          <p class="step-desc">El punto de partida para el cálculo es el "Volumen de Negocio" de su empresa. En términos sencillos, esto se refiere a su <strong>facturación anual total</strong> antes de impuestos.</p>

          <div class="vdn-input-container">
            <label class="vd-label">Volumen de Negocio (VDN) Anual (USD)</label>
            <div class="currency-input">
              <span class="currency-prefix">$</span>
              <input type="number" class="vd-input" [ngModel]="vdn()" (ngModelChange)="vdn.set($event)" placeholder="Ej: 500000" min="0">
            </div>
          </div>

          <div class="step-nav">
            <div></div>
            <button class="vd-btn vd-btn-primary" (click)="step.set(2)" [disabled]="!vdn()">Siguiente →</button>
          </div>
        </div>
      }

      <!-- Step 2: Scenario Selection -->
      @if (step() === 2) {
        <div class="vd-card step-card">
          <h3>Paso 2: Selección de Escenario</h3>
          <p class="step-desc">Seleccione el escenario que mejor describe la infracción cometida. Cada escenario tiene un nivel de gravedad y un rango de multa base.</p>

          <div class="scenario-grid">
            @for (scenario of scenarios; track scenario.id) {
              <div class="scenario-card" [class.selected]="selectedScenario()?.id === scenario.id" [class]="'severity-' + scenario.severity" (click)="selectedScenario.set(scenario)">
                <h4>{{ scenario.name }}</h4>
                <p>{{ scenario.description }}</p>
                <span class="severity-badge" [class]="'badge-' + scenario.severity">{{ scenario.severity | titlecase }}</span>
              </div>
            }
          </div>

          <div class="step-nav">
            <button class="vd-btn vd-btn-secondary" (click)="step.set(1)">← Anterior</button>
            <button class="vd-btn vd-btn-primary" (click)="step.set(3)" [disabled]="!selectedScenario()">Siguiente →</button>
          </div>
        </div>
      }

      <!-- Step 3: Maturity & Context Questions -->
      @if (step() === 3) {
        <div class="vd-card step-card">
          <h3>Paso 3: Nivel de Madurez y Contexto</h3>
          <p class="step-desc">Sus respuestas aquí ajustarán los factores de la multa. La proactividad, la diligencia y la buena fe pueden ser atenuantes clave.</p>

          <div class="questions-list">
            @for (q of maturityQuestions; track q.id; let i = $index) {
              <div class="question-item">
                <span class="question-text">{{ i + 1 }}. {{ q.text }}</span>
                <div class="question-buttons">
                  <button class="answer-btn" [class.selected]="q.answer === true" (click)="setAnswer(q.id, true)">Sí</button>
                  <button class="answer-btn" [class.selected]="q.answer === false" (click)="setAnswer(q.id, false)">No</button>
                </div>
              </div>
            }
          </div>

          <div class="maturity-index">
            <span class="maturity-label">Índice de Madurez Referencial</span>
            <span class="maturity-value">{{ getMaturityIndex() }}%</span>
            <div class="maturity-bar">
              <div class="maturity-fill" [style.width.%]="getMaturityIndex()"></div>
            </div>
          </div>

          <div class="step-nav">
            <button class="vd-btn vd-btn-secondary" (click)="step.set(2)">← Anterior</button>
            <button class="vd-btn vd-btn-primary" (click)="calculateAndShowResult()">Ver Resultado</button>
          </div>
        </div>
      }

      <!-- Step 4: Result -->
      @if (step() === 4) {
        <div class="vd-card result-card" [class]="'result-' + selectedScenario()?.severity">
          <h3>📊 Resultado del Cálculo</h3>

          <div class="result-summary">
            <div class="result-header">
              <span class="result-severity">{{ selectedScenario()?.severity | uppercase }}</span>
              <span class="result-scenario">{{ selectedScenario()?.name }}</span>
            </div>

            <div class="result-grid">
              <div class="result-item">
                <span class="result-label">VDN Anual</span>
                <span class="result-value">{{ vdn() | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Rango base de multa</span>
                <span class="result-value">{{ selectedScenario()?.minPct }}% - {{ selectedScenario()?.maxPct }}%</span>
              </div>
              <div class="result-item">
                <span class="result-label">Multa base (punto medio)</span>
                <span class="result-value">{{ result().baseAmount | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Índice de Madurez</span>
                <span class="result-value">{{ getMaturityIndex() }}%</span>
              </div>
              <div class="result-item">
                <span class="result-label">Ajuste por madurez</span>
                <span class="result-value" [class.positive]="result().maturityAdjustment < 0" [class.negative]="result().maturityAdjustment > 0">
                  {{ result().maturityAdjustment > 0 ? '+' : '' }}{{ result().maturityAdjustmentPct }}%
                </span>
              </div>
              <div class="result-item final">
                <span class="result-label">Multa estimada final</span>
                <span class="result-value final-amount">{{ result().finalAmount | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
            </div>

            <div class="result-range">
              <div class="range-bar">
                <div class="range-fill" [style.left.%]="result().rangePosition" [style.width]="'4px'"></div>
              </div>
              <div class="range-labels">
                <span>{{ result().rangeMin | currency:'USD':'symbol':'1.0-0' }}</span>
                <span>{{ result().rangeMax | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          </div>

          <div class="result-factors">
            <h4>Factores atenuantes aplicados:</h4>
            <ul>
              @for (q of maturityQuestions; track q.id) {
                @if (q.answer !== null) {
                  <li [class.positive]="q.isAtenuante ? q.answer : !q.answer">
                    {{ (q.isAtenuante ? q.answer : !q.answer) ? '✅' : '❌' }} {{ q.text }}
                    <span class="factor-impact">{{ (q.isAtenuante ? q.answer : !q.answer) ? q.atenuanteLabel : q.agravanteLabel }}</span>
                  </li>
                }
              }
            </ul>
          </div>

          <div class="result-legal">
            <h4>📚 Base Legal</h4>
            <p>{{ selectedScenario()?.legalBasis }}</p>
          </div>

          <div class="result-actions">
            <button class="vd-btn vd-btn-secondary" (click)="step.set(1); resetCalculation()">🔄 Nuevo cálculo</button>
            <button class="vd-btn vd-btn-secondary" (click)="step.set(3)">← Modificar factores</button>
          </div>

          <p class="disclaimer">⚠️ Este cálculo es una estimación orientativa basada en la LOPDP y resoluciones aplicables. La sanción definitiva es competencia exclusiva de la SPDP.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .tools-container { max-width: 1000px; margin: 0 auto; }
    .tools-header { margin-bottom: 1.5rem; text-align: center; }
    .tools-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0 0 0.5rem; }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; }
    .progress-bar { display: flex; justify-content: center; gap: 2rem; margin-bottom: 2rem; }
    .progress-step { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; opacity: 0.4; }
    .progress-step.active { opacity: 1; }
    .progress-step.current .step-number { background: #5687f3; color: white; }
    .step-number { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #e2e8f0; font-weight: 700; font-size: 0.875rem; }
    .progress-step.active .step-number { background: #22c55e; color: white; }
    .progress-step.current .step-number { background: #5687f3 !important; }
    .step-label { font-size: 0.75rem; color: #64748b; }
    .step-card { max-width: 900px; margin: 0 auto; }
    .step-card h3 { text-align: center; font-size: 1.25rem; margin-bottom: 0.5rem; }
    .step-desc { text-align: center; color: #64748b; font-size: 0.875rem; margin-bottom: 1.5rem; }
    .vdn-input-container { max-width: 400px; margin: 0 auto 2rem; }
    .currency-input { display: flex; align-items: center; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .currency-prefix { padding: 0.75rem 1rem; background: #f8fafc; color: #64748b; font-weight: 600; border-right: 1px solid #e2e8f0; }
    .currency-input .vd-input { border: none; border-radius: 0; }
    .step-nav { display: flex; justify-content: space-between; margin-top: 2rem; }
    .scenario-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
    .scenario-card { padding: 1rem; border: 2px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
    .scenario-card:hover { border-color: #cbd5e0; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .scenario-card.selected { border-color: #5687f3; background: rgba(86,135,243,0.05); }
    .scenario-card h4 { margin: 0 0 0.5rem; font-size: 0.875rem; color: #0f172a; }
    .scenario-card p { margin: 0 0 0.75rem; font-size: 0.75rem; color: #64748b; line-height: 1.4; }
    .severity-badge { display: inline-block; font-size: 0.625rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 4px; text-transform: uppercase; }
    .badge-leve { background: rgba(34,197,94,0.1); color: #16a34a; }
    .badge-grave { background: rgba(245,158,11,0.1); color: #d97706; }
    .badge-gravisima { background: rgba(239,68,68,0.1); color: #dc2626; }
    .questions-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
    .question-item { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 8px; }
    .question-text { flex: 1; font-size: 0.875rem; color: #334155; }
    .question-buttons { display: flex; gap: 0.5rem; }
    .answer-btn { padding: 0.5rem 1.5rem; border: 1px solid #e2e8f0; border-radius: 6px; background: white; cursor: pointer; font-size: 0.875rem; transition: all 0.15s; }
    .answer-btn:hover { background: #f1f5f9; }
    .answer-btn.selected { background: #5687f3; color: white; border-color: #5687f3; }
    .maturity-index { padding: 1rem; background: #f8fafc; border-radius: 8px; text-align: center; }
    .maturity-label { font-size: 0.875rem; color: #64748b; }
    .maturity-value { display: block; font-size: 1.5rem; font-weight: 700; color: #5687f3; margin: 0.25rem 0; }
    .maturity-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 0.5rem; }
    .maturity-fill { height: 100%; background: linear-gradient(90deg, #ef4444, #f59e0b, #22c55e); border-radius: 4px; transition: width 0.3s; }
    .result-card { border-left: 4px solid #f59e0b; }
    .result-card.result-leve { border-left-color: #22c55e; }
    .result-card.result-grave { border-left-color: #f59e0b; }
    .result-card.result-gravisima { border-left-color: #dc2626; }
    .result-summary { margin-bottom: 1.5rem; }
    .result-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .result-severity { font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 4px; background: rgba(245,158,11,0.1); color: #d97706; }
    .result-leve .result-severity { background: rgba(34,197,94,0.1); color: #16a34a; }
    .result-gravisima .result-severity { background: rgba(239,68,68,0.1); color: #dc2626; }
    .result-scenario { font-size: 1rem; font-weight: 600; color: #0f172a; }
    .result-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .result-item { text-align: center; padding: 1rem; background: #f8fafc; border-radius: 8px; }
    .result-item.final { background: rgba(86,135,243,0.1); grid-column: span 3; }
    .result-label { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem; }
    .result-value { display: block; font-size: 1.125rem; font-weight: 700; color: #0f172a; }
    .result-value.final-amount { font-size: 2rem; color: #5687f3; }
    .result-value.positive { color: #16a34a; }
    .result-value.negative { color: #dc2626; }
    .result-range { margin-bottom: 1rem; }
    .range-bar { height: 8px; background: linear-gradient(90deg, #22c55e, #f59e0b, #ef4444); border-radius: 4px; position: relative; }
    .range-fill { position: absolute; top: -4px; height: 16px; width: 4px !important; background: #0f172a; border-radius: 2px; }
    .range-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
    .result-factors { margin-bottom: 1rem; }
    .result-factors h4 { margin: 0 0 0.75rem; font-size: 0.875rem; }
    .result-factors ul { list-style: none; padding: 0; margin: 0; }
    .result-factors li { font-size: 0.8rem; padding: 0.4rem 0; color: #64748b; display: flex; justify-content: space-between; }
    .result-factors li.positive { color: #16a34a; }
    .factor-impact { font-weight: 600; font-size: 0.75rem; }
    .result-legal { padding: 1rem; background: #f8fafc; border-radius: 8px; margin-bottom: 1rem; }
    .result-legal h4 { margin: 0 0 0.5rem; font-size: 0.875rem; }
    .result-legal p { margin: 0; font-size: 0.8rem; color: #64748b; }
    .result-actions { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
    .disclaimer { font-size: 0.75rem; color: #94a3b8; font-style: italic; margin: 0; }
    @media (max-width: 768px) { .scenario-grid { grid-template-columns: 1fr; } .result-grid { grid-template-columns: 1fr; } .result-item.final { grid-column: span 1; } }
  `],
})
export class SanctionsCalculatorComponent {
  step = signal(1);
  vdn = signal<number>(0);
  selectedScenario = signal<any>(null);
  result = signal<any>({});

  // Scenarios from ecijagpa.tech reference
  scenarios = [
    // Leves (Art. 67.1 LOPDP) - 0.1% a 0.7% VDN
    { id: 1, name: 'Solicitud sin Responder', description: 'No se respondió o se respondió fuera de plazo a una solicitud de un cliente.', severity: 'leve', minPct: 0.1, maxPct: 0.7, basePct: 0.3, legalBasis: 'Art. 67.1 LOPDP – Infracciones leves. Multa del 0.1% al 0.7% del VDN del ejercicio anterior.' },
    { id: 2, name: 'Sin Política de Datos', description: 'La empresa no tiene o no ha publicado una política de protección de datos clara y accesible.', severity: 'leve', minPct: 0.1, maxPct: 0.7, basePct: 0.4, legalBasis: 'Art. 67.1 LOPDP – Infracciones leves. Multa del 0.1% al 0.7% del VDN del ejercicio anterior.' },
    { id: 3, name: 'Producto sin Privacy by Design', description: 'Se creó un nuevo producto o sistema sin pensar en la protección de los datos desde el principio.', severity: 'leve', minPct: 0.1, maxPct: 0.7, basePct: 0.3, legalBasis: 'Art. 67.1 LOPDP – Infracciones leves. Multa del 0.1% al 0.7% del VDN del ejercicio anterior.' },
    { id: 4, name: 'Proveedor de Riesgo', description: 'Se contrató a un proveedor que no podía asegurar la protección de los datos de los clientes.', severity: 'leve', minPct: 0.1, maxPct: 0.7, basePct: 0.3, legalBasis: 'Art. 67.1 LOPDP – Infracciones leves. Multa del 0.1% al 0.7% del VDN del ejercicio anterior.' },
    { id: 5, name: 'Orden Ignorada (Leve)', description: 'No se cumplió con una orden o corrección de carácter leve emitida por la autoridad de datos.', severity: 'leve', minPct: 0.1, maxPct: 0.7, basePct: 0.5, legalBasis: 'Art. 67.1 LOPDP – Infracciones leves. Multa del 0.1% al 0.7% del VDN del ejercicio anterior.' },
    // Graves (Art. 67.2 LOPDP) - 0.7% a 1% VDN
    { id: 6, name: 'Uso Indebido de Datos', description: 'Se usó una base de datos de clientes para marketing sin consentimiento para ese fin.', severity: 'grave', minPct: 0.7, maxPct: 1.0, basePct: 0.85, legalBasis: 'Art. 67.2 LOPDP – Infracciones graves. Multa del 0.7% al 1% del VDN del ejercicio anterior.' },
    { id: 7, name: 'Brecha por Negligencia', description: 'Ciberataque que expuso datos de clientes por falta de medidas de seguridad básicas.', severity: 'grave', minPct: 0.7, maxPct: 1.0, basePct: 0.85, legalBasis: 'Art. 67.2 LOPDP – Infracciones graves. Multa del 0.7% al 1% del VDN del ejercicio anterior.' },
    { id: 8, name: 'Brecha de Datos Sensibles', description: 'Vulnerabilidad que expuso datos de categoría especial (salud, etc.).', severity: 'grave', minPct: 0.7, maxPct: 1.0, basePct: 0.9, legalBasis: 'Art. 67.2 LOPDP – Infracciones graves. Multa del 0.7% al 1% del VDN del ejercicio anterior.' },
    { id: 9, name: 'Transferencia Ilegal', description: 'Se compartió o vendió una base de datos de clientes a un tercero sin consentimiento.', severity: 'grave', minPct: 0.7, maxPct: 1.0, basePct: 0.9, legalBasis: 'Art. 67.2 LOPDP – Infracciones graves. Multa del 0.7% al 1% del VDN del ejercicio anterior.' },
    { id: 10, name: 'Falta de Evaluación de Impacto', description: 'Se inició un nuevo tratamiento de datos de alto riesgo sin realizar la EIPD obligatoria.', severity: 'grave', minPct: 0.7, maxPct: 1.0, basePct: 0.8, legalBasis: 'Art. 67.2 LOPDP – Infracciones graves. Multa del 0.7% al 1% del VDN del ejercicio anterior.' },
    { id: 11, name: 'Contratos Inadecuados con Proveedores', description: 'Se contrató a un proveedor (encargado) para tratar datos sin un contrato que cumpla las exigencias de la ley.', severity: 'grave', minPct: 0.7, maxPct: 1.0, basePct: 0.8, legalBasis: 'Art. 67.2 LOPDP – Infracciones graves. Multa del 0.7% al 1% del VDN del ejercicio anterior.' },
    { id: 12, name: 'Obstrucción a la Autoridad', description: 'No se colaboró o se entregó información falsa/incompleta durante una auditoría de la SPDP.', severity: 'grave', minPct: 0.7, maxPct: 1.0, basePct: 0.95, legalBasis: 'Art. 67.2 LOPDP – Infracciones graves. Multa del 0.7% al 1% del VDN del ejercicio anterior.' },
    { id: 13, name: 'Fuga de Datos Oculta a la Autoridad', description: 'Ocurrió una fuga de datos y no se le informó a la autoridad de protección de datos.', severity: 'grave', minPct: 0.7, maxPct: 1.0, basePct: 0.9, legalBasis: 'Art. 67.2 LOPDP – Infracciones graves. Multa del 0.7% al 1% del VDN del ejercicio anterior.' },
    { id: 14, name: 'Fuga de Datos Oculta a Todos', description: 'Ocurrió una fuga de datos y no se informó ni a la autoridad ni a los titulares.', severity: 'grave', minPct: 0.7, maxPct: 1.0, basePct: 0.95, legalBasis: 'Art. 67.2 LOPDP – Infracciones graves. Multa del 0.7% al 1% del VDN del ejercicio anterior.' },
    { id: 15, name: 'Sin Delegado de Protección de Datos', description: 'La empresa no nombró un DPO, a pesar de estar obligada a hacerlo.', severity: 'grave', minPct: 0.7, maxPct: 1.0, basePct: 0.75, legalBasis: 'Art. 67.2 LOPDP – Infracciones graves. Multa del 0.7% al 1% del VDN del ejercicio anterior.' },
    { id: 16, name: 'Infracción con Reincidencia', description: 'Se comete una infracción grave y la empresa ya ha sido sancionada previamente.', severity: 'grave', minPct: 0.7, maxPct: 1.0, basePct: 1.0, legalBasis: 'Art. 67.2 LOPDP – Infracciones graves. Multa del 0.7% al 1% del VDN del ejercicio anterior.' },
    { id: 17, name: 'Reincidencia en Faltas Leves', description: 'La empresa comete repetidamente las mismas faltas leves o ignora una orden de corrección.', severity: 'grave', minPct: 0.7, maxPct: 1.0, basePct: 0.8, legalBasis: 'Art. 67.2 LOPDP – Infracciones graves. Se aplica por reincidencia de faltas leves.' },
  ];

  // 9 Maturity questions from the reference
  maturityQuestions = [
    { id: 1, text: '¿Cuenta con un Registro de actividades de tratamiento?', answer: null as boolean | null, isAtenuante: true, weight: 10, atenuanteLabel: '-10%', agravanteLabel: '+5%' },
    { id: 2, text: '¿Cuenta con un análisis de riesgo para el tratamiento donde recae la infracción?', answer: null as boolean | null, isAtenuante: true, weight: 12, atenuanteLabel: '-12%', agravanteLabel: '+8%' },
    { id: 3, text: '¿Su empresa cuenta con una Política de Protección de Datos publicada y accesible?', answer: null as boolean | null, isAtenuante: true, weight: 10, atenuanteLabel: '-10%', agravanteLabel: '+5%' },
    { id: 4, text: '¿Ha designado un Delegado de Protección de Datos (DPO)?', answer: null as boolean | null, isAtenuante: true, weight: 8, atenuanteLabel: '-8%', agravanteLabel: '+5%' },
    { id: 5, text: 'Tras la infracción, ¿se tomaron acciones inmediatas para mitigar el daño?', answer: null as boolean | null, isAtenuante: true, weight: 15, atenuanteLabel: '-15%', agravanteLabel: '+10%' },
    { id: 6, text: '¿La decisión que causó la infracción priorizó un interés comercial sobre el cumplimiento normativo?', answer: null as boolean | null, isAtenuante: false, weight: 10, atenuanteLabel: '-10%', agravanteLabel: '+10%' },
    { id: 7, text: '¿Cuenta con canales para el ejercicio de Derechos de Protección de Datos?', answer: null as boolean | null, isAtenuante: true, weight: 8, atenuanteLabel: '-8%', agravanteLabel: '+5%' },
    { id: 8, text: '¿Ha firmado contratos de protección de datos con sus proveedores (encargados)?', answer: null as boolean | null, isAtenuante: true, weight: 10, atenuanteLabel: '-10%', agravanteLabel: '+5%' },
    { id: 9, text: '¿Conoce si alguien ha sido sancionado previamente por la misma acción/actividad?', answer: null as boolean | null, isAtenuante: false, weight: 12, atenuanteLabel: '-5%', agravanteLabel: '+12%' },
  ];

  setAnswer(questionId: number, value: boolean): void {
    const q = this.maturityQuestions.find(q => q.id === questionId);
    if (q) q.answer = value;
  }

  getMaturityIndex(): number {
    const answered = this.maturityQuestions.filter(q => q.answer !== null);
    if (answered.length === 0) return 0;
    const positiveCount = answered.filter(q => q.isAtenuante ? q.answer === true : q.answer === false).length;
    return Math.round((positiveCount / this.maturityQuestions.length) * 100);
  }

  calculateAndShowResult(): void {
    const scenario = this.selectedScenario();
    if (!scenario || !this.vdn()) return;

    const vdn = this.vdn();

    // Base amount = VDN * scenario base percentage
    const baseAmount = vdn * (scenario.basePct / 100);

    // Calculate maturity adjustment
    let adjustmentPct = 0;
    this.maturityQuestions.forEach(q => {
      if (q.answer === null) return;
      const isPositive = q.isAtenuante ? q.answer === true : q.answer === false;
      if (isPositive) {
        adjustmentPct -= q.weight; // atenuante (reduce)
      } else {
        adjustmentPct += Math.round(q.weight * 0.5); // agravante (increase, less impact)
      }
    });

    // Clamp adjustment
    adjustmentPct = Math.max(-50, Math.min(50, adjustmentPct));

    const maturityAdjustment = baseAmount * (adjustmentPct / 100);
    let finalAmount = baseAmount + maturityAdjustment;

    // Ensure within legal range
    const rangeMin = vdn * (scenario.minPct / 100);
    const rangeMax = vdn * (scenario.maxPct / 100);
    finalAmount = Math.max(rangeMin, Math.min(rangeMax, finalAmount));

    // Position on range bar (0-100%)
    const rangePosition = rangeMax > rangeMin ? ((finalAmount - rangeMin) / (rangeMax - rangeMin)) * 100 : 50;

    this.result.set({
      baseAmount: Math.round(baseAmount),
      maturityAdjustment: Math.round(maturityAdjustment),
      maturityAdjustmentPct: adjustmentPct,
      finalAmount: Math.round(finalAmount),
      rangeMin: Math.round(rangeMin),
      rangeMax: Math.round(rangeMax),
      rangePosition: Math.min(98, Math.max(2, rangePosition)),
    });

    this.step.set(4);
  }

  resetCalculation(): void {
    this.vdn.set(0);
    this.selectedScenario.set(null);
    this.maturityQuestions.forEach(q => q.answer = null);
    this.result.set({});
  }
}
