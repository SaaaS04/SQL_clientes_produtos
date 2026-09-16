import { Component, effect, inject, signal } from '@angular/core';

import { CompareCoefs, CompareMetrics, CompareScatter } from './charts/compare-charts';
import { baixarCSV } from './download';
import { fixed, sci } from './format';
import { CompareOut } from './models';
import { Store } from './store';

/** Comparacao entre os experimentos marcados na barra lateral. */
@Component({
  selector: 'app-compare',
  imports: [CompareMetrics, CompareCoefs, CompareScatter],
  templateUrl: './compare-view.html',
})
export class CompareView {
  readonly store = inject(Store);
  readonly fixed = fixed;
  readonly sci = sci;
  readonly resultado = signal<CompareOut | null>(null);
  readonly carregando = signal(false);

  private seq = 0;

  constructor() {
    effect(() => {
      const files = this.store.compareSelection();
      if (files.length < 2) {
        this.resultado.set(null);
        return;
      }
      void this.carregar([...files]);
    });
  }

  private async carregar(files: string[]): Promise<void> {
    const seq = ++this.seq;
    this.carregando.set(true);
    try {
      const out = await this.store.compare(files);
      if (seq === this.seq) this.resultado.set(out);
    } catch (e) {
      if (seq === this.seq) {
        this.resultado.set(null);
        this.store.reportError(e);
      }
    } finally {
      if (seq === this.seq) this.carregando.set(false);
    }
  }

  baixarTabela(): void {
    const r = this.resultado();
    if (!r) return;
    baixarCSV(
      'comparacao-experimentos',
      ['Experimento', 'Resposta', 'Fatores', 'Ensaios', 'R2', 'R2 ajustado', 'Q2', 'F', 'p (F)', 'Y otimo', 'Condicoes otimas'],
      r.items.map((it) => [
        it.name,
        it.resp_label,
        it.info.k,
        it.info.n_total,
        it.kpis.r2,
        it.kpis.r2_adj,
        it.kpis.q2,
        it.kpis.f,
        it.kpis.p_f,
        it.optimum.y,
        it.optimum.factors.map((f) => `${f.name} = ${f.real} ${f.unit}`.trim()).join(' | '),
      ]),
    );
  }
}
