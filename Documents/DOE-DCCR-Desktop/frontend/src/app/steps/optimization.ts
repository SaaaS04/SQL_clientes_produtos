import { Component, inject, input } from '@angular/core';

import { baixarCSV, nomeArquivo } from '../download';
import { fixed, signed3 } from '../format';
import { OptResult } from '../models';
import { Store } from '../store';

/** Cartao de um resultado, maximizacao ou minimizacao. */
@Component({
  selector: 'app-opt-result',
  template: `
    @let r = result();
    <section [class]="'card opt opt--' + tone()">
      <header class="card__head">
        <h2 class="card__title">{{ title() }}</h2>
        <span class="spacer"></span>
        <span [class]="'pill pill--' + (r.converged ? 'ok' : 'warn')">
          {{ r.converged ? 'convergido' : 'não convergiu' }}
        </span>
      </header>

      <div class="opt__hero">
        <span class="opt__label">Y predito no ótimo</span>
        <span class="opt__value">{{ fixed(r.y) }}</span>
        @if (r.se > 0 && r.ci_available) {
          <span class="opt__ci">IC 95%: {{ fixed(r.ci_low) }} a {{ fixed(r.ci_high) }} &nbsp;·&nbsp; SE ± {{ fixed(r.se, 3) }}</span>
        }
      </div>

      @if (r.truncated) {
        <!-- o polinomio nao conhece o dominio fisico: o modelo fica intocado e o
             que se exibe respeita o limite, com a estimativa crua ao lado -->
        <p class="alert alert--warn">
          O polinômio estima <strong>{{ fixed(r.y_raw) }}</strong>, além do limite físico de {{ r.limit }}. Leia como
          resposta {{ tone() === 'teal' ? 'máxima' : 'mínima' }} dentro da região experimental.
        </p>
      }

      <div class="tbl-wrap">
        <table class="tbl tbl--compact">
          <thead>
            <tr>
              <th class="tbl__left">Fator</th>
              <th class="tbl__num">Codificado</th>
              <th class="tbl__num">Real</th>
              <th class="tbl__left">Unidade</th>
            </tr>
          </thead>
          <tbody>
            @for (f of r.factors; track $index) {
              <tr>
                <td class="tbl__left"><strong>X{{ $index + 1 }}</strong> {{ f.name }}</td>
                <td class="tbl__num">{{ signed3(f.coded) }}</td>
                <td class="tbl__num">
                  <strong>{{ f.real }}</strong>
                  @if (f.extrapolated) {
                    <span class="pill pill--warn">extrapolado</span>
                  }
                </td>
                <td class="tbl__left">{{ f.unit || '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (r.sensitivity.length) {
        <h3 class="sub-title">Sensibilidade</h3>
        <p class="hint">quanto a resposta muda ao desviar ±10% de cada fator, perto do ótimo</p>
        <div class="sens">
          @for (s of r.sensitivity; track s.name) {
            <div class="sens__row">
              <span class="sens__name">{{ s.name }}</span>
              <span class="sens__bar"><span class="sens__fill" [style.width.%]="s.pct"></span></span>
              <span class="sens__val">{{ fixed(s.value, 3) }}</span>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class OptResultCard {
  readonly result = input.required<OptResult>();
  readonly title = input.required<string>();
  readonly tone = input<'teal' | 'red'>('teal');
  readonly fixed = fixed;
  readonly signed3 = signed3;
}

/** Otimizacao da resposta com IC e sensibilidade. */
@Component({
  selector: 'app-optimization',
  imports: [OptResultCard],
  template: `
    @if (store.optimization(); as o) {
      <div class="sec-head">
        <h3 class="sec-head__title">Otimização da resposta</h3>
        <p class="sec-head__sub">
          Busca global restrita à região experimental — a esfera que contém todos os pontos do delineamento. O ótimo
          nunca é extrapolado para fora de onde houve ensaio.
        </p>
        <span class="spacer"></span>
        <button class="chip" type="button" (click)="baixar()">CSV</button>
      </div>

      <div class="opt-grid">
        <app-opt-result [result]="o.max" title="Maximização" tone="teal" />
        <app-opt-result [result]="o.min" title="Minimização" tone="red" />
      </div>

      <section class="card">
        <header class="card__head"><h2 class="card__title">Amplitude da resposta</h2></header>
        <div class="amp">
          <div class="amp__item">
            <span class="amp__label">Y mínimo</span><span class="amp__value amp__value--red">{{ fixed(o.amplitude.y_min) }}</span>
          </div>
          <span class="amp__arrow">→</span>
          <div class="amp__item">
            <span class="amp__label">amplitude</span><span class="amp__value">{{ fixed(o.amplitude.range) }}</span>
          </div>
          <span class="amp__arrow">→</span>
          <div class="amp__item">
            <span class="amp__label">Y máximo</span><span class="amp__value amp__value--teal">{{ fixed(o.amplitude.y_max) }}</span>
          </div>
        </div>
      </section>
    } @else {
      <div class="loading">Otimizando (evolução diferencial)…</div>
    }
  `,
})
export class OptimizationStep {
  readonly store = inject(Store);
  readonly fixed = fixed;

  constructor() {
    void this.store.loadOptimization();
  }

  baixar(): void {
    const o = this.store.optimization();
    if (!o) return;
    const linhas: unknown[][] = [];
    for (const [rotulo, r] of [
      ['Maximizacao', o.max],
      ['Minimizacao', o.min],
    ] as const) {
      for (const f of r.factors) {
        linhas.push([rotulo, r.y, r.y_raw, r.truncated ? 'sim' : 'nao', f.name, f.coded, f.real, f.unit]);
      }
    }
    baixarCSV(
      nomeArquivo(this.store.name(), 'otimizacao'),
      ['Objetivo', 'Y exibido', 'Y bruto', 'Truncado', 'Fator', 'Codificado', 'Real', 'Unidade'],
      linhas,
    );
  }
}
