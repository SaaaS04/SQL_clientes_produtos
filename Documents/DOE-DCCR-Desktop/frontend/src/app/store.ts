import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { Api, problemOf } from './api';
import { std } from './format';
import {
  AlphaType,
  AnalysisIn,
  AnalysisOut,
  ChartsOut,
  DesignIn,
  DesignOut,
  ExperimentItem,
  FactorIn,
  Level,
  LevelsOut,
  Meta,
  OptimizationOut,
  SurfaceOut,
  Theme,
  Transform,
} from './models';
import type { Problem } from './api';

export type View = 'welcome' | 'experiment' | 'compare';

export interface Notice {
  level: Level;
  message: string;
  errors: string[];
}

/**
 * Estado do app. Os experimentos sao arquivos numa pasta de trabalho, como no
 * VS Code: nao ha banco de dados. Nenhum calculo acontece aqui - tudo vem do
 * motor local, inclusive os numeros que viram grafico.
 */
@Injectable({ providedIn: 'root' })
export class Store {
  private readonly api = inject(Api);

  readonly status = signal<'connecting' | 'online' | 'offline'>('connecting');
  readonly meta = signal<Meta | null>(null);
  readonly theme = signal<Theme>('light');

  // ---- pasta de trabalho
  readonly workspacePath = signal<string | null>(null);
  readonly experiments = signal<ExperimentItem[]>([]);

  // ---- experimento aberto
  readonly file = signal<string | null>(null);
  readonly name = signal('Novo experimento');
  readonly notes = signal('');
  readonly dirty = signal(false);

  readonly factors = signal<FactorIn[]>([]);
  readonly nCenter = signal(6);
  readonly alphaType = signal<AlphaType>('rotatable');
  readonly respName = signal('Conversao');
  readonly respUnit = signal('%');
  readonly transform = signal<Transform>('none');
  readonly significance = signal(0.05);
  readonly refKey = signal<string | null>(null);
  readonly responses = signal<number[]>([]);

  readonly levels = signal<LevelsOut | null>(null);
  readonly levelsProblem = signal<Problem | null>(null);
  readonly design = signal<DesignOut | null>(null);
  readonly analysis = signal<AnalysisOut | null>(null);
  readonly optimization = signal<OptimizationOut | null>(null);

  // ---- navegacao e avisos
  readonly view = signal<View>('welcome');
  readonly compareSelection = signal<string[]>([]);
  readonly notice = signal<Notice | null>(null);
  readonly busy = signal<string | null>(null);

  readonly designIn = computed<DesignIn>(() => ({
    factors: this.factors(),
    n_center: this.nCenter(),
    alpha_type: this.alphaType(),
    resp_name: this.respName(),
    resp_unit: this.respUnit(),
    transform: this.transform(),
    significance: this.significance(),
  }));

  readonly analysisIn = computed<AnalysisIn>(() => ({
    ...this.designIn(),
    responses: this.responses(),
    ref_key: this.refKey(),
  }));

  readonly temRespostas = computed(() => {
    const r = this.responses();
    return r.length > 0 && !r.every((v) => v === 0);
  });

  private levelsTimer: ReturnType<typeof setTimeout> | undefined;
  private levelsSeq = 0;

  constructor() {
    // a tabela de niveis acompanha cada edicao da configuracao
    effect(() => {
      const d = this.designIn();
      if (this.status() !== 'online' || this.view() !== 'experiment') return;
      clearTimeout(this.levelsTimer);
      this.levelsTimer = setTimeout(() => void this.fetchLevels(d), 200);
    });
    void this.connect();
  }

  // ------------------------------------------------------------------ conexao
  /** Espera o motor de calculo subir; no app empacotado ele leva alguns segundos. */
  private async connect(): Promise<void> {
    for (let tentativa = 1; ; tentativa++) {
      try {
        const meta = await this.api.meta();
        this.meta.set(meta);
        this.aplicarPadroes(meta);
        const ws = await this.api.workspace();
        this.workspacePath.set(ws.path);
        this.experiments.set(ws.experiments);
        this.aplicarTema(ws.theme);
        this.status.set('online');
        return;
      } catch {
        if (tentativa >= 20) this.status.set('offline');
        await new Promise((r) => setTimeout(r, tentativa < 20 ? 500 : 2000));
      }
    }
  }

  private aplicarPadroes(meta: Meta): void {
    this.factors.set(meta.default_factors.slice(0, meta.defaults.n_factors).map((f) => ({ ...f })));
    this.nCenter.set(meta.defaults.n_center);
    this.alphaType.set(meta.defaults.alpha_type);
    this.respName.set(meta.defaults.resp_name);
    this.respUnit.set(meta.defaults.resp_unit);
    this.transform.set('none');
    this.significance.set(0.05);
    this.refKey.set(null);
    this.responses.set([]);
    this.notes.set('');
  }

  private async fetchLevels(d: DesignIn): Promise<void> {
    const seq = ++this.levelsSeq;
    try {
      const lv = await this.api.levels(d);
      if (seq !== this.levelsSeq) return;
      this.levels.set(lv);
      this.levelsProblem.set(null);
    } catch (e) {
      if (seq !== this.levelsSeq) return;
      this.levels.set(null);
      this.levelsProblem.set(problemOf(e));
    }
  }

  // -------------------------------------------------------------------- tema
  private aplicarTema(t: Theme): void {
    this.theme.set(t);
    document.documentElement.dataset['theme'] = t;
  }

  async toggleTheme(): Promise<void> {
    const novo: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.aplicarTema(novo);
    try {
      await this.api.settings(novo);
    } catch {
      /* o tema vale na tela mesmo se nao der para gravar */
    }
  }

  // ---------------------------------------------------------------- pasta
  async openWorkspace(path: string): Promise<void> {
    if (!path.trim()) return;
    this.busy.set('Abrindo a pasta…');
    try {
      const ws = await this.api.openWorkspace(path.trim());
      this.workspacePath.set(ws.path);
      this.experiments.set(ws.experiments);
      this.view.set('welcome');
      this.notify('success', `Pasta de trabalho: ${ws.path}`);
    } catch (e) {
      this.reportError(e);
    } finally {
      this.busy.set(null);
    }
  }

  // ------------------------------------------------------------ experimento
  novoExperimento(): void {
    const meta = this.meta();
    if (!meta) return;
    this.aplicarPadroes(meta);
    this.file.set(null);
    this.name.set(`Experimento ${this.experiments().length + 1}`);
    this.design.set(null);
    this.analysis.set(null);
    this.optimization.set(null);
    this.dirty.set(true);
    this.view.set('experiment');
    void this.generate();
  }

  async abrirExperimento(file: string): Promise<void> {
    this.busy.set('Abrindo o experimento…');
    try {
      const doc = await this.api.load(file);
      const d = doc.design;
      this.factors.set(d.factors.map((f) => ({ ...f })));
      this.nCenter.set(d.n_center);
      this.alphaType.set(d.alpha_type);
      this.respName.set(d.resp_name);
      this.respUnit.set(d.resp_unit);
      this.transform.set(d.transform);
      this.significance.set(d.significance);
      this.responses.set([...doc.responses]);
      this.refKey.set(doc.ref_key);
      this.notes.set(doc.notes ?? '');
      this.name.set(doc.name);
      this.file.set(doc.file);
      this.analysis.set(null);
      this.optimization.set(null);
      this.dirty.set(false);
      this.view.set('experiment');
      await this.generate(false);
      if (this.temRespostas()) await this.runAnalysis();
    } catch (e) {
      this.reportError(e);
    } finally {
      this.busy.set(null);
    }
  }

  async salvar(avisar = true): Promise<void> {
    if (!this.workspacePath()) {
      this.notify('warn', 'Escolha uma pasta de trabalho antes de salvar.');
      return;
    }
    this.busy.set('Salvando…');
    try {
      const out = await this.api.save({
        file: this.file(),
        name: this.name(),
        design: this.designIn(),
        responses: this.responses(),
        ref_key: this.refKey(),
        notes: this.notes(),
      });
      this.file.set(out.file);
      this.experiments.set(out.experiments);
      this.dirty.set(false);
      if (avisar) this.notify('success', `Salvo em ${out.file}`);
    } catch (e) {
      this.reportError(e);
    } finally {
      this.busy.set(null);
    }
  }

  async excluir(file: string): Promise<void> {
    this.busy.set('Excluindo…');
    try {
      const out = await this.api.remove(file);
      this.experiments.set(out.experiments);
      this.compareSelection.update((s) => s.filter((f) => f !== file));
      if (this.file() === file) {
        this.file.set(null);
        this.view.set('welcome');
      }
      this.notify('info', 'Experimento excluído.');
    } catch (e) {
      this.reportError(e);
    } finally {
      this.busy.set(null);
    }
  }

  async renomear(novoNome: string): Promise<void> {
    const arquivo = this.file();
    this.name.set(novoNome);
    this.marcarSujo();
    if (!arquivo) return;
    try {
      const out = await this.api.rename(arquivo, novoNome);
      this.file.set(out.file);
      this.experiments.set(out.experiments);
      this.dirty.set(false);
    } catch (e) {
      this.reportError(e);
    }
  }

  // ------------------------------------------------------------ configuracao
  private marcarSujo(): void {
    this.dirty.set(true);
  }

  setNFactors(n: number): void {
    const meta = this.meta();
    if (!meta) return;
    const atual = this.factors();
    this.factors.set(
      Array.from({ length: n }, (_, i) => ({
        ...(atual[i] ?? meta.default_factors[i] ?? { name: `Fator ${i + 1}`, min_val: 2, max_val: 8, unit: '' }),
      })),
    );
    this.configChanged();
  }

  updateFactor(i: number, patch: Partial<FactorIn>): void {
    this.factors.update((fs) => fs.map((f, j) => (j === i ? { ...f, ...patch } : f)));
    this.configChanged();
  }

  setNCenter(n: number): void {
    this.nCenter.set(n);
    this.configChanged();
  }

  setAlphaType(a: AlphaType): void {
    this.alphaType.set(a);
    this.configChanged();
  }

  setRespName(v: string): void {
    this.respName.set(v);
    this.configChanged();
  }

  setRespUnit(v: string): void {
    this.respUnit.set(v);
    this.configChanged();
  }

  applyPreset(key: string): void {
    const p = this.meta()?.presets.find((x) => x.key === key);
    if (!p) return;
    this.nCenter.set(p.n_center);
    this.alphaType.set(p.alpha_type);
    this.respName.set(p.resp_name);
    this.respUnit.set(p.resp_unit);
    this.factors.set(p.factors.map((f) => ({ ...f })));
    this.configChanged();
    this.refKey.set(key);
    this.notify('success', `Preset ${p.label} carregado.`);
    void this.generate();
  }

  /** Mudar a configuracao invalida a matriz ja gerada e tudo que veio dela. */
  private configChanged(): void {
    this.marcarSujo();
    if (this.design()) {
      this.design.set(null);
      this.invalidateAnalysis();
    }
  }

  private invalidateAnalysis(): void {
    this.analysis.set(null);
    this.optimization.set(null);
  }

  async generate(avisar = true): Promise<void> {
    if (this.busy() && avisar) return;
    if (avisar) this.busy.set('Gerando a matriz…');
    try {
      const d = await this.api.design(this.designIn());
      this.design.set(d);
      if (this.responses().length !== d.info.n_total) {
        this.responses.set(new Array<number>(d.info.n_total).fill(0));
      }
      this.invalidateAnalysis();
      if (avisar) {
        this.notify('success', `Matriz: ${d.info.n_total} ensaios | alpha=${d.info.alpha.toFixed(4)}`);
      }
    } catch (e) {
      this.reportError(e);
    } finally {
      if (avisar) this.busy.set(null);
    }
  }

  // ------------------------------------------------------------------- dados
  setResponse(i: number, v: number): void {
    this.responses.update((r) => r.map((x, j) => (j === i ? v : x)));
    this.refKey.set(null);
    this.marcarSujo();
    this.invalidateAnalysis();
  }

  setResponses(vals: number[]): void {
    this.responses.set([...vals]);
    this.refKey.set(null);
    this.marcarSujo();
    this.invalidateAnalysis();
  }

  zeroResponses(): void {
    this.responses.update((r) => r.map(() => 0));
    this.refKey.set(null);
    this.marcarSujo();
    this.invalidateAnalysis();
    this.notify('info', 'Campos zerados.');
  }

  loadExample(key: string): void {
    const p = this.meta()?.presets.find((x) => x.key === key);
    const n = this.design()?.info.n_total ?? 0;
    if (!p) return;
    if (p.responses.length !== n) {
      this.notify('warn', `Requer ${p.responses.length} ensaios.`);
      return;
    }
    this.responses.set([...p.responses]);
    this.refKey.set(key);
    this.marcarSujo();
    this.invalidateAnalysis();
    this.notify(
      'warn',
      `ATENÇÃO: respostas de EXEMPLO (${p.label}) carregadas, apenas para demonstração da ferramenta. ` +
        'Para analisar o SEU experimento, apague-as e cole as suas respostas.',
    );
  }

  /** Conferencias antes de mandar ajustar (legacy DataPanel._submit). */
  async analyze(): Promise<void> {
    const vals = this.responses();
    if (vals.length === 0) return this.notify('error', 'Nenhuma resposta encontrada.');
    if (vals.some((v) => !Number.isFinite(v))) {
      return this.notify('error', 'Há valores inválidos (NaN). Verifique os campos.');
    }
    if (vals.every((v) => v === 0)) return this.notify('warn', 'Preencha as respostas.');
    if (std(vals) < 1e-10) return this.notify('error', 'Sem variabilidade nos dados.');
    if (await this.runAnalysis()) {
      this.notify('success', 'Análise concluída.');
      if (this.workspacePath()) await this.salvar(false);
    }
  }

  private async runAnalysis(): Promise<boolean> {
    this.busy.set('Ajustando o modelo…');
    try {
      this.analysis.set(await this.api.analysis(this.analysisIn()));
      this.optimization.set(null);
      return true;
    } catch (e) {
      this.reportError(e);
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  /** Alfa so entra nos valores criticos, IC e vereditos: reajusta sem trocar os dados. */
  async setSignificance(alpha: number): Promise<void> {
    const anterior = this.significance();
    this.significance.set(alpha);
    this.marcarSujo();
    if (this.analysis() && !(await this.runAnalysis())) {
      this.significance.set(anterior);
      await this.runAnalysis();
    }
  }

  /** A logit e decisao de modelagem: reajusta com as mesmas respostas e volta atras se falhar. */
  async setTransform(t: Transform): Promise<void> {
    const anterior = this.transform();
    this.transform.set(t);
    this.marcarSujo();
    if (this.analysis() && !(await this.runAnalysis())) {
      this.transform.set(anterior);
      await this.runAnalysis();
    }
  }

  // -------------------------------------------------------- graficos e otimo
  /** Series numericas dos graficos; o desenho e feito na tela, com ECharts. */
  fetchCharts(): Promise<ChartsOut> {
    return this.api.charts(this.analysisIn());
  }

  fetchSurface(ix: number, iy: number): Promise<SurfaceOut> {
    return this.api.surface(this.analysisIn(), ix, iy);
  }

  async loadOptimization(): Promise<void> {
    if (this.optimization() || !this.analysis()) return;
    this.busy.set('Otimizando (evolução diferencial)…');
    try {
      this.optimization.set(await this.api.optimization(this.analysisIn()));
    } catch (e) {
      this.reportError(e);
    } finally {
      this.busy.set(null);
    }
  }

  // --------------------------------------------------------------- comparar
  toggleCompare(file: string): void {
    this.compareSelection.update((s) => (s.includes(file) ? s.filter((f) => f !== file) : [...s, file]));
  }

  abrirComparacao(): void {
    this.view.set('compare');
  }

  compare(files: string[]) {
    return this.api.compare(files);
  }

  // --------------------------------------------------------------- avisos
  notify(level: Level, message: string, errors: string[] = []): void {
    this.notice.set({ level, message, errors });
  }

  dismiss(): void {
    this.notice.set(null);
  }

  reportError(e: unknown): void {
    const p = problemOf(e);
    this.notify('error', p.message, p.errors);
  }
}
