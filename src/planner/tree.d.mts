import type { Catalog } from '../catalog/types';
import type { ShoppingList } from '../types';
import type { ShoppingRow } from './engine.mjs';
export type TreeNode = { row: ShoppingRow; x: number; y: number };
export function buildCraftingTree(list: ShoppingList, catalog: Catalog, target: ShoppingRow, quantity: number): { nodes: TreeNode[]; edges: { from: TreeNode; to: TreeNode }[]; width: number; height: number; warnings: string[] };
