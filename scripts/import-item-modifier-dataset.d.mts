import type { ItemModifierDataset } from '@exile-toolkit/domain';

export interface ItemModifierImportManifest {
  readonly schemaVersion: 1;
  readonly gameVersion: string;
  readonly revision: number;
  readonly preparedAt: string;
  readonly reviewer: string;
  readonly coverage: string;
  readonly sources: readonly {
    readonly name: string;
    readonly url: string;
    readonly license: string;
    readonly licenseUrl: string;
    readonly attribution: string;
  }[];
  readonly disagreements: readonly {
    readonly subject: string;
    readonly sources: readonly string[];
    readonly evidence: string;
    readonly decision: string;
    readonly reviewer: string;
  }[];
  readonly retiredModifierIds: readonly string[];
  readonly chunks: Readonly<Record<string, string>>;
}

export function importItemModifierSnapshot(sourceDirectory: string): Promise<{
  readonly dataset: ItemModifierDataset;
  readonly datasets: readonly ItemModifierDataset[];
  readonly manifest: ItemModifierImportManifest;
}>;

export function renderItemModifierChunk(
  dataset: ItemModifierDataset
): Promise<string>;

export function writeItemModifierDataset(input: {
  readonly sourceDirectory: string;
  readonly outputDirectory: string;
}): Promise<void>;
