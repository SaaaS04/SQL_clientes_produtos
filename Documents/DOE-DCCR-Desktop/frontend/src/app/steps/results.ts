import { Component, computed, inject } from '@angular/core';

import { baixarCSV, nomeArquivo } from '../download';
import { escapeHtml, fixed, sci } from '../format';
import { Transform } from '../models';
import { Store } from '../store';
import { simboloTexto } from '../charts/simbolos';

/** Passo 3 - KPIs, equacao, coeficientes e ANOVA. */
@Component({
  selector: 'app-results',
  templateUrl: './results.html',
})
export class ResultsStep {
  readonly store = inject(Store);
  readonly fixed = fixed;
  readonly sci = sci;

  readonly sigOptions = [
    { v: 0.01, l: '1 %' },
    { v: 0.05, l: '5 %' },
    { v: 0.1, l: '10 %' },
  ];
  // chaves de AnovaResult.to_dataframe() e o cabecalho exibido
  readonly anovaCols = ['Fonte de variacao', 'GL', 'SQ', 'QM', 'F calculado', 'F tabelado', 'p-valor', 'Veredito'];
  readonly anovaHeads = ['Fonte', 'GL', 'SQ', 'QM', 'F calc.', 'F tab.', 'p', 'Veredito'];

  /** Todos os termos na mesma cor: quem informa a significancia e a tabela. */
  readonly equationHtml = computed(() => {
    const a = this.store.analysis();
    if (!a) return '';
    const e = a.equation;
    let s = `${escapeHtml(e.resp_label)} = ${e.intercept.toFixed(2)}`;
    for (const t of e.terms) {
      s += ` ${t.coef >= 0 ? '+' : '&minus;'} ${Math.abs(t.coef).toFixed(2)}&middot;${t.symbol}`;
    }
    return s;
  });

  value(ev: Event): string {
    return (ev.target as HTMLSelectElement).value;
  }

  setSignificance(ev: Event): void {
    void this.store.setSignificance(parseFloat(this.value(ev)));
  }

  setTransform(ev: Event): void {
    void this.store.setTransform(this.value(ev) as Transform);
  }

  tone(v: number, good: number, mid: number): string {
    return v >= good ? 'good' : v >= mid ? 'mid' : 'bad';
  }

  comparison(below: boolean): string {
    return below ? '<' : '>';
  }

  baixarCoeficientes(): void {
    const a = this.store.analysis();
    if (!a) return;
    baixarCSV(
      nomeArquivo(this.store.name(), 'coeficientes'),
      ['Termo', 'Descricao', 'Coeficiente', 'Erro padrao', 't', 'p', 'Significativo'],
      a.coefficients.map((c) => [
        simboloTexto(c.symbol),
        c.caption,
        c.coef,
        c.se,
        c.t,
        c.p,
        c.significant ? 'sim' : 'nao',
      ]),
    );
  }

  baixarAnova(): void {
    const a = this.store.analysis();
    if (!a) return;
    baixarCSV(
      nomeArquivo(this.store.name(), 'anova'),
      this.anovaCols,
      a.anova.map((linha) => this.anovaCols.map((c) => linha[c])),
    );
  }
}
