import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Project, Framework, ControlDomain, Evaluation, Gap, ActionItem, ExecutiveReport, DomainMaturity
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

    <!-- Step 3: Results -->
    @if (currentStep() === 3) {
      <div class="results-grid">
        <div class="vd-card metric"><div class="metric-value">{{ globalMaturity() | number:'1.1-1' }}</div><div class="metric-label">Madurez Global</div><div class="metric-bar vd-progress-bar"><div class="vd-progress-fill" [style.width.%]="globalMaturity() * 20"></div></div></div>
        <div class="vd-card metric"><div class="metric-value" [style.color]="project.data_subjects_count > 50000 ? '#ef4444' : '#22c55e'">{{ project.data_subjects_count > 50000 ? 'Sí' : 'No' }}</div><div class="metric-label">Gran Escala</div></div>
        <div class="vd-card metric"><div class="metric-value">{{ gaps().length }}</div><div class="metric-label">Brechas Detectadas</div></div>
      </div>
      <div class="vd-card">
        <h3>📊 Madurez por Dominio</h3>
        @for (dm of domainMaturity(); track dm.domain_id) {
          <div class="domain-score"><div class="ds-label"><span>{{ dm.domain_code }}</span><strong>{{ dm.avg_maturity | number:'1.1-1' }}</strong></div><div class="vd-progress-bar"><div class="vd-progress-fill" [style.width.%]="dm.avg_maturity * 20" [style.background]="dm.avg_maturity >= 4 ? 'linear-gradient(90deg,#22c55e,#4ade80)' : dm.avg_maturity >= 3 ? 'linear-gradient(90deg,#5687f3,#7ba3f7)' : dm.avg_maturity >= 2 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)'"></div></div></div>
        }
      </div>
      <div class="vd-card" style="margin-top:1.25rem">
        <div class="section-header"><h3>🔎 Informe GAP</h3><button class="vd-btn vd-btn-primary vd-btn-sm" (click)="generateGaps()" [disabled]="generatingGaps()">{{ generatingGaps() ? 'Generando...' : 'Generar Brechas' }}</button></div>
        @if (gaps().length) {
          <table class="vd-table"><thead><tr><th>Dominio</th><th>Control</th><th>Hallazgo</th><th>Impacto</th><th>Recomendación</th></tr></thead><tbody>@for (g of gaps(); track g.id) { <tr><td>{{ g.domain }}</td><td><strong>{{ g.control_code }}</strong></td><td>{{ g.finding }}</td><td><span class="vd-badge" [class]="'vd-badge-' + g.impact">{{ g.impact }}</span></td><td style="max-width:200px">{{ g.recommendation }}</td></tr> }</tbody></table>
        }
      </div>
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
        <div class="section-header"><h3>📋 Plan de Acción</h3><button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="shareProject()">🔗 Compartir</button></div>
        @if (actionItems().length === 0) { <p style="color:#64748b;text-align:center;padding:2rem;">No hay acciones generadas. Vuelve al paso anterior y genera las brechas primero.</p> }
        @for (item of actionItems(); track item.id) {
          <div class="action-item vd-card" style="margin-top:0.75rem">
            <div class="ai-header"><div><strong>{{ item.title }}</strong><p class="ai-desc">{{ item.description }}</p></div><span class="vd-badge" [class]="'vd-badge-' + item.priority">{{ item.priority }}</span></div>
            <div class="ai-controls">
              <select class="vd-select" style="max-width:160px" [ngModel]="item.status" (ngModelChange)="updateActionStatus(item.id, $event)"><option value="pendiente">Pendiente</option><option value="en_progreso">En Progreso</option><option value="completada">Completada</option><option value="cancelada">Cancelada</option></select>
              @if (item.due_date) { <small style="color:#64748b">📅 {{ item.due_date }}</small> }
            </div>
          </div>
        }
      </div>
      <div class="step-actions"><button class="vd-btn vd-btn-secondary" (click)="goToStep(3)">← Anterior</button><a routerLink="/projects" class="vd-btn vd-btn-primary">Finalizar ✓</a></div>
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
    .domain-score { margin-bottom: 0.75rem; }
    .ds-label { display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.8125rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header h3 { margin: 0; }
    .report { font-size: 0.875rem; line-height: 1.6; }
    .report h4 { margin: 1.25rem 0 0.5rem; font-size: 0.9375rem; }
    .report-meta { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .action-item { padding: 1rem !important; border: 1px solid #e2e8f0; }
    .ai-header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .ai-desc { color: #64748b; font-size: 0.8125rem; margin: 0.25rem 0 0.75rem; }
    .ai-controls { display: flex; align-items: center; gap: 1rem; }
    .share-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 50; background: #0d1321; color: white; padding: 1rem 1.5rem; }
    .share-toast a { color: #5687f3; }
    @media (max-width: 768px) { .form-grid, .results-grid { grid-template-columns: 1fr; } }
  `],
})
export class ProjectWizardComponent implements OnInit {
  steps = [{ num: 1, label: 'Información' }, { num: 2, label: 'Evaluación' }, { num: 3, label: 'Resultados' }, { num: 4, label: 'Plan de Acción' }];
  currentStep = signal(1);
  isEdit = false;
  projectId = 0;

  project: { name: string; description: string; framework_id: number; data_subjects_count: number; data_categories: string[] } = { name: '', description: '', framework_id: 0, data_subjects_count: 0, data_categories: [] };
  frameworks = signal<Framework[]>([]);
  domains = signal<ControlDomain[]>([]);
  evaluationMap = new Map<number, { maturity_level: number; findings: string }>();
  expandedDomains = new Set<number>();

  gaps = signal<Gap[]>([]);
  actionItems = signal<ActionItem[]>([]);
  report = signal<ExecutiveReport | null>(null);
  domainMaturity = signal<DomainMaturity[]>([]);
  globalMaturity = signal(0);
  sharedUrl = signal('');

  saving = signal(false);
  generatingGaps = signal(false);
  generatingReport = signal(false);

  dataCategories = ['Identificación', 'Contacto', 'Financieros', 'Salud', 'Biométricos', 'Geolocalización', 'Ideología', 'Orientación sexual', 'Origen étnico', 'Antecedentes penales', 'Datos de menores'];

  totalControls = computed(() => this.domains().reduce((sum: number, d: ControlDomain) => sum + d.controls.length, 0));
  evaluatedCount = computed(() => [...this.evaluationMap.values()].filter((e: { maturity_level: number }) => e.maturity_level > 0).length);
  evaluationProgress = computed(() => this.totalControls() ? (this.evaluatedCount() / this.totalControls()) * 100 : 0);

  constructor(private api: ApiService, private auth: AuthService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.api.getFrameworks().subscribe({ next: (f: Framework[]) => this.frameworks.set(f) });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true; this.projectId = +id;
      this.api.getProject(this.projectId).subscribe({
        next: (p: Project) => {
          this.project = { name: p.name, description: p.description, framework_id: p.framework?.id || 0, data_subjects_count: p.data_subjects_count, data_categories: p.data_categories || [] };
          this.loadEvaluation();
        }
      });
    }
  }

  isCategorySelected(cat: string): boolean { return this.project.data_categories.includes(cat); }
  toggleCategory(cat: string): void { this.project.data_categories = this.isCategorySelected(cat) ? this.project.data_categories.filter((c: string) => c !== cat) : [...this.project.data_categories, cat]; }
  hasSpecialCategory(): boolean { return ['Salud', 'Biométricos', 'Ideología', 'Orientación sexual', 'Origen étnico', 'Antecedentes penales', 'Datos de menores'].some((c: string) => this.project.data_categories.includes(c)); }

  toggleDomain(id: number): void { this.expandedDomains.has(id) ? this.expandedDomains.delete(id) : this.expandedDomains.add(id); }
  getMaturity(controlId: number): number { return this.evaluationMap.get(controlId)?.maturity_level ?? 0; }
  getFinding(controlId: number): string { return this.evaluationMap.get(controlId)?.findings ?? ''; }
  setMaturity(controlId: number, val: number): void { const e = this.evaluationMap.get(controlId) || { maturity_level: 0, findings: '' }; e.maturity_level = val; this.evaluationMap.set(controlId, e); }
  setFinding(controlId: number, val: string): void { const e = this.evaluationMap.get(controlId) || { maturity_level: 0, findings: '' }; e.findings = val; this.evaluationMap.set(controlId, e); }

  goToStep(step: number): void { this.currentStep.set(step); }

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
          res.evaluations.forEach((ev: Evaluation) => this.evaluationMap.set(ev.control_id, { maturity_level: ev.maturity_level, findings: ev.findings || '' }));
          this.domainMaturity.set(res.maturity_by_domain); this.globalMaturity.set(res.global_maturity);
        }
      });
      this.api.getGaps(this.projectId).subscribe({ next: (res: { gaps: Gap[] }) => this.gaps.set(res.gaps) });
      this.api.getActionPlan(this.projectId).subscribe({ next: (res: { action_items: ActionItem[] }) => this.actionItems.set(res.action_items) });
    }
  }

  saveEvaluation(): void {
    this.saving.set(true);
    const evals = [...this.evaluationMap.entries()].filter(([, v]) => v.maturity_level > 0).map(([controlId, v]) => ({ control_id: controlId, maturity_level: v.maturity_level, findings: v.findings || null }));
    this.api.saveEvaluation(this.projectId, evals).subscribe({
      next: () => { this.saving.set(false); this.loadEvaluation(); this.goToStep(3); },
      error: () => this.saving.set(false),
    });
  }

  generateGaps(): void { this.generatingGaps.set(true); this.api.generateGaps(this.projectId).subscribe({ next: (res: { gaps: Gap[] }) => { this.gaps.set(res.gaps); this.generatingGaps.set(false); }, error: () => this.generatingGaps.set(false) }); }
  generateAiReport(): void { this.generatingReport.set(true); this.api.generateExecutiveReport(this.projectId).subscribe({ next: (r: ExecutiveReport) => { this.report.set(r); this.generatingReport.set(false); }, error: () => this.generatingReport.set(false) }); }
  generateActionPlan(): void { this.api.generateActionPlan(this.projectId).subscribe({ next: (res: { action_items: ActionItem[] }) => { this.actionItems.set(res.action_items); this.goToStep(4); } }); }
  updateActionStatus(itemId: number, status: string): void { this.api.updateActionItem(this.projectId, itemId, { status: status as ActionItem['status'] }).subscribe(); }
  shareProject(): void { this.api.createSharedLink(this.projectId, 'action_plan').subscribe({ next: (res: { url: string }) => this.sharedUrl.set(res.url) }); }
}
