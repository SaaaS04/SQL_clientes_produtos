// Formatacao numerica equivalente aos f-strings da interface do notebook.

const vazio = (v: number | null | undefined): v is null | undefined =>
  v === null || v === undefined || !Number.isFinite(v);

/** f"{v:.Nf}" */
export function fixed(v: number | null | undefined, casas = 2): string {
  return vazio(v) ? '-' : v.toFixed(casas);
}

/** f"{v:.Ne}", com expoente de dois digitos como no Python (1.78e-02). */
export function sci(v: number | null | undefined, casas = 2): string {
  if (vazio(v)) return '-';
  const [mant, exp] = v.toExponential(casas).split('e');
  const n = Number(exp);
  return `${mant}e${n < 0 ? '-' : '+'}${String(Math.abs(n)).padStart(2, '0')}`;
}

/** f"{v:.4g}" */
export function g4(v: number | null | undefined): string {
  return vazio(v) ? '-' : String(Number(v.toPrecision(4)));
}

/** f"{v:+.3f}" */
export function signed3(v: number | null | undefined): string {
  if (vazio(v)) return '-';
  return (v >= 0 ? '+' : '') + v.toFixed(3);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Desvio-padrao populacional, como np.std. */
export function std(vals: number[]): number {
  if (!vals.length) return 0;
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.sqrt(vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length);
}

/**
 * Le numeros colados do Excel. Porta de legacy DataPanel._parse_numeros.
 *
 * Aceita virgula decimal, tabulacao, ponto e virgula e quebra de linha.
 * A virgula so vira ponto quando nao ha ponto no mesmo token, para nao
 * estragar valores no formato 1,234.56.
 */
export function parseNumbers(txt: string): { values: number[]; bad: number } {
  const bruto = txt.replace(/;/g, '\n').replace(/\t/g, '\n');
  const values: number[] = [];
  let bad = 0;
  for (const token of bruto.split(/\s+/)) {
    let t = token.trim();
    if (!t) continue;
    t = t.includes(',') && !t.includes('.') ? t.replace(/,/g, '.') : t.replace(/,/g, '');
    const v = Number(t);
    if (t !== '' && Number.isFinite(v)) values.push(v);
    else bad++;
  }
  return { values, bad };
}
