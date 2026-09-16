import { Component, computed, inject, input } from '@angular/core';

import { PredActualData } from '../models';
import { Store } from '../store';
import { Chart, paletaChart } from './chart';

/**
 * Valores experimentais x preditos: cada ponto e um ensaio, a diagonal e o
 * ajuste perfeito. A barra vertical e +-1 erro padrao do ajuste.
 *
 * As previsoes deixa-um-fora ficam de fora do grafico de proposito: com
 * alavancagem alta o LOO infla o residuo e produzia pontos que pareciam
 * previsao do modelo. Q2 e RMSE-CV aparecem na legenda do cartao.
 */
@Component({
  selector: 'app-pred-actual-chart',
  imports: [Chart],
  template: `
    <app-chart
      [option]="option()"
      [height]="440"
      [fileName]="fileName()"
      title="Valores experimentais × preditos"
      [caption]="legenda()"
    />
  `,
})
export class PredActualChart {
  readonly data = input.required<PredActualData>();
  readonly fileName = input('experimental-x-predito');
  private readonly store = inject(Store);

  readonly legenda = computed(() => {
    const m = this.data().metrics;
    const orig = m.r2_resp !== null ? ` · R² (escala original) ${m.r2_resp.toFixed(4)}` : '';
    return `R² ${m.r2.toFixed(4)} · R² ajustado ${m.r2_adj.toFixed(4)} · Q² ${m.q2.toFixed(4)} · RMSE-CV ${m.rmse_cv.toFixed(2)} · n = ${m.n}${orig}`;
  });

  readonly option = computed(() => {
    const d = this.data();
    const c = paletaChart(this.store.theme());
    const pontos = d.points.map((p) => ({
      value: [p.actual, p.predicted],
      label: p.label,
      se: p.se,
      levels: p.levels,
    }));

    return {
      backgroundColor: 'transparent',
      textStyle: { color: c.texto, fontFamily: 'Inter, sans-serif' },
      grid: { left: 70, right: 28, top: 20, bottom: 52, containLabel: false },
      tooltip: {
        trigger: 'item',
        backgroundColor: c.fundo,
        borderColor: c.linha,
        textStyle: { color: c.texto },
        formatter: (p: {
          data: { label: string; se: number; levels: { name: string; value: string; unit: string }[]; value: number[] };
        }) => {
          const niveis = p.data.levels
            .map((n) => `${n.name}: ${n.value} ${n.unit}`.trim())
            .join('<br>');
          return (
            `<b>${p.data.label}</b><br>` +
            `Predito: ${p.data.value[1].toFixed(2)} ± ${p.data.se.toFixed(2)}<br>` +
            `Experimental: ${p.data.value[0].toFixed(2)}` +
            (niveis ? `<br>${niveis}` : '')
          );
        },
      },
      xAxis: {
        type: 'value',
        min: d.min,
        max: d.max,
        name: 'Experimental',
        nameLocation: 'middle',
        nameGap: 32,
        nameTextStyle: { color: c.suave },
        axisLine: { lineStyle: { color: c.linha } },
        axisLabel: { color: c.suave },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: d.min,
        max: d.max,
        name: 'Predito',
        nameLocation: 'middle',
        nameGap: 46,
        nameTextStyle: { color: c.suave },
        axisLine: { lineStyle: { color: c.linha } },
        axisLabel: { color: c.suave },
        splitLine: { show: false },
      },
      series: [
        {
          // diagonal do ajuste perfeito
          type: 'line',
          silent: true,
          symbol: 'none',
          data: [
            [d.min, d.min],
            [d.max, d.max],
          ],
          lineStyle: { color: c.vermelho, type: 'dashed', width: 1.5 },
        },
        {
          // barra de +-1 erro padrao
          type: 'custom',
          silent: true,
          data: d.points.map((p) => [p.actual, p.predicted, p.se]),
          renderItem: (
            params: unknown,
            api: { value: (i: number) => number; coord: (p: number[]) => number[]; style: (o: unknown) => unknown },
          ) => {
            const x = api.value(0);
            const y = api.value(1);
            const se = api.value(2);
            const alto = api.coord([x, y + se]);
            const baixo = api.coord([x, y - se]);
            return {
              type: 'line',
              shape: { x1: alto[0], y1: alto[1], x2: baixo[0], y2: baixo[1] },
              style: api.style({ stroke: c.azul, lineWidth: 1.2, opacity: 0.7 }),
            };
          },
        },
        {
          type: 'scatter',
          data: pontos,
          symbolSize: 10,
          itemStyle: { color: c.azul, borderColor: c.fundo, borderWidth: 1 },
          label: {
            show: true,
            position: 'top',
            color: c.suave,
            fontSize: 9,
            formatter: (p: { data: { label: string } }) => p.data.label,
          },
          markLine: d.bounds.length
            ? {
                silent: true,
                symbol: 'none',
                lineStyle: { color: c.suave, type: 'dotted', width: 1.2 },
                label: {
                  formatter: (p: { value: number }) => `limite físico = ${p.value}`,
                  color: c.suave,
                  fontSize: 10,
                },
                data: d.bounds.map((b) => ({ yAxis: b })),
              }
            : undefined,
        },
      ],
    } as Record<string, unknown>;
  });
}
