import { Component, computed, inject, input } from '@angular/core';

import { EffectTerm } from '../models';
import { Store } from '../store';
import { Chart, paletaChart } from './chart';
import { simboloTexto } from './simbolos';

/**
 * Coeficientes do modelo na escala codificada.
 *
 * So sao comparaveis entre si porque todos os fatores variam de -alfa a
 * +alfa. Verde/vermelho conforme o sinal quando significativo; cinza quando
 * nao.
 */
@Component({
  selector: 'app-effects-chart',
  imports: [Chart],
  template: `
    <app-chart
      [option]="option()"
      [height]="altura()"
      [fileName]="fileName()"
      title="Coeficientes do modelo"
      caption="magnitude e sinal de cada termo, em variáveis codificadas"
    />
  `,
})
export class EffectsChart {
  readonly terms = input.required<EffectTerm[]>();
  readonly fileName = input('coeficientes');
  private readonly store = inject(Store);

  readonly altura = computed(() => Math.max(260, 34 * this.terms().length + 80));

  readonly option = computed(() => {
    const termos = this.terms();
    const c = paletaChart(this.store.theme());
    const maior = Math.max(...termos.map((t) => Math.abs(t.coef)), 1);

    return {
      backgroundColor: 'transparent',
      textStyle: { color: c.texto, fontFamily: 'Inter, sans-serif' },
      grid: { left: 96, right: 76, top: 16, bottom: 46, containLabel: false },
      tooltip: {
        trigger: 'item',
        backgroundColor: c.fundo,
        borderColor: c.linha,
        textStyle: { color: c.texto },
        formatter: (p: { name: string; data: { nome: string; p: number }; value: number }) =>
          `<b>${p.name}</b> &nbsp; ${p.data.nome}<br>coef = ${p.value.toFixed(3)}<br>p = ${p.data.p.toFixed(4)}`,
      },
      xAxis: {
        type: 'value',
        min: -maior * 1.25,
        max: maior * 1.25,
        name: 'Coeficiente',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { color: c.suave },
        axisLine: { lineStyle: { color: c.linha } },
        axisLabel: { color: c.suave },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: termos.map((t) => simboloTexto(t.symbol)),
        axisLine: { lineStyle: { color: c.linha } },
        axisLabel: { color: c.texto, fontFamily: 'ui-monospace, monospace' },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 22,
          data: termos.map((t) => ({
            value: t.coef,
            nome: t.name,
            p: t.p,
            itemStyle: {
              color: !t.significant ? c.cinza : t.coef > 0 ? c.teal : c.vermelho,
            },
          })),
          label: {
            show: true,
            position: (p: { value: number }) => (p.value >= 0 ? 'right' : 'left'),
            color: c.texto,
            fontSize: 11,
            formatter: (p: { value: number; data: { p: number } }) =>
              `${p.value >= 0 ? '+' : ''}${p.value.toFixed(2)}`,
          },
          markLine: {
            silent: true,
            symbol: 'none',
            label: { show: false },
            lineStyle: { color: c.texto, width: 1.2 },
            data: [{ xAxis: 0 }],
          },
        },
      ],
    } as Record<string, unknown>;
  });
}
