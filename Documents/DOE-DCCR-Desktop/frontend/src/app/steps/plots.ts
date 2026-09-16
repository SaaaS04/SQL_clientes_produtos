import { Component, effect, inject, signal } from '@angular/core';

import { ContourChart } from '../charts/contour-chart';
import { EffectsChart } from '../charts/effects-chart';
import { NormalChart } from '../charts/normal-chart';
import { ParetoChart } from '../charts/pareto-chart';
import { PredActualChart } from '../charts/pred-actual-chart';
import { SurfaceChart } from '../charts/surface-chart';
import { nomeArquivo } from '../download';
import { ChartsOut, SurfaceOut } from '../models';
import { Store } from '../store';

/** Galeria de graficos do experimento aberto, desenhada com ECharts. */
@Component({
  selector: 'app-plots',
  imports: [ParetoChart, EffectsChart, PredActualChart, NormalChart, SurfaceChart, ContourChart],
  templateUrl: './plots.html',
})
export class PlotsStep {
  readonly store = inject(Store);
  readonly dados = signal<ChartsOut | null>(null);
  readonly par = signal(0);
  readonly superficie = signal<SurfaceOut | null>(null);

  private seq = 0;

  constructor() {
    // os numeros sao pedidos uma vez por ajuste; trocar o tema so repinta,
    // porque o desenho acontece aqui
    effect(() => {
      const a = this.store.analysis();
      if (!a) return;
      void this.carregar();
    });
  }

  arquivo(sufixo: string): string {
    return nomeArquivo(this.store.name(), sufixo);
  }

  private async carregar(): Promise<void> {
    const seq = ++this.seq;
    try {
      const out = await this.store.fetchCharts();
      if (seq !== this.seq) return;
      this.dados.set(out);
      if (out.pairs.length) {
        await this.selecionarPar(this.par() < out.pairs.length ? this.par() : 0, seq);
      }
    } catch (e) {
      if (seq === this.seq) this.store.reportError(e);
    }
  }

  /** Trocar o par redesenha a superficie 3D e o contorno juntos. */
  async selecionarPar(i: number, seq = this.seq): Promise<void> {
    const p = this.dados()?.pairs[i];
    if (!p) return;
    this.par.set(i);
    this.superficie.set(null);
    try {
      const s = await this.store.fetchSurface(p.ix, p.iy);
      if (seq === this.seq) this.superficie.set(s);
    } catch (e) {
      if (seq === this.seq) this.store.reportError(e);
    }
  }
}
