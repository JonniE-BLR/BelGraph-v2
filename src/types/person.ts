export type CategoryId =
  | 'enlightener'
  | 'writer'
  | 'figure'
  | 'scientist'
  | 'artist'
  | 'modern';

export type Language = 'be' | 'ru';

export type ViewMode = 'network' | 'timeline-graph' | 'chronicle';

export interface Milestone {
  year: number;
  labelBe: string;
  labelRu: string;
}

export interface Person {
  id: string;
  nameBe: string;
  nameRu: string;
  years: string;
  birthYear: number;
  deathYear?: number;
  category: CategoryId;
  roleBe: string;
  roleRu: string;
  placeBe: string;
  placeRu: string;
  quoteBe: string;
  quoteRu: string;
  bioBe: string;
  bioRu: string;
  achievementsBe: string[];
  achievementsRu: string[];
  milestones: Milestone[];
  connections: string[];
  isCentralHub?: boolean;
  significance?: number; // 1..3 visual node radius weight
}

export interface CategoryMeta {
  id: CategoryId | 'all';
  labelBe: string;
  labelRu: string;
  colorVar: string;
  hex: string;
}

export interface LineagePreset {
  id: string;
  titleBe: string;
  titleRu: string;
  descBe: string;
  descRu: string;
  path: string[];
}
