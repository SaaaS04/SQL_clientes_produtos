import { Component, computed, inject, input } from '@angular/core';

import { CompareCharts } from '../models';
import { Store } from '../store';
import { Chart, paletaChart } from './chart';
import { simboloTexto } from './simbolos';

function base(c: ReturnType<typeof paletaChart>) {
  return {
    backgroundColor: 'transparent',
    textStyle: { color: c.texto, fontFamily: 'Inter, sans-serif' },
    legend: { textStyle: { color: c.texto, fontSize: 11 }, top: 0 },
    tooltip: {
      backgroundColor: c.fundo,
      borderColor: c.linha,
      textStyle: { color: c.texto },
    },
  };
}

/** R2, R2 ajustado e Q2 dos experimentos, lado a lado. */
@Component({
  selector: 'app-compare-metrics',
  imports: [Chart],
  template: `
    <app-chart
      [option]="option()"
      [height]="380"
      fileName="comparacao-qualidade"
      title="Qualidade do ajuste"
      caption="R² descreve os dados; Q² mede a previsão deixando um ensaio de fora"
    />
  `,
})
export class CompareMetrics {
  readonly data = input.required<CompareCharts['metricas']>();
  private readonly store = inject(Store);

  readonly option = computed(() => {
    const d = this.data();
    const c = paletaChart(this.store.theme());
    return {
      ...base(c),
      tooltip: { ...base(c).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 56, right: 24, top: 40, bottom: 40, containLabel: false },
      xAxis: {
        type: 'category',
        data: d.labels,
        axisLine: { lineStyle: { color: c.linha } },
        axisLabel: { color: c.texto },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: c.linha } },
        axisLabel: { color: c.suave },
        splitLine: { lineStyle: { color: c.grade } },
      },
      series: d.series.map((s, i) => ({
        name: s.name,
        type: 'bar',
        data: s.values,
        itemStyle: { color: c.series[i % c.series.length] },
        label: {
          show: true,
          position: 'top',
          color: c.suave,
          fontSize: 10,
          formatter: (p: { value: number }) => p.value.toFixed(3),
        },
      })),
    } as Record<string, unknown>;
  });
}

/** Coeficientes de cada experimento, agrupados por termo. */
@Component({
  selector: 'app-compare-coefs',
  imports: [Chart],
  template: `
    <app-chart
      [option]="option()"
      [height]="400"
      fileName="comparacao-coeficientes"
      title="Coeficientes do modelo"
      caption="comparáveis porque todos estão em variáveis codificadas · termo ausente = experimento com menos fatores"
    />
  `,
})
export class CompareCoefs {
  readonly data = input.required<CompareCharts['coeficientes']>();
  private readonly store = inject(Store);

  readonly option = computed(() => {
    const d = this.data();
    const c = paletaChart(this.store.theme());
    return {
      ...base(c),
      tooltip: { ...base(c).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 60, right: 24, top: 40, bottom: 44, containLabel: false },
      xAxis: {
        type: 'category',
        data: d.symbols.map(simboloTexto),
        axisLine: { lineStyle: { color: c.linha } },
        axisLabel: { color: c.texto, fontFamily: 'ui-monospace, monospace' },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'coeficiente',
        nameTextStyle: { color: c.suave },
        axisLine: { lineStyle: { color: c.linha } },
        axisLabel: { color: c.suave },
        splitLine: { lineStyle: { color: c.grade } },
      },
      series: d.series.map((s, i) => ({
        name: s.name,
        type: 'bar',
        data: s.values,
        itemStyle: { color: c.series[i % c.series.length] },
      })),
    } as Record<string, unknown>;
  });
}

/** Previsto x observado de todos os experimentos, com a diagonal. */
@Component({
  selector: 'app-compare-scatter',
  imports: [Chart],
  template: `
    <app-chart
      [option]="option()"
      [height]="420"
      fileName="comparacao-experimental-x-predito"
      title="Valores experimentais × preditos"
      caption="quanto mais próximo da diagonal, melhor o ajuste"
    />
  `,
})
export class CompareScatter {
  readonly data = input.required<CompareCharts['previsto_observado']>();
  private readonly store = inject(Store);

  readonly option = computed(() => {
    const d = this.data();
    const c = paletaChart(this.store.theme());
    const eixo = {
      type: 'value',
      min: d.min,
      max: d.max,
      axisLine: { lineStyle: { color: c.linha } },
      axisLabel: { color: c.suave },
      splitLine: { show: false },
    };
    return {
      ...base(c),
      tooltip: {
        ...base(c).tooltip,
        trigger: 'item',
        formatter: (p: { seriesName: string; data: { value: number[]; label: string } }) =>
          `<b>${p.seriesName}</b> · ${p.data.label}<br>` +
          `observado: ${p.data.value[0].toFixed(2)}<br>predito: ${p.data.value[1].toFixed(2)}`,
      },
      grid: { left: 66, right: 24, top: 40, bottom: 48, containLabel: false },
      xAxis: { ...eixo, name: 'observado', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: c.suave } },
      yAxis: { ...eixo, name: 'predito', nameLocation: 'middle', nameGap: 44, nameTextStyle: { color: c.suave } },
      series: [
        ...d.series.map((s, i) => ({
          name: s.name,
          type: 'scatter',
          symbolSize: 9,
          itemStyle: { color: c.series[i % c.series.length] },
          data: s.points.map((p) => ({ value: [p.x, p.y], label: p.label })),
        })),
        {
          name: 'diagonal',
          type: 'line',
          silent: true,
          symbol: 'none',
          data: [
            [d.min, d.min],
            [d.max, d.max],
          ],
          lineStyle: { color: c.suave, type: 'dashed', width: 1.5 },
          tooltip: { show: false },
        },
      ],
    } as Record<string, unknown>;
  });
}
