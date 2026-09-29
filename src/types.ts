export type Game = 'dragonwilds' | 'valheim' | 'enshrouded' | 'grounded2' | 'vrising' | 'duneawakening';
export type Plan = { id: string; name: string; game: Game; quantity: number; notes: string; status: 'planned' | 'in-progress' | 'completed'; updatedAt: string };
export type Supply = { itemId?:string; id: string; name: string; game: Game; quantity: number };
export type ListTarget = { itemId: string; name: string; quantity: number; fromLevel?:number; toLevel?:number };
export type ShoppingList = { id: string; name: string; game: Game; quick: boolean; targets: ListTarget[]; owned?:Record<string,number>; assignments?:Record<string,string>; recipes: Record<string, string>; progress: Record<string, number>; useSupplies: boolean; hideCompleted: boolean; collapsed: Record<string, boolean>; updatedAt: string };
export type Workspace = { completionLog?:{id:string;game:Game;at:string}[]; schemaVersion: 2; game: Game; plans: Plan[]; supplies: Supply[]; lists: ShoppingList[] };
export type Update = { state: string; message: string; version?: string; percent?: number };
export type Access = { unlocked:boolean; subject?:string; expiresAt?:number };
export type Info = { version: string; dataPath: string; packaged: boolean; update: Update; access:Access;controllerAccess?:Access };
export type Member = { uid:string; displayName:string };
export type Account = { state:string; message:string; user?:Member & {email:string} };
export type SharedList = ShoppingList & { ownerUid:string; members:Member[]; activity:Record<string,{byUid:string;at:number;amount:number}> };
export type SharedState = {account:Account;lists:{id:string;name:string;game:Game;ownerUid:string;members:number}[];active:SharedList|null;online:boolean;message:string};
export type Build = {id:string;name:string;game:Game;tags:string[];description:string;skills:string;items:{slot:string;itemId:string;name:string;quantity:number}[];updatedAt:string;owner?:Member;creator?:Member;publishedAt?:string;sourceId?:string;sourceUpdatedAt?:string};
export type ToolsWorkspace={schemaVersion:1;builds:Build[];favorites:Partial<Record<Game,string[]>>;recent:Partial<Record<Game,string[]>>};
export type ServerSnapshot={registry:{id:string;title:string;game:string;description:string;region:string;host:string;notes:string;rules:string[];status:string;controllerServerId:string;image:string;address:string;password:string;joinUrl:string}[];control:null|{servers:{id:string;label:string;status:string;playerQueryStatus?:string;playersOnline?:number;playersMax?:number;playerNames?:string[]}[]};controlError:string};
export type KeyVault={available:boolean;keys:{id:string;label:string;subject?:string;expiresAt?:number}[]};
export type FeedbackReport={game:Game;type:string;subject:string;details:string;email:string;version:string};
export interface Bridge {
  adminKeys():Promise<KeyVault>;copyAdminKey(id:string):Promise<boolean>;sendFeedback(report:FeedbackReport):Promise<{sent:boolean}>;
  unlockController(key:string):Promise<Access>;lockController():Promise<Access>;serversSnapshot():Promise<ServerSnapshot>;serverAction(id:string,action:string):Promise<unknown>;
  toolsLoad():Promise<ToolsWorkspace>;toolsSave(value:ToolsWorkspace):Promise<ToolsWorkspace>;
  buildsBrowse(game:Game):Promise<Build[]>;buildsGet(id:string):Promise<Build|null>;buildsPublish(build:Build):Promise<Build>;buildsRemove(id:string):Promise<void>;profileAvatar(uid:string):Promise<{uid:string;displayName:string;image:string}|null>;
  importWorkspace():Promise<Workspace|null>;exportList(list:ShoppingList):Promise<boolean>;importList():Promise<ShoppingList|null>;exportBuild(build:Build):Promise<boolean>;importBuild():Promise<Build|null>;gamingMode(enable:boolean):Promise<void>;

  accountConnect():Promise<Account>;accountDisconnect():Promise<Account>;sharedStatus():Promise<SharedState>;
  sharedWatch(id:string|null):Promise<void>;sharedCreate(id:string):Promise<string>;sharedChange(id:string,base:ShoppingList,next:ShoppingList):Promise<unknown>;
  sharedSearch(text:string):Promise<Member[]>;sharedAdd(id:string,uid:string):Promise<void>;sharedRemoveMember(id:string,uid:string):Promise<void>;sharedRemove(id:string):Promise<void>;
  sharedRestore(id:string):Promise<string>;
  onShared(callback:(data:SharedState)=>void):()=>void;
  info(): Promise<Info>; load(): Promise<Workspace>; save(data: Workspace): Promise<Workspace>;
  unlockCommunity(key:string):Promise<Access>; lockCommunity():Promise<Access>; openBank(order?:{amount:number;note:string}):Promise<void>;
  openWebsite(): Promise<void>; openSource(url: string): Promise<void>; openData(): Promise<unknown>; exportWorkspace(): Promise<boolean>;
  checkUpdate(): Promise<Update>; downloadUpdate(): Promise<Update>; installUpdate(): Promise<void>; onUpdate(callback: (update: Update) => void): () => void;
}
declare global { const __APP_VERSION__: string; interface Window { bancy?: Bridge } }
