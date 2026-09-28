import { useState } from 'react';
import { Box } from 'lucide-react';
import icons from './data/icons.json';
import type { Game } from '../types';
export function ItemIcon({ game, id }: { game: Game; id?: string }) {
  const [failed, setFailed] = useState(false);
  const url = id ? (icons as Record<Game, Record<string, string>>)[game][id] : undefined;
  return <span className="item-picture">{url && !failed ? <img src={url} alt="" loading="lazy" onError={() => setFailed(true)}/> : <Box size={19}/>}</span>;
}
