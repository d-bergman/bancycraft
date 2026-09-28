export type Game = 'dragonwilds' | 'valheim' | 'enshrouded';
export type Plan = { id: string; name: string; game: Game; quantity: number; notes: string; status: 'planned' | 'in-progress' | 'completed'; updatedAt: string };
export type Supply = { id: string; name: string; game: Game; quantity: number };
export type ListTarget = { itemId: string; name: string; quantity: number };
export type ShoppingList = { id: string; name: string; game: Game; quick: boolean; targets: ListTarget[]; recipes: Record<string, string>; progress: Record<string, number>; useSupplies: boolean; hideCompleted: boolean; collapsed: Record<string, boolean>; updatedAt: string };
export type Workspace = { schemaVersion: 2; game: Game; plans: Plan[]; supplies: Supply[]; lists: ShoppingList[] };
export type Update = { state: string; message: string; version?: string; percent?: number };
export type Access = { unlocked:boolean; subject?:string; expiresAt?:number };
export type Info = { version: string; dataPath: string; packaged: boolean; update: Update; access:Access };
export interface Bridge {
  info(): Promise<Info>; load(): Promise<Workspace>; save(data: Workspace): Promise<Workspace>;
  unlockCommunity(key:string):Promise<Access>; lockCommunity():Promise<Access>; openBank(order?:{amount:number;note:string}):Promise<void>;
  openWebsite(): Promise<void>; openSource(url: string): Promise<void>; openData(): Promise<unknown>; exportWorkspace(): Promise<boolean>;
  checkUpdate(): Promise<Update>; downloadUpdate(): Promise<Update>; installUpdate(): Promise<void>; onUpdate(callback: (update: Update) => void): () => void;
}
declare global { const __APP_VERSION__: string; interface Window { bancy?: Bridge } }
