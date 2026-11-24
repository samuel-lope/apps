import type { ComponentType, LazyExoticComponent } from 'react';

export type AppVisibility = 'public' | 'internal';
export type AppCategory = 'utilitarios' | 'seguranca' | 'jogos' | 'operacional' | 'dev';
export type AppRuntime = 'react' | 'legacy';

export type AppIconName =
  | 'receipt'
  | 'qr-code'
  | 'key-round'
  | 'cpu'
  | 'shield-check'
  | 'lock'
  | 'grid-3x3'
  | 'terminal'
  | 'clipboard-list'
  | 'database'
  | 'folder-sync'
  | 'search-code';

export interface AppManifest {
  id: string;
  slug: string;
  path: string;
  title: string;
  description: string;
  category: AppCategory;
  visibility: AppVisibility;
  runtime: AppRuntime;
  tags: string[];
  accent: string;
  iconName: AppIconName;
  immersive?: boolean;
  printFriendly?: boolean;
  legacySrc?: string;
  component?: LazyExoticComponent<ComponentType>;
}
