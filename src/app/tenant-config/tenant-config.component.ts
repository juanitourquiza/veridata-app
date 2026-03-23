import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TenantConfigService, Organization, TeamMember, TeamInvitation, Preferences, InviteRequest } from '../core/services/tenant-config.service';

type TabType = 'organization' | 'team' | 'preferences';

@Component({
  selector: 'app-tenant-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="config-container">
      <!-- Header -->
      <div class="config-header">
        <div class="breadcrumb">
          <a routerLink="/dashboard">Configuración</a>
        </div>
        <h1>Configuración</h1>
        <p class="subtitle">Configuración de la organización</p>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <nav class="tabs">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'organization'"
            (click)="setTab('organization')"
          >
            <span class="tab-icon">🏢</span>
            Organización
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'team'"
            (click)="setTab('team')"
          >
            <span class="tab-icon">👥</span>
            Equipo
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'preferences'"
            (click)="setTab('preferences')"
          >
            <span class="tab-icon">⚙️</span>
            Preferencias
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- ORGANIZATION TAB -->
        @if (activeTab() === 'organization') {
          <div class="panel">
            <div class="panel-header">
              <h2>Información de la Organización</h2>
              <p class="panel-description">Administra los datos básicos de tu organización</p>
            </div>

            <div class="panel-body">
              @if (loading()) {
                <div class="loading-state">
                  <div class="spinner"></div>
                  <p>Cargando...</p>
                </div>
              } @else if (organization()) {
                <form (ngSubmit)="saveOrganization()" class="form">
                  <div class="form-group">
                    <label for="orgName">Nombre de la Organización</label>
                    <input
                      type="text"
                      id="orgName"
                      [(ngModel)]="orgForm.name"
                      name="name"
                      required
                      placeholder="Ej: Mi Empresa S.A."
                    />
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="billingEmail">Email de Facturación</label>
                      <input
                        type="email"
                        id="billingEmail"
                        [(ngModel)]="orgForm.billing_email"
                        name="billing_email"
                        placeholder="billing@empresa.com"
                      />
                    </div>

                    <div class="form-group">
                      <label for="supportEmail">Email de Soporte</label>
                      <input
                        type="email"
                        id="supportEmail"
                        [(ngModel)]="orgForm.support_email"
                        name="support_email"
                        placeholder="support@empresa.com"
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="website">Sitio Web</label>
                      <input
                        type="url"
                        id="website"
                        [(ngModel)]="orgForm.website"
                        name="website"
                        placeholder="https://www.empresa.com"
                      />
                    </div>

                    <div class="form-group">
                      <label for="phone">Teléfono</label>
                      <input
                        type="tel"
                        id="phone"
                        [(ngModel)]="orgForm.phone"
                        name="phone"
                        placeholder="+593 4 XXX XXXX"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="taxId">RUC / NIT</label>
                    <input
                      type="text"
                      id="taxId"
                      [(ngModel)]="orgForm.tax_id"
                      name="tax_id"
                      placeholder="1234567890001"
                    />
                  </div>

                  <div class="form-group">
                    <label for="address">Dirección</label>
                    <textarea
                      id="address"
                      [(ngModel)]="orgForm.address"
                      name="address"
                      rows="3"
                      placeholder="Dirección completa de la organización"
                    ></textarea>
                  </div>

                  <div class="form-actions">
                    <button
                      type="submit"
                      class="btn-primary"
                      [disabled]="saving()"
                    >
                      @if (saving()) {
                        <span class="spinner-small"></span> Guardando...
                      } @else {
                        Guardar cambios
                      }
                    </button>
                  </div>
                </form>
              }
            </div>
          </div>
        }

        <!-- TEAM TAB -->
        @if (activeTab() === 'team') {
          <div class="panel">
            <div class="panel-header">
              <div class="header-content">
                <div>
                  <h2>Miembros del Equipo</h2>
                  <p class="panel-description">Invita colaboradores y administra el acceso</p>
                </div>
                <button class="btn-primary" (click)="showInviteModal.set(true)">
                  <span>+</span> Invitar
                </button>
              </div>
            </div>

            <div class="panel-body">
              @if (loading()) {
                <div class="loading-state">
                  <div class="spinner"></div>
                  <p>Cargando...</p>
                </div>
              } @else {
                <!-- Members List -->
                @if (teamData()?.members?.length === 0 && teamData()?.invitations?.length === 0) {
                  <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <p>No hay miembros adicionales en tu equipo</p>
                  </div>
                } @else {
                  <!-- Active Members -->
                  @if (teamData()?.members?.length! > 0) {
                    <div class="members-section">
                      <h3>Miembros Activos</h3>
                      <div class="members-list">
                        @for (member of teamData()?.members; track member.id) {
                          <div class="member-card">
                            <div class="member-info">
                              <div class="member-avatar">
                                {{ getInitials(member.name) }}
                              </div>
                              <div class="member-details">
                                <h4>{{ member.name }}</h4>
                                <p>{{ member.email }}</p>
                                <div class="member-meta">
                                  <span class="role-badge" [class]="'role-' + member.role">
                                    {{ getRoleLabel(member.role) }}
                                  </span>
                                  @if (!member.is_verified) {
                                    <span class="status-badge pending">Pendiente</span>
                                  }
                                </div>
                              </div>
                            </div>
                            <div class="member-actions">
                              <select
                                [(ngModel)]="member.role"
                                (change)="updateMemberRole(member.id, $event)"
                                class="role-select"
                              >
                                <option value="admin">Administrador</option>
                                <option value="member">Miembro</option>
                                <option value="viewer">Visualizador</option>
                              </select>
                              <button
                                class="btn-icon btn-danger"
                                (click)="removeMember(member.id)"
                                title="Eliminar miembro"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Pending Invitations -->
                  @if (teamData()?.invitations?.length! > 0) {
                    <div class="members-section">
                      <h3>Invitaciones Pendientes</h3>
                      <div class="invitations-list">
                        @for (invitation of teamData()?.invitations; track invitation.id) {
                          <div class="invitation-card" [class.expired]="invitation.is_expired">
                            <div class="invitation-info">
                              <div class="invitation-avatar">📧</div>
                              <div class="invitation-details">
                                <h4>{{ invitation.name || invitation.email }}</h4>
                                <p>{{ invitation.email }}</p>
                                <div class="invitation-meta">
                                  <span class="role-badge" [class]="'role-' + invitation.role">
                                    {{ getRoleLabel(invitation.role) }}
                                  </span>
                                  <span class="expires-text">
                                    @if (invitation.is_expired) {
                                      Expirada
                                    } @else {
                                      Expira: {{ formatDate(invitation.expires_at) }}
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div class="invitation-actions">
                              <button
                                class="btn-secondary"
                                (click)="resendInvitation(invitation.id)"
                                [disabled]="invitation.is_expired"
                              >
                                Reenviar
                              </button>
                              <button
                                class="btn-icon btn-danger"
                                (click)="cancelInvitation(invitation.id)"
                                title="Cancelar invitación"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                }

                <!-- Member Limit Info -->
                <div class="limit-info">
                  <div class="limit-icon">ℹ️</div>
                  <div class="limit-text">
                    <strong>Límite de Miembros</strong>
                    <p>Plan Free — {{ teamData()?.total_members || 0 }} / 5 miembros</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- PREFERENCES TAB -->
        @if (activeTab() === 'preferences') {
          <div class="panel">
            <div class="panel-header">
              <h2>Preferencias</h2>
              <p class="panel-description">Configura tus preferencias personales y de la organización</p>
            </div>

            <div class="panel-body">
              @if (loading()) {
                <div class="loading-state">
                  <div class="spinner"></div>
                  <p>Cargando...</p>
                </div>
              } @else if (preferences()) {
                <form (ngSubmit)="savePreferences()" class="form">
                  <!-- Language -->
                  <div class="form-group">
                    <label for="language">Idioma de la Interfaz</label>
                    <select
                      id="language"
                      [(ngModel)]="prefForm.language"
                      name="language"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <!-- Notifications -->
                  <div class="form-section">
                    <h3 class="section-title">Notificaciones</h3>

                    <div class="toggle-list">
                      <div class="toggle-item">
                        <div class="toggle-info">
                          <div class="toggle-icon">🔔</div>
                          <div class="toggle-text">
                            <strong>Actualizaciones de Compliance</strong>
                            <p>Recibe alertas sobre cambios en regulaciones</p>
                          </div>
                        </div>
                        <label class="toggle-switch">
                          <input
                            type="checkbox"
                            [(ngModel)]="prefForm.notifications.compliance_updates"
                            name="compliance_updates"
                          />
                          <span class="toggle-slider"></span>
                        </label>
                      </div>

                      <div class="toggle-item">
                        <div class="toggle-info">
                          <div class="toggle-icon">📧</div>
                          <div class="toggle-text">
                            <strong>Resumen Semanal</strong>
                            <p>Estadísticas y actividad de la semana</p>
                          </div>
                        </div>
                        <label class="toggle-switch">
                          <input
                            type="checkbox"
                            [(ngModel)]="prefForm.notifications.weekly_summary"
                            name="weekly_summary"
                          />
                          <span class="toggle-slider"></span>
                        </label>
                      </div>

                      <div class="toggle-item">
                        <div class="toggle-info">
                          <div class="toggle-icon">⚠️</div>
                          <div class="toggle-text">
                            <strong>Alertas de Seguridad</strong>
                            <p>Notificaciones importantes de seguridad</p>
                          </div>
                        </div>
                        <label class="toggle-switch">
                          <input
                            type="checkbox"
                            [(ngModel)]="prefForm.notifications.security_alerts"
                            name="security_alerts"
                          />
                          <span class="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div class="form-actions">
                    <button
                      type="submit"
                      class="btn-primary"
                      [disabled]="saving()"
                    >
                      @if (saving()) {
                        <span class="spinner-small"></span> Guardando...
                      } @else {
                        Guardar preferencias
                      }
                    </button>
                  </div>
                </form>
              }
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Invite Modal -->
    @if (showInviteModal()) {
      <div class="modal-overlay" (click)="showInviteModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Invitar Miembro</h3>
            <button class="btn-close" (click)="showInviteModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="sendInvitation()" class="form">
              <div class="form-group">
                <label for="inviteEmail">Email</label>
                <input
                  type="email"
                  id="inviteEmail"
                  [(ngModel)]="inviteForm.email"
                  name="email"
                  required
                  placeholder="correo@empresa.com"
                />
              </div>

              <div class="form-group">
                <label for="inviteName">Nombre (opcional)</label>
                <input
                  type="text"
                  id="inviteName"
                  [(ngModel)]="inviteForm.name"
                  name="name"
                  placeholder="Nombre del colaborador"
                />
              </div>

              <div class="form-group">
                <label for="inviteRole">Rol</label>
                <select
                  id="inviteRole"
                  [(ngModel)]="inviteForm.role"
                  name="role"
                  required
                >
                  <option value="admin">Administrador - Acceso completo</option>
                  <option value="member">Miembro - Puede crear y editar</option>
                  <option value="viewer">Visualizador - Solo lectura</option>
                </select>
              </div>

              <div class="modal-actions">
                <button
                  type="button"
                  class="btn-secondary"
                  (click)="showInviteModal.set(false)"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn-primary"
                  [disabled]="inviting() || !inviteForm.email"
                >
                  @if (inviting()) {
                    <span class="spinner-small"></span> Enviando...
                  } @else {
                    Enviar invitación
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .config-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 24px;
    }

    .config-header {
      margin-bottom: 24px;
    }

    .breadcrumb {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .breadcrumb a {
      color: #6b7280;
      text-decoration: none;
    }

    .breadcrumb a:hover {
      color: #374151;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 4px 0;
    }

    .subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }

    .tabs-container {
      background: #f9fafb;
      border-radius: 8px;
      padding: 4px;
      margin-bottom: 24px;
    }

    .tabs {
      display: flex;
      gap: 4px;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background: #e5e7eb;
      color: #374151;
    }

    .tab-btn.active {
      background: white;
      color: #111827;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .tab-icon {
      font-size: 16px;
    }

    .panel {
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }

    .panel-header {
      padding: 24px 24px 0;
    }

    .panel-header h2 {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 4px 0;
    }

    .panel-description {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 16px 0;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .panel-body {
      padding: 24px;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      color: #111827;
      background: white;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .form-group input::placeholder,
    .form-group textarea::placeholder {
      color: #9ca3af;
    }

    .form-section {
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }

    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 16px 0;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background: #059669;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #f9fafb;
    }

    .btn-secondary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #f3f4f6;
    }

    .btn-danger {
      color: #ef4444;
    }

    .btn-danger:hover {
      background: #fef2f2;
    }

    /* Toggle Switch */
    .toggle-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .toggle-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .toggle-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toggle-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 8px;
      font-size: 20px;
    }

    .toggle-text strong {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #111827;
    }

    .toggle-text p {
      margin: 2px 0 0 0;
      font-size: 13px;
      color: #6b7280;
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #d1d5db;
      transition: 0.3s;
      border-radius: 24px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    .toggle-switch input:checked + .toggle-slider {
      background-color: #10b981;
    }

    .toggle-switch input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }

    /* Members */
    .members-section {
      margin-bottom: 24px;
    }

    .members-section h3 {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 12px 0;
    }

    .members-list,
    .invitations-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .member-card,
    .invitation-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .invitation-card.expired {
      opacity: 0.6;
    }

    .member-info,
    .invitation-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .member-avatar,
    .invitation-avatar {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #10b981;
      color: white;
      border-radius: 50%;
      font-size: 14px;
      font-weight: 600;
    }

    .invitation-avatar {
      background: #6b7280;
    }

    .member-details h4,
    .invitation-details h4 {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .member-details p,
    .invitation-details p {
      font-size: 13px;
      color: #6b7280;
      margin: 2px 0 0 0;
    }

    .member-meta,
    .invitation-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .role-badge {
      font-size: 11px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .role-admin {
      background: #fef3c7;
      color: #92400e;
    }

    .role-member {
      background: #dbeafe;
      color: #1e40af;
    }

    .role-viewer {
      background: #f3f4f6;
      color: #4b5563;
    }

    .status-badge {
      font-size: 11px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .status-badge.pending {
      background: #fef3c7;
      color: #92400e;
    }

    .expires-text {
      font-size: 12px;
      color: #9ca3af;
    }

    .member-actions,
    .invitation-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .role-select {
      padding: 6px 10px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      background: white;
    }

    /* Limit Info */
    .limit-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #eff6ff;
      border-radius: 8px;
      border: 1px solid #dbeafe;
    }

    .limit-icon {
      font-size: 20px;
    }

    .limit-text strong {
      display: block;
      font-size: 14px;
      color: #1e40af;
    }

    .limit-text p {
      margin: 2px 0 0 0;
      font-size: 13px;
      color: #3b82f6;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-state p {
      font-size: 14px;
      color: #6b7280;
    }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 24px;
    }

    .modal {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 18px;
      color: #6b7280;
      cursor: pointer;
      padding: 4px;
    }

    .modal-body {
      padding: 24px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .config-container {
        padding: 16px;
      }

      .tabs {
        flex-wrap: wrap;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .member-card,
      .invitation-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .member-actions,
      .invitation-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `]
})
export class TenantConfigComponent implements OnInit {
  private tenantConfigService = inject(TenantConfigService);

  // Tabs
  activeTab = signal<TabType>('organization');

  // Loading states
  loading = signal(true);
  saving = signal(false);
  inviting = signal(false);

  // Data
  organization = signal<Organization | null>(null);
  teamData = signal<{ members: TeamMember[]; invitations: TeamInvitation[]; total_members: number } | null>(null);
  preferences = signal<Preferences | null>(null);

  // Forms
  orgForm: Partial<Organization> = {};
  prefForm: Partial<Preferences> & { notifications: NonNullable<Preferences['notifications']> } = {
    language: 'es',
    notifications: {
      compliance_updates: true,
      weekly_summary: true,
      security_alerts: true,
      subscription_reminders: true,
      project_deadlines: true,
    },
    privacy: {
      analytics_enabled: true,
      share_usage_data: false,
    },
  };

  inviteForm: InviteRequest = {
    email: '',
    name: '',
    role: 'member',
  };

  // UI State
  showInviteModal = signal(false);

  ngOnInit() {
    this.loadData();
  }

  setTab(tab: TabType) {
    this.activeTab.set(tab);
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    const tab = this.activeTab();

    if (tab === 'organization') {
      this.tenantConfigService.getOrganization().subscribe({
        next: (org) => {
          this.organization.set(org);
          this.orgForm = { ...org };
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
    } else if (tab === 'team') {
      this.tenantConfigService.getTeam().subscribe({
        next: (data) => {
          this.teamData.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
    } else if (tab === 'preferences') {
      this.tenantConfigService.getPreferences().subscribe({
        next: (prefs) => {
          this.preferences.set(prefs);
          this.prefForm = { ...prefs };
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
    }
  }

  saveOrganization() {
    this.saving.set(true);
    this.tenantConfigService.updateOrganization(this.orgForm).subscribe({
      next: () => {
        this.saving.set(false);
        // Show success message
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  savePreferences() {
    this.saving.set(true);
    this.tenantConfigService.updatePreferences(this.prefForm).subscribe({
      next: () => {
        this.saving.set(false);
        // Show success message
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  sendInvitation() {
    if (!this.inviteForm.email) return;

    this.inviting.set(true);
    this.tenantConfigService.inviteMember(this.inviteForm).subscribe({
      next: () => {
        this.inviting.set(false);
        this.showInviteModal.set(false);
        this.inviteForm = { email: '', name: '', role: 'member' };
        this.loadData(); // Reload team data
      },
      error: () => {
        this.inviting.set(false);
      },
    });
  }

  cancelInvitation(id: number) {
    if (!confirm('¿Estás seguro de cancelar esta invitación?')) return;

    this.tenantConfigService.cancelInvitation(id).subscribe({
      next: () => {
        this.loadData();
      },
    });
  }

  resendInvitation(id: number) {
    this.tenantConfigService.resendInvitation(id).subscribe({
      next: () => {
        // Show success message
      },
    });
  }

  removeMember(userId: number) {
    if (!confirm('¿Estás seguro de eliminar este miembro?')) return;

    this.tenantConfigService.removeMember(userId).subscribe({
      next: () => {
        this.loadData();
      },
    });
  }

  updateMemberRole(userId: number, event: Event) {
    const role = (event.target as HTMLSelectElement).value;
    this.tenantConfigService.updateMemberRole(userId, role).subscribe({
      next: () => {
        // Show success message
      },
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'Admin',
      member: 'Miembro',
      viewer: 'Visualizador',
    };
    return labels[role] || role;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
