export function parseChangelog(markdown: string): {version: string; date: string; blocks: {kind: string; lines: string[]}[]}[];
