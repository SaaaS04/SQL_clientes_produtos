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

import { Theme } from '../models';
import { Store } from '../store';
import { baixarBlob } from '../download';
import { ECharts, carregarECharts } from './echarts-setup';

/** Cores do grafico conforme o tema, na mesma paleta da interface. */
export function paletaChart(tema: Theme) {
  const escuro = tema === 'dark';
  // espelha os tokens de theme.scss: o grafico e desenhado em canvas e nao
  // enxerga CSS, entao as cores precisam ser repetidas aqui
  return {
    fundo: escuro ? '#182231' : '#ffffff',
    texto: escuro ? '#e8edf3' : '#16202c',
    suave: escuro ? '#8d9bad' : '#6b7789',
    linha: escuro ? '#3d4d61' : '#cbd5e1',
    grade: escuro ? '#2c3a4b' : '#e3e8ee',
    teal: escuro ? '#2dd4bf' : '#0d9488',
    azul: escuro ? '#93c5fd' : '#1e3a5f',
    vermelho: escuro ? '#f87171' : '#dc2626',
    cinza: escuro ? '#3d4d61' : '#cbd5e1',
    ambar: escuro ? '#fbbf24' : '#b45309',
    // escala das superficies: a mesma do notebook, que foi calibrada para o
    // extremo escuro nao virar um borrao nas faixas baixas do contorno
    superficie: ['#1e3a5f', '#256d8b', '#0d9488', '#4ba96b', '#c3b53f', '#e08b2f', '#c0392b'],
    series: ['#0d9488', '#1e3a5f', '#f59e0b', '#dc2626', '#8b5cf6', '#0891b2', '#db2777'],
  };
}

/**
 * Base de todo grafico: cria a instancia do ECharts, acompanha o tamanho do
 * cartao, refaz ao trocar o tema e oferece o download.
 *
 * Todo grafico daqui e 2D e exporta PNG e SVG. A superficie 3D tem componente
 * proprio (surface-chart.ts), com Plotly, e exporta so PNG.
 */
@Component({
  selector: 'app-chart',
  template: `
    <figure class="chart">
      <figcaption class="chart__head">
        <div>
          <span class="chart__title">{{ title() }}</span>
          @if (caption()) {
            <span class="chart__caption">{{ caption() }}</span>
          }
        </div>
        <div class="chart__actions">
          <button type="button" class="chip" title="Baixar imagem PNG" (click)="baixarPNG()">PNG</button>
          <button type="button" class="chip" title="Baixar vetorial SVG" (click)="baixarSVG()">SVG</button>
        </div>
      </figcaption>
      <div #host class="chart__host" [style.height.px]="height()"></div>
      @if (erro(); as e) {
        <div class="alert alert--error">{{ e }}</div>
      }
    </figure>
  `,
})
export class Chart implements OnDestroy {
  readonly option = input.required<Record<string, unknown>>();
  readonly title = input('Gráfico');
  readonly caption = input('');
  readonly height = input(360);
  readonly fileName = input('grafico');

  readonly erro = signal<string | null>(null);
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private readonly store = inject(Store);
  private instancia: ECharts | null = null;
  private observer: ResizeObserver | null = null;
  private temaAplicado: Theme | null = null;

  readonly paleta = computed(() => paletaChart(this.store.theme()));

  constructor() {
    afterRenderEffect(() => {
      const opcao = this.option();
      const tema = this.store.theme();
      void this.desenhar(opcao, tema);
    });
  }

  private async desenhar(opcao: Record<string, unknown>, tema: Theme): Promise<void> {
    try {
      const lib = await carregarECharts();
      const el = this.host().nativeElement;
      // trocar o tema exige recriar: o ECharts nao troca a paleta de uma instancia viva
      if (this.instancia && this.temaAplicado !== tema) {
        this.instancia.dispose();
        this.instancia = null;
      }
      if (!this.instancia) {
        this.instancia = lib.init(el, null, { renderer: 'canvas' });
        this.temaAplicado = tema;
        this.observer?.disconnect();
        this.observer = new ResizeObserver(() => this.instancia?.resize());
        this.observer.observe(el);
      }
      this.instancia.setOption(opcao, true);
      this.erro.set(null);
    } catch (e) {
      this.erro.set(`Falha ao desenhar: ${e instanceof Error ? e.message : e}`);
    }
  }

  baixarPNG(): void {
    if (!this.instancia) return;
    const url = this.instancia.getDataURL({
      type: 'png',
      pixelRatio: 3, // ~3x a dimensao da tela, como os downloads do notebook
      backgroundColor: this.paleta().fundo,
    });
    const bin = atob(url.split(',')[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    baixarBlob(`${this.fileName()}.png`, new Blob([bytes], { type: 'image/png' }));
  }

  async baixarSVG(): Promise<void> {
    try {
      const lib = await carregarECharts();
      // instancia fora da tela so para serializar: o grafico visivel usa canvas
      const fora = document.createElement('div');
      fora.style.cssText = 'position:absolute;left:-10000px;width:1000px;height:620px;';
      document.body.appendChild(fora);
      const svgInst = lib.init(fora, null, { renderer: 'svg', width: 1000, height: 620 });
      svgInst.setOption(this.option(), true);
      const svg = svgInst.renderToSVGString?.() ?? '';
      svgInst.dispose();
      fora.remove();
      baixarBlob(`${this.fileName()}.svg`, new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    } catch (e) {
      this.erro.set(`Falha ao exportar SVG: ${e instanceof Error ? e.message : e}`);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.instancia?.dispose();
  }
}
