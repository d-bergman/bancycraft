import dragonwilds from './data/dragonwilds.json';
import valheim from './data/valheim.json';
import enshrouded from './data/enshrouded.json';
import grounded2 from './data/grounded2.json';
import vrising from './data/vrising.json';
import type { Game } from '../types';
import type { Catalog } from './types';
export const catalogs: Record<Game, Catalog> = { dragonwilds, valheim, enshrouded, grounded2, vrising };
export const gameNames: Record<Game, string> = { dragonwilds: 'RuneScape: Dragonwilds', valheim: 'Valheim', enshrouded: 'Enshrouded', grounded2: 'Grounded 2', vrising: 'V Rising' };
