import type {Item} from '../catalog/types';
export const layout:string[];
export function fits(item:Item,slot:string):boolean;
export function supported(game:string,slot:string):boolean;
export function twoHanded(item:Item|undefined):boolean;
