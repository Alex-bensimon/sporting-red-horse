import type { Match, Player, Slot } from './types'

export const players: Player[] = [
  { id:'pGK', name:'Alex Keeper', position:'GK', rating:84, pace:45, shooting:32, passing:70, dribbling:54, defense:50, physical:76 },
  { id:'pD1', name:'Leo Rock', position:'DEF', rating:82, pace:72, shooting:40, passing:66, dribbling:64, defense:84, physical:82, side:'L' },
  { id:'pD2', name:'Max Steel', position:'DEF', rating:81, pace:70, shooting:42, passing:68, dribbling:62, defense:82, physical:83, side:'C' },
  { id:'pD3', name:'Ilan Wall', position:'DEF', rating:79, pace:74, shooting:38, passing:64, dribbling:60, defense:80, physical:80, side:'R' },
  { id:'pM1', name:'Nico Brain', position:'MID', rating:85, pace:78, shooting:74, passing:86, dribbling:84, defense:70, physical:76 },
  { id:'pM2', name:'Sam Link', position:'MID', rating:83, pace:79, shooting:72, passing:84, dribbling:82, defense:68, physical:78 },
  { id:'pM3', name:'Yanis Box', position:'MID', rating:80, pace:76, shooting:70, passing:80, dribbling:79, defense:72, physical:77 },
  { id:'pF1', name:'Red Horse', position:'FWD', rating:86, pace:88, shooting:86, passing:72, dribbling:86, defense:42, physical:82 },
  { id:'pF2', name:'Tomi Dash', position:'FWD', rating:81, pace:86, shooting:80, passing:70, dribbling:82, defense:45, physical:76 },
]

export const matches: Match[] = [
  { id:'m1', date:'2025-09-07', time:'19:30', opponent:'FC Lynx', home:true, location:'Parc des Sports 1', competition:'Ligue 7v7' },
  { id:'m2', date:'2025-09-14', time:'20:15', opponent:'US Raptors', home:false, location:'Stade Municipal 3', competition:'Ligue 7v7' },
  { id:'m3', date:'2025-09-21', time:'18:00', opponent:'AS Orion', home:true, location:'Parc des Sports 1', competition:'Coupe' },
]

export const formations: Record<string, Slot[]> = {
  '3-2-1': [
    { key:'GK', x:50,y:88, position:'GK' },
    { key:'CB-L', x:25,y:66, position:'DEF' },
    { key:'CB-C', x:50,y:66, position:'DEF' },
    { key:'CB-R', x:75,y:66, position:'DEF' },
    { key:'CM-L', x:35,y:44, position:'MID' },
    { key:'CM-R', x:65,y:44, position:'MID' },
    { key:'ST',   x:50,y:24, position:'FWD' },
  ],
  '2-3-1': [
    { key:'GK', x:50,y:90, position:'GK' },
    { key:'CB-L', x:33,y:68, position:'DEF' },
    { key:'CB-R', x:67,y:68, position:'DEF' },
    { key:'CM-L', x:24,y:46, position:'MID' },
    { key:'CM-C', x:50,y:40, position:'MID' },
    { key:'CM-R', x:76,y:46, position:'MID' },
    { key:'ST',   x:50,y:14, position:'FWD' },
  ],
  '4-2': [
    { key:'GK', x:50,y:88, position:'GK' },
    { key:'LB', x:20,y:56, position:'DEF' },
    { key:'CB-L', x:38,y:70, position:'DEF' },
    { key:'CB-R', x:62,y:70, position:'DEF' },
    { key:'RB', x:80,y:56, position:'DEF' },
    { key:'ST-L', x:38,y:24, position:'FWD' },
    { key:'ST-R', x:62,y:24, position:'FWD' },
  ],
  '3-3': [
    { key:'GK', x:50,y:88, position:'GK' },
    { key:'CB-L', x:22,y:68, position:'DEF' },
    { key:'CB-C', x:50,y:68, position:'DEF' },
    { key:'CB-R', x:78,y:68, position:'DEF' },
    { key:'CM-L', x:22,y:44, position:'MID' },
    { key:'CM-C', x:50,y:38, position:'MID' },
    { key:'CM-R', x:78,y:44, position:'MID' },
  ],
  '1-4-1': [
    { key:'GK', x:50,y:88, position:'GK' },
    { key:'LB', x:28,y:76, position:'DEF' },
    { key:'CB-L', x:40,y:70, position:'DEF' },
    { key:'CB-R', x:60,y:70, position:'DEF' },
    { key:'RB', x:72,y:76, position:'DEF' },
    { key:'DM', x:50,y:46, position:'MID' },
    { key:'ST', x:50,y:14, position:'FWD' },
  ],
}

export const presets: Record<string, string[]> = {
  // simple presets: prioritized player ids by slot order for 3-2-1
  TOP_TEAM: ['pGK','pD1','pD2','pD3','pM1','pM2','pF1'],
  ROTATION: ['pGK','pD1','pD2','pD3','pM2','pM3','pF2'],
}

