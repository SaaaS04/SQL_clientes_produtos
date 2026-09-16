import { Component, computed, inject } from '@angular/core';

import { g4 } from '../format';
import { AlphaType } from '../models';
import { Store } from '../store';

/** Passo 1 - fatores, delineamento e conjuntos de referencia (legacy ConfigPanel). */
@Component({
  selector: 'app-config',
  templateUrl: './config.html',
})
export class ConfigStep {
  readonly store = inject(Store);
  readonly g4 = g4;
  readonly nFactorOptions = [2, 3, 4, 5];
  readonly nCenterOptions = [3, 4, 5, 6, 7, 8, 9, 10];
  readonly levelHeads = ['Fator', '−α', '−1', '0', '+1', '+α', 'Mínimo', 'Máximo'];

  readonly summary = computed(() => {
    const lv = this.store.levels();
    if (!lv) return 'Níveis calculados';
    return (
      `Níveis calculados · ${lv.n_total} ensaios · ${lv.n_factorial} fatoriais + ` +
      `${lv.n_axial} axiais + ${lv.n_center} centrais · alfa = ${lv.alpha.toFixed(4)}`
    );
  });

  text(ev: Event): string {
    return (ev.target as HTMLInputElement | HTMLSelectElement).value;
  }

  int(ev: Event): number {
    return parseInt(this.text(ev), 10);
  }

  number(ev: Event): number {
    return (ev.target as HTMLInputElement).valueAsNumber;
  }

  alpha(ev: Event): AlphaType {
    return this.text(ev) as AlphaType;
  }

  /** Nivel 0 = media dos niveis -1 e +1, travado para manter o delineamento simetrico. */
  center(i: number): string {
    const f = this.store.factors()[i];
    return f ? g4((f.min_val + f.max_val) / 2) : '-';
  }
}
