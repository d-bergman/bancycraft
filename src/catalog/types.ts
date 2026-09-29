export type Item = { availability?:string; id: string; name: string; category: string; description: string; acquisition: string; sourceUrl: string; revision?: number; updatedAt?: string };
export type Ingredient = { name: string; quantity: number; itemId?: string };
export type Recipe = { id: string; station: string; notes: string; inputs: Ingredient[]; outputs: Ingredient[]; sourceUrl: string };
export type Catalog = { upgrades?:Record<string,{sourceUrl:string;verifiedAt:string;levels:{level:number;inputs:Ingredient[]}[]}>; schemaVersion: number; game: string; importedAt: string; source: { name: string; url: string; license: string; licenseUrl: string; version?: string }; coverage: string; items: Item[]; recipes: Recipe[] };
