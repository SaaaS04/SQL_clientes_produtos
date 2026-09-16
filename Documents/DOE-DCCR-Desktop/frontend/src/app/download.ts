/**
 * Download de arquivos gerados na propria tela: imagens dos graficos e CSV
 * das tabelas.
 */

export function baixarBlob(nome: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // o navegador ainda precisa do blob no clique; soltar no proximo ciclo
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function celula(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * CSV no dialeto que o Excel em português abre com dois cliques: separador
 * ponto e vírgula, vírgula decimal e BOM para o acento não sair trocado.
 */
export function montarCSV(cabecalhos: string[], linhas: unknown[][]): string {
  const decimal = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? String(v).replace('.', ',') : celula(v);
  const corpo = linhas.map((l) => l.map(decimal).join(';'));
  return '﻿' + [cabecalhos.map(celula).join(';'), ...corpo].join('\r\n');
}

export function baixarCSV(nome: string, cabecalhos: string[], linhas: unknown[][]): void {
  baixarBlob(`${nome}.csv`, new Blob([montarCSV(cabecalhos, linhas)], { type: 'text/csv;charset=utf-8' }));
}

/** Nome de arquivo seguro, a partir do nome do experimento. */
export function nomeArquivo(...partes: string[]): string {
  return (
    partes
      .join('-')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'doe-dccr'
  );
}
