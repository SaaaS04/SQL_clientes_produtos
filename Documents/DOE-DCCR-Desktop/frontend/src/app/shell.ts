import { Component, computed, inject, signal } from '@angular/core';

import { dentroDoTauri, escolherPastaNativa } from './api';
import { CompareView } from './compare-view';
import { ExperimentView } from './experiment';
import { Store } from './store';

/** Casca do app: barra lateral com os experimentos da pasta e a area principal. */
@Component({
  selector: 'app-root',
  imports: [ExperimentView, CompareView],
  templateUrl: './shell.html',
})
export class Shell {
  readonly store = inject(Store);
  readonly nativo = dentroDoTauri();
  readonly caminhoDigitado = signal('');
  readonly confirmandoExclusao = signal<string | null>(null);

  readonly pastaCurta = computed(() => {
    const p = this.store.workspacePath();
    if (!p) return '';
    const partes = p.replace(/\\/g, '/').split('/').filter(Boolean);
    return partes.slice(-2).join(' / ');
  });

  value(ev: Event): string {
    return (ev.target as HTMLInputElement).value;
  }

  async escolherPasta(): Promise<void> {
    const escolhida = await escolherPastaNativa();
    if (escolhida) await this.store.openWorkspace(escolhida);
  }

  async abrirDigitada(): Promise<void> {
    await this.store.openWorkspace(this.caminhoDigitado());
    this.caminhoDigitado.set('');
  }

  confirmarExclusao(file: string, ev: Event): void {
    ev.stopPropagation();
    this.confirmandoExclusao.set(file);
  }

  async excluir(file: string, ev: Event): Promise<void> {
    ev.stopPropagation();
    this.confirmandoExclusao.set(null);
    await this.store.excluir(file);
  }

  cancelarExclusao(ev: Event): void {
    ev.stopPropagation();
    this.confirmandoExclusao.set(null);
  }

  alternarComparacao(file: string, ev: Event): void {
    ev.stopPropagation();
    this.store.toggleCompare(file);
  }

  resumoLinha(r2: number | null | undefined): string {
    return r2 === null || r2 === undefined ? '' : `R² ${r2.toFixed(4)}`;
  }
}
