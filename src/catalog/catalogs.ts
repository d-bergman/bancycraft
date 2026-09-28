import dragonwilds from './data/dragonwilds.json';
import valheim from './data/valheim.json';
import enshrouded from './data/enshrouded.json';
import type { Game } from '../types';
import type { Catalog } from './types';
export const catalogs: Record<Game, Catalog> = { dragonwilds, valheim, enshrouded };
export const gameNames: Record<Game, string> = { dragonwilds: 'RuneScape: Dragonwilds', valheim: 'Valheim', enshrouded: 'Enshrouded' };
