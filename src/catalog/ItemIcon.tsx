import { useState,useEffect } from 'react';
import { Box } from 'lucide-react';
import icons from './data/icons.json';
import artwork from './data/art.json';
import type { Game } from '../types';
export function ItemIcon({ game, id, art=false }: { game: Game; id?: string; art?:boolean }) {
  const [failed, setFailed] = useState(false),[fallbackFailed,setFallbackFailed]=useState(false);
  useEffect(()=>{setFailed(false);setFallbackFailed(false);},[game,id,art]);
  const full=id&&art?(artwork as Record<Game,Record<string,string>>)[game][id]:undefined;
  const url = full&&!failed?full:id ? (icons as Record<Game, Record<string, string>>)[game][id] : undefined;
  return <span className={"item-picture "+(art?(full&&!failed?"item-art item-art-full":"item-art item-art-fallback"):"")}>{url && !fallbackFailed ? <img src={url} alt="" loading="lazy" onError={() => full&&!failed?setFailed(true):setFallbackFailed(true)}/> : <Box size={19}/>}</span>;
}
