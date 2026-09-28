function sourceUrl(value) {
  if (typeof value !== 'string' || value.length > 2000) throw new Error('Invalid source URL.');
  const url = new URL(value);
  const paths = {
    'dragonwilds.runescape.wiki': ['/', '/w/'],
    'wiki.v-ris.ing': ['/', '/w/'],
    'grounded.wiki.gg': ['/', '/wiki/'],
    'enshrouded.wiki.gg': ['/', '/wiki/'],
    'valheim-modding.github.io': ['/Jotunn/data/objects/'],
    'creativecommons.org': ['/licenses/'],
    'github.com': ['/Valheim-Modding/Jotunn/blob/master/LICENSE']
  };
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !paths[url.hostname]?.some(p => p === '/' ? url.pathname === '/' : url.pathname.startsWith(p))) throw new Error('Source URL is not allowed.');
  return url.href;
}
module.exports = { sourceUrl };
