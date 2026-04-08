import { Injectable, signal, ComponentRef, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';

export type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface ModalConfig {
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private _visible = signal(false);
  private _config = signal<ModalConfig>({ type: 'info', title: '', message: '' });
  private _resolver: ((value: boolean) => void) | null = null;

  get visible() { return this._visible; }
  get config() { return this._config; }

  success(title: string, message: string = ''): void {
    this._config.set({ type: 'success', title, message });
    this._visible.set(true);
  }

  error(title: string, message: string = ''): void {
    this._config.set({ type: 'error', title, message });
    this._visible.set(true);
  }

  warning(title: string, message: string = ''): void {
    this._config.set({ type: 'warning', title, message });
    this._visible.set(true);
  }

  info(title: string, message: string = ''): void {
    this._config.set({ type: 'info', title, message });
    this._visible.set(true);
  }

  confirm(title: string, message: string = ''): Promise<boolean> {
    return new Promise((resolve) => {
      this._resolver = resolve;
      this._config.set({ type: 'confirm', title, message, confirmText: 'Confirmar', cancelText: 'Cancelar' });
      this._visible.set(true);
    });
  }

  close(result: boolean = false): void {
    this._visible.set(false);
    if (this._resolver) {
      this._resolver(result);
      this._resolver = null;
    }
  }
}
