export type CollectionItem={id:string;name:string;group:string;family:string;tier:number|null;unique:boolean};
export type CollectionSlot={id:string;itemId:string;targetId?:string};
export type CollectionLoadout={id:string;name:string;slots:CollectionSlot[]};
export function nextUpgrades<T extends CollectionItem>(items:T[],current:T|undefined):T[];
export function acquire<T extends CollectionItem>(loadouts:CollectionLoadout[],itemId:string,byId:Map<string,T>,items:T[]):CollectionLoadout[];
