import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PdpToolsService } from '../pdp-tools.service';
import { HttpResponse } from '@angular/common/http';

// Legitimacy Report Component - Informe de Legitimación (Resolución 041)

@Component({
  selector: 'app-legitimacy-report',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <div class="form-header">
        <div class="form-header-grid">
          <div>
            <div class="header-title">
              <h1>⚖️ Informe de Legitimación</h1>
              @if (projectId()) {
                <div class="project-badge">📁 Proyecto #{{ projectId() }}</div>
              }
            </div>
            <p class="tools-subtitle">Informe de Evaluación de Ponderación - Interés Legítimo según Res. SPDP-SPD-2025-0041-R</p>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="vd-loading-overlay">
          <div class="vd-spinner"></div>
          <span>{{ loadingMessage() }}</span>
        </div>
      }

      <!-- Modo Rápido -->
      <div class="vd-card vd-card-accent">
        <h3>⚡ Auto-completar según supuesto típico</h3>
        <p class="section-desc">Seleccione un escenario para pre-llenar el formulario</p>
        <select class="vd-select" [(ngModel)]="selectedScenario" (ngModelChange)="applyScenario($event)">
          <option value="">-- Personalizado --</option>
          <option value="videovigilancia">Videovigilancia de seguridad (Art. 15)</option>
          <option value="mercadotecnia">Mercadotecnia directa a clientes (Art. 11)</option>
          <option value="fraude">Prevención de fraude / AML (Art. 12)</option>
          <option value="grupo">Comunicación interna en grupo empresarial (Art. 13)</option>
          <option value="seguridad_tic">Seguridad de redes y sistemas TIC (Art. 14)</option>
        </select>
      </div>

      <!-- Sección 1: Identificación -->
      <div class="vd-card">
        <div class="section-header">
          <span class="section-number">1</span>
          <h3>Identificación</h3>
        </div>
        <div class="form-header-grid">
          <div class="form-group span-2">
            <label class="vd-label">Responsable del tratamiento *</label>
            <input class="vd-input" [(ngModel)]="report().responsible_name" placeholder="Nombre de la entidad">
          </div>
          <div class="form-group">
            <label class="vd-label">RUC</label>
            <input class="vd-input" [(ngModel)]="report().ruc" placeholder="RUC">
          </div>
        </div>
        <div class="form-header-grid">
          <div class="form-group">
            <label class="vd-label">Sector</label>
            <select class="vd-select" [(ngModel)]="report().sector">
              <option value="">-- Seleccione --</option>
              <option value="financiero">Financiero / Bancario</option>
              <option value="seguros">Seguros</option>
              <option value="salud">Salud</option>
              <option value="retail">Retail / Comercio</option>
              <option value="tecnologia">Tecnología / SaaS</option>
              <option value="educacion">Educación</option>
              <option value="servicios_profesionales">Servicios profesionales</option>
              <option value="industria">Industria / Manufactura</option>
              <option value="inmobiliario">Inmobiliario</option>
              <option value="transporte">Transporte / Logística</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">DPD / DPO</label>
            <input class="vd-input" [(ngModel)]="report().dpd_name" placeholder="Nombre del DPD">
          </div>
          <div class="form-group">
            <label class="vd-label">Correo DPD</label>
            <input type="email" class="vd-input" [(ngModel)]="report().dpd_email" placeholder="correo@ejemplo.com">
          </div>
        </div>
        <div class="form-header-grid">
          <div class="form-group span-3">
            <label class="vd-label">Nombre de la actividad de tratamiento *</label>
            <input class="vd-input" [(ngModel)]="report().activity_name" placeholder="Ej: Prevención de accesos no autorizados al perímetro">
          </div>
        </div>
        <div class="form-header-grid">
          <div class="form-group">
            <label class="vd-label">Código RAT</label>
            <input class="vd-input" [(ngModel)]="report().rat_code" placeholder="RAT-001">
          </div>
          <div class="form-group">
            <label class="vd-label">Fecha elaboración *</label>
            <input type="date" class="vd-input" [(ngModel)]="report().report_date">
          </div>
          <div class="form-group">
            <label class="vd-label">Próxima revisión (máx. 1 año)</label>
            <input type="date" class="vd-input" [(ngModel)]="report().next_review_date">
          </div>
        </div>
      </div>

      <!-- Sección 2: Base legal invocada -->
      <div class="vd-card">
        <div class="section-header">
          <span class="section-number">2</span>
          <h3>Base legal invocada</h3>
        </div>
        <div class="info-box">
          <strong>Base: Interés legítimo</strong> - Art. 7.9 LOPDP - Res. SPDP-SPD-2025-0041-R
        </div>
        <div class="form-group">
          <label class="vd-label">Supuesto específico *</label>
          <select class="vd-select" [(ngModel)]="report().specific_assumption">
            <option value="">-- Seleccione --</option>
            <option value="art11">Art. 11 - Mercadotecnia directa</option>
            <option value="art12">Art. 12 - Prevención de fraude, lavado de activos y delitos conexos</option>
            <option value="art13">Art. 13 - Comunicación interna en grupos empresariales</option>
            <option value="art14">Art. 14 - Seguridad de redes y sistemas TIC</option>
            <option value="art15">Art. 15 - Videovigilancia con fines de seguridad</option>
            <option value="otro">Otro supuesto del giro ordinario</option>
          </select>
        </div>
      </div>

      <!-- Sección 3: Descripción del tratamiento -->
      <div class="vd-card">
        <div class="section-header">
          <span class="section-number">3</span>
          <h3>Descripción del tratamiento</h3>
        </div>
        <div class="form-group">
          <label class="vd-label">Finalidad específica *</label>
          <textarea class="vd-input" rows="2" [(ngModel)]="report().purpose" placeholder="Ej.: Prevenir accesos no autorizados al perímetro"></textarea>
        </div>
        <div class="form-group">
          <label class="vd-label">Categorías de titulares</label>
          <div class="chip-grid">
            @for (cat of subjectCategories; track cat.value) {
              <button class="chip" [class.selected]="isSelected(report().subject_categories, cat.value)" (click)="toggleArrayValue('subject_categories', cat.value)">
                {{ cat.label }}
              </button>
            }
          </div>
        </div>
        <div class="form-group">
          <label class="vd-label">Categorías de datos tratados</label>
          <div class="chip-grid">
            @for (cat of dataCategories; track cat.value) {
              <button class="chip" [class.selected]="isSelected(report().data_categories, cat.value)" (click)="toggleArrayValue('data_categories', cat.value)">
                {{ cat.label }}
              </button>
            }
          </div>
        </div>
        <div class="form-header-grid">
          <div class="form-group">
            <label class="vd-label">Volumen de titulares</label>
            <select class="vd-select" [(ngModel)]="report().subject_volume">
              <option value="">-- --</option>
              <option value="lt100">< 100</option>
              <option value="100-1000">100 - 1.000</option>
              <option value="1000-10000">1.000 - 10.000</option>
              <option value="10000-100000">10.000 - 100.000</option>
              <option value="gt100000">> 100.000 (gran escala)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">Entorno</label>
            <select class="vd-select" [(ngModel)]="report().environment">
              <option value="">-- --</option>
              <option value="publico">Espacio público</option>
              <option value="privado">Espacio privado accesible al público</option>
              <option value="laboral">Ámbito laboral exclusivo</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">Plazo de conservación</label>
            <select class="vd-select" [(ngModel)]="report().retention_period">
              <option value="">-- --</option>
              <option value="24h">24 horas</option>
              <option value="7d">7 días</option>
              <option value="30d">30 días</option>
              <option value="90d">90 días</option>
              <option value="1y">1 año</option>
              <option value="3y">3 años</option>
              <option value="otro">Otro plazo justificado</option>
            </select>
          </div>
        </div>
        <div class="form-header-grid">
          <div class="form-group">
            <label class="vd-label">¿Transferencias internacionales?</label>
            <select class="vd-select" [(ngModel)]="report().international_transfer">
              <option [ngValue]="false">No</option>
              <option [ngValue]="true">Sí</option>
            </select>
          </div>
          @if (report().international_transfer) {
            <div class="form-group span-2">
              <label class="vd-label">Países destinatarios (si aplica)</label>
              <input class="vd-input" [(ngModel)]="report().destination_countries" placeholder="Ej: Estados Unidos, Colombia, España">
            </div>
          }
        </div>
      </div>

      <!-- Sección 4: Categorías especiales -->
      <div class="vd-card">
        <div class="section-header">
          <span class="section-number">4</span>
          <h3>Categorías especiales (Art. 25 LOPDP)</h3>
        </div>
        <div class="info-box warning">
          ⚠️ Si involucra categorías especiales, el interés legítimo está <strong>prohibido</strong> salvo salvaguardas reforzadas (Art. 16).
        </div>
        <div class="chip-grid">
          @for (cat of specialCategories; track cat.value) {
            <button class="chip" [class.selected]="isSelected(report().special_categories, cat.value)" (click)="toggleArrayValue('special_categories', cat.value)">
              {{ cat.label }}
            </button>
          }
        </div>
      </div>

      <!-- Sección 5: Idoneidad del interés (Art. 6.1) -->
      <div class="vd-card">
        <div class="section-header">
          <span class="section-number">5</span>
          <h3>Idoneidad del interés (Art. 6.1)</h3>
        </div>
        <div class="form-header-grid">
          <div class="form-group">
            <label class="vd-label">¿Es lícito?</label>
            <select class="vd-select" [(ngModel)]="report().interest_legal">
              <option value="">-- --</option>
              <option value="si_norma">Sí - amparado por norma vigente</option>
              <option value="no_norma">No - sin fundamento legal</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">¿Es concreto y real?</label>
            <select class="vd-select" [(ngModel)]="report().interest_concrete">
              <option value="">-- --</option>
              <option value="si_necesidad">Sí - necesidad actual y comprobable</option>
              <option value="no_vago">No - es vago o especulativo</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">¿Es proporcional?</label>
            <select class="vd-select" [(ngModel)]="report().interest_proportional">
              <option value="">-- --</option>
              <option value="si_adecuado">Sí - adecuado y no excesivo</option>
              <option value="no_excesivo">No - medida desproporcionada</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="vd-label">Descripción breve del interés *</label>
          <textarea class="vd-input" rows="2" [(ngModel)]="report().interest_description" placeholder="Ej.: Protección de bienes e instalaciones"></textarea>
        </div>
        <div class="form-group">
          <label class="vd-label">Tipo de beneficio perseguido</label>
          <div class="chip-grid">
            @for (benefit of pursuedBenefits; track benefit.value) {
              <button class="chip" [class.selected]="isSelected(report().pursued_benefits, benefit.value)" (click)="toggleArrayValue('pursued_benefits', benefit.value)">
                {{ benefit.label }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Sección 6: Necesidad (Art. 6.2) -->
      <div class="vd-card">
        <div class="section-header">
          <span class="section-number">6</span>
          <h3>Necesidad (Art. 6.2)</h3>
        </div>
        <div class="form-header-grid">
          <div class="form-group">
            <label class="vd-label">¿Indispensable para la finalidad?</label>
            <select class="vd-select" [(ngModel)]="report().necessity_indispensable">
              <option value="">-- --</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">¿Alternativas menos invasivas?</label>
            <select class="vd-select" [(ngModel)]="report().necessity_alternatives">
              <option value="">-- --</option>
              <option value="no_viables">No - es la vía menos invasiva</option>
              <option value="si_viables">Sí - existen alternativas viables</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">Minimización aplicada</label>
            <select class="vd-select" [(ngModel)]="report().minimization_applied">
              <option value="">-- --</option>
              <option value="si_datos">Sí - solo datos estrictamente necesarios</option>
              <option value="no_sobredatos">No - se recogen más datos de los necesarios</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="vd-label">Alternativas analizadas y descartadas</label>
          <div class="chip-grid">
            @for (alt of analyzedAlternatives; track alt.value) {
              <button class="chip" [class.selected]="isSelected(report().analyzed_alternatives, alt.value)" (click)="toggleArrayValue('analyzed_alternatives', alt.value)">
                {{ alt.label }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Sección 7: Ponderación e impacto (Art. 6.3) -->
      <div class="vd-card">
        <div class="section-header">
          <span class="section-number">7</span>
          <h3>Ponderación e impacto (Art. 6.3)</h3>
        </div>
        <div class="form-header-grid">
          <div class="form-group">
            <label class="vd-label">Expectativa razonable del titular</label>
            <select class="vd-select" [(ngModel)]="report().expectations_level">
              <option value="">-- --</option>
              <option value="alta">Alta - esperaría este tratamiento</option>
              <option value="media">Media - podría esperarlo</option>
              <option value="baja">Baja - no esperaría este tratamiento</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">Relación con el titular</label>
            <select class="vd-select" [(ngModel)]="report().subject_relationship">
              <option value="">-- --</option>
              <option value="cliente">Cliente activo</option>
              <option value="empleado">Empleado</option>
              <option value="visitante">Visitante</option>
              <option value="publico">Público general</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">Nivel de riesgo *</label>
            <select class="vd-select" [(ngModel)]="report().risk_level">
              <option value="">-- --</option>
              <option value="nulo">Nulo</option>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
              <option value="critico">Crítico</option>
            </select>
          </div>
        </div>
        <div class="form-header-grid">
          <div class="form-group">
            <label class="vd-label">Impacto económico</label>
            <select class="vd-select" [(ngModel)]="report().economic_impact">
              <option value="">-- --</option>
              <option value="nulo">Nulo</option>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">Impacto reputacional</label>
            <select class="vd-select" [(ngModel)]="report().reputational_impact">
              <option value="">-- --</option>
              <option value="nulo">Nulo</option>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">Riesgo de discriminación</label>
            <select class="vd-select" [(ngModel)]="report().discrimination_risk">
              <option value="">-- --</option>
              <option value="nulo">Nulo</option>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
            </select>
          </div>
        </div>
        <div class="form-header-grid">
          <div class="form-group">
            <label class="vd-label">¿Perfilado / decisiones automatizadas?</label>
            <select class="vd-select" [(ngModel)]="report().automated_decisions">
              <option value="">-- --</option>
              <option value="no">No</option>
              <option value="si_sin_efecto">Sí - sin efecto jurídico significativo</option>
              <option value="si_con_efecto">Sí - con efecto jurídico significativo</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">¿EIPD realizada?</label>
            <select class="vd-select" [(ngModel)]="report().dpia_realized">
              <option value="">-- --</option>
              <option value="no_aplica">No aplica</option>
              <option value="si">Sí</option>
              <option value="en_proceso">En proceso</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">¿Datos obtenidos del titular?</label>
            <select class="vd-select" [(ngModel)]="report().data_from_subject">
              <option value="">-- --</option>
              <option value="si">Sí</option>
              <option value="no_terceros">No - de terceros</option>
              <option value="no_fuentes">No - fuentes públicas</option>
            </select>
          </div>
        </div>
        @if (['medio', 'alto', 'critico'].includes(report().risk_level || '')) {
          <div class="info-box warning">
            ⚠️ Riesgo medio, alto o crítico → no procede ponderación simplificada (Art. 5).
          </div>
        }
      </div>

      <!-- Sección 8: Garantías y medidas -->
      <div class="vd-card">
        <div class="section-header">
          <span class="section-number">8</span>
          <h3>Garantías y medidas</h3>
        </div>
        <div class="form-group">
          <label class="vd-label">Medidas técnicas y organizativas aplicadas</label>
          <div class="chip-grid">
            @for (measure of technicalMeasures; track measure.value) {
              <button class="chip" [class.selected]="isSelected(report().technical_measures, measure.value)" (click)="toggleArrayValue('technical_measures', measure.value)">
                {{ measure.label }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Sección 9: Transparencia y derechos -->
      <div class="vd-card">
        <div class="section-header">
          <span class="section-number">9</span>
          <h3>Transparencia y derechos (Arts. 17-19)</h3>
        </div>
        <div class="form-group">
          <label class="vd-label">Canales de información al titular</label>
          <div class="chip-grid">
            @for (channel of informationChannels; track channel.value) {
              <button class="chip" [class.selected]="isSelected(report().information_channels, channel.value)" (click)="toggleArrayValue('information_channels', channel.value)">
                {{ channel.label }}
              </button>
            }
          </div>
        </div>
        <div class="form-group">
          <label class="vd-label">Canales de ejercicio de derechos</label>
          <div class="chip-grid">
            @for (channel of exerciseChannels; track channel.value) {
              <button class="chip" [class.selected]="isSelected(report().exercise_channels, channel.value)" (click)="toggleArrayValue('exercise_channels', channel.value)">
                {{ channel.label }}
              </button>
            }
          </div>
        </div>
        <div class="form-header-grid">
          <div class="form-group">
            <label class="vd-label">Plazo de respuesta</label>
            <select class="vd-select" [(ngModel)]="report().response_period">
              <option value="">-- --</option>
              <option value="15d">15 días</option>
              <option value="20d">20 días</option>
              <option value="30d">30 días</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">Lenguaje empleado</label>
            <select class="vd-select" [(ngModel)]="report().language_used">
              <option value="">-- --</option>
              <option value="claro">Claro, sencillo y en español</option>
              <option value="tecnico">Técnico/avanzado</option>
              <option value="bilingue">Bilingüe (español/inglés)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Sección 10: Conclusión del equilibrio -->
      <div class="vd-card">
        <div class="section-header">
          <span class="section-number">10</span>
          <h3>Conclusión del equilibrio</h3>
        </div>
        <div class="form-group">
          <label class="vd-label">Resultado de la ponderación *</label>
          <div class="result-options">
            <button class="result-btn" [class.selected]="report().balance_result === 'favorable'" (click)="report().balance_result = 'favorable'">
              <span class="result-icon green">✓</span>
              A favor del responsable
            </button>
            <button class="result-btn" [class.selected]="report().balance_result === 'condicional'" (click)="report().balance_result = 'condicional'">
              <span class="result-icon yellow">⚠</span>
              Dudoso - requiere garantías adicionales
            </button>
            <button class="result-btn" [class.selected]="report().balance_result === 'desfavorable'" (click)="report().balance_result = 'desfavorable'">
              <span class="result-icon red">✕</span>
              A favor del titular
            </button>
          </div>
        </div>
        <div class="form-group">
          <label class="vd-label">Justificación motivada *</label>
          <textarea class="vd-input" rows="4" [(ngModel)]="report().justification" placeholder="Explique la decisión de equilibrio entre intereses..."></textarea>
        </div>
        <div class="info-box">
          En caso de duda, prevalecen siempre los derechos del titular.
        </div>
      </div>

      <!-- Sección 11: Aprobación -->
      <div class="vd-card">
        <div class="section-header">
          <span class="section-number">11</span>
          <h3>Aprobación</h3>
        </div>
        <div class="form-header-grid">
          <div class="form-group">
            <label class="vd-label">Elaborado por</label>
            <input class="vd-input" [(ngModel)]="report().prepared_by" placeholder="Nombre y cargo">
          </div>
          <div class="form-group">
            <label class="vd-label">Revisado por (DPD)</label>
            <input class="vd-input" [(ngModel)]="report().reviewed_by" placeholder="Nombre y cargo">
          </div>
          <div class="form-group">
            <label class="vd-label">Aprobado por</label>
            <input class="vd-input" [(ngModel)]="report().approved_by" placeholder="Nombre y cargo">
          </div>
        </div>
      </div>

      <!-- Lista de informes guardados -->
      <div class="vd-card" *ngIf="savedReports().length > 0">
        <div class="section-header">
          <h3>📋 Informes guardados</h3>
          <button class="vd-btn vd-btn-secondary" (click)="loadSavedReports()">🔄 Actualizar</button>
        </div>
        <table class="vd-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Actividad</th>
              <th>Fecha</th>
              <th>Resultado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of savedReports()">
              <td>{{ r.code || 'LEG-' + r.id }}</td>
              <td>{{ r.activity_name }}</td>
              <td>{{ r.report_date | date:'dd/MM/yyyy' }}</td>
              <td>
                <span class="vd-badge" [ngClass]="'vd-badge-' + r.balance_result">{{ r.balance_result }}</span>
              </td>
              <td>
                <button class="vd-btn vd-btn-sm vd-btn-secondary" (click)="loadReport(r)">Cargar</button>
                <button class="vd-btn vd-btn-sm vd-btn-secondary" (click)="downloadReport(r.id)">Descargar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="vd-btn vd-btn-primary" (click)="saveReport()" [disabled]="saving()">
          {{ saving() ? '� Guardando...' : '💾 Guardar informe' }}
        </button>
        <button class="vd-btn vd-btn-primary" (click)="generateWordReport()">� Descargar Word</button>
        <button class="vd-btn vd-btn-secondary" (click)="exportReports()">� Exportar Excel</button>
        <button class="vd-btn vd-btn-secondary" (click)="clearForm()">🧹 Limpiar</button>
      </div>
    </div>
  `,
  styles: [`
    .tools-container { max-width: 1200px; margin: 0 auto; }
    .form-header { margin-bottom: 1.5rem; }
    .header-title { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .form-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0; }
    .project-badge { background: rgba(86,135,243,0.1); color: #5687f3; padding: 0.375rem 0.75rem; border-radius: 20px; font-size: 0.875rem; font-weight: 500; border: 1px solid rgba(86,135,243,0.2); }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; }
    .form-header-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group.span-2 { grid-column: span 2; }
    .form-group.span-3 { grid-column: span 3; }
    .section-desc { color: #64748b; font-size: 0.875rem; margin: 0.5rem 0 1rem; }
    .section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .section-number { width: 28px; height: 28px; background: #0f172a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; }
    .section-header h3 { margin: 0; font-size: 1rem; color: #0f172a; }
    .info-box { background: rgba(86,135,243,0.1); border: 1px solid rgba(86,135,243,0.2); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.875rem; color: #0f172a; }
    .info-box.warning { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.2); color: #d97706; }
    .chip-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .chip { padding: 0.375rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 20px; background: white; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; }
    .chip:hover { border-color: #5687f3; }
    .chip.selected { background: #0f172a; color: white; border-color: #0f172a; }
    .result-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 0.5rem; }
    .result-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border: 2px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s; font-size: 0.875rem; text-align: left; }
    .result-btn:hover { border-color: #5687f3; }
    .result-btn.selected { border-color: #0f172a; background: rgba(15,23,42,0.05); }
    .result-icon { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; }
    .result-icon.green { background: rgba(34,197,94,0.1); color: #16a34a; }
    .result-icon.yellow { background: rgba(245,158,11,0.1); color: #d97706; }
    .result-icon.red { background: rgba(239,68,68,0.1); color: #dc2626; }
    .vd-card-accent { border-left: 4px solid #5687f3; }
    .action-buttons { display: flex; gap: 0.75rem; margin-top: 1.5rem; flex-wrap: wrap; }
    .vd-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .vd-table th, .vd-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; }
    .vd-table th { background: #f8fafc; font-weight: 600; }
    .vd-badge-favorable { background: rgba(34,197,94,0.1); color: #16a34a; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
    .vd-badge-desfavorable { background: rgba(239,68,68,0.1); color: #dc2626; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
    .vd-badge-condicional { background: rgba(245,158,11,0.1); color: #d97706; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
    .vd-btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; }
    .vd-loading-overlay { display: flex; align-items: center; gap: 1rem; padding: 2rem; background: rgba(255,255,255,0.9); border-radius: 12px; margin-bottom: 1rem; }
    .vd-spinner { width: 24px; height: 24px; border: 2px solid #e2e8f0; border-top-color: #5687f3; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) { .form-header-grid { grid-template-columns: repeat(2, 1fr); } .form-group.span-2, .form-group.span-3 { grid-column: span 1; } .result-options { grid-template-columns: 1fr; } }
  `],
})
export class LegitimacyReportComponent implements OnInit {
  projectId = signal<number | null>(null);
  loading = signal<boolean>(false);
  loadingMessage = signal<string>('Cargando...');
  saving = signal<boolean>(false);
  savedReports = signal<any[]>([]);
  selectedScenario = signal<string>('');

  report = signal<any>({
    responsible_name: '', ruc: '', legal_rep: '',
    sector: '', dpd_name: '', dpd_email: '',
    activity_name: '', rat_code: '',
    report_date: new Date().toISOString().split('T')[0],
    next_review_date: '',
    legal_basis: 'interes_legitimo', specific_assumption: '',
    purpose: '', purpose_licit: true, data_necessary: true, less_invasive_alternative: false,
    subject_categories: [], data_categories: [], subject_volume: '', environment: '', retention_period: '',
    international_transfer: false, destination_countries: '',
    rights_impact: 'ninguno', special_categories: [],
    interest_legal: '', interest_concrete: '', interest_proportional: '', interest_description: '', pursued_benefits: [],
    necessity_indispensable: '', necessity_alternatives: '', minimization_applied: '', analyzed_alternatives: [],
    controller_interests: '', data_subjects_impact: '', reasonable_expectations: '',
    expectations_level: '', subject_relationship: '', risk_level: '',
    economic_impact: '', reputational_impact: '', discrimination_risk: '', automated_decisions: '', dpia_realized: '', data_from_subject: '',
    technical_measures: [], organizational_measures: [],
    information_channels: [], exercise_channels: [], response_period: '', language_used: '',
    balance_result: '', justification: '',
    prepared_by: '', reviewed_by: '', approved_by: ''
  });

  // Opciones para chips
  subjectCategories = [
    { value: 'clientes', label: 'Clientes' },
    { value: 'empleados', label: 'Empleados' },
    { value: 'proveedores', label: 'Proveedores' },
    { value: 'visitantes', label: 'Visitantes' },
    { value: 'usuarios_web', label: 'Usuarios web' },
    { value: 'prospectos', label: 'Prospectos' },
    { value: 'accionistas', label: 'Accionistas' },
    { value: 'publico_general', label: 'Público general' }
  ];

  dataCategories = [
    { value: 'identificativos', label: 'Identificativos' },
    { value: 'contacto', label: 'Contacto' },
    { value: 'imagen_video', label: 'Imagen / video' },
    { value: 'laborales', label: 'Laborales' },
    { value: 'economicos', label: 'Económicos' },
    { value: 'ubicacion', label: 'Ubicación' },
    { value: 'navegacion_cookies', label: 'Navegación / cookies' },
    { value: 'dispositivo_ip', label: 'Dispositivo / IP' },
    { value: 'academicos', label: 'Académicos' },
    { value: 'perfil_preferencias', label: 'Perfil / preferencias' }
  ];

  specialCategories = [
    { value: 'ninguna', label: 'Ninguna categoría especial' },
    { value: 'sensibles', label: 'Datos sensibles' },
    { value: 'menores', label: 'Niños, niñas, adolescentes' },
    { value: 'salud', label: 'Salud' },
    { value: 'discapacidad', label: 'Discapacidad' },
    { value: 'biometricos', label: 'Biométricos / genéticos' }
  ];

  pursuedBenefits = [
    { value: 'seguridad_fisica', label: 'Seguridad física' },
    { value: 'prevencion_fraude', label: 'Prevención fraude' },
    { value: 'mejora_servicio', label: 'Mejora del servicio' },
    { value: 'eficiencia_operativa', label: 'Eficiencia operativa' },
    { value: 'cumplimiento_regulatorio', label: 'Cumplimiento regulatorio' },
    { value: 'comercial_fidelizacion', label: 'Comercial / fidelización' },
    { value: 'continuidad_negocio', label: 'Continuidad del negocio' },
    { value: 'proteccion_terceros', label: 'Protección de terceros' }
  ];

  analyzedAlternatives = [
    { value: 'consentimiento', label: 'Consentimiento (no viable)' },
    { value: 'anonimizacion', label: 'Anonimización (no viable)' },
    { value: 'datos_agregados', label: 'Datos agregados' },
    { value: 'menor_volumen', label: 'Menor volumen de datos' },
    { value: 'ejecucion_contrato', label: 'Ejecución de contrato' },
    { value: 'obligacion_legal', label: 'Obligación legal' }
  ];

  technicalMeasures = [
    { value: 'cifrado', label: '🔒 Cifrado' },
    { value: 'seudonimizacion', label: 'Seudonimización' },
    { value: 'anonimizacion', label: 'Anonimización' },
    { value: 'control_acceso', label: 'Control de acceso RBAC' },
    { value: 'mfa', label: 'MFA' },
    { value: 'logs_auditoria', label: 'Logs y auditoría' },
    { value: 'retencion', label: 'Política de retención' },
    { value: 'eliminacion', label: 'Eliminación segura' },
    { value: 'formacion', label: 'Formación del personal' },
    { value: 'contratos', label: 'Contratos con encargados' },
    { value: 'privacy_design', label: 'Privacidad por diseño' },
    { value: 'pets', label: 'PETs' },
    { value: 'backup', label: 'Backup y continuidad' },
    { value: 'incidentes', label: 'Gestión de incidentes' },
    { value: 'dlp', label: 'DLP' },
    { value: 'firewall', label: 'Firewall / IDS' }
  ];

  informationChannels = [
    { value: 'privacidad_web', label: 'Política de privacidad web' },
    { value: 'contratacion', label: 'Aviso en contratación' },
    { value: 'cartel', label: 'Cartel de videovigilancia' },
    { value: 'correo', label: 'Correo electrónico' },
    { value: 'app', label: 'App móvil' },
    { value: 'contrato_laboral', label: 'Contrato laboral' },
    { value: 'pie_correo', label: 'Pie de correo comercial' }
  ];

  exerciseChannels = [
    { value: 'correo_dpd', label: '📧 Correo DPD' },
    { value: 'formulario', label: 'Formulario web' },
    { value: 'opt_out', label: 'Opt-out 1 clic' },
    { value: 'presencial', label: 'Atención presencial' },
    { value: 'telefono', label: 'Teléfono' },
    { value: 'whatsapp', label: 'WhatsApp' }
  ];

  // Escenarios predefinidos
  scenarios: Record<string, any> = {
    videovigilancia: {
      specific_assumption: 'art15',
      purpose: 'Prevención de accesos no autorizados y protección de bienes e instalaciones',
      subject_categories: ['visitantes', 'empleados'],
      data_categories: ['imagen_video'],
      subject_volume: '100-1000',
      environment: 'privado',
      retention_period: '30d',
      interest_description: 'Protección de bienes e instalaciones',
      pursued_benefits: ['seguridad_fisica', 'proteccion_terceros'],
      technical_measures: ['cifrado', 'control_acceso', 'logs_auditoria', 'retencion'],
      information_channels: ['cartel', 'correo'],
      exercise_channels: ['correo_dpd', 'presencial']
    },
    mercadotecnia: {
      specific_assumption: 'art11',
      purpose: 'Envío de comunicaciones comerciales sobre productos y servicios propios',
      subject_categories: ['clientes'],
      data_categories: ['identificativos', 'contacto'],
      subject_volume: '1000-10000',
      environment: 'privado',
      retention_period: '1y',
      interest_description: 'Fidelización de clientes y desarrollo comercial',
      pursued_benefits: ['comercial_fidelizacion'],
      technical_measures: ['seudonimizacion', 'control_acceso'],
      information_channels: ['privacidad_web', 'pie_correo'],
      exercise_channels: ['opt_out', 'correo_dpd', 'formulario']
    },
    fraude: {
      specific_assumption: 'art12',
      purpose: 'Prevención de fraude, lavado de activos y financiamiento del terrorismo',
      subject_categories: ['clientes', 'proveedores'],
      data_categories: ['identificativos', 'economicos', 'contacto'],
      subject_volume: '1000-10000',
      environment: 'privado',
      retention_period: '3y',
      interest_description: 'Cumplimiento de obligaciones legales AML/FT',
      pursued_benefits: ['cumplimiento_regulatorio', 'prevencion_fraude'],
      technical_measures: ['cifrado', 'control_acceso', 'logs_auditoria', 'dlp'],
      information_channels: ['privacidad_web', 'contratacion'],
      exercise_channels: ['correo_dpd', 'formulario']
    },
    grupo: {
      specific_assumption: 'art13',
      purpose: 'Comunicación interna entre empresas del grupo corporativo',
      subject_categories: ['clientes', 'empleados'],
      data_categories: ['identificativos', 'contacto'],
      subject_volume: '10000-100000',
      environment: 'laboral',
      retention_period: '1y',
      interest_description: 'Gestión administrativa del grupo empresarial',
      pursued_benefits: ['eficiencia_operativa', 'continuidad_negocio'],
      technical_measures: ['cifrado', 'control_acceso', 'contratos'],
      information_channels: ['contratacion', 'privacidad_web'],
      exercise_channels: ['correo_dpd']
    },
    seguridad_tic: {
      specific_assumption: 'art14',
      purpose: 'Seguridad de redes y sistemas de información - prevención de intrusiones',
      subject_categories: ['usuarios_web', 'empleados'],
      data_categories: ['dispositivo_ip', 'navegacion_cookies'],
      subject_volume: '1000-10000',
      environment: 'privado',
      retention_period: '90d',
      interest_description: 'Protección de infraestructura tecnológica',
      pursued_benefits: ['seguridad_fisica', 'continuidad_negocio'],
      technical_measures: ['firewall', 'logs_auditoria', 'retencion', 'backup'],
      information_channels: ['privacidad_web'],
      exercise_channels: ['correo_dpd']
    }
  };

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const pid = params['project_id'];
      if (pid) this.projectId.set(parseInt(pid, 10));
    });
    this.loadSavedReports();
  }

  applyScenario(scenarioKey: string): void {
    if (!scenarioKey) return;
    const scenario = this.scenarios[scenarioKey];
    if (scenario) {
      this.report.update(r => ({ ...r, ...scenario }));
    }
  }

  isSelected(array: string[] | null, value: string): boolean {
    return array?.includes(value) || false;
  }

  toggleArrayValue(field: string, value: string): void {
    this.report.update(r => {
      const current = r[field] || [];
      // Si es 'ninguna' en categorías especiales, limpiar otros
      if (field === 'special_categories' && value === 'ninguna') {
        return { ...r, [field]: ['ninguna'] };
      }
      if (field === 'special_categories' && current.includes('ninguna')) {
        return { ...r, [field]: [value] };
      }
      const exists = current.includes(value);
      const updated = exists
        ? current.filter((v: string) => v !== value)
        : [...current, value];
      return { ...r, [field]: updated };
    });
  }

  loadSavedReports(): void {
    const params = this.projectId() ? { project_id: this.projectId() } : {};
    this.pdpToolsService.listLegitimacyReports(params).subscribe({
      next: (response: any) => {
        this.savedReports.set(response.data || []);
      },
      error: () => {
        this.savedReports.set([]);
      }
    });
  }

  saveReport(): void {
    this.saving.set(true);
    const data = this.report();
    const params = this.projectId() ? { project_id: this.projectId() } : {};

    this.pdpToolsService.createLegitimacyReport({ ...data, ...params }).subscribe({
      next: () => {
        this.saving.set(false);
        alert('Informe guardado correctamente');
        this.loadSavedReports();
      },
      error: (err) => {
        this.saving.set(false);
        alert('Error al guardar: ' + (err.error?.message || err.message));
      }
    });
  }

  loadReport(report: any): void {
    this.report.set(report);
  }

  downloadReport(id: number): void {
    this.pdpToolsService.downloadLegitimacyReport(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Informe_Legitimidad_${id}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        alert('Error al descargar el informe');
      }
    });
  }

  generateWordReport(): void {
    // Primero guardar, luego descargar
    this.saving.set(true);
    const data = this.report();
    const params = this.projectId() ? { project_id: this.projectId() } : {};

    this.pdpToolsService.createLegitimacyReport({ ...data, ...params }).subscribe({
      next: (response: any) => {
        this.saving.set(false);
        this.downloadReport(response.id);
        this.loadSavedReports();
      },
      error: (err) => {
        this.saving.set(false);
        alert('Error al generar: ' + (err.error?.message || err.message));
      }
    });
  }

  exportReports(): void {
    const params = this.projectId() ? { project_id: this.projectId() } : {};
    this.pdpToolsService.exportLegitimacyReports(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Informes_Legitimidad_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        alert('Error al exportar');
      }
    });
  }

  clearForm(): void {
    this.report.set({
      responsible_name: '', ruc: '', legal_rep: '',
      sector: '', dpd_name: '', dpd_email: '',
      activity_name: '', rat_code: '',
      report_date: new Date().toISOString().split('T')[0],
      next_review_date: '',
      legal_basis: 'interes_legitimo', specific_assumption: '',
      purpose: '', purpose_licit: true, data_necessary: true, less_invasive_alternative: false,
      subject_categories: [], data_categories: [], subject_volume: '', environment: '', retention_period: '',
      international_transfer: false, destination_countries: '',
      rights_impact: 'ninguno', special_categories: [],
      interest_legal: '', interest_concrete: '', interest_proportional: '', interest_description: '', pursued_benefits: [],
      necessity_indispensable: '', necessity_alternatives: '', minimization_applied: '', analyzed_alternatives: [],
      controller_interests: '', data_subjects_impact: '', reasonable_expectations: '',
      expectations_level: '', subject_relationship: '', risk_level: '',
      economic_impact: '', reputational_impact: '', discrimination_risk: '', automated_decisions: '', dpia_realized: '', data_from_subject: '',
      technical_measures: [], organizational_measures: [],
      information_channels: [], exercise_channels: [], response_period: '', language_used: '',
      balance_result: '', justification: '',
      prepared_by: '', reviewed_by: '', approved_by: ''
    });
    this.selectedScenario.set('');
  }

  private pdpToolsService = inject(PdpToolsService);
  private route = inject(ActivatedRoute);
}
