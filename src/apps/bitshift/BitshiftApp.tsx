import { useEffect, useMemo, useRef, useState } from 'react';
import { Cpu, Disc, ShoppingBag, Terminal, TrendingUp, User } from 'lucide-react';
import {
  CONFIG,
  ENEMY_NAMES,
  HARDWARE_DB,
  RANKS,
  SKILLS_DB,
  SOFTWARE_DB,
} from './gameData';
import './bitshift.css';

type ViewMode = 'MENU' | 'MARKET' | 'LOADOUT' | 'GAME' | 'RESULT';
type LogType = 'info' | 'system' | 'success' | 'warning' | 'error';

interface UserSave {
  bits: number;
  xp: number;
  hardware: { cpu: number; ram: number; cooler: number };
  skills: { offense: number; defense: number };
  inventory: string[];
  loadout: string[];
  stats: { games: number; maxLevel: number };
}

interface PlayerState {
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
  shield: number;
  cooldowns: Record<string, number>;
}

interface EnemyState {
  name: string;
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
  shield: number;
}

interface CombatLog {
  time: string;
  text: string;
  type: LogType;
}

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

const DEFAULT_USER: UserSave = {
  bits: CONFIG.initialBits,
  xp: 0,
  hardware: { cpu: 0, ram: 0, cooler: 0 },
  skills: { offense: 0, defense: 0 },
  inventory: ['PING', 'INJECT', 'FIREWALL', 'OVERCLOCK'],
  loadout: ['PING', 'INJECT', 'FIREWALL', 'OVERCLOCK'],
  stats: { games: 0, maxLevel: 0 },
};

export default function BitshiftApp() {
  const [user, setUser] = useState<UserSave>(() => {
    try {
      const saved = window.localStorage.getItem(CONFIG.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<UserSave>;
        return {
          ...DEFAULT_USER,
          ...parsed,
          skills: parsed.skills ?? DEFAULT_USER.skills,
          hardware: parsed.hardware ?? DEFAULT_USER.hardware,
          stats: parsed.stats ?? DEFAULT_USER.stats,
        };
      }
    } catch {
      // Fallback to default save
    }
    return DEFAULT_USER;
  });

  const [view, setView] = useState<ViewMode>('MENU');
  const [level, setLevel] = useState(1);
  const [sessionBits, setSessionBits] = useState(0);
  const [minedBits, setMinedBits] = useState(0);
  const [sessionUpgrades, setSessionUpgrades] = useState({ offense: 0, defense: 0 });

  const [player, setPlayer] = useState<PlayerState>({
    hp: CONFIG.initialHp,
    maxHp: CONFIG.initialHp,
    ap: CONFIG.initialAp,
    maxAp: CONFIG.maxApCap,
    shield: 0,
    cooldowns: {},
  });
  const [enemy, setEnemy] = useState<EnemyState>({
    hp: 20,
    maxHp: 20,
    ap: 3,
    maxAp: 5,
    shield: 0,
    name: 'NODE',
  });
  const [logs, setLogs] = useState<CombatLog[]>([]);
  const [turn, setTurn] = useState(1);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [glitch, setGlitch] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    if (view === 'GAME' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, view]);

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  };

  const saveUser = (newData: UserSave) => {
    setUser(newData);
    window.localStorage.setItem(CONFIG.storageKey, JSON.stringify(newData));
  };

  const playerRank = useMemo(
    () => [...RANKS].reverse().find((r) => user.xp >= r.xp) || RANKS[0],
    [user.xp],
  );

  const hardwareStats = useMemo(() => {
    const offLvl = user.skills.offense + sessionUpgrades.offense;
    const defLvl = user.skills.defense + sessionUpgrades.defense;
    return {
      maxHp: 20 + user.hardware.ram * 5,
      dmgBonus: user.hardware.cpu + sessionUpgrades.offense,
      startAp: 3 + Math.floor(user.hardware.cooler / 2),
      miningRate: CONFIG.miningBaseRate + user.hardware.cpu * 0.2,
      critChance: 0.05 + offLvl * 0.05,
      critMult: 1.5 + offLvl * 0.1,
      unstableChance: Math.max(0, 0.2 - offLvl * 0.04),
      shieldMult: 1 + defLvl * 0.1,
      mitigationChance: defLvl * 0.05,
    };
  }, [user.hardware, user.skills, sessionUpgrades]);

  const addLog = (text: string, type: LogType = 'info') => {
    const time = new Date().toLocaleTimeString('pt-PT', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogs((prev) => [...prev.slice(-5), { time, text, type }]);
  };

  const triggerGlitch = () => {
    setGlitch(true);
    schedule(() => setGlitch(false), 200);
  };

  const startLevel = (lvl: number, carryHp?: number) => {
    const enemyMaxHp = Math.floor(20 * (1 + lvl * 0.3));
    const startHp = carryHp && carryHp > 0 && lvl > 1 ? carryHp : hardwareStats.maxHp;

    setPlayer({
      hp: startHp,
      maxHp: hardwareStats.maxHp,
      ap: hardwareStats.startAp,
      maxAp: 5,
      shield: 0,
      cooldowns: {},
    });

    const name = `${ENEMY_NAMES[Math.min(lvl - 1, ENEMY_NAMES.length - 1)]}_V${lvl}`;
    setEnemy({
      name,
      hp: enemyMaxHp,
      maxHp: enemyMaxHp,
      ap: 2 + Math.floor(lvl / 3),
      maxAp: 5 + Math.floor(lvl / 2),
      shield: 0,
    });

    setTurn(1);
    setIsPlayerTurn(true);
    addLog(`Conectado ao nó ${name}.`, 'system');
  };

  const startGame = () => {
    setView('GAME');
    setLevel(1);
    setSessionBits(0);
    setMinedBits(0);
    setSessionUpgrades({ offense: 0, defense: 0 });
    setLogs([]);
    startLevel(1);
  };

  const getUpgradeCost = (currentLvl: number) => 10 * (currentLvl + 1);

  const buySessionUpgrade = (type: 'offense' | 'defense') => {
    const cost = getUpgradeCost(sessionUpgrades[type]);
    const totalBits = user.bits + sessionBits;

    if (totalBits < cost) {
      addLog('BITS Insuficientes!', 'error');
      return;
    }

    if (sessionBits >= cost) {
      setSessionBits((prev) => prev - cost);
    } else {
      const remaining = cost - sessionBits;
      setSessionBits(0);
      saveUser({ ...user, bits: user.bits - remaining });
    }

    setSessionUpgrades((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    addLog(`PATCH: ${type.toUpperCase()} UPGRADE`, 'success');
  };

  const handleDefeat = (finalSessionBits = sessionBits) => {
    const totalXp = level * 100 + Math.floor(finalSessionBits);
    const finalBits = Math.floor(finalSessionBits);

    saveUser({
      ...user,
      bits: user.bits + finalBits,
      xp: user.xp + totalXp,
      stats: {
        games: user.stats.games + 1,
        maxLevel: Math.max(user.stats.maxLevel, level),
      },
    });
    setView('RESULT');
  };

  const handleWin = (carryHp: number) => {
    const earned = level * 10 + randomInt(5, 15);
    setSessionBits((prev) => prev + earned);
    addLog(`Alvo Eliminado. +${earned} BITS.`, 'system');
    schedule(() => {
      const next = level + 1;
      setLevel(next);
      startLevel(next, carryHp);
    }, 1500);
  };

  const processEnemyTurn = (pState: PlayerState, eState: EnemyState) => {
    const p: PlayerState = { ...pState, cooldowns: { ...pState.cooldowns } };
    const e: EnemyState = { ...eState };

    e.ap = Math.min(e.maxAp, e.ap + 2);
    Object.keys(p.cooldowns).forEach((key) => {
      if (p.cooldowns[key] > 0) p.cooldowns[key]--;
    });

    const dmgBase = randomInt(3 + level, 6 + level);
    let action = '';

    if (e.hp < e.maxHp * 0.3 && e.ap >= 2) {
      e.shield += 5 + level;
      e.ap -= 2;
      action = 'Ativou Protocolo de Defesa.';
    } else {
      let incomingDmg = dmgBase;
      let mitigated = false;
      if (Math.random() < hardwareStats.mitigationChance) {
        incomingDmg = Math.floor(incomingDmg / 2);
        mitigated = true;
      }
      const realDmg = Math.max(0, incomingDmg - p.shield);
      p.shield = Math.max(0, p.shield - incomingDmg);
      p.hp -= realDmg;
      action = `Ataque: ${realDmg} dmg ${mitigated ? '(MITIGADO)' : ''}.`;
      triggerGlitch();
    }

    p.ap = Math.min(p.maxAp, p.ap + 2);
    const miningGain = hardwareStats.miningRate;
    const nextSessionBits = sessionBits + miningGain;
    setSessionBits(nextSessionBits);
    setMinedBits((prev) => prev + miningGain);

    setPlayer(p);
    setEnemy(e);
    addLog(action, action.includes('MITIGADO') ? 'success' : 'warning');
    addLog(`Mining: +${miningGain.toFixed(1)} BITS`, 'system');

    setTurn((t) => t + 1);
    setIsPlayerTurn(true);

    if (p.hp <= 0) handleDefeat(nextSessionBits);
  };

  const useSoftware = (swId: string) => {
    if (!isPlayerTurn) return;
    const sw = SOFTWARE_DB[swId];
    if (!sw) return;

    if ((player.cooldowns[swId] ?? 0) > 0) {
      addLog(`Cooldown ativo (${player.cooldowns[swId]}t)`, 'error');
      return;
    }
    if (player.ap < sw.cost) {
      addLog('BW Insuficiente!', 'error');
      return;
    }

    const newP: PlayerState = {
      ...player,
      ap: player.ap - sw.cost,
      cooldowns: { ...player.cooldowns },
    };
    const newE: EnemyState = { ...enemy };
    let logMsg = '';
    let isCrit = false;
    let isUnstable = false;

    if (sw.cooldown) {
      newP.cooldowns[swId] = sw.cooldown;
    }

    const rollDamage = (min: number, max: number) => {
      let base = randomInt(min, max) + hardwareStats.dmgBonus;
      const roll = Math.random();
      if (roll < hardwareStats.critChance) {
        base = Math.floor(base * hardwareStats.critMult);
        isCrit = true;
      } else if (roll > 1 - hardwareStats.unstableChance) {
        base = Math.floor(base * 0.5);
        isUnstable = true;
      }
      return base;
    };

    if (sw.type === 'dmg' || sw.type === 'drain' || sw.type === 'pierce' || sw.type === 'risk') {
      const range = Array.isArray(sw.val) ? sw.val : [1, 2];
      if (sw.type === 'risk') {
        if (Math.random() > 0.3) {
          const dmg = rollDamage(range[0], range[1]);
          const realDmg = Math.max(0, dmg - newE.shield);
          newE.shield = Math.max(0, newE.shield - dmg);
          newE.hp -= realDmg;
          logMsg = `${isCrit ? 'CRIT!' : ''} ${realDmg} dano.`;
          triggerGlitch();
        } else {
          newP.hp -= 3;
          logMsg = 'FALHA! Backlash sofrido.';
          triggerGlitch();
        }
      } else {
        const dmg = rollDamage(range[0], range[1]);
        let realDmg = dmg;
        if (sw.type !== 'pierce') {
          realDmg = Math.max(0, dmg - newE.shield);
          newE.shield = Math.max(0, newE.shield - dmg);
        } else {
          logMsg = '(Piercing) ';
        }
        newE.hp -= realDmg;
        logMsg += `${isCrit ? 'CRIT!' : isUnstable ? 'INSTÁVEL...' : ''} ${realDmg} dmg.`;
        if (sw.type === 'drain') {
          const heal = Math.floor(realDmg / 2);
          newP.hp = Math.min(newP.maxHp, newP.hp + heal);
          logMsg += ` Curou ${heal}.`;
        }
        triggerGlitch();
      }
    } else if (sw.type === 'shield') {
      const baseShield = typeof sw.val === 'number' ? sw.val : 5;
      const shieldVal = Math.floor(baseShield * hardwareStats.shieldMult);
      newP.shield += shieldVal;
      logMsg = `Escudo +${shieldVal}.`;
    } else if (sw.id === 'OVERCLOCK') {
      newP.hp -= 3;
      newP.ap = Math.min(newP.maxAp + 2, newP.ap + 3);
      logMsg = 'Overclock: -3 HP, +3 BW.';
    }

    setPlayer(newP);
    setEnemy(newE);

    const logType: LogType = isCrit ? 'success' : isUnstable ? 'warning' : 'success';
    addLog(`> ${sw.name}: ${logMsg}`, logMsg.includes('FALHA') ? 'error' : logType);

    if (newE.hp <= 0) {
      handleWin(newP.hp);
    } else if (newP.hp <= 0) {
      handleDefeat();
    } else {
      setIsPlayerTurn(false);
      schedule(() => processEnemyTurn(newP, newE), 1000);
    }
  };

  const buyItem = (type: 'hardware' | 'software' | 'skill', id: string, cost: number) => {
    if (user.bits < cost) return;
    const newData: UserSave = {
      ...user,
      bits: user.bits - cost,
      hardware: { ...user.hardware },
      skills: { ...user.skills },
      inventory: [...user.inventory],
    };
    if (type === 'hardware' && (id === 'cpu' || id === 'ram' || id === 'cooler')) {
      newData.hardware[id]++;
    } else if (type === 'software') {
      newData.inventory.push(id);
    } else if (type === 'skill' && (id === 'offense' || id === 'defense')) {
      newData.skills[id]++;
    }
    saveUser(newData);
  };

  const toggleEquip = (id: string) => {
    let newLoadout = [...user.loadout];
    if (newLoadout.includes(id)) {
      if (newLoadout.length > 1) newLoadout = newLoadout.filter((i) => i !== id);
    } else if (newLoadout.length < 4) {
      newLoadout.push(id);
    }
    saveUser({ ...user, loadout: newLoadout });
  };

  return (
    <div
      className={`bitshift-root min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-2 md:p-4 select-none ${
        glitch ? 'bitshift-glitch' : ''
      }`}
    >
      <div className="bitshift-crt absolute inset-0 pointer-events-none" />
      <div className="bitshift-scanline" />

      {view !== 'RESULT' && (
        <div className="w-full max-w-4xl flex justify-between items-end border-b border-green-900/50 pb-2 mb-4 z-10">
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tighter bitshift-glow">
              BIT-SHIFT <span className="text-xs align-top opacity-50">v2.4</span>
            </h1>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>XP: {user.xp}</span>
              <span className="text-green-600 font-bold">[{playerRank.title}]</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-yellow-500 font-mono font-bold text-lg inline-flex items-center gap-1.5">
              <span>{Math.floor(view === 'GAME' ? sessionBits + user.bits : user.bits)}</span>
              <Disc className="w-5 h-5" />
            </div>
            <div className="text-xs text-gray-500">{view === 'GAME' ? 'TOTAL AVAILABLE' : 'WALLET'}</div>
          </div>
        </div>
      )}

      {view === 'MENU' && (
        <div className="w-full max-w-md space-y-4 z-10">
          <div className="border border-green-800 bg-black/80 p-6 text-center shadow-lg">
            <div className="text-xs text-green-600 mb-2 font-mono">STATUS DO SISTEMA</div>
            <div className="grid grid-cols-3 gap-2 text-sm mb-4">
              <div className="bg-green-900/20 p-2 border border-green-900">CPU v{user.hardware.cpu}</div>
              <div className="bg-green-900/20 p-2 border border-green-900">RAM v{user.hardware.ram}</div>
              <div className="bg-green-900/20 p-2 border border-green-900">
                COOL v{user.hardware.cooler}
              </div>
            </div>
            <div className="flex justify-between text-xs px-2 border-t border-green-900/50 pt-2">
              <span className="text-red-400">ATK: Lv.{user.skills.offense}</span>
              <span className="text-blue-400">DEF: Lv.{user.skills.defense}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={startGame}
            className="w-full py-4 bg-green-600 text-black font-bold text-xl hover:bg-green-500 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Terminal className="w-5 h-5" /> INICIAR RUN
          </button>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setView('MARKET')}
              className="py-4 border border-yellow-700 text-yellow-500 font-bold flex items-center justify-center gap-2 hover:bg-yellow-900/10 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" /> MARKET
            </button>
            <button
              type="button"
              onClick={() => setView('LOADOUT')}
              className="py-4 border border-blue-700 text-blue-500 font-bold flex items-center justify-center gap-2 hover:bg-blue-900/10 cursor-pointer"
            >
              <Cpu className="w-5 h-5" /> DECK
            </button>
          </div>
        </div>
      )}

      {view === 'MARKET' && (
        <div className="flex-1 w-full max-w-4xl p-4 overflow-y-auto z-10">
          <div className="flex justify-between items-center mb-6 border-b border-yellow-600 pb-2">
            <h2 className="text-2xl font-bold bitshift-glow-gold">DARK WEB MARKET</h2>
            <div className="text-yellow-400 font-bold">{user.bits.toFixed(0)} BITS</div>
          </div>

          <h3 className="text-purple-400 mb-2 border-l-4 border-purple-600 pl-2">NEURAL TRAINING (RPG)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {(['offense', 'defense'] as const).map((skillType) => {
              const skill = SKILLS_DB[skillType];
              const currentLvl = user.skills[skillType];
              const cost = skill.baseCost * (currentLvl + 1);
              return (
                <div
                  key={skillType}
                  className="border border-purple-800 bg-black/50 p-4 flex flex-col justify-between hover:bg-purple-900/10 transition"
                >
                  <div>
                    <div className={`font-bold text-lg ${skill.color}`}>
                      {skill.name} <span className="text-xs text-gray-500">Lv.{currentLvl}</span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{skill.desc}</div>
                    <div className="text-[10px] text-gray-500">{skill.stats(currentLvl)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => buyItem('skill', skillType, cost)}
                    disabled={user.bits < cost}
                    className={`w-full py-1 mt-2 text-sm font-bold border cursor-pointer ${
                      user.bits >= cost
                        ? 'border-gray-500 text-gray-300 hover:text-white hover:bg-gray-800'
                        : 'border-gray-900 text-gray-700 cursor-not-allowed'
                    }`}
                  >
                    UPGRADE ({cost})
                  </button>
                </div>
              );
            })}
          </div>

          <h3 className="text-green-400 mb-2 border-l-4 border-green-600 pl-2">HARDWARE UPGRADES</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {HARDWARE_DB.map((item) => {
              const currentLvl = user.hardware[item.id];
              const cost = item.linear
                ? item.baseCost * (currentLvl + 1)
                : item.baseCost * Math.pow(item.costMult, currentLvl);

              return (
                <div
                  key={item.id}
                  className="border border-green-800 bg-black/50 p-4 flex flex-col justify-between hover:bg-green-900/10"
                >
                  <div>
                    <div className="font-bold text-lg">
                      {item.name} <span className="text-xs text-green-600">v{currentLvl}</span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{item.desc}</div>
                    <div className="text-[10px] text-green-700">{item.effect(currentLvl)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => buyItem('hardware', item.id, cost)}
                    disabled={user.bits < cost}
                    className={`w-full py-1 mt-2 text-sm font-bold border cursor-pointer ${
                      user.bits >= cost
                        ? 'border-yellow-600 text-yellow-500 hover:bg-yellow-900/20'
                        : 'border-gray-800 text-gray-700 cursor-not-allowed'
                    }`}
                  >
                    {user.bits >= cost ? `COMPRAR (${cost})` : `FALTA ${cost - Math.floor(user.bits)}`}
                  </button>
                </div>
              );
            })}
          </div>

          <h3 className="text-blue-400 mb-2 border-l-4 border-blue-600 pl-2">BLACK MARKET SOFTWARE</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(SOFTWARE_DB)
              .filter((sw) => sw.price)
              .map((sw) => {
                const owned = user.inventory.includes(sw.id);
                const price = sw.price ?? 0;
                return (
                  <div
                    key={sw.id}
                    className={`border p-4 flex justify-between items-center ${
                      owned ? 'border-gray-800 opacity-50' : 'border-blue-800 bg-blue-900/10'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{sw.name}</div>
                      <div className="text-xs text-gray-400">{sw.desc}</div>
                    </div>
                    {owned ? (
                      <span className="text-xs text-gray-500 font-bold border border-gray-800 px-2 py-1">
                        ADQUIRIDO
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => buyItem('software', sw.id, price)}
                        disabled={user.bits < price}
                        className={`px-3 py-1 text-xs font-bold border cursor-pointer ${
                          user.bits >= price
                            ? 'border-yellow-600 text-yellow-500 hover:bg-yellow-900/20'
                            : 'border-gray-800 text-gray-700 cursor-not-allowed'
                        }`}
                      >
                        {price} BITS
                      </button>
                    )}
                  </div>
                );
              })}
          </div>

          <button
            type="button"
            onClick={() => setView('MENU')}
            className="mt-8 w-full py-3 border border-red-800 text-red-500 hover:bg-red-900/20 cursor-pointer"
          >
            VOLTAR AO MENU
          </button>
        </div>
      )}

      {view === 'LOADOUT' && (
        <div className="flex-1 w-full max-w-4xl p-4 z-10">
          <h2 className="text-2xl font-bold bitshift-glow mb-6 border-b border-green-800 pb-2">
            DECK ({user.loadout.length}/4)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {user.inventory.map((id) => {
              const sw = SOFTWARE_DB[id];
              if (!sw) return null;
              const equipped = user.loadout.includes(id);
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => toggleEquip(id)}
                  className={`p-4 border text-left transition relative cursor-pointer ${
                    equipped ? 'border-green-400 bg-green-900/20' : 'border-gray-800 text-gray-500'
                  }`}
                >
                  <div className="font-bold text-sm">{sw.name}</div>
                  <div className="text-xs mt-1">{sw.desc}</div>
                  <div className="text-xs font-mono mt-2">{sw.cost} BW</div>
                  {sw.cooldown && <div className="text-xs text-red-400">CD: {sw.cooldown}</div>}
                  {equipped && (
                    <div className="absolute top-0 right-0 p-1 bg-green-500 text-black text-[10px] font-bold">
                      ON
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setView('MENU')}
            className="mt-8 w-full py-3 border border-green-800 text-green-500 hover:bg-green-900/20 cursor-pointer"
          >
            CONFIRMAR
          </button>
        </div>
      )}

      {view === 'GAME' && (
        <div className="w-full max-w-4xl grid md:grid-cols-12 gap-4 z-10">
          <div className="md:col-span-4 space-y-4">
            <div className="border border-red-900/50 bg-black/80 p-4 relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-red-500 font-bold flex items-center gap-2">
                  <User className="w-5 h-5" /> {enemy.name}
                </span>
                <span className="text-xs bg-red-900/20 px-2 py-1 rounded border border-red-900">
                  {enemy.shield} SHIELD
                </span>
              </div>
              <div className="h-2 bg-red-900/20 w-full mb-1">
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}
                />
              </div>
              <div className="text-right text-xs text-red-400">
                {enemy.hp}/{enemy.maxHp}
              </div>
            </div>

            <div className="border border-green-500 bg-black/80 p-4 shadow-[0_0_10px_rgba(0,255,0,0.1)]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-green-500 font-bold flex items-center gap-2">
                  <Terminal className="w-5 h-5" /> YOU
                </span>
                <span className="text-xs bg-green-900/20 px-2 py-1 rounded border border-green-900">
                  {player.shield} SHIELD
                </span>
              </div>
              <div className="text-xs mb-1">INTEGRITY</div>
              <div className="h-4 bg-green-900/20 w-full mb-1 relative border border-green-900">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}
                />
              </div>
              <div className="text-right text-xs mb-4">
                {player.hp}/{player.maxHp}
              </div>
              <div className="text-xs mb-1">BANDWIDTH (AP)</div>
              <div className="flex gap-1 h-3">
                {Array.from({ length: player.maxAp }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 border border-green-800 ${
                      i < player.ap ? 'bg-yellow-500' : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="border border-yellow-600/50 bg-black/60 p-3">
              <div className="text-xs text-yellow-500 mb-2 flex items-center gap-1 font-bold">
                <TrendingUp className="w-3 h-3" /> LIVE PATCHING (SESSION)
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => buySessionUpgrade('offense')}
                  disabled={
                    !isPlayerTurn || user.bits + sessionBits < getUpgradeCost(sessionUpgrades.offense)
                  }
                  className="flex-1 border border-red-900/50 text-red-400 text-[10px] p-2 hover:bg-red-900/20 disabled:opacity-30 cursor-pointer"
                >
                  <div className="font-bold">ATK Lv.{sessionUpgrades.offense}</div>
                  <div>COST: {getUpgradeCost(sessionUpgrades.offense)}</div>
                </button>
                <button
                  type="button"
                  onClick={() => buySessionUpgrade('defense')}
                  disabled={
                    !isPlayerTurn || user.bits + sessionBits < getUpgradeCost(sessionUpgrades.defense)
                  }
                  className="flex-1 border border-blue-900/50 text-blue-400 text-[10px] p-2 hover:bg-blue-900/20 disabled:opacity-30 cursor-pointer"
                >
                  <div className="font-bold">DEF Lv.{sessionUpgrades.defense}</div>
                  <div>COST: {getUpgradeCost(sessionUpgrades.defense)}</div>
                </button>
              </div>
            </div>

            <div className="text-center text-xs font-mono py-2 bg-green-900/10 border border-green-900/30">
              LEVEL {level} // TURN {turn}
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col gap-4">
            <div className="flex-1 bg-black/90 border border-green-900 p-4 font-mono text-xs overflow-hidden flex flex-col justify-end min-h-[180px]">
              {logs.map((l, i) => (
                <div
                  key={i}
                  className={`mb-1 ${
                    l.type === 'error'
                      ? 'text-red-500'
                      : l.type === 'success'
                        ? 'text-green-400'
                        : l.type === 'warning'
                          ? 'text-yellow-500'
                          : 'text-gray-400'
                  }`}
                >
                  <span className="opacity-30">[{l.time}]</span> {l.text}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {user.loadout.map((id) => {
                const sw = SOFTWARE_DB[id];
                if (!sw) return null;
                const canAfford = player.ap >= sw.cost;
                const onCooldown = (player.cooldowns[id] ?? 0) > 0;
                return (
                  <button
                    type="button"
                    key={id}
                    disabled={!isPlayerTurn || !canAfford || onCooldown}
                    onClick={() => useSoftware(id)}
                    className={`p-2 border text-left h-20 relative overflow-hidden group transition-all cursor-pointer ${
                      !isPlayerTurn || onCooldown
                        ? 'opacity-30 border-gray-800 cursor-not-allowed'
                        : !canAfford
                          ? 'opacity-50 border-red-900 text-red-800 cursor-not-allowed'
                          : 'border-green-600 hover:bg-green-900/20 active:translate-y-1'
                    }`}
                  >
                    <div className="font-bold text-sm">{sw.name}</div>
                    <div className="text-[10px] absolute top-2 right-2 border border-current px-1">
                      {sw.cost} BW
                    </div>
                    <div className="text-[10px] mt-1 opacity-70 leading-tight">{sw.desc}</div>
                    {onCooldown && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-red-500 font-bold text-lg border border-red-500">
                        {player.cooldowns[id]}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {view === 'RESULT' && (
        <div className="z-20 flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-4xl font-bold text-red-500 mb-2">CONEXÃO PERDIDA</h2>
          <p className="text-gray-500 mb-8 font-mono">EXTRAÇÃO DE DADOS COMPLETA</p>

          <div className="bg-green-900/10 border border-green-800 p-8 w-full max-w-md mb-8 space-y-2">
            <div className="flex justify-between text-lg text-gray-400">
              <span>NÍVEIS</span>
              <span>{level - 1}</span>
            </div>
            <div className="flex justify-between text-lg text-gray-400">
              <span>TURNOS SOBREVIVIDOS</span>
              <span>{turn}</span>
            </div>
            <div className="flex justify-between text-sm text-yellow-700">
              <span>MINING YIELD</span>
              <span>+{minedBits.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-xl text-yellow-500 border-t border-green-900 pt-4 mt-2">
              <span>TOTAL BITS ACUMULADOS</span>
              <span className="font-bold">{sessionBits.toFixed(0)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setView('MENU')}
            className="px-8 py-4 bg-green-600 text-black font-bold hover:bg-green-500 cursor-pointer"
          >
            VOLTAR À BASE
          </button>
        </div>
      )}
    </div>
  );
}
