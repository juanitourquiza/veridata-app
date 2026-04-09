import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { ModalService } from '../shared/modal.service';

interface Project {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="tools-page">
      <h1>🛠️ Herramientas y Registros PDP</h1>
      <p class="subtitle">Selecciona un proyecto para acceder a las herramientas específicas</p>

      @if (!selectedProject()) {
        <!-- Lista de Proyectos -->
        <div class="vd-card">
          <h2>📁 Selecciona un Proyecto</h2>
          @if (loading()) {
            <div class="loading">Cargando proyectos...</div>
          } @else if (projects().length === 0) {
            <div class="empty-state">
              <p>No tienes proyectos creados.</p>
              <a routerLink="/projects/new" class="vd-btn vd-btn-primary">Crear Proyecto</a>
            </div>
          } @else {
            <div class="projects-grid">
              @for (project of projects(); track project.id) {
                <div class="project-card" (click)="selectProject(project)">
                  <div class="project-icon">📁</div>
                  <div class="project-info">
                    <strong>{{ project.name }}</strong>
                    <span class="project-status" [class]="project.status">{{ project.status }}</span>
                  </div>
                  <span class="select-arrow">→</span>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <!-- Proyecto Seleccionado + Herramientas -->
        <div class="vd-card selected-project">
          <div class="project-header">
            <h2>📁 {{ selectedProject()?.name }}</h2>
            <button class="vd-btn vd-btn-secondary" (click)="clearSelection()">Cambiar Proyecto</button>
          </div>
        </div>

        <!-- Categorías de Herramientas -->
        <div class="tools-grid">
          <!-- RAT y Evaluaciones -->
          <div class="tool-category">
            <h3>📝 RAT, Riesgos e Impacto</h3>
            <div class="tool-list">
              <a [routerLink]="['/tools/rat']" [queryParams]="{project_id: selectedProject()?.id}" class="tool-item">
                <span class="tool-icon">📋</span>
                <div class="tool-info">
                  <strong>Registro de Actividades (RAT)</strong>
                  <span class="tool-desc">Art. 14 LOPDP</span>
                </div>
                <span class="tool-arrow">→</span>
              </a>
              <a [routerLink]="['/tools/impact-assessment']" [queryParams]="{project_id: selectedProject()?.id}" class="tool-item">
                <span class="tool-icon">🔍</span>
                <div class="tool-info">
                  <strong>Evaluación de Impacto (EIPD)</strong>
                  <span class="tool-desc">Art. 28 LOPDP</span>
                </div>
                <span class="tool-arrow">→</span>
              </a>
            </div>
          </div>

          <!-- Calificaciones -->
          <div class="tool-category">
            <h3>⭐ Calificaciones</h3>
            <div class="tool-list">
              <a [routerLink]="['/tools/officer-qualification']" [queryParams]="{project_id: selectedProject()?.id}" class="tool-item">
                <span class="tool-icon">✅</span>
                <div class="tool-info">
                  <strong>Calificación de Encargados</strong>
                  <span class="tool-desc">Art. 25 LOPDP</span>
                </div>
                <span class="tool-arrow">→</span>
              </a>
              <a [routerLink]="['/tools/transfer-qualification']" [queryParams]="{project_id: selectedProject()?.id}" class="tool-item">
                <span class="tool-icon">🌐</span>
                <div class="tool-info">
                  <strong>Transferencias Internacionales</strong>
                  <span class="tool-desc">Art. 29 LOPDP</span>
                </div>
                <span class="tool-arrow">→</span>
              </a>
              <a [routerLink]="['/tools/qualifications-summary']" [queryParams]="{project_id: selectedProject()?.id}" class="tool-item">
                <span class="tool-icon">📊</span>
                <div class="tool-info">
                  <strong>Resumen de Calificaciones</strong>
                  <span class="tool-desc">Vista consolidada</span>
                </div>
                <span class="tool-arrow">→</span>
              </a>
            </div>
          </div>

          <!-- Registros -->
          <div class="tool-category">
            <h3>📋 Registros</h3>
            <div class="tool-list">
              <a [routerLink]="['/tools/rights-exercise']" [queryParams]="{project_id: selectedProject()?.id}" class="tool-item">
                <span class="tool-icon">🙋</span>
                <div class="tool-info">
                  <strong>Ejercicio de Derechos</strong>
                  <span class="tool-desc">Art. 10 LOPDP</span>
                </div>
                <span class="tool-arrow">→</span>
              </a>
              <a [routerLink]="['/tools/incidents']" [queryParams]="{project_id: selectedProject()?.id}" class="tool-item">
                <span class="tool-icon">🚨</span>
                <div class="tool-info">
                  <strong>Incidentes PDP</strong>
                  <span class="tool-desc">Banco de incidentes</span>
                </div>
                <span class="tool-arrow">→</span>
              </a>
            </div>
          </div>

          <!-- Herramientas -->
          <div class="tool-category">
            <h3>🧮 Herramientas</h3>
            <div class="tool-list">
              <a [routerLink]="['/tools/legitimacy-report']" [queryParams]="{project_id: selectedProject()?.id}" class="tool-item">
                <span class="tool-icon">📜</span>
                <div class="tool-info">
                  <strong>Informe de Legitimidad</strong>
                  <span class="tool-desc">Res. 041 SPDP</span>
                </div>
                <span class="tool-arrow">→</span>
              </a>
              <a [routerLink]="['/tools/sanctions-calculator']" [queryParams]="{project_id: selectedProject()?.id}" class="tool-item">
                <span class="tool-icon">⚖️</span>
                <div class="tool-info">
                  <strong>Calculadora de Sanciones</strong>
                  <span class="tool-desc">Modelo LOPDP</span>
                </div>
                <span class="tool-arrow">→</span>
              </a>
              <a [routerLink]="['/tools/large-scale-calculator']" [queryParams]="{project_id: selectedProject()?.id}" class="tool-item">
                <span class="tool-icon">🏭</span>
                <div class="tool-info">
                  <strong>Cálculo de Gran Escala</strong>
                  <span class="tool-desc">Metodología MTGE</span>
                </div>
                <span class="tool-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tools-page {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      font-size: 1.5rem;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #64748b;
      margin-bottom: 1.5rem;
    }
    .vd-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
      margin-bottom: 1.5rem;
    }
    .loading, .empty-state {
      text-align: center;
      padding: 2rem;
      color: #64748b;
    }
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    .project-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.2s;
    }
    .project-card:hover {
      background: #f8fafc;
      border-color: #5687f3;
    }
    .project-icon {
      font-size: 1.5rem;
    }
    .project-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .project-info strong {
      color: #1e293b;
    }
    .project-status {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
      display: inline-block;
      margin-top: 0.25rem;
      width: fit-content;
    }
    .project-status.draft {
      background: #fef3c7;
      color: #92400e;
    }
    .project-status.active {
      background: #d1fae5;
      color: #065f46;
    }
    .project-status.completed {
      background: #dbeafe;
      color: #1e40af;
    }
    .select-arrow {
      color: #94a3b8;
      font-size: 1.25rem;
    }
    .selected-project .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tools-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    @media (max-width: 768px) {
      .tools-grid {
        grid-template-columns: 1fr;
      }
    }
    .tool-category {
      background: #f8fafc;
      border-radius: 12px;
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
    }
    .tool-category h3 {
      margin: 0 0 1rem;
      font-size: 0.9375rem;
      color: #1e293b;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
    }
    .tool-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .tool-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      text-decoration: none;
      color: inherit;
    }
    .tool-item:hover {
      background: #e2e8f0;
    }
    .tool-icon {
      font-size: 1.25rem;
    }
    .tool-info {
      flex: 1;
    }
    .tool-info strong {
      display: block;
      font-size: 0.875rem;
      color: #1e293b;
    }
    .tool-desc {
      font-size: 0.75rem;
      color: #64748b;
    }
    .tool-arrow {
      color: #94a3b8;
    }
    .vd-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;
    }
    .vd-btn-primary {
      background: #5687f3;
      color: white;
    }
    .vd-btn-primary:hover {
      background: #4a6fd8;
    }
    .vd-btn-secondary {
      background: #e2e8f0;
      color: #475569;
    }
    .vd-btn-secondary:hover {
      background: #cbd5e1;
    }
  `]
})
export class ToolsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private modalService = inject(ModalService);

  projects = signal<Project[]>([]);
  loading = signal(true);
  selectedProject = signal<Project | null>(null);

  ngOnInit(): void {
    this.loadProjects();

    // Check if project_id is in query params
    this.route.queryParams.subscribe(params => {
      if (params['project_id']) {
        this.loadProject(parseInt(params['project_id']));
      }
    });
  }

  loadProjects(): void {
    this.api.getProjects().subscribe({
      next: (response) => {
        this.projects.set(response.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.modalService.error('Error', 'No se pudieron cargar los proyectos');
      }
    });
  }

  loadProject(id: number): void {
    this.api.getProject(id).subscribe({
      next: (project) => {
        this.selectedProject.set(project);
      },
      error: () => {
        this.modalService.error('Error', 'No se pudo cargar el proyecto');
      }
    });
  }

  selectProject(project: Project): void {
    this.selectedProject.set(project);
    // Update URL with project_id
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { project_id: project.id },
      queryParamsHandling: 'merge'
    });
  }

  clearSelection(): void {
    this.selectedProject.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }
}
