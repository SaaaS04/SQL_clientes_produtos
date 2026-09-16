import { Component, computed, inject, input } from '@angular/core';

import { ParetoData } from '../models';
import { Store } from '../store';
import { Chart, paletaChart } from './chart';
import { simboloTexto } from './simbolos';

/**
 * Diagrama de Pareto: |t| de cada termo contra o t tabelado.
 *
 * A Media entra no topo com a barra truncada - o |t| do intercepto esmagaria
 * os efeitos se governasse a escala -, e o rotulo carrega o valor verdadeiro.
 */
@Component({
  selector: 'app-pareto-chart',
  imports: [Chart],
  template: `
    <app-chart
      [option]="option()"
      [height]="altura()"
      [fileName]="fileName()"
      title="Diagrama de Pareto"
      caption="efeitos padronizados |t| contra o t tabelado · * = significativo"
    />
  `,
})
export class ParetoChart {
  readonly data = input.required<ParetoData>();
  readonly fileName = input('pareto');
  private readonly store = inject(Store);

  readonly altura = computed(() => Math.max(280, 34 * (this.data().terms.length + 1) + 90));

  readonly option = computed(() => {
    const d = this.data();
    const c = paletaChart(this.store.theme());
    const categorias = [...d.terms.map((t) => simboloTexto(t.symbol)), 'Média'];
    const valores = [
      ...d.terms.map((t) => ({
        value: t.t,
        itemStyle: { color: t.significant ? c.teal : c.cinza },
        rotulo: `${t.t.toFixed(2)}${t.significant ? '*' : ''}`,
        nome: t.name,
        p: t.p,
      })),
      {
        value: d.mean.t_plot,
        itemStyle: { color: c.azul },
        rotulo: `${d.mean.t.toFixed(2)}${d.mean.significant ? '*' : ''}${d.mean.truncated ? ' →' : ''}`,
        nome: d.mean.truncated ? 'Intercepto (barra truncada para a escala seguir os efeitos)' : 'Intercepto',
        p: d.mean.p,
      },
    ];

    return {
      backgroundColor: 'transparent',
      textStyle: { color: c.texto, fontFamily: 'Inter, sans-serif' },
      grid: { left: 96, right: 88, top: 16, bottom: 46, containLabel: false },
      tooltip: {
        trigger: 'item',
        backgroundColor: c.fundo,
        borderColor: c.linha,
        textStyle: { color: c.texto },
        formatter: (p: { name: string; data: { nome: string; p: number }; value: number }) =>
          `<b>${p.name}</b> &nbsp; ${p.data.nome}<br>|t| = ${p.value.toFixed(3)}<br>p = ${p.data.p.toFixed(4)}`,
      },
      xAxis: {
        type: 'value',
        max: d.x_max,
        name: 'Efeitos padronizados (t calculado)',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { color: c.suave },
        axisLine: { lineStyle: { color: c.linha } },
        axisLabel: { color: c.suave },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: categorias,
        axisLine: { lineStyle: { color: c.linha } },
        axisLabel: { color: c.texto, fontFamily: 'ui-monospace, monospace' },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: valores,
          barMaxWidth: 22,
          label: {
            show: true,
            position: 'right',
            color: c.texto,
            fontSize: 11,
            formatter: (p: { data: { rotulo: string } }) => p.data.rotulo,
          },
          markLine: {
            silent: true,
            symbol: 'none',
            label: {
              formatter: `t crítico (${d.df} gl) = ${d.t_crit.toFixed(2)}`,
              color: c.vermelho,
              fontSize: 11,
              position: 'end',
            },
            lineStyle: { color: c.vermelho, type: 'dashed', width: 1.5 },
            data: [{ xAxis: d.t_crit }],
          },
        },
      ],
    } as Record<string, unknown>;
  });
}
