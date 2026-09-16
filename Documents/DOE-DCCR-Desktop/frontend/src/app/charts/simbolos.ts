/**
 * Os simbolos dos termos vem da API em HTML (x<sub>1</sub>, x<sub>1</sub><sup>2</sup>),
 * porque na tela eles sao renderizados como HTML. Nos eixos do grafico nao ha
 * HTML, entao aqui viram texto com indices em Unicode: x₁, x₁², x₁·x₂.
 */
const SUB: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
};

const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

const trocar = (txt: string, mapa: Record<string, string>) =>
  txt.replace(/[0-9]/g, (d) => mapa[d] ?? d);

export function simboloTexto(html: string): string {
  return html
    .replace(/<sub>(.*?)<\/sub>/g, (_, d: string) => trocar(d, SUB))
    .replace(/<sup>(.*?)<\/sup>/g, (_, d: string) => trocar(d, SUP))
    .replace(/<[^>]+>/g, '')
    .trim();
}
