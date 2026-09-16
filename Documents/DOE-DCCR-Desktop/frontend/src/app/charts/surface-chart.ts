import {
  Component,
  ElementRef,
  OnDestroy,
  afterRenderEffect,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { baixarBlob } from '../download';
import { Mesh, Theme } from '../models';
import { Store } from '../store';
import { paletaChart } from './chart';

/**
 * Superficie de resposta em 3D, girável com o mouse.
 *
 * Este e o UNICO grafico que nao usa ECharts: a extensao 3D dele (echarts-gl)
 * nao e compativel com o empacotador do Angular - ela importa caminhos
 * internos sem extensao e, pelo bundle pronto, registra a serie numa
 * instancia diferente da que desenha na tela. O Plotly resolve 3D nativamente
 * e entra por importacao dinamica, so quando a aba de graficos abre.
 *
 * A malha de 60x60 vem calculada do motor, na janela axial de cada fator. O
 * eixo Z e a barra de cores usam os extremos REAIS da superficie: arredondar o
 * topo para cima deixava o cume fora do vermelho da escala.
 */
type Plotly = {
  react: (el: HTMLElement, data: unknown[], layout: unknown, config: unknown) => Promise<unknown>;
  toImage: (el: HTMLElement, opts: Record<string, unknown>) => Promise<string>;
  purge: (el: HTMLElement) => void;
  Plots: { resize: (el: HTMLElement) => void };
};

let plotly: Promise<Plotly> | null = null;

function carregarPlotly(): Promise<Plotly> {
  plotly ??= import('plotly.js-dist-min').then(
    (m) => ((m as unknown as { default?: Plotly }).default ?? (m as unknown as Plotly)),
  );
  return plotly;
}

@Component({
  selector: 'app-surface-chart',
  template: `
    <figure class="chart">
      <figcaption class="chart__head">
        <div>
          <span class="chart__title">Superfície de resposta</span>
          <span class="chart__caption">arraste para girar · roda do mouse aproxima</span>
        </div>
        <div class="chart__actions">
          <button type="button" class="chip" title="Baixar imagem PNG" (click)="baixarPNG()">PNG</button>
        </div>
      </figcaption>
      <div #host class="chart__host" [style.height.px]="460"></div>
      @if (erro(); as e) {
        <div class="alert alert--error">{{ e }}</div>
      }
    </figure>
  `,
})
export class SurfaceChart implements OnDestroy {
  readonly mesh = input.required<Mesh>();
  readonly fileName = input('superficie');

  readonly erro = signal<string | null>(null);
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private readonly store = inject(Store);
  private observer: ResizeObserver | null = null;
  private desenhado = false;

  readonly paleta = computed(() => paletaChart(this.store.theme()));

  constructor() {
    afterRenderEffect(() => {
      const m = this.mesh();
      const tema = this.store.theme();
      void this.desenhar(m, tema);
    });
  }

  private async desenhar(m: Mesh, tema: Theme): Promise<void> {
    try {
      const P = await carregarPlotly();
      const el = this.host().nativeElement;
      const c = paletaChart(tema);
      // a escala do notebook, calibrada para o extremo escuro nao virar um
      // borrao nas faixas baixas
      const escala = c.superficie.map((cor, i) => [i / (c.superficie.length - 1), cor]);

      const dados = [
        {
          type: 'surface',
          x: m.x,
          y: m.y,
          z: m.z,
          colorscale: escala,
          cmin: m.zmin,
          cmax: m.zmax,
          colorbar: {
            title: { text: m.z_label, side: 'right', font: { color: c.suave, size: 12 } },
            tickfont: { color: c.suave, size: 11 },
            thickness: 14,
            len: 0.75,
            outlinewidth: 0,
            ...(m.levels ? { dtick: m.levels.step } : {}),
          },
          contours: {
            z: { show: true, usecolormap: true, width: 1.6, project: { z: false } },
          },
          // luz difusa e quase sem brilho: o relevo aparece pela cor e pelas
          // isolinhas, nao por reflexo de plastico
          lighting: { ambient: 0.78, diffuse: 0.55, specular: 0.04, roughness: 0.9, fresnel: 0.1 },
          hovertemplate:
            `${m.x_name}: %{x:.2f} ${m.x_unit}<br>` +
            `${m.y_name}: %{y:.2f} ${m.y_unit}<br>` +
            `${m.z_label}: %{z:.2f}<extra></extra>`,
        },
      ];

      const eixo = (titulo: string) => ({
        title: { text: titulo, font: { color: c.suave, size: 12 } },
        gridcolor: c.grade,
        linecolor: c.linha,
        zerolinecolor: c.grade,
        tickfont: { color: c.suave, size: 11 },
        backgroundcolor: 'rgba(0,0,0,0)',
        showbackground: false,
      });

      const layout = {
        autosize: true,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: c.texto, family: 'Inter, sans-serif', size: 12 },
        margin: { l: 4, r: 4, t: 8, b: 4 },
        scene: {
          xaxis: eixo(m.x_label),
          yaxis: eixo(m.y_label),
          zaxis: { ...eixo(m.z_label), range: [m.zmin, m.zmax] },
          camera: { eye: { x: 1.5, y: -1.7, z: 1.1 } },
          aspectmode: 'cube',
          bgcolor: 'rgba(0,0,0,0)',
        },
      };

      await P.react(el, dados, layout, {
        responsive: true,
        displaylogo: false,
        displayModeBar: false,
      });

      if (!this.observer) {
        this.observer = new ResizeObserver(() => P.Plots.resize(el));
        this.observer.observe(el);
      }
      this.desenhado = true;
      this.erro.set(null);
    } catch (e) {
      this.erro.set(`Falha ao desenhar a superfície: ${e instanceof Error ? e.message : e}`);
    }
  }

  async baixarPNG(): Promise<void> {
    if (!this.desenhado) return;
    try {
      const P = await carregarPlotly();
      const url = await P.toImage(this.host().nativeElement, {
        format: 'png',
        width: 1200,
        height: 800,
        scale: 3,
      });
      const bin = atob(url.split(',')[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      baixarBlob(`${this.fileName()}.png`, new Blob([bytes], { type: 'image/png' }));
    } catch (e) {
      this.erro.set(`Falha ao exportar PNG: ${e instanceof Error ? e.message : e}`);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    void carregarPlotly().then((P) => P.purge(this.host().nativeElement));
  }
}
