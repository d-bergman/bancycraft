export type UniqueLocation = {location:string;region:string;provenance:string};
export function resolveLocation(
  item:{id:string;location:string},
  mapFallbacks:Record<string,Array<{site:string;map:string}>>,
  overrides:Record<string,{location:string;sourceUrl:string}>,
):UniqueLocation;
export function regionsIn(text:string):string[];
