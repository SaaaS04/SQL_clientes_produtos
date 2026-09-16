import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  AnalysisIn,
  AnalysisOut,
  ChartsOut,
  CompareOut,
  DesignIn,
  DesignOut,
  ExperimentDoc,
  ExperimentItem,
  LevelsOut,
  Meta,
  OptimizationOut,
  SaveIn,
  SaveOut,
  SurfaceOut,
  Theme,
  WorkspaceState,
} from './models';

/**
 * Motor de calculo local (FastAPI, pasta api/). Em desenvolvimento roda com
 * `python -m doe_api`; no app empacotado o Tauri sobe o mesmo servidor nesta
 * porta. Escuta so em 127.0.0.1.
 */
export const API_BASE = 'http://127.0.0.1:8765/api';

@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);

  private get<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(API_BASE + path));
  }

  private post<T>(path: string, body: unknown = {}): Promise<T> {
    return firstValueFrom(this.http.post<T>(API_BASE + path, body));
  }

  meta() {
    return this.get<Meta>('/meta');
  }

  levels(d: DesignIn) {
    return this.post<LevelsOut>('/levels', d);
  }

  design(d: DesignIn) {
    return this.post<DesignOut>('/design', d);
  }

  analysis(d: AnalysisIn) {
    return this.post<AnalysisOut>('/analysis', d);
  }

  optimization(d: AnalysisIn) {
    return this.post<OptimizationOut>('/optimization', d);
  }

  // O servidor devolve series numericas: a cor e o tema sao decididos na tela,
  // por isso nada aqui depende do tema.
  charts(d: AnalysisIn) {
    return this.post<ChartsOut>('/plots', d);
  }

  surface(d: AnalysisIn, ix: number, iy: number) {
    return this.post<SurfaceOut>('/plots/surface', { ...d, ix, iy });
  }

  // ---------------------------------------------------------------- pasta
  workspace() {
    return this.get<WorkspaceState>('/workspace');
  }

  openWorkspace(path: string) {
    return this.post<WorkspaceState>('/workspace/open', { path });
  }

  save(body: SaveIn) {
    return this.post<SaveOut>('/workspace/save', body);
  }

  load(file: string) {
    return this.post<ExperimentDoc>('/workspace/load', { file });
  }

  remove(file: string) {
    return this.post<{ experiments: ExperimentItem[] }>('/workspace/delete', { file });
  }

  rename(file: string, name: string) {
    return this.post<SaveOut>('/workspace/rename', { file, name });
  }

  settings(theme: Theme) {
    return this.post<{ theme: Theme }>('/settings', { theme });
  }

  compare(files: string[]) {
    return this.post<CompareOut>('/compare', { files });
  }
}

export interface Problem {
  message: string;
  errors: string[];
}

/** Converte qualquer falha de requisicao numa mensagem para o usuario. */
export function problemOf(e: unknown): Problem {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) {
      return { message: 'O motor de cálculo não respondeu.', errors: [] };
    }
    const body = e.error as { detail?: unknown; errors?: string[] } | null;
    if (body && typeof body.detail === 'string') {
      return { message: body.detail, errors: body.errors ?? [] };
    }
    if (body && Array.isArray(body.detail)) {
      // erro de validacao do pydantic: lista de {loc, msg}
      const itens = body.detail as { loc?: unknown[]; msg?: string }[];
      return {
        message: 'Dados inválidos.',
        errors: itens.map((x) => `${(x.loc ?? []).slice(1).join(' › ')}: ${x.msg ?? ''}`),
      };
    }
    return { message: `Erro ${e.status} do motor de cálculo.`, errors: [] };
  }
  return { message: e instanceof Error ? e.message : String(e), errors: [] };
}

/**
 * Seletor nativo de pasta, quando rodando dentro do Tauri. No navegador
 * (desenvolvimento) nao existe API para escolher pasta, entao devolve null e
 * a interface cai no campo de digitar o caminho.
 */
export async function escolherPastaNativa(): Promise<string | null> {
  if (!('__TAURI_INTERNALS__' in window)) return null;
  const { open } = await import('@tauri-apps/plugin-dialog');
  const escolha = await open({ directory: true, multiple: false, title: 'Pasta dos experimentos' });
  return typeof escolha === 'string' ? escolha : null;
}

export function dentroDoTauri(): boolean {
  return '__TAURI_INTERNALS__' in window;
}
