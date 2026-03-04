import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
    selector: 'app-register',
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="register-page">
      <div class="register-card">
        <div class="brand"><svg viewBox="0 0 40 40" fill="none" width="40" height="40"><path d="M20 4L6 12v16l14 8 14-8V12L20 4z" fill="#5687f3" opacity="0.2"/><path d="M20 4L6 12v16l14 8 14-8V12L20 4z" stroke="#5687f3" stroke-width="2" fill="none"/><path d="M14 20l4 4 8-8" stroke="#5687f3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><h1>Veridata</h1></div>
        <h2>Crear Cuenta</h2>
        <p class="subtitle">Registra tu organización y comienza a evaluar el cumplimiento</p>
        @if (error()) { <div class="alert-error">{{ error() }}</div> }
        <form (ngSubmit)="onRegister()">
          <div class="form-group"><label class="vd-label">Nombre de la organización</label><input class="vd-input" [(ngModel)]="form.tenant_name" name="tenant_name" required></div>
          <div class="form-group"><label class="vd-label">Tu nombre</label><input class="vd-input" [(ngModel)]="form.name" name="name" required></div>
          <div class="form-group"><label class="vd-label">Correo electrónico</label><input type="email" class="vd-input" [(ngModel)]="form.email" name="email" required></div>
          <div class="form-row">
            <div class="form-group"><label class="vd-label">Contraseña</label><input type="password" class="vd-input" [(ngModel)]="form.password" name="password" required></div>
            <div class="form-group"><label class="vd-label">Confirmar</label><input type="password" class="vd-input" [(ngModel)]="form.password_confirmation" name="password_confirmation" required></div>
          </div>
          <button type="submit" class="vd-btn vd-btn-primary" style="width:100%;padding:0.75rem;" [disabled]="loading()">{{ loading() ? 'Registrando...' : 'Crear cuenta' }}</button>
        </form>
        <p class="login-link">¿Ya tienes cuenta? <a routerLink="/login">Iniciar sesión</a></p>
      </div>
    </div>
  `,
    styles: [`
    .register-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0d1321, #1a2540); padding: 2rem; }
    .register-card { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 20px 40px rgb(0 0 0 / 0.2); width: 100%; max-width: 500px; }
    .brand { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; }
    .brand h1 { font-size: 1.5rem; font-weight: 800; margin: 0; }
    h2 { margin: 0 0 0.25rem; font-size: 1.25rem; }
    .subtitle { color: #64748b; font-size: 0.8125rem; margin: 0 0 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .alert-error { background: rgba(239,68,68,0.1); color: #ef4444; padding: 0.75rem; border-radius: 8px; font-size: 0.8125rem; margin-bottom: 1rem; }
    .login-link { text-align: center; margin-top: 1rem; font-size: 0.8125rem; color: #64748b; }
    .login-link a { color: #5687f3; font-weight: 600; text-decoration: none; }
  `],
})
export class RegisterComponent {
    form = { name: '', email: '', password: '', password_confirmation: '', tenant_name: '' };
    error = signal('');
    loading = signal(false);
    constructor(private authService: AuthService, private router: Router) { }
    onRegister(): void {
        this.loading.set(true); this.error.set('');
        this.authService.register(this.form).subscribe({
            next: () => { this.loading.set(false); this.router.navigate(['/projects']); },
            error: (err: { error?: { message?: string } }) => { this.loading.set(false); this.error.set(err.error?.message || 'Error al registrar'); },
        });
    }
}
