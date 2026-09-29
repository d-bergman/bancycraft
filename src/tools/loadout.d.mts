import type {Item} from '../catalog/types';
export const layout:string[];
export function fits(item:Item,slot:string):boolean;
export function supported(game:string,slot:string):boolean;
export function twoHanded(item:Item|undefined):boolean;
export function fitsGame(item:Item,slot:string,game:string):boolean;
export function normalizeSlots<T extends {slot:string}>(items:T[]):T[];
export function uniqueEquipment(items:Item[],catalog:import('../catalog/types').Catalog):Item[];
