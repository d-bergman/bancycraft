export type Game = 'dragonwilds' | 'valheim' | 'enshrouded';
export type Plan = { id: string; name: string; game: Game; quantity: number; notes: string; status: 'planned' | 'in-progress' | 'completed'; updatedAt: string };
export type Supply = { id: string; name: string; game: Game; quantity: number };
export type Workspace = { schemaVersion: 1; game: Game; plans: Plan[]; supplies: Supply[] };
export type Update = { state: string; message: string; version?: string };
export type Info = { version: string; dataPath: string; packaged: boolean; update: Update };
export interface Bridge {
  info(): Promise<Info>; load(): Promise<Workspace>; save(data: Workspace): Promise<Workspace>;
  openWebsite(): Promise<void>; openSource(url: string): Promise<void>; openData(): Promise<unknown>; exportWorkspace(): Promise<boolean>;
  checkUpdate(): Promise<Update>; downloadUpdate(): Promise<Update>; installUpdate(): Promise<void>; onUpdate(callback: (update: Update) => void): () => void;
}
declare global { const __APP_VERSION__: string; interface Window { bancy?: Bridge } }
