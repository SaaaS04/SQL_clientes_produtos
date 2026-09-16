// Contrato da API local (api/src/doe_api/).
// Os graficos chegam como numeros; quem desenha e o ECharts, no Angular.

export type AlphaType = 'rotatable' | 'orthogonal' | 'face_centered';
export type Transform = 'none' | 'logit';
export type Theme = 'light' | 'dark';
export type Level = 'info' | 'success' | 'warn' | 'error';
export type PointKind = 'factorial' | 'axial' | 'center';

export interface FactorIn {
  name: string;
  min_val: number; // nivel (-1)
  max_val: number; // nivel (+1)
  unit: string;
}

export interface DesignIn {
  factors: FactorIn[];
  n_center: number;
  alpha_type: AlphaType;
  resp_name: string;
  resp_unit: string;
  transform: Transform;
  significance: number;
}

export interface AnalysisIn extends DesignIn {
  responses: number[];
  ref_key: string | null;
}

export interface Preset {
  key: string;
  label: string;
  n_center: number;
  alpha_type: AlphaType;
  resp_name: string;
  resp_unit: string;
  factors: FactorIn[];
  responses: number[];
}

export interface Meta {
  units: string[];
  alpha_types: { value: AlphaType; label: string }[];
  default_factors: FactorIn[];
  defaults: {
    n_factors: number;
    n_center: number;
    alpha_type: AlphaType;
    resp_name: string;
    resp_unit: string;
  };
  presets: Preset[];
}

export interface LevelsRow {
  name: string;
  unit: string;
  levels: (number | null)[];
  abs_min: number | null;
  abs_max: number | null;
}

export interface LevelsOut {
  k: number;
  alpha: number;
  n_center: number;
  n_factorial: number;
  n_axial: number;
  n_total: number;
  rows: LevelsRow[];
  warnings: string[];
  errors: string[];
}

export interface DesignInfo {
  k: number;
  n_factorial: number;
  n_axial: number;
  n_center: number;
  n_total: number;
  alpha: number;
  alpha_type: AlphaType;
}

export interface Run {
  n: number;
  type: PointKind;
  coded: number[];
  real: string[];
}

export interface DesignOut {
  info: DesignInfo;
  level_table: { name: string; unit: string; values: string[] }[];
  runs: Run[];
  factor_names: string[];
  resp_label: string;
  warnings: string[];
}

export interface Coefficient {
  symbol: string;
  caption: string;
  coef: number | null;
  se: number | null;
  t: number | null;
  p: number | null;
  significant: boolean;
}

export interface Kpis {
  r2: number;
  r2_adj: number;
  q2: number;
  f: number;
  p_f: number;
  s: number | null;
  rmse: number;
  rmse_cv: number;
  mae_cv: number;
  n_obs: number;
  n_params: number;
}

export interface AnalysisOut {
  info: DesignInfo;
  significance: number;
  transform: Transform;
  kpis: Kpis;
  equation: {
    resp_label: string;
    intercept: number;
    terms: { coef: number; symbol: string }[];
    legend: { symbol: string; name: string; unit: string }[];
  };
  coefficients: Coefficient[];
  anova: Record<string, string | number>[];
  anova_summary: string;
  lack_of_fit: {
    f: number;
    f_crit: number | null;
    p: number;
    ok: boolean;
    below_crit: boolean;
    df_lof: number;
    df_pe: number;
  } | null;
  reference: { cite: string; r2_pub: number; r2_calc: number; diff: number; ok: boolean } | null;
  logit: { r2_resp: number | null; r2_raw_ref: number | null; worsens: boolean } | null;
}

export interface OptFactor {
  name: string;
  unit: string;
  coded: number;
  real: string;
  extrapolated: boolean;
}

export interface OptResult {
  y: number;
  y_raw: number;
  truncated: boolean;
  limit: number | null;
  converged: boolean;
  ci_low: number;
  ci_high: number;
  ci_available: boolean;
  se: number;
  factors: OptFactor[];
  sensitivity: { name: string; value: number; pct: number }[];
}

export interface OptimizationOut {
  max: OptResult;
  min: OptResult;
  amplitude: { y_min: number; y_max: number; range: number };
  resp_label: string;
}

// ---------------------------------------------------------------------------
// Series dos graficos
// ---------------------------------------------------------------------------

export interface ParetoTerm {
  symbol: string;
  name: string;
  t: number;
  p: number;
  significant: boolean;
}

export interface ParetoData {
  terms: ParetoTerm[];
  mean: {
    symbol: string;
    name: string;
    t: number;
    t_plot: number;
    p: number;
    significant: boolean;
    truncated: boolean;
  };
  t_crit: number;
  df: number;
  x_max: number;
}

export interface EffectTerm {
  symbol: string;
  name: string;
  coef: number;
  p: number;
  significant: boolean;
}

export interface PredActualPoint {
  label: string;
  actual: number;
  predicted: number;
  se: number;
  levels: { name: string; value: string; unit: string }[];
}

export interface PredActualData {
  points: PredActualPoint[];
  min: number;
  max: number;
  bounds: number[];
  metrics: {
    r2: number;
    r2_resp: number | null;
    r2_adj: number;
    q2: number;
    rmse_cv: number;
    n: number;
  };
}

export interface NormalData {
  points: { x: number; y: number }[];
  line: { slope: number; intercept: number; x_min: number; x_max: number };
}

export interface Pair {
  ix: number;
  iy: number;
  label: string;
}

export interface ChartsOut {
  pareto: ParetoData;
  effects: { terms: EffectTerm[] };
  pred_actual: PredActualData;
  normal: NormalData;
  pairs: Pair[];
  meta: {
    resp_label: string;
    r2: number;
    transform: Transform;
    significance: number;
    symbols: { symbol: string; name: string; unit: string }[];
  };
}

/** Malha calculada pelo PlotEngine: 60x60 pontos na janela de cada fator. */
export interface Mesh {
  x: number[];
  y: number[];
  z: (number | null)[][];
  zmin: number;
  zmax: number;
  x_label: string;
  y_label: string;
  z_label: string;
  x_name: string;
  y_name: string;
  x_unit: string;
  y_unit: string;
  levels: { start: number; end: number; step: number } | null;
}

export interface SurfaceOut {
  surface: Mesh;
  contour: Mesh;
  r2: number;
  transform: Transform;
}

// ---------------------------------------------------------------------------
// Pasta de trabalho
// ---------------------------------------------------------------------------

export interface ExperimentSummary {
  r2: number;
  r2_adj: number;
  q2: number;
  f: number;
  p_f: number;
  n_total: number;
  transform: Transform;
  optimum: {
    y: number;
    y_raw: number;
    truncated: boolean;
    factors: { name: string; real: string; unit: string }[];
  } | null;
}

export interface ExperimentItem {
  file: string;
  name: string;
  updated_at: string | null;
  created_at: string | null;
  resp_name: string | null;
  resp_unit: string | null;
  k: number;
  n_center: number | null;
  fitted: boolean;
  summary: ExperimentSummary | null;
}

export interface ExperimentDoc {
  file: string;
  name: string;
  created_at: string;
  updated_at: string;
  design: DesignIn;
  responses: number[];
  ref_key: string | null;
  notes: string;
  summary: ExperimentSummary | null;
}

export interface WorkspaceState {
  path: string | null;
  theme: Theme;
  experiments: ExperimentItem[];
}

export interface SaveIn {
  file: string | null;
  name: string;
  design: DesignIn;
  responses: number[];
  ref_key: string | null;
  notes: string;
}

export interface SaveOut {
  file: string;
  doc: ExperimentDoc;
  experiments: ExperimentItem[];
}

// ---------------------------------------------------------------------------
// Comparacao
// ---------------------------------------------------------------------------

export interface CompareItem {
  file: string;
  name: string;
  resp_label: string;
  info: DesignInfo;
  kpis: Kpis;
  transform: Transform;
  significance: number;
  coefficients: Coefficient[];
  optimum: { y: number; y_raw: number; truncated: boolean; factors: OptFactor[] };
  factors: { name: string; unit: string; min_val: number; max_val: number }[];
}

export interface CompareCharts {
  metricas: { labels: string[]; series: { name: string; values: number[] }[] };
  coeficientes: {
    symbols: string[];
    series: { name: string; values: (number | null)[]; p_values: (number | null)[] }[];
  };
  previsto_observado: {
    series: { name: string; points: { x: number; y: number; label: string }[] }[];
    min: number;
    max: number;
  };
}

export interface CompareOut {
  items: CompareItem[];
  charts: CompareCharts;
}
