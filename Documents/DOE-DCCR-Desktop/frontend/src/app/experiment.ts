import { Component, computed, effect, inject, signal } from '@angular/core';

import { ConfigStep } from './steps/config';
import { DataStep } from './steps/data';
import { OptimizationStep } from './steps/optimization';
import { PlotsStep } from './steps/plots';
import { ResultsStep } from './steps/results';
import { Store } from './store';

export type Aba = 'fatores' | 'dados' | 'resultados' | 'graficos' | 'otimizacao';

/**
 * Um experimento em abas, criadas conforme o trabalho avanca: Dados so
 * aparece depois da matriz, e Resultados, Graficos e Otimizacao so depois do
 * ajuste. Cada aba monta o conteudo apenas quando aberta, entao graficos e
 * otimizacao nao sao calculados antes de alguem pedir.
 */
@Component({
  selector: 'app-experiment',
  imports: [ConfigStep, DataStep, ResultsStep, PlotsStep, OptimizationStep],
  templateUrl: './experiment.html',
})
export class ExperimentView {
  readonly store = inject(Store);
  readonly aba = signal<Aba>('fatores');

  private ultimoArquivo: string | null | undefined;
  private tinhaAnalise = false;

  readonly abas = computed(() => {
    const temMatriz = !!this.store.design();
    const temAjuste = !!this.store.analysis();
    return [
      { id: 'fatores' as const, label: 'Fatores e níveis', liberada: true },
      { id: 'dados' as const, label: 'Dados', liberada: temMatriz },
      { id: 'resultados' as const, label: 'Resultados', liberada: temAjuste },
      { id: 'graficos' as const, label: 'Gráficos', liberada: temAjuste },
      { id: 'otimizacao' as const, label: 'Otimização', liberada: temAjuste },
    ];
  });

  constructor() {
    effect(() => {
      const arquivo = this.store.file();
      const analise = this.store.analysis();

      // trocar de experimento recomeca pelas abas iniciais
      if (this.ultimoArquivo !== undefined && this.ultimoArquivo !== arquivo) {
        this.aba.set(this.store.analysis() ? 'resultados' : 'fatores');
      }
      this.ultimoArquivo = arquivo;

      // terminou de ajustar: leva para os resultados, como fazia o fluxo antigo
      const temAnalise = !!analise;
      if (temAnalise && !this.tinhaAnalise && this.aba() === 'dados') {
        this.aba.set('resultados');
      }
      this.tinhaAnalise = temAnalise;
    });
  }

  ir(id: Aba, liberada: boolean): void {
    if (liberada) this.aba.set(id);
  }

  value(ev: Event): string {
    return (ev.target as HTMLInputElement).value;
  }
}
