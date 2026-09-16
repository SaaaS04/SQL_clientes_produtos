import { Component, computed, inject, input } from '@angular/core';

import { Mesh } from '../models';
import { Store } from '../store';
import { Chart, paletaChart } from './chart';

/**
 * Curvas de nivel do par de fatores.
 *
 * A malha de 60x60 vem calculada do motor (a mesma da superficie 3D). Cada
 * ponto vira um retangulo pintado pela escala de cor, o que da o mapa
 * preenchido continuo sem sair dos eixos numericos reais.
 *
 * O `heatmap` do ECharts nao serve aqui: ele exige dois eixos de categoria, e
 * os eixos deste grafico sao os valores reais dos fatores.
 */
@Component({
  selector: 'app-contour-chart',
  imports: [Chart],
  template: `
    <app-chart
      [option]="option()"
      [height]="440"
      [fileName]="fileName()"
      title="Contorno 2D"
      caption="curvas de nível do mesmo par de fatores"
    />
  `,
})
export class ContourChart {
  readonly mesh = input.required<Mesh>();
  readonly fileName = input('contorno');
  private readonly store = inject(Store);

  readonly option = computed(() => {
    const m = this.mesh();
    const c = paletaChart(this.store.theme());

    const dados: [number, number, number][] = [];
    for (let j = 0; j < m.y.length; j++) {
      for (let i = 0; i < m.x.length; i++) {
        const z = m.z[j]?.[i];
        if (z !== null && z !== undefined) dados.push([m.x[i], m.y[j], z]);
      }
    }
    const passoX = m.x.length > 1 ? m.x[1] - m.x[0] : 1;
    const passoY = m.y.length > 1 ? m.y[1] - m.y[0] : 1;

    const eixo = {
      type: 'value' as const,
      axisLine: { lineStyle: { color: c.linha } },
      axisLabel: { color: c.suave },
      splitLine: { show: false },
      nameTextStyle: { color: c.suave },
    };

    return {
      backgroundColor: 'transparent',
      textStyle: { color: c.texto, fontFamily: 'Inter, sans-serif' },
      grid: { left: 72, right: 104, top: 20, bottom: 54, containLabel: false },
      tooltip: {
        trigger: 'item',
        backgroundColor: c.fundo,
        borderColor: c.linha,
        textStyle: { color: c.texto },
        formatter: (p: { value: number[] }) =>
          `${m.z_label}: <b>${p.value[2].toFixed(2)}</b><br>` +
          `${m.x_name}: ${p.value[0].toFixed(2)} ${m.x_unit}<br>` +
          `${m.y_name}: ${p.value[1].toFixed(2)} ${m.y_unit}`,
      },
      xAxis: {
        ...eixo,
        min: m.x[0],
        max: m.x[m.x.length - 1],
        name: m.x_label,
        nameLocation: 'middle',
        nameGap: 32,
      },
      yAxis: {
        ...eixo,
        min: m.y[0],
        max: m.y[m.y.length - 1],
        name: m.y_label,
        nameLocation: 'middle',
        nameGap: 50,
      },
      visualMap: {
        type: 'continuous',
        dimension: 2,
        min: m.zmin,
        max: m.zmax,
        calculable: true,
        realtime: false,
        right: 12,
        top: 'middle',
        itemHeight: 220,
        precision: 1,
        text: [m.z_label, ''],
        textStyle: { color: c.suave, fontSize: 11 },
        inRange: { color: c.superficie },
      },
      series: [
        {
          type: 'custom',
          data: dados,
          encode: { x: 0, y: 1, tooltip: [0, 1, 2] },
          animation: false,
          renderItem: (
            _params: unknown,
            api: {
              value: (i: number) => number;
              coord: (p: number[]) => number[];
              size: (p: number[]) => number[];
              style: () => unknown;
            },
          ) => {
            const ponto = api.coord([api.value(0), api.value(1)]);
            const tam = api.size([passoX, passoY]);
            return {
              type: 'rect',
              shape: {
                // meio pixel a mais fecha o fio de fundo entre celulas vizinhas
                x: ponto[0] - tam[0] / 2,
                y: ponto[1] - tam[1] / 2,
                width: tam[0] + 0.5,
                height: Math.abs(tam[1]) + 0.5,
              },
              style: api.style(),
            };
          },
        },
      ],
    } as Record<string, unknown>;
  });
}
