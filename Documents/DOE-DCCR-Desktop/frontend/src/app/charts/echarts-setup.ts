/**
 * Carregamento do ECharts.
 *
 * Entra por importacao dinamica, entao nao pesa na abertura do app: so e
 * baixado quando aparece o primeiro grafico.
 *
 * A superficie 3D NAO vem daqui - ela tem componente proprio, com Plotly (ver
 * surface-chart.ts). A extensao 3D do ECharts (echarts-gl) nao e compativel
 * com o empacotador do Angular: em modulos, importa caminhos internos sem
 * extensao que o mapa `exports` do echarts nao resolve; pelo bundle pronto,
 * registra a serie numa instancia diferente da que desenha na tela.
 */
export type ECharts = {
  setOption: (option: unknown, notMerge?: boolean) => void;
  resize: () => void;
  dispose: () => void;
  getDataURL: (opts: { type: string; pixelRatio?: number; backgroundColor?: string }) => string;
  renderToSVGString?: () => string;
};

export type EChartsLib = {
  init: (
    el: HTMLElement,
    tema?: string | null,
    opts?: { renderer?: 'canvas' | 'svg'; width?: number; height?: number },
  ) => ECharts;
};

let base: Promise<EChartsLib> | null = null;

/** ECharts 2D: todos os graficos do app, menos a superficie. */
export function carregarECharts(): Promise<EChartsLib> {
  base ??= import('echarts').then(
    (m) => ((m as unknown as { default?: EChartsLib }).default ?? (m as unknown as EChartsLib)),
  );
  return base;
}
