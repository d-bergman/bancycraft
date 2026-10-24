export interface AtlasMarker {id:string;name:string;group:string;x:number;y:number;article?:string}
export interface AtlasLayer {id:string;name:string;width:number;height:number;source:string;revision:number|null;markers:AtlasMarker[]}
export interface AtlasLocation {location:string;region:string;provenance:string}
export function normalizePlace(value:string):string;
export function pinsForItem(item:{id:string;location?:string},maps:AtlasLayer[],fallbacks:Record<string,{map:string;site:string}[]>,overrides:Record<string,{location:string}>):{info:AtlasLocation;pins:{mapId:string;marker:AtlasMarker}[]};
