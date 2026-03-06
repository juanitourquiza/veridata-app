import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Project, Framework, ControlDomain, Evaluation, Gap, ActionItem, ExecutiveReport, DomainMaturity, Deliverable, User
} from '../../core/models/models';

@Component({
  selector: 'app-project-wizard',
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Stepper -->
    <div class="vd-stepper">
      @for (s of steps; track s.num; let i = $index) {
        <div class="vd-step" [class.vd-step-active]="currentStep() === s.num" [class.vd-step-completed]="currentStep() > s.num" [class.vd-step-pending]="currentStep() < s.num" (click)="goToStep(s.num)">
          <div class="vd-step-number">{{ currentStep() > s.num ? '✓' : s.num }}</div>
          <span class="vd-step-label">{{ s.label }}</span>
        </div>
        @if (i < steps.length - 1) { <div class="vd-step-line" [class.completed]="currentStep() > s.num"></div> }
      }
    </div>

    <!-- Step 1: Project Info -->
    @if (currentStep() === 1) {
      <div class="vd-card">
        <h2>📋 Información del Proyecto</h2>
        <div class="form-grid">
          <div class="form-group full"><label class="vd-label">Nombre del proyecto</label><input class="vd-input" [(ngModel)]="project.name" placeholder="Ej: Evaluación LOPDP 2026"></div>
          <div class="form-group full"><label class="vd-label">Descripción</label><textarea class="vd-input" rows="3" [(ngModel)]="project.description" placeholder="Describe el alcance de la evaluación"></textarea></div>
          <div class="form-group"><label class="vd-label">Marco normativo</label><select class="vd-select" [(ngModel)]="project.framework_id"><option [ngValue]="0" disabled>Seleccionar...</option>@for (f of frameworks(); track f.id) { <option [ngValue]="f.id">{{ f.name }}</option> }</select></div>
          <div class="form-group"><label class="vd-label">Nº de titulares de datos</label><input type="number" class="vd-input" [(ngModel)]="project.data_subjects_count" min="0"></div>
          <div class="form-group full"><label class="vd-label">Categorías de datos tratados</label>
            <div class="chip-grid">
              @for (cat of dataCategories; track cat) {
                <label class="chip" [class.selected]="isCategorySelected(cat)"><input type="checkbox" [checked]="isCategorySelected(cat)" (change)="toggleCategory(cat)"><span>{{ cat }}</span></label>
              }
            </div>
          </div>
        </div>
        @if (project.data_subjects_count > 50000 || hasSpecialCategory()) { <div class="alert-warn">⚠️ Tratamiento a gran escala detectado. Se requiere Evaluación de Impacto.</div> }
        <div class="step-actions"><button class="vd-btn vd-btn-primary" (click)="saveProject()" [disabled]="saving()">{{ saving() ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear y Continuar →' }}</button></div>
      </div>
    }

    <!-- Step 2: Evaluation -->
    @if (currentStep() === 2) {
      <div class="eval-header vd-card"><h2>🔍 Evaluación de Controles</h2>
        <div class="eval-progress"><span>Progreso: {{ evaluatedCount() }}/{{ totalControls() }}</span><div class="vd-progress-bar"><div class="vd-progress-fill" [style.width.%]="evaluationProgress()"></div></div></div>
      </div>
      @for (domain of domains(); track domain.id) {
        <div class="vd-card domain-card">
          <div class="domain-header" (click)="toggleDomain(domain.id)">
            <h3>{{ domain.code }} — {{ domain.name }}</h3><span class="toggle">{{ expandedDomains.has(domain.id) ? '▼' : '►' }}</span>
          </div>
          @if (expandedDomains.has(domain.id)) {
            <table class="vd-table">
              <thead><tr><th style="width:100px">Código</th><th>Control</th><th style="width:180px">Madurez</th><th style="width:200px">Hallazgo</th></tr></thead>
              <tbody>
                @for (control of domain.controls; track control.id) {
                  <tr>
                    <td><strong>{{ control.code }}</strong></td>
                    <td><div>{{ control.name }}</div><small style="color:#64748b">{{ control.statement }}</small></td>
                    <td><select class="vd-select" [ngModel]="getMaturity(control.id)" (ngModelChange)="setMaturity(control.id, $event)"><option [ngValue]="0">Sin evaluar</option><option [ngValue]="1">1 - Inexistente</option><option [ngValue]="2">2 - Inicial</option><option [ngValue]="3">3 - Definido</option><option [ngValue]="4">4 - Gestionado</option><option [ngValue]="5">5 - Optimizado</option></select></td>
                    <td><input class="vd-input" placeholder="Hallazgo..." [ngModel]="getFinding(control.id)" (ngModelChange)="setFinding(control.id, $event)"></td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
      <div class="step-actions"><button class="vd-btn vd-btn-secondary" (click)="goToStep(1)">← Anterior</button><button class="vd-btn vd-btn-primary" (click)="saveEvaluation()" [disabled]="saving()">{{ saving() ? 'Guardando...' : 'Guardar y Ver Resultados →' }}</button></div>
    }

    <!-- Step 3: Results & GAP Report -->
    @if (currentStep() === 3) {
      <!-- Metrics Summary -->
      <div class="results-grid">
        <div class="vd-card metric"><div class="metric-value">{{ globalMaturityPercent() | number:'1.0-0' }}%</div><div class="metric-label">Madurez Global ({{ globalMaturity() | number:'1.1-1' }}/5)</div><div class="metric-bar vd-progress-bar"><div class="vd-progress-fill" [style.width.%]="globalMaturityPercent()"></div></div></div>
        <div class="vd-card metric"><div class="metric-value" [style.color]="isLargeScale() ? '#ef4444' : '#22c55e'">{{ isLargeScale() ? 'Sí' : 'No' }}</div><div class="metric-label">Gran Escala</div>
          <div class="large-scale-toggle"><label class="chip small" [class.selected]="manualLargeScale !== null"><input type="checkbox" [checked]="manualLargeScale !== null" (change)="toggleManualLargeScale()"><span>Definir manualmente</span></label>
            @if (manualLargeScale !== null) { <select class="vd-select" style="max-width:100px;margin-top:0.5rem" [(ngModel)]="manualLargeScale"><option [ngValue]="true">Sí</option><option [ngValue]="false">No</option></select> }
          </div>
        </div>
        <div class="vd-card metric"><div class="metric-value" style="color:#ef4444">{{ gaps().length }}</div><div class="metric-label">Brechas Detectadas</div>
          <div style="margin-top:0.5rem; display:flex; gap:0.5rem; justify-content:center; flex-wrap:wrap">
            <span class="vd-badge vd-badge-alta">{{ gapCountByImpact('alta') }} Alta</span>
            <span class="vd-badge vd-badge-media">{{ gapCountByImpact('media') }} Media</span>
            <span class="vd-badge vd-badge-baja">{{ gapCountByImpact('baja') }} Baja</span>
          </div>
        </div>
      </div>

      <!-- Maturity by Domain -->
      <div class="vd-card">
        <h3>📊 Madurez por Dominio</h3>
        @for (dm of domainMaturity(); track dm.domain_id) {
          <div class="domain-score"><div class="ds-label"><span>{{ dm.domain_code }}</span><strong>{{ dm.avg_maturity | number:'1.1-1' }}/5 ({{ (dm.avg_maturity / 5) * 100 | number:'1.0-0' }}%)</strong></div><div class="vd-progress-bar"><div class="vd-progress-fill" [style.width.%]="(dm.avg_maturity / 5) * 100" [style.background]="dm.avg_maturity >= 4 ? 'linear-gradient(90deg,#22c55e,#4ade80)' : dm.avg_maturity >= 3 ? 'linear-gradient(90deg,#5687f3,#7ba3f7)' : dm.avg_maturity >= 2 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)'"></div></div></div>
        }
      </div>

      <!-- Structured GAP Report -->
      <div class="vd-card gap-report" style="margin-top:1.25rem">
        <div class="section-header">
          <div><h3>🔎 Informe de Análisis GAP</h3><small style="color:#64748b">Análisis de brechas de cumplimiento</small></div>
          <button class="vd-btn vd-btn-primary vd-btn-sm" (click)="generateGaps()" [disabled]="generatingGaps()">{{ generatingGaps() ? 'Generando...' : 'Generar Brechas' }}</button>
        </div>
        @if (gaps().length) {
          <!-- Gap summary cards -->
          <div class="gap-summary">
            <div class="gap-stat alta"><div class="gap-stat-num">{{ gapCountByImpact('alta') }}</div><div class="gap-stat-label">Impacto Alto</div></div>
            <div class="gap-stat media"><div class="gap-stat-num">{{ gapCountByImpact('media') }}</div><div class="gap-stat-label">Impacto Medio</div></div>
            <div class="gap-stat baja"><div class="gap-stat-num">{{ gapCountByImpact('baja') }}</div><div class="gap-stat-label">Impacto Bajo</div></div>
          </div>
          <!-- Gaps grouped by domain -->
          @for (domain of gapDomains(); track domain) {
            <div class="gap-domain-section">
              <h4 class="gap-domain-title">{{ domain }}</h4>
              @for (g of gapsByDomain(domain); track g.id) {
                <div class="gap-item" [class]="'gap-item-' + g.impact">
                  <div class="gap-item-header">
                    <div class="gap-item-code"><strong>{{ g.control_code }}</strong></div>
                    <span class="vd-badge" [class]="'vd-badge-' + g.impact">{{ g.impact | uppercase }}</span>
                  </div>
                  <div class="gap-item-body">
                    <div class="gap-field"><label>Hallazgo</label><p>{{ g.finding }}</p></div>
                    <div class="gap-field"><label>Recomendación</label><p>{{ g.recommendation }}</p></div>
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>

      <!-- Executive AI Report -->
      <div class="vd-card" style="margin-top:1.25rem">
        <div class="section-header"><h3>🤖 Informe Ejecutivo IA</h3><button class="vd-btn vd-btn-primary vd-btn-sm" (click)="generateAiReport()" [disabled]="generatingReport()">{{ generatingReport() ? 'Generando...' : 'Generar con IA' }}</button></div>
        @if (report()) {
          <div class="report"><div class="report-meta"><span class="vd-badge vd-badge-medio">{{ report()!.generated_by }}</span>@if (report()!.provider) { <span class="vd-badge vd-badge-bajo">{{ report()!.provider }}</span> }</div>
            <h4>Resumen Ejecutivo</h4><p>{{ report()!.executive_summary }}</p>
            <h4>Top Riesgos</h4><ul>@for (r of report()!.top_risks; track r) { <li>{{ r }}</li> }</ul>
            <h4>Quick Wins</h4><ul>@for (q of report()!.quick_wins; track q) { <li>✅ {{ q }}</li> }</ul>
          </div>
        }
      </div>
      <div class="step-actions"><button class="vd-btn vd-btn-secondary" (click)="goToStep(2)">← Anterior</button><button class="vd-btn vd-btn-primary" (click)="generateActionPlan()">Generar Plan de Acción →</button></div>
    }

    <!-- Step 4: Action Plan -->
    @if (currentStep() === 4) {
      <div class="vd-card">
        <div class="section-header"><h3>📋 Plan de Acción</h3>
          <div style="display:flex;gap:0.5rem">
            <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="showDeliverables = true">📂 Entregables</button>
            <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="shareProject()">🔗 Compartir</button>
          </div>
        </div>
        @if (actionItems().length === 0) { <p style="color:#64748b;text-align:center;padding:2rem;">No hay acciones generadas. Vuelve al paso anterior y genera las brechas primero.</p> }
        @for (item of actionItems(); track item.id) {
          <div class="action-item vd-card" style="margin-top:0.75rem">
            <div class="ai-header"><div><strong>{{ item.title }}</strong><p class="ai-desc">{{ item.description }}</p></div><span class="vd-badge" [class]="'vd-badge-' + item.priority">{{ item.priority | uppercase }}</span></div>
            <div class="ai-controls">
              <div class="ai-field"><label>Estado</label>
                <select class="vd-select" [ngModel]="item.status" (ngModelChange)="updateActionField(item.id, 'status', $event)"><option value="pendiente">Pendiente</option><option value="en_progreso">En Progreso</option><option value="completada">Completada</option><option value="cancelada">Cancelada</option></select>
              </div>
              <div class="ai-field"><label>Prioridad</label>
                <select class="vd-select" [ngModel]="item.priority" (ngModelChange)="updateActionField(item.id, 'priority', $event)"><option value="critica">Crítica</option><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select>
              </div>
              <div class="ai-field"><label>Responsable</label>
                <select class="vd-select" [ngModel]="item.assigned_to" (ngModelChange)="updateActionField(item.id, 'assigned_to', $event)"><option [ngValue]="null">Sin asignar</option>@for (u of teamUsers(); track u.id) { <option [ngValue]="u.id">{{ u.name }}</option> }</select>
              </div>
              <div class="ai-field"><label>Fecha objetivo</label>
                <input type="date" class="vd-input" [ngModel]="item.due_date ? item.due_date.split('T')[0] : ''" (ngModelChange)="updateActionField(item.id, 'due_date', $event)">
              </div>
            </div>
          </div>
        }
      </div>
      <div class="step-actions"><button class="vd-btn vd-btn-secondary" (click)="goToStep(3)">← Anterior</button><button class="vd-btn vd-btn-primary" (click)="finishProject()">Finalizar ✓</button></div>
    }

    <!-- Deliverables Panel (overlay) -->
    @if (showDeliverables) {
      <div class="deliverables-overlay" (click)="showDeliverables = false">
        <div class="deliverables-panel" (click)="$event.stopPropagation()">
          <div class="deliv-header">
            <h3>📂 Gestor de Entregables</h3>
            <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="showDeliverables = false">← Salir</button>
          </div>
          <div class="deliv-tabs">
            <button class="deliv-tab" [class.active]="deliverableTab === 'pending'" (click)="switchDeliverableTab('pending')">Pendientes ({{ deliverablesByStatus('pending').length }})</button>
            <button class="deliv-tab" [class.active]="deliverableTab === 'generated'" (click)="switchDeliverableTab('generated')">Generados ({{ deliverablesByStatus('generated').length + deliverablesByStatus('uploaded').length }})</button>
          </div>
          @if (deliverables().length === 0) {
            <div style="text-align:center;padding:2rem;color:#64748b">
              <p>No hay entregables generados.</p>
              <button class="vd-btn vd-btn-primary vd-btn-sm" style="margin-top:1rem" (click)="generateDeliverablesList()" [disabled]="generatingDeliverables()">{{ generatingDeliverables() ? 'Generando...' : 'Generar Entregables' }}</button>
            </div>
          }
          <div class="deliv-content">
            <div class="deliv-list">
              @for (d of currentDeliverables(); track d.id) {
                <div class="deliv-item" [class.active]="selectedDeliverable()?.id === d.id" (click)="selectedDeliverable.set(d)">
                  <strong>{{ d.title }}</strong>
                  <small>{{ d.description }}</small>
                  <span class="vd-badge vd-badge-baja">{{ d.domain_name }}</span>
                </div>
              }
            </div>
            <div class="deliv-detail">
              @if (selectedDeliverable()) {
                <h4>{{ selectedDeliverable()!.title }}</h4>
                <p style="color:#64748b;margin-bottom:1rem">{{ selectedDeliverable()!.description }}</p>
                <div class="deliv-actions">
                  <select class="vd-select" [ngModel]="selectedDeliverable()!.status" (ngModelChange)="updateDeliverableStatus(selectedDeliverable()!.id, $event)"><option value="pending">Pendiente</option><option value="generated">Generado</option><option value="uploaded">Cargado</option></select>
                </div>
                @if (selectedDeliverable()!.content) {
                  <div class="deliv-content-text" style="margin-top:1rem;padding:1rem;background:#f8fafc;border-radius:8px;font-size:0.875rem;white-space:pre-wrap">{{ selectedDeliverable()!.content }}</div>
                } @else {
                  <div style="margin-top:2rem;text-align:center;padding:2rem;background:#f8fafc;border-radius:12px">
                    <div style="font-size:2.5rem;opacity:0.3">📄</div>
                    <p style="color:#64748b;margin-top:0.5rem">Seleccione un entregable del menú lateral.</p>
                  </div>
                }
              } @else {
                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b">
                  <div style="text-align:center">
                    <div style="font-size:3rem;opacity:0.3">📄</div>
                    <p style="margin-top:0.5rem">Seleccione un entregable del menú lateral.</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }

    @if (sharedUrl()) { <div class="share-toast vd-card">🔗 Enlace compartido: <a [href]="sharedUrl()" target="_blank">{{ sharedUrl() }}</a></div> }
  `,
  styles: [`
    h2 { margin: 0 0 1.5rem; font-size: 1.25rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; }
    .form-group.full { grid-column: 1 / -1; }
    .step-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
    .chip-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .chip { display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.8125rem; cursor: pointer; transition: all 0.2s; background: white; }
    .chip:hover { border-color: #5687f3; }
    .chip.selected { background: rgba(86,135,243,0.1); border-color: #5687f3; color: #5687f3; font-weight: 600; }
    .chip.small { font-size: 0.75rem; padding: 0.25rem 0.5rem; }
    .chip input { display: none; }
    .alert-warn { background: rgba(245,158,11,0.1); color: #d97706; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; margin-top: 1rem; }
    .eval-header { margin-bottom: 1rem; }
    .eval-progress { display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem; font-size: 0.8125rem; color: #64748b; }
    .eval-progress .vd-progress-bar { flex: 1; }
    .domain-card { margin-bottom: 0.75rem; padding: 0; }
    .domain-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; cursor: pointer; border-radius: 16px; }
    .domain-header:hover { background: #f8fafc; }
    .domain-header h3 { margin: 0; font-size: 0.9375rem; }
    .toggle { color: #64748b; font-size: 0.75rem; }
    .results-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
    .metric { text-align: center; padding: 1.5rem; }
    .metric-value { font-size: 2rem; font-weight: 800; color: #5687f3; }
    .metric-label { font-size: 0.8125rem; color: #64748b; margin-top: 0.25rem; }
    .metric-bar { margin-top: 0.75rem; }
    .large-scale-toggle { margin-top: 0.75rem; }
    .domain-score { margin-bottom: 0.75rem; }
    .ds-label { display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.8125rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header h3 { margin: 0; }

    /* GAP Report styles */
    .gap-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
    .gap-stat { padding: 1rem; border-radius: 10px; text-align: center; }
    .gap-stat.alta { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); }
    .gap-stat.media { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); }
    .gap-stat.baja { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); }
    .gap-stat-num { font-size: 1.5rem; font-weight: 800; }
    .gap-stat.alta .gap-stat-num { color: #ef4444; }
    .gap-stat.media .gap-stat-num { color: #f59e0b; }
    .gap-stat.baja .gap-stat-num { color: #22c55e; }
    .gap-stat-label { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
    .gap-domain-section { margin-bottom: 1.5rem; }
    .gap-domain-title { font-size: 0.9375rem; font-weight: 700; padding: 0.5rem 0; border-bottom: 2px solid #e2e8f0; margin-bottom: 0.75rem; color: #1e293b; }
    .gap-item { padding: 1rem; border-radius: 10px; border-left: 4px solid #e2e8f0; margin-bottom: 0.75rem; background: #fafbfc; }
    .gap-item-alta { border-left-color: #ef4444; }
    .gap-item-media { border-left-color: #f59e0b; }
    .gap-item-baja { border-left-color: #22c55e; }
    .gap-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .gap-item-code { font-size: 0.875rem; }
    .gap-item-body { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .gap-field label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
    .gap-field p { font-size: 0.8125rem; color: #334155; margin: 0.25rem 0 0; line-height: 1.5; }

    /* Report */
    .report { font-size: 0.875rem; line-height: 1.6; }
    .report h4 { margin: 1.25rem 0 0.5rem; font-size: 0.9375rem; }
    .report-meta { display: flex; gap: 0.5rem; margin-bottom: 1rem; }

    /* Action Plan */
    .action-item { padding: 1rem !important; border: 1px solid #e2e8f0; }
    .ai-header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .ai-desc { color: #64748b; font-size: 0.8125rem; margin: 0.25rem 0 0.75rem; }
    .ai-controls { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
    .ai-field { display: flex; flex-direction: column; }
    .ai-field label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.25rem; letter-spacing: 0.05em; }

    /* Deliverables */
    .deliverables-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; }
    .deliverables-panel { background: white; border-radius: 16px; width: 90vw; max-width: 1100px; height: 80vh; display: flex; flex-direction: column; overflow: hidden; }
    .deliv-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; }
    .deliv-header h3 { margin: 0; }
    .deliv-tabs { display: flex; border-bottom: 1px solid #e2e8f0; }
    .deliv-tab { padding: 0.75rem 1.5rem; background: none; border: none; cursor: pointer; font-size: 0.875rem; color: #64748b; border-bottom: 2px solid transparent; }
    .deliv-tab.active { color: #5687f3; border-bottom-color: #5687f3; font-weight: 600; }
    .deliv-content { display: grid; grid-template-columns: 320px 1fr; flex: 1; overflow: hidden; }
    .deliv-list { overflow-y: auto; border-right: 1px solid #e2e8f0; padding: 0.5rem; }
    .deliv-item { padding: 0.75rem; border-radius: 8px; cursor: pointer; margin-bottom: 0.25rem; display: flex; flex-direction: column; gap: 0.25rem; }
    .deliv-item:hover { background: #f8fafc; }
    .deliv-item.active { background: rgba(86,135,243,0.08); border: 1px solid rgba(86,135,243,0.2); }
    .deliv-item strong { font-size: 0.8125rem; }
    .deliv-item small { font-size: 0.75rem; color: #64748b; }
    .deliv-detail { padding: 1.5rem; overflow-y: auto; }
    .deliv-actions { display: flex; gap: 0.75rem; align-items: center; }

    .share-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 50; background: #0d1321; color: white; padding: 1rem 1.5rem; }
    .share-toast a { color: #5687f3; }

    .vd-badge-alta { background: rgba(239,68,68,0.1); color: #dc2626; }
    .vd-badge-media { background: rgba(245,158,11,0.1); color: #d97706; }
    .vd-badge-baja { background: rgba(34,197,94,0.1); color: #16a34a; }
    .vd-badge-critica { background: rgba(127,29,29,0.1); color: #991b1b; }

    @media (max-width: 768px) { .form-grid, .results-grid, .gap-summary { grid-template-columns: 1fr; } .ai-controls { grid-template-columns: 1fr 1fr; } .gap-item-body { grid-template-columns: 1fr; } }
  `],
})
export class ProjectWizardComponent implements OnInit {
  steps = [{ num: 1, label: 'Información' }, { num: 2, label: 'Evaluación' }, { num: 3, label: 'Resultados' }, { num: 4, label: 'Plan de Acción' }];
  currentStep = signal(1);
  isEdit = false;
  projectId = 0;

  project: { name: string; description: string; framework_id: number; data_subjects_count: number; data_categories: string[]; large_scale?: boolean } = { name: '', description: '', framework_id: 0, data_subjects_count: 0, data_categories: [] };
  frameworks = signal<Framework[]>([]);
  domains = signal<ControlDomain[]>([]);
  evaluationMap = signal<Map<number, { maturity_level: number; findings: string }>>(new Map());
  expandedDomains = new Set<number>();

  gaps = signal<Gap[]>([]);
  actionItems = signal<ActionItem[]>([]);
  report = signal<ExecutiveReport | null>(null);
  domainMaturity = signal<DomainMaturity[]>([]);
  globalMaturity = signal(0);
  sharedUrl = signal('');
  teamUsers = signal<User[]>([]);
  deliverables = signal<Deliverable[]>([]);
  selectedDeliverable = signal<Deliverable | null>(null);

  saving = signal(false);
  generatingGaps = signal(false);
  generatingReport = signal(false);
  generatingDeliverables = signal(false);

  manualLargeScale: boolean | null = null;
  showDeliverables = false;
  deliverableTab: 'pending' | 'generated' = 'pending';

  dataCategories = ['Identificación', 'Contacto', 'Financieros', 'Salud', 'Biométricos', 'Geolocalización', 'Ideología', 'Orientación sexual', 'Origen étnico', 'Antecedentes penales', 'Datos de menores'];

  totalControls = computed(() => this.domains().reduce((sum: number, d: ControlDomain) => sum + d.controls.length, 0));
  evaluatedCount = computed(() => [...this.evaluationMap().values()].filter((e: { maturity_level: number }) => e.maturity_level > 0).length);
  evaluationProgress = computed(() => this.totalControls() ? (this.evaluatedCount() / this.totalControls()) * 100 : 0);
  globalMaturityPercent = computed(() => (this.globalMaturity() / 5) * 100); // Convertir escala 0-5 a 0-100%

  constructor(private api: ApiService, private auth: AuthService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.api.getFrameworks().subscribe({ next: (f: Framework[]) => this.frameworks.set(f) });
    this.api.getUsers().subscribe({ next: (res: { data: User[] }) => this.teamUsers.set(res.data) });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true; this.projectId = +id;
      this.api.getProject(this.projectId).subscribe({
        next: (p: Project) => {
          this.project = { name: p.name, description: p.description, framework_id: p.framework?.id || 0, data_subjects_count: p.data_subjects_count, data_categories: p.data_categories || [], large_scale: p.large_scale };
          this.loadEvaluation();
        }
      });
    }
  }

  isCategorySelected(cat: string): boolean { return this.project.data_categories.includes(cat); }
  toggleCategory(cat: string): void { this.project.data_categories = this.isCategorySelected(cat) ? this.project.data_categories.filter((c: string) => c !== cat) : [...this.project.data_categories, cat]; }
  hasSpecialCategory(): boolean { return ['Salud', 'Biométricos', 'Ideología', 'Orientación sexual', 'Origen étnico', 'Antecedentes penales', 'Datos de menores'].some((c: string) => this.project.data_categories.includes(c)); }

  toggleDomain(id: number): void { this.expandedDomains.has(id) ? this.expandedDomains.delete(id) : this.expandedDomains.add(id); }
  getMaturity(controlId: number): number { return this.evaluationMap().get(controlId)?.maturity_level ?? 0; }
  getFinding(controlId: number): string { return this.evaluationMap().get(controlId)?.findings ?? ''; }
  setMaturity(controlId: number, val: number): void {
    const newMap = new Map(this.evaluationMap());
    const e = newMap.get(controlId) || { maturity_level: 0, findings: '' };
    e.maturity_level = val;
    newMap.set(controlId, e);
    this.evaluationMap.set(newMap);
  }
  setFinding(controlId: number, val: string): void {
    const newMap = new Map(this.evaluationMap());
    const e = newMap.get(controlId) || { maturity_level: 0, findings: '' };
    e.findings = val;
    newMap.set(controlId, e);
    this.evaluationMap.set(newMap);
  }

  goToStep(step: number): void { this.currentStep.set(step); }

  isLargeScale(): boolean {
    if (this.manualLargeScale !== null) return this.manualLargeScale;
    return this.project.large_scale ?? false;
  }

  toggleManualLargeScale(): void {
    this.manualLargeScale = this.manualLargeScale === null ? this.isLargeScale() : null;
  }

  gapCountByImpact(impact: string): number { return this.gaps().filter(g => g.impact === impact).length; }
  gapDomains(): string[] { return [...new Set(this.gaps().map(g => g.domain))]; }
  gapsByDomain(domain: string): Gap[] { return this.gaps().filter(g => g.domain === domain); }

  deliverablesByStatus(status: string): Deliverable[] { return this.deliverables().filter(d => d.status === status); }
  currentDeliverables(): Deliverable[] {
    if (this.deliverableTab === 'pending') return this.deliverablesByStatus('pending');
    return this.deliverables().filter(d => d.status === 'generated' || d.status === 'uploaded');
  }

  switchDeliverableTab(tab: 'pending' | 'generated'): void {
    this.deliverableTab = tab;
    // Mantener selección solo si el entregable existe en la nueva pestaña
    const currentSelection = this.selectedDeliverable();
    if (currentSelection) {
      const existsInNewTab = this.currentDeliverables().some(d => d.id === currentSelection.id);
      if (!existsInNewTab) {
        this.selectedDeliverable.set(null);
      }
    }
  }

  saveProject(): void {
    this.saving.set(true);
    const obs = this.isEdit ? this.api.updateProject(this.projectId, this.project) : this.api.createProject(this.project);
    obs.subscribe({
      next: (res: Project) => { this.projectId = res.id; this.isEdit = true; this.saving.set(false); this.loadEvaluation(); this.goToStep(2); },
      error: () => this.saving.set(false),
    });
  }

  loadEvaluation(): void {
    if (this.projectId && this.project.framework_id) {
      this.api.getControls(this.project.framework_id).subscribe({ next: (d: ControlDomain[]) => this.domains.set(d) });
      this.api.getEvaluation(this.projectId).subscribe({
        next: (res: { evaluations: Evaluation[]; maturity_by_domain: DomainMaturity[]; global_maturity: number }) => {
          const newMap = new Map<number, { maturity_level: number; findings: string }>();
          res.evaluations.forEach((ev: Evaluation) => newMap.set(ev.control_id, { maturity_level: ev.maturity_level, findings: ev.findings || '' }));
          this.evaluationMap.set(newMap);
          this.domainMaturity.set(res.maturity_by_domain); this.globalMaturity.set(res.global_maturity);
        }
      });
      this.api.getGaps(this.projectId).subscribe({ next: (res: { gaps: Gap[] }) => this.gaps.set(res.gaps) });
      this.api.getActionPlan(this.projectId).subscribe({ next: (res: { action_items: ActionItem[] }) => this.actionItems.set(res.action_items) });
      this.api.getDeliverables(this.projectId).subscribe({ next: (res: { deliverables: Deliverable[] }) => this.deliverables.set(res.deliverables) });
    }
  }

  saveEvaluation(): void {
    this.saving.set(true);
    const evals = [...this.evaluationMap().entries()].filter(([, v]) => v.maturity_level > 0).map(([controlId, v]) => ({ control_id: controlId, maturity_level: v.maturity_level, findings: v.findings || null }));
    this.api.saveEvaluation(this.projectId, evals).subscribe({
      next: () => { this.saving.set(false); this.loadEvaluation(); this.goToStep(3); },
      error: () => this.saving.set(false),
    });
  }

  generateGaps(): void {
    this.generatingGaps.set(true);
    this.api.generateGaps(this.projectId).subscribe({
      next: (res: { gaps: Gap[] }) => {
        this.gaps.set(res.gaps);
        this.generatingGaps.set(false);
        // Reload project to get updated large_scale + dpo_required
        this.api.getProject(this.projectId).subscribe({
          next: (p: Project) => { this.project.large_scale = p.large_scale; }
        });
      },
      error: () => this.generatingGaps.set(false)
    });
  }

  generateAiReport(): void {
    this.generatingReport.set(true);
    this.api.generateExecutiveReport(this.projectId).subscribe({
      next: (r: ExecutiveReport) => { this.report.set(r); this.generatingReport.set(false); },
      error: (err) => {
        this.generatingReport.set(false);
        if (err.status === 429) {
          alert('Has alcanzado el límite de generación de reportes. Por favor espera un momento e intenta de nuevo.');
        } else {
          alert('Error al generar el reporte: ' + (err.error?.message || 'Inténtalo de nuevo'));
        }
      }
    });
  }

  generateActionPlan(): void { this.api.generateActionPlan(this.projectId).subscribe({ next: (res: { action_items: ActionItem[] }) => { this.actionItems.set(res.action_items); this.goToStep(4); } }); }

  updateActionField(itemId: number, field: string, value: unknown): void {
    this.api.updateActionItem(this.projectId, itemId, { [field]: value } as Partial<ActionItem>).subscribe({
      next: (res: { action_item: ActionItem }) => {
        const items = this.actionItems().map(i => i.id === itemId ? { ...i, ...res.action_item } : i);
        this.actionItems.set(items);
      }
    });
  }

  generateDeliverablesList(): void {
    this.generatingDeliverables.set(true);
    this.api.generateDeliverables(this.projectId).subscribe({
      next: (res: { deliverables: Deliverable[] }) => { this.deliverables.set(res.deliverables); this.generatingDeliverables.set(false); },
      error: () => this.generatingDeliverables.set(false)
    });
  }

  updateDeliverableStatus(delivId: number, status: string): void {
    this.api.updateDeliverable(this.projectId, delivId, { status: status as Deliverable['status'] }).subscribe({
      next: (res: { deliverable: Deliverable }) => {
        const items = this.deliverables().map(d => d.id === delivId ? res.deliverable : d);
        this.deliverables.set(items);
        if (this.selectedDeliverable()?.id === delivId) this.selectedDeliverable.set(res.deliverable);
      }
    });
  }

  shareProject(): void { this.api.createSharedLink(this.projectId, 'action_plan').subscribe({ next: (res: { url: string }) => this.sharedUrl.set(res.url) }); }

  finishProject(): void {
    const pendingDeliverables = this.deliverablesByStatus('pending').length;
    const pendingActions = this.actionItems().filter(i => i.status === 'pendiente').length;

    if (pendingDeliverables > 0 || pendingActions > 0) {
      const msg = `Hay elementos pendientes:\n${pendingDeliverables} entregables pendientes\n${pendingActions} acciones pendientes\n\n¿Deseas finalizar de todas formas?`;
      if (!confirm(msg)) return;
    }
    // Actualizar status a completed
    this.api.updateProject(this.projectId, { status: 'completed' }).subscribe({
      next: () => this.router.navigate(['/projects']),
      error: () => this.router.navigate(['/projects'])
    });
  }
}
