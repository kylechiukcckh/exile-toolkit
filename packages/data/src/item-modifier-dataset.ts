import {
  validateItemModifierDataset,
  type EquipmentClass,
  type ItemModifierDataset,
  type ModifierSourcePool
} from '@exile-toolkit/domain';

export type LoadItemModifierDatasetResult =
  | { readonly status: 'success'; readonly dataset: ItemModifierDataset }
  | {
      readonly status: 'dataset-unavailable';
      readonly equipmentClass: EquipmentClass;
      readonly sourcePool: ModifierSourcePool;
    }
  | {
      readonly status: 'dataset-invalid';
      readonly issues: readonly string[];
    };

export async function loadItemModifierDataset(input: {
  readonly equipmentClass: EquipmentClass;
  readonly sourcePool: ModifierSourcePool;
}): Promise<LoadItemModifierDatasetResult> {
  if (input.equipmentClass === 'amulet' && input.sourcePool === 'normal') {
    const { itemModifierDataset } =
      await import('./generated/item-modifiers/amulet-normal');
    const validation = validateItemModifierDataset(itemModifierDataset);
    return validation.valid
      ? { status: 'success', dataset: validation.dataset }
      : { status: 'dataset-invalid', issues: validation.issues };
  }

  return { status: 'dataset-unavailable', ...input };
}
