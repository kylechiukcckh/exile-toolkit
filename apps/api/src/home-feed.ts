import {
  isHomeFeedResponse,
  type HomeFeedSnapshot
} from '@exile-toolkit/contracts';
import { steamDbRetentionSeed } from '@exile-toolkit/data';

export interface HomeFeedStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export const homeFeedKey = 'home-feed:complete:v5';
export const homeFeedFreshForMs = 24 * 60 * 60_000;
const patchListUrl = 'https://www.pathofexile.com/forum/view-forum/patch-notes';
const steamPlayersUrl =
  'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=238960';

export function homeFeedIsFresh(snapshot: HomeFeedSnapshot, now = Date.now()) {
  const retrievedAt = new Date(snapshot.retrievedAt).getTime();
  return Number.isFinite(retrievedAt) && now - retrievedAt < homeFeedFreshForMs;
}

export async function readStoredHomeFeed(store?: HomeFeedStore) {
  if (!store) return undefined;
  try {
    const value = await store.get(homeFeedKey);
    if (!value) return undefined;
    const response: unknown = JSON.parse(value);
    return isHomeFeedResponse(response) ? response.snapshot : undefined;
  } catch {
    return undefined;
  }
}

export async function writeStoredHomeFeed(
  store: HomeFeedStore | undefined,
  snapshot: HomeFeedSnapshot
) {
  if (!store) return;
  try {
    await store.put(homeFeedKey, JSON.stringify({ snapshot }));
  } catch {
    // A cache failure must not prevent the homepage response.
  }
}

export async function fetchHomeFeed(
  requestUpstream: typeof fetch,
  timeoutMs: number,
  retained?: HomeFeedSnapshot
): Promise<HomeFeedSnapshot> {
  const [patchList, retention] = await Promise.all([
    fetchText(requestUpstream, patchListUrl, timeoutMs),
    retained
      ? updateRetentionFromSteam(requestUpstream, retained.retention, timeoutMs)
      : Promise.resolve(seedRetentionFromSteamDb())
  ]);
  const patchMatch = patchList.match(
    /href="(\/forum\/view-thread\/\d+)"[^>]*>\s*(3\.\d+(?:\.\d+)*[a-z]? Patch Notes)\s*<\/a>/i
  );
  if (!patchMatch) throw new Error('Patch notes were not found');
  const patchPath = patchMatch[1];
  const patchTitle = patchMatch[2];
  if (!patchPath || !patchTitle) throw new Error('Patch notes were invalid');
  const patchUrl = new URL(patchPath, 'https://www.pathofexile.com').toString();
  const patch =
    retained?.patch.url === patchUrl
      ? retained.patch
      : await fetchPatch(requestUpstream, patchUrl, patchTitle, timeoutMs);
  const snapshot: HomeFeedSnapshot = {
    retrievedAt: new Date().toISOString(),
    patch,
    retention
  };
  if (!isHomeFeedResponse({ snapshot })) throw new Error('Invalid home feed');
  return snapshot;
}

async function fetchPatch(
  requestUpstream: typeof fetch,
  patchUrl: string,
  patchTitle: string,
  timeoutMs: number
) {
  const patchHtml = await fetchText(requestUpstream, patchUrl, timeoutMs);
  return {
    version: patchTitle.replace(/ Patch Notes$/i, ''),
    title: patchTitle,
    publishedAt: readPublishedAt(patchHtml),
    url: patchUrl,
    changes: readPatchChanges(patchHtml)
  };
}

function seedRetentionFromSteamDb() {
  const [current, ...previous] = steamDbRetentionSeed.series;
  const launchPlayers = current.players[0];
  if (!current || !launchPlayers)
    throw new Error('SteamDB retention seed is empty');
  const values = current.players.map(
    players => Math.round((players / launchPlayers) * 1_000) / 10
  );
  const series = [current, ...previous].map(item => {
    const launch = item.players[0];
    return {
      league: item.league,
      launchPlayers: launch ?? 0,
      players: [...item.players],
      values: item.players.map(players =>
        launch ? Math.round((players / launch) * 1_000) / 10 : 0
      )
    };
  });
  return {
    sourceUrl: steamDbRetentionSeed.sourceUrl,
    source: 'steamdb-export' as const,
    league: current.league,
    launchPlayers,
    lastSampledAt: `${steamDbRetentionSeed.importedThrough}T23:59:59.000Z`,
    days: values.map((_, index) => index + 1),
    values,
    series,
    comparisons: [current, ...previous].map(item => {
      const launch = item.players[0];
      const at = (day: number) => {
        const players = item.players[day - 1];
        return players === undefined || !launch
          ? null
          : Math.round((players / launch) * 1_000) / 10;
      };
      return { league: item.league, day7: at(7), day14: at(14), day28: at(28) };
    })
  };
}

async function updateRetentionFromSteam(
  requestUpstream: typeof fetch,
  retained: HomeFeedSnapshot['retention'],
  timeoutMs: number
) {
  const payload = await fetchJson(requestUpstream, steamPlayersUrl, timeoutMs);
  if (
    !isRecord(payload) ||
    !isRecord(payload.response) ||
    !isNumber(payload.response.player_count)
  ) {
    throw new Error('Steam player count is invalid');
  }
  const playerCount = payload.response.player_count;
  const sampledAt = new Date();
  const priorSample = new Date(retained.lastSampledAt).getTime();
  const elapsedDays = Math.max(
    1,
    Math.floor((sampledAt.getTime() - priorSample) / homeFeedFreshForMs)
  );
  const day = (retained.days.at(-1) ?? 0) + elapsedDays;
  const retention =
    Math.round((playerCount / retained.launchPlayers) * 1_000) / 10;
  const days = [...retained.days];
  const values = [...retained.values];
  if (days.at(-1) === day) values[values.length - 1] = retention;
  else {
    days.push(day);
    values.push(retention);
  }
  return {
    ...retained,
    source: 'steam' as const,
    sourceUrl: steamPlayersUrl,
    lastSampledAt: sampledAt.toISOString(),
    days,
    values,
    series: retained.series.map((item, index) =>
      index === 0
        ? {
            ...item,
            values,
            players: [...item.players, playerCount]
          }
        : item
    ),
    comparisons: retained.comparisons.map((item, index) =>
      index === 0
        ? {
            ...item,
            day7: values[6] ?? null,
            day14: values[13] ?? null,
            day28: values[27] ?? null
          }
        : item
    )
  };
}

async function fetchText(
  requestUpstream: typeof fetch,
  url: string,
  timeoutMs: number
) {
  const response = await fetchWithTimeout(requestUpstream, url, timeoutMs);
  return response.text();
}

async function fetchJson(
  requestUpstream: typeof fetch,
  url: string,
  timeoutMs: number
) {
  const response = await fetchWithTimeout(requestUpstream, url, timeoutMs);
  return response.json() as Promise<unknown>;
}

async function fetchWithTimeout(
  requestUpstream: typeof fetch,
  url: string,
  timeoutMs: number
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await requestUpstream(url, {
      headers: {
        'user-agent': 'Exile Toolkit/0.1 (https://exile-toolkit.pages.dev)'
      },
      signal: controller.signal
    });
    if (!response.ok) throw new Error('Homepage source is unavailable');
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function readPatchChanges(html: string) {
  const posts = [...html.matchAll(/<div class="content">([\s\S]*?)<\/div>/gi)];
  const changes =
    posts
      .map(post =>
        [...(post[1] ?? '').matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
          .map(match => cleanText(match[1] ?? ''))
          .filter(Boolean)
      )
      .find(items => items.length > 0)
      ?.slice(0, 8) ?? [];
  if (changes.length === 0) throw new Error('Patch changes were not found');
  return changes;
}

function readPublishedAt(html: string) {
  const value = html.match(/class="post_date"[^>]*>([^<]+)</i)?.[1];
  if (!value) return new Date().toISOString();
  const parsed = new Date(cleanText(value).replace(/^on\s+/i, ''));
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function cleanText(value: string) {
  return value
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(?:x([\da-f]+)|(\d+));/gi, (entity, hex, decimal) => {
      const codePoint = Number.parseInt(hex ?? decimal, hex ? 16 : 10);
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
    })
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
