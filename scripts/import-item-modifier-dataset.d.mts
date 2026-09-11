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
  readonly disagreements: readonly unknown[];
  readonly chunks: Readonly<Record<string, string>>;
}

export function importItemModifierSnapshot(sourceDirectory: string): Promise<{
  readonly dataset: ItemModifierDataset;
  readonly manifest: ItemModifierImportManifest;
}>;

export function renderItemModifierChunk(
  dataset: ItemModifierDataset
): Promise<string>;

export function writeItemModifierDataset(input: {
  readonly sourceDirectory: string;
  readonly outputDirectory: string;
}): Promise<void>;
