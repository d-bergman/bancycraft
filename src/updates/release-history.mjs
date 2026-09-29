export function parseChangelog(markdown) {
  return [...markdown.matchAll(/^## (\d+\.\d+\.\d+)\s+[—-]\s+(\d{4}-\d{2}-\d{2})\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].map(([,version,date,body]) => {
    const blocks=[];
    for(const line of body.split('\n')) {
      const text=line.trim(); if(!text)continue;
      const kind=text.startsWith('### ')?'heading':text.startsWith('- ')?'list':'paragraph', value=kind==='heading'?text.slice(4):kind==='list'?text.slice(2):text;
      if(kind==='list' && blocks.at(-1)?.kind==='list')blocks.at(-1).lines.push(value);
      else blocks.push({kind,lines:[value]});
    }
    return {version,date,blocks};
  });
}
