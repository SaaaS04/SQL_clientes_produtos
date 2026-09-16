import { Component, computed, inject, input } from '@angular/core';

import { NormalData } from '../models';
import { Store } from '../store';
import { Chart, paletaChart } from './chart';

/** Papel de probabilidade normal: pontos proximos da reta = residuos bem comportados. */
@Component({
  selector: 'app-normal-chart',
  imports: [Chart],
  template: `
    <app-chart
      [option]="option()"
      [height]="400"
      [fileName]="fileName()"
      title="Probabilidade normal"
      caption="pontos próximos da reta indicam resíduos bem comportados"
    />
  `,
})
export class NormalChart {
  readonly data = input.required<NormalData>();
  readonly fileName = input('probabilidade-normal');
  private readonly store = inject(Store);

  readonly option = computed(() => {
    const d = this.data();
    const c = paletaChart(this.store.theme());
    const { slope, intercept, x_min, x_max } = d.line;

    return {
      backgroundColor: 'transparent',
      textStyle: { color: c.texto, fontFamily: 'Inter, sans-serif' },
      grid: { left: 66, right: 28, top: 20, bottom: 52, containLabel: false },
      tooltip: {
        trigger: 'item',
        backgroundColor: c.fundo,
        borderColor: c.linha,
        textStyle: { color: c.texto },
        formatter: (p: { value: number[] }) =>
          `Quantil teórico: ${p.value[0].toFixed(2)}<br>Quantil amostral: ${p.value[1].toFixed(2)}`,
      },
      xAxis: {
        type: 'value',
        name: 'Quantil teórico',
        nameLocation: 'middle',
        nameGap: 32,
        nameTextStyle: { color: c.suave },
        axisLine: { lineStyle: { color: c.linha } },
        axisLabel: { color: c.suave },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'Quantil amostral',
        nameLocation: 'middle',
        nameGap: 46,
        nameTextStyle: { color: c.suave },
        axisLine: { lineStyle: { color: c.linha } },
        axisLabel: { color: c.suave },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'line',
          silent: true,
          symbol: 'none',
          data: [
            [x_min, slope * x_min + intercept],
            [x_max, slope * x_max + intercept],
          ],
          lineStyle: { color: c.vermelho, type: 'dashed', width: 1.5 },
        },
        {
          type: 'scatter',
          data: d.points.map((p) => [p.x, p.y]),
          symbolSize: 10,
          itemStyle: { color: c.azul, borderColor: c.fundo, borderWidth: 1 },
        },
      ],
    } as Record<string, unknown>;
  });
}
