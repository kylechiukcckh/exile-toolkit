export interface ImportedDisenchantDataset {
  readonly id: string;
  readonly version: string;
  readonly coverage: string;
  readonly provenance: unknown;
  readonly entries: readonly {
    readonly id: string;
    readonly name: string;
    readonly baseType: string;
    readonly category: 'weapon' | 'armour' | 'accessory';
    readonly baseDust: number;
    readonly influenceCount: number;
    readonly dustValue: number;
    readonly upstreamReference: string;
    readonly iconUrl?: string;
    readonly cannotGainQuality?: true;
  }[];
}

export function importDataset(input: unknown): ImportedDisenchantDataset;
export function calculateReferenceDustValue(
  baseDust: number,
  itemLevel: number,
  quality: 0 | 20,
  influenceCount: number
): number;
export function renderDataset(
  dataset: ImportedDisenchantDataset
): Promise<string>;
export function renderManifest(
  dataset: ImportedDisenchantDataset
): Promise<string>;
