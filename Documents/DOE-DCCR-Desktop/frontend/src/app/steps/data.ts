import { Component, computed, inject, signal } from '@angular/core';

import { baixarCSV, nomeArquivo } from '../download';
import { parseNumbers, signed3 } from '../format';
import { PointKind } from '../models';
import { Store } from '../store';

/** Passo 2 - matriz experimental e entrada das respostas. */
@Component({
  selector: 'app-data',
  templateUrl: './data.html',
})
export class DataStep {
  readonly store = inject(Store);
  readonly signed3 = signed3;
  readonly paste = signal('');
  /** A matriz fica larga demais com as duas escalas: mostra uma de cada vez. */
  readonly vista = signal<'coded' | 'real'>('coded');

  readonly kinds: Record<PointKind, { label: string; short: string; css: string }> = {
    factorial: { label: 'Fatorial', short: 'FAT', css: 'fat' },
    axial: { label: 'Axial', short: 'AXI', css: 'axi' },
    center: { label: 'Central', short: 'CEN', css: 'cen' },
  };

  readonly preenchidas = computed(() => this.store.responses().filter((v) => v !== 0).length);

  value(ev: Event): string {
    return (ev.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  number(ev: Event): number {
    return (ev.target as HTMLInputElement).valueAsNumber;
  }

  fill(): void {
    const { values, bad } = parseNumbers(this.paste());
    const n = this.store.responses().length;
    if (!values.length) {
      this.store.notify('warn', 'Nada numérico foi encontrado no texto colado.');
      return;
    }
    if (values.length !== n) {
      this.store.notify(
        'error',
        `Foram lidos ${values.length} valores para ${n} ensaios. Confira se a coluna colada tem exatamente ` +
          'uma resposta por ensaio, na ordem da matriz.',
      );
      return;
    }
    this.store.setResponses(values);
    const extra = bad ? ` (${bad} item(ns) não numérico(s) ignorado(s))` : '';
    this.store.notify('success', `${n} respostas preenchidas${extra}.`);
  }

  copyCurrent(): void {
    this.paste.set(this.store.responses().map((v) => String(v)).join('\n'));
    this.store.notify('info', 'Respostas atuais copiadas para a caixa de texto.');
  }

  /** A matriz inteira, nas duas escalas, mais a resposta digitada. */
  baixar(): void {
    const d = this.store.design();
    if (!d) return;
    const y = this.store.responses();
    const cabecalho = [
      'Ensaio',
      'Tipo',
      ...d.factor_names.map((_, i) => `x${i + 1}`),
      ...d.factor_names,
      `${d.resp_label}`,
    ];
    baixarCSV(
      nomeArquivo(this.store.name(), 'matriz'),
      cabecalho,
      d.runs.map((r, i) => [r.n, this.kinds[r.type].label, ...r.coded, ...r.real, y[i] ?? 0]),
    );
  }
}
