import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from './modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (modal.visible()) {
      <div class="modal-overlay" (click)="onOverlayClick()">
        <div class="modal-card" [class]="'modal-' + modal.config().type" (click)="$event.stopPropagation()">
          <div class="modal-icon-wrap">
            @switch (modal.config().type) {
              @case ('success') { <div class="modal-icon success-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div> }
              @case ('error') { <div class="modal-icon error-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg></div> }
              @case ('warning') { <div class="modal-icon warning-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div> }
              @case ('info') { <div class="modal-icon info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div> }
              @case ('confirm') { <div class="modal-icon confirm-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div> }
            }
          </div>
          <h3 class="modal-title">{{ modal.config().title }}</h3>
          @if (modal.config().message) {
            <p class="modal-message">{{ modal.config().message }}</p>
          }
          <div class="modal-actions">
            @if (modal.config().type === 'confirm') {
              <button class="modal-btn modal-btn-cancel" (click)="modal.close(false)">{{ modal.config().cancelText || 'Cancelar' }}</button>
              <button class="modal-btn modal-btn-confirm" (click)="modal.close(true)">{{ modal.config().confirmText || 'Confirmar' }}</button>
            } @else {
              <button class="modal-btn modal-btn-primary" [class]="'btn-' + modal.config().type" (click)="modal.close()">Aceptar</button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.2s ease;
      padding: 1rem;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

    .modal-card {
      background: white;
      border-radius: 20px;
      padding: 2.5rem 2rem 2rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-icon-wrap { display: flex; justify-content: center; margin-bottom: 1.25rem; }
    .modal-icon {
      width: 56px; height: 56px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
    }
    @keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }
    .modal-icon svg { width: 28px; height: 28px; }

    .success-icon { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #16a34a; }
    .error-icon { background: linear-gradient(135deg, #fee2e2, #fecaca); color: #dc2626; }
    .warning-icon { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #d97706; }
    .info-icon { background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #2563eb; }
    .confirm-icon { background: linear-gradient(135deg, #e0e7ff, #c7d2fe); color: #4f46e5; }

    .modal-title {
      font-size: 1.25rem; font-weight: 700; color: #0f172a;
      margin: 0 0 0.5rem; line-height: 1.3;
    }
    .modal-message {
      font-size: 0.875rem; color: #64748b; margin: 0 0 1.5rem;
      line-height: 1.5; max-height: 200px; overflow-y: auto;
      word-break: break-word;
    }

    .modal-actions { display: flex; gap: 0.75rem; justify-content: center; }
    .modal-btn {
      padding: 0.625rem 1.5rem;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 100px;
    }
    .modal-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .modal-btn:active { transform: translateY(0); }

    .modal-btn-primary { color: white; }
    .modal-btn-primary.btn-success { background: linear-gradient(135deg, #22c55e, #16a34a); }
    .modal-btn-primary.btn-error { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .modal-btn-primary.btn-warning { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .modal-btn-primary.btn-info { background: linear-gradient(135deg, #3b82f6, #2563eb); }

    .modal-btn-cancel {
      background: #f1f5f9; color: #64748b;
    }
    .modal-btn-cancel:hover { background: #e2e8f0; }

    .modal-btn-confirm {
      background: linear-gradient(135deg, #5687f3, #3b6de0); color: white;
    }

    @media (max-width: 480px) {
      .modal-card { padding: 2rem 1.5rem 1.5rem; border-radius: 16px; }
      .modal-actions { flex-direction: column; }
      .modal-btn { width: 100%; }
    }
  `]
})
export class ModalComponent {
  modal = inject(ModalService);

  onOverlayClick(): void {
    if (this.modal.config().type !== 'confirm') {
      this.modal.close();
    }
  }
}
