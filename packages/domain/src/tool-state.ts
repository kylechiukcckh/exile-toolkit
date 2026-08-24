import type { DatasetCategory } from './dataset';

export interface RegexToolState {
  readonly category: DatasetCategory;
  readonly selectedIds: readonly string[];
}

export type DecodedRegexToolState =
  | { readonly valid: true; readonly state: RegexToolState }
  | { readonly valid: false; readonly message: string };

const currentVersion = 1;
const maximumEncodedLength = 2000;
const maximumSelectionSize = 200;
const base64Alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function encodeRegexToolState(state: RegexToolState) {
  if (
    !isCategory(state.category) ||
    state.selectedIds.length > maximumSelectionSize ||
    !state.selectedIds.every(isEntryId)
  ) {
    throw new Error('The Tool state contains unsupported values.');
  }
  const payload = JSON.stringify({ version: currentVersion, ...state });
  const encoded = encodeBase64(payload)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
  if (encoded.length > maximumEncodedLength) {
    throw new Error('The Tool state is too large to share safely.');
  }
  return encoded;
}

export function decodeRegexToolState(encoded: string): DecodedRegexToolState {
  if (encoded.length > maximumEncodedLength) {
    return {
      valid: false,
      message: 'The shared Tool state is too large to open safely.'
    };
  }

  try {
    const base64 = encoded.replaceAll('-', '+').replaceAll('_', '/');
    const payload: unknown = JSON.parse(decodeBase64(base64));
    if (!isRecord(payload)) throw new Error('invalid payload');
    if (payload.version !== currentVersion) {
      const version =
        typeof payload.version === 'number' ? payload.version : 'unknown';
      return {
        valid: false,
        message: `Shared Tool state version ${version} is not supported.`
      };
    }
    if (
      !isCategory(payload.category) ||
      !Array.isArray(payload.selectedIds) ||
      payload.selectedIds.length > maximumSelectionSize ||
      !payload.selectedIds.every(isEntryId)
    ) {
      throw new Error('invalid state');
    }
    return {
      valid: true,
      state: {
        category: payload.category,
        selectedIds: [...new Set(payload.selectedIds)]
      }
    };
  } catch {
    return { valid: false, message: 'The shared Tool state is malformed.' };
  }
}

function encodeBase64(value: string) {
  let output = '';
  for (let index = 0; index < value.length; index += 3) {
    const first = value.charCodeAt(index);
    const second = value.charCodeAt(index + 1);
    const third = value.charCodeAt(index + 2);
    const block = (first << 16) | ((second || 0) << 8) | (third || 0);
    output += base64Alphabet[(block >> 18) & 63];
    output += base64Alphabet[(block >> 12) & 63];
    output += Number.isNaN(second) ? '=' : base64Alphabet[(block >> 6) & 63];
    output += Number.isNaN(third) ? '=' : base64Alphabet[block & 63];
  }
  return output;
}

function decodeBase64(value: string) {
  if (!/^[A-Za-z0-9+/]*={0,2}$/u.test(value)) throw new Error('invalid base64');
  const padded = value.padEnd(Math.ceil(value.length / 4) * 4, '=');
  let output = '';
  for (let index = 0; index < padded.length; index += 4) {
    const values = Array.from(padded.slice(index, index + 4), character =>
      character === '=' ? 0 : base64Alphabet.indexOf(character)
    );
    if (values.some(number => number < 0)) throw new Error('invalid base64');
    const block =
      ((values[0] ?? 0) << 18) |
      ((values[1] ?? 0) << 12) |
      ((values[2] ?? 0) << 6) |
      (values[3] ?? 0);
    output += String.fromCharCode((block >> 16) & 255);
    if (padded[index + 2] !== '=')
      output += String.fromCharCode((block >> 8) & 255);
    if (padded[index + 3] !== '=') output += String.fromCharCode(block & 255);
  }
  return output;
}

function isEntryId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 100 &&
    /^[a-z0-9-]+$/u.test(value)
  );
}

function isCategory(value: unknown): value is DatasetCategory {
  return value === 'map' || value === 'map-modifier';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
