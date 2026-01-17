// Importando dados do escopo global (definido em game_data.js)
const { CONFIG, SOFTWARE_DB, HARDWARE_DB, SKILLS_DB, RANKS, ENEMY_NAMES } = window.GameData;

// --- UTILS ---
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// --- COMPONENTES VISUAIS (ICONS) ---
const Icons = {
    Terminal: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>,
    Shield: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
    Zap: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
    Cpu: () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>,
    Lock: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
    ShoppingBag: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>,
    Disc: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>,
    User: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    TrendingUp: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
};

// --- MAIN APP COMPONENT ---
function App() {
    const { useState, useEffect, useRef, useMemo } = React;

    // --- STATE: USER DATA (PERSISTENT) ---
    const [user, setUser] = useState({
        bits: CONFIG.initialBits,
        xp: 0,
        hardware: { cpu: 0, ram: 0, cooler: 0 },
        skills: { offense: 0, defense: 0 }, 
        inventory: ['PING', 'INJECT', 'FIREWALL', 'OVERCLOCK'],
        loadout: ['PING', 'INJECT', 'FIREWALL', 'OVERCLOCK'],
        stats: { games: 0, maxLevel: 0 }
    });

    // --- STATE: SESSION ---
    const [view, setView] = useState('MENU');
    const [level, setLevel] = useState(1);
    const [sessionBits, setSessionBits] = useState(0); 
    const [minedBits, setMinedBits] = useState(0);
    const [sessionUpgrades, setSessionUpgrades] = useState({ offense: 0, defense: 0 });
    
    // --- STATE: BATTLE ---
    const [player, setPlayer] = useState({ hp: CONFIG.initialHp, maxHp: CONFIG.initialHp, ap: CONFIG.initialAp, maxAp: CONFIG.maxApCap, shield: 0, cooldowns: {} });
    const [enemy, setEnemy] = useState({ hp: 20, maxHp: 20, ap: 3, maxAp: 5, shield: 0, name: 'NODE' });
    const [logs, setLogs] = useState([]);
    const [turn, setTurn] = useState(1);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [glitch, setGlitch] = useState(false);
    const logsEndRef = useRef(null);

    // --- INITIALIZATION ---
    useEffect(() => {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (saved) {
            try { 
                const parsed = JSON.parse(saved);
                if (!parsed.skills) parsed.skills = { offense: 0, defense: 0 };
                setUser(parsed); 
            } catch(e) { console.error("Save file corrupted, using defaults.", e); }
        }
    }, []);

    useEffect(() => {
        if(view === 'GAME' && logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const saveUser = (newData) => {
        setUser(newData);
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(newData));
    };

    // --- COMPUTED STATS ---
    const playerRank = useMemo(() => RANKS.slice().reverse().find(r => user.xp >= r.xp) || RANKS[0], [user.xp]);
    
    const hardwareStats = useMemo(() => {
        const offLvl = user.skills.offense + sessionUpgrades.offense;
        const defLvl = user.skills.defense + sessionUpgrades.defense;
        
        return {
            maxHp: 20 + (user.hardware.ram * 5),
            dmgBonus: user.hardware.cpu * 1 + (sessionUpgrades.offense * 1),
            startAp: 3 + Math.floor(user.hardware.cooler / 2),
            miningRate: CONFIG.miningBaseRate + (user.hardware.cpu * 0.2),
            
            critChance: 0.05 + (offLvl * 0.05), 
            critMult: 1.5 + (offLvl * 0.1), 
            unstableChance: Math.max(0, 0.2 - (offLvl * 0.04)),
            
            shieldMult: 1 + (defLvl * 0.1),
            mitigationChance: 0 + (defLvl * 0.05) 
        };
    }, [user.hardware, user.skills, sessionUpgrades]);

    const addLog = (text, type = 'info') => {
        const time = new Date().toLocaleTimeString('pt-PT', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
        setLogs(prev => [...prev.slice(-5), { time, text, type }]);
    };

    // --- LOGIC: GAME LOOP ---
    const startGame = () => {
        setView('GAME');
        setLevel(1);
        setSessionBits(0);
        setMinedBits(0);
        setSessionUpgrades({ offense: 0, defense: 0 });
        setLogs([]);
        startLevel(1);
    };

    const startLevel = (lvl) => {
        const enemyMaxHp = Math.floor(20 * (1 + (lvl * 0.3)));
        
        setPlayer({ 
            hp: player.hp > 0 && lvl > 1 ? player.hp : hardwareStats.maxHp, 
            maxHp: hardwareStats.maxHp, 
            ap: hardwareStats.startAp, 
            maxAp: 5, 
            shield: 0,
            cooldowns: {}
        });
        
        const name = ENEMY_NAMES[Math.min(lvl-1, ENEMY_NAMES.length-1)] + `_V${lvl}`;

        setEnemy({ 
            name, 
            hp: enemyMaxHp, 
            maxHp: enemyMaxHp,
            ap: 2 + Math.floor(lvl/3), 
            maxAp: 5 + Math.floor(lvl/2), 
            shield: 0 
        });

        setTurn(1);
        setIsPlayerTurn(true);
        addLog(`Conectado ao nó ${name}.`, 'system');
    };

    // --- LOGIC: LIVE UPGRADES ---
    const getUpgradeCost = (currentLvl) => {
        return 10 * (currentLvl + 1);
    };

    const buySessionUpgrade = (type) => {
        const cost = getUpgradeCost(sessionUpgrades[type]);
        const totalBits = user.bits + sessionBits;
        
        if (totalBits < cost) {
            addLog('BITS Insuficientes!', 'error');
            return;
        }

        if (sessionBits >= cost) {
            setSessionBits(prev => prev - cost);
        } else {
            const remaining = cost - sessionBits;
            setSessionBits(0);
            saveUser({ ...user, bits: user.bits - remaining }); 
        }

        setSessionUpgrades(prev => ({
            ...prev,
            [type]: prev[type] + 1
        }));
        
        addLog(`PATCH: ${type.toUpperCase()} UPGRADE`, 'success');
    };

    // --- LOGIC: COMBAT ---
    const triggerGlitch = () => { setGlitch(true); setTimeout(() => setGlitch(false), 200); };

    const useSoftware = (swId) => {
        if (!isPlayerTurn) return;
        const sw = SOFTWARE_DB[swId];
        
        if (player.cooldowns[swId] > 0) {
            addLog(`Cooldown ativo (${player.cooldowns[swId]}t)`, 'error');
            return;
        }

        if (player.ap < sw.cost) { addLog('BW Insuficiente!', 'error'); return; }

        let newP = { ...player, ap: player.ap - sw.cost };
        let newE = { ...enemy };
        let logMsg = '';
        let isCrit = false;
        let isUnstable = false;

        if (sw.cooldown) {
            newP.cooldowns = { ...newP.cooldowns, [swId]: sw.cooldown };
        }

        const rollDamage = (min, max) => {
            let base = randomInt(min, max) + hardwareStats.dmgBonus;
            const roll = Math.random();
            if (roll < hardwareStats.critChance) {
                base = Math.floor(base * hardwareStats.critMult);
                isCrit = true;
            } else if (roll > (1 - hardwareStats.unstableChance)) {
                base = Math.floor(base * 0.5);
                isUnstable = true;
            }
            return base;
        };

        if (sw.type === 'dmg' || sw.type === 'drain' || sw.type === 'pierce' || sw.type === 'risk') {
            let dmg = 0;
            if (sw.type === 'risk') {
                    if (Math.random() > 0.3) {
                        dmg = rollDamage(sw.val[0], sw.val[1]);
                        const realDmg = Math.max(0, dmg - newE.shield);
                        newE.shield = Math.max(0, newE.shield - dmg);
                        newE.hp -= realDmg;
                        logMsg = `${isCrit ? 'CRIT!' : ''} ${realDmg} dano.`;
                        triggerGlitch();
                } else {
                    newP.hp -= 3;
                    logMsg = `FALHA! Backlash sofrido.`;
                    triggerGlitch();
                }
            } else {
                dmg = rollDamage(sw.val[0], sw.val[1]);
                let realDmg = dmg;
                if (sw.type !== 'pierce') {
                    realDmg = Math.max(0, dmg - newE.shield);
                    newE.shield = Math.max(0, newE.shield - dmg);
                } else {
                    logMsg = `(Piercing) `;
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
        } 
        else if (sw.type === 'shield') {
            const shieldVal = Math.floor(sw.val * hardwareStats.shieldMult);
            newP.shield += shieldVal;
            logMsg = `Escudo +${shieldVal}.`;
        }
        else if (sw.id === 'OVERCLOCK') {
            newP.hp -= 3;
            newP.ap = Math.min(newP.maxAp + 2, newP.ap + 3);
            logMsg = `Overclock: -3 HP, +3 BW.`;
        }

        setPlayer(newP);
        setEnemy(newE);
        
        const logType = isCrit ? 'success' : isUnstable ? 'warning' : 'success';
        if (!logMsg.includes('FALHA')) addLog(`> ${sw.name}: ${logMsg}`, logType);
        else addLog(`> ${sw.name}: ${logMsg}`, 'error');

        if (newE.hp <= 0) {
            handleWin(lvl => lvl + 1);
        } else if (newP.hp <= 0) {
            handleDefeat();
        } else {
            setIsPlayerTurn(false);
            setTimeout(() => processEnemyTurn(newP, newE), 1000);
        }
    };

    const processEnemyTurn = (pState, eState) => {
        let p = { ...pState };
        let e = { ...eState };

        e.ap = Math.min(e.maxAp, e.ap + 2);
        
        // Cooldown tick
        Object.keys(p.cooldowns).forEach(key => {
            if (p.cooldowns[key] > 0) p.cooldowns[key]--;
        });

        const dmgBase = randomInt(3 + (level), 6 + (level));
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
        setSessionBits(prev => prev + miningGain);
        setMinedBits(prev => prev + miningGain);

        setPlayer(p);
        setEnemy(e);
        addLog(action, action.includes('MITIGADO') ? 'success' : 'warning');
        addLog(`Mining: +${miningGain.toFixed(1)} BITS`, 'system');

        setTurn(t => t + 1);
        setIsPlayerTurn(true);

        if (p.hp <= 0) handleDefeat();
    };

    const handleWin = (nextLvlFn) => {
        const earned = level * 10 + randomInt(5, 15);
        setSessionBits(prev => prev + earned);
        addLog(`Alvo Eliminado. +${earned} BITS.`, 'system');
        setTimeout(() => {
            const next = nextLvlFn(level);
            setLevel(next);
            startLevel(next);
        }, 1500);
    };

    const handleDefeat = () => {
        const totalXp = level * 100 + Math.floor(sessionBits);
        const finalBits = Math.floor(sessionBits); 

        const newUserData = {
            ...user,
            bits: user.bits + finalBits,
            xp: user.xp + totalXp,
            stats: {
                games: user.stats.games + 1,
                maxLevel: Math.max(user.stats.maxLevel, level)
            }
        };
        saveUser(newUserData);
        setView('RESULT');
    };

    const buyItem = (type, id, cost) => {
        if (user.bits < cost) return;
        let newData = { ...user, bits: user.bits - cost };
        if (type === 'hardware') newData.hardware[id]++;
        else if (type === 'software') newData.inventory.push(id);
        else if (type === 'skill') newData.skills[id]++;
        saveUser(newData);
    };

    const toggleEquip = (id) => {
        let newLoadout = [...user.loadout];
        if (newLoadout.includes(id)) {
            if (newLoadout.length > 1) newLoadout = newLoadout.filter(i => i !== id);
        } else {
            if (newLoadout.length < 4) newLoadout.push(id);
        }
        saveUser({ ...user, loadout: newLoadout });
    };

    // --- RENDER SUB-COMPONENTS ---
    
    // 1. Render Market (Completo)
    const renderMarket = () => (
        <div className="flex-1 w-full max-w-4xl p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-yellow-600 pb-2">
                <h2 className="text-2xl font-bold text-glow-gold">DARK WEB MARKET</h2>
                <div className="text-yellow-400 font-bold">{user.bits.toFixed(0)} BITS</div>
            </div>

            {/* SEÇÃO 1: SKILLS RPG */}
            <h3 className="text-purple-400 mb-2 border-l-4 border-purple-600 pl-2">NEURAL TRAINING (RPG)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {['offense', 'defense'].map(skillType => {
                    const skill = SKILLS_DB[skillType];
                    const currentLvl = user.skills[skillType];
                    const cost = skill.baseCost * (currentLvl + 1);
                    return (
                        <div key={skillType} className="border border-purple-800 bg-black/50 p-4 flex flex-col justify-between hover:bg-purple-900/10 transition">
                            <div>
                                <div className={`font-bold text-lg ${skill.color}`}>{skill.name} <span className="text-xs text-gray-500">Lv.{currentLvl}</span></div>
                                <div className="text-xs text-gray-400 mb-2">{skill.desc}</div>
                                <div className="text-[10px] text-gray-500">{skill.stats(currentLvl)}</div>
                            </div>
                            <button 
                                onClick={() => buyItem('skill', skillType, cost)}
                                disabled={user.bits < cost}
                                className={`w-full py-1 mt-2 text-sm font-bold border ${user.bits >= cost ? 'border-gray-500 text-gray-300 hover:text-white hover:bg-gray-800' : 'border-gray-900 text-gray-700'}`}
                            >
                                UPGRADE ({cost})
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* SEÇÃO 2: HARDWARE */}
            <h3 className="text-green-400 mb-2 border-l-4 border-green-600 pl-2">HARDWARE UPGRADES</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {HARDWARE_DB.map(item => {
                    const currentLvl = user.hardware[item.id];
                    // Cálculo de custo: Exponencial ou Linear
                    const cost = item.linear 
                        ? item.baseCost * (currentLvl + 1)
                        : item.baseCost * (Math.pow(item.costMult, currentLvl));
                    
                    return (
                        <div key={item.id} className="border border-green-800 bg-black/50 p-4 flex flex-col justify-between hover:bg-green-900/10">
                            <div>
                                <div className="font-bold text-lg">{item.name} <span className="text-xs text-green-600">v{currentLvl}</span></div>
                                <div className="text-xs text-gray-400 mb-2">{item.desc}</div>
                                <div className="text-[10px] text-green-700">{item.effect(currentLvl)}</div>
                            </div>
                            <button 
                                onClick={() => buyItem('hardware', item.id, cost)}
                                disabled={user.bits < cost}
                                className={`w-full py-1 mt-2 text-sm font-bold border ${user.bits >= cost ? 'border-yellow-600 text-yellow-500 hover:bg-yellow-900/20' : 'border-gray-800 text-gray-700'}`}
                            >
                                {user.bits >= cost ? `COMPRAR (${cost})` : `FALTA ${cost - Math.floor(user.bits)}`}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* SEÇÃO 3: SOFTWARE */}
            <h3 className="text-blue-400 mb-2 border-l-4 border-blue-600 pl-2">BLACK MARKET SOFTWARE</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(SOFTWARE_DB).filter(sw => sw.price).map(sw => {
                    const owned = user.inventory.includes(sw.id);
                    return (
                        <div key={sw.id} className={`border p-4 flex justify-between items-center ${owned ? 'border-gray-800 opacity-50' : 'border-blue-800 bg-blue-900/10'}`}>
                            <div>
                                <div className="font-bold">{sw.name}</div>
                                <div className="text-xs text-gray-400">{sw.desc}</div>
                            </div>
                            {owned ? (
                                <span className="text-xs text-gray-500 font-bold border border-gray-800 px-2 py-1">ADQUIRIDO</span>
                            ) : (
                                <button 
                                    onClick={() => buyItem('software', sw.id, sw.price)}
                                    disabled={user.bits < sw.price}
                                    className={`px-3 py-1 text-xs font-bold border ${user.bits >= sw.price ? 'border-yellow-600 text-yellow-500 hover:bg-yellow-900/20' : 'border-gray-800 text-gray-700'}`}
                                >
                                    {sw.price} BITS
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <button onClick={() => setView('MENU')} className="mt-8 w-full py-3 border border-red-800 text-red-500 hover:bg-red-900/20">VOLTAR AO MENU</button>
        </div>
    );

    // --- MAIN RENDER ---
    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-2 md:p-4 select-none ${glitch ? 'glitch-effect' : ''}`}>
            <div className="absolute inset-0 pointer-events-none crt"></div>
            <div className="absolute inset-0 pointer-events-none scanline"></div>

            {/* HEADER */}
            {view !== 'RESULT' && (
                    <div className="w-full max-w-4xl flex justify-between items-end border-b border-green-900/50 pb-2 mb-4 z-10">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold tracking-tighter text-glow">BIT-SHIFT <span className="text-xs align-top opacity-50">v2.4</span></h1>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>XP: {user.xp}</span>
                            <span className="text-green-600 font-bold">[{playerRank.title}]</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-yellow-500 font-mono font-bold text-lg">
                            {Math.floor(view === 'GAME' ? sessionBits + user.bits : user.bits)} <Icons.Disc />
                        </div>
                        <div className="text-xs text-gray-500">{view === 'GAME' ? 'TOTAL AVAILABLE' : 'WALLET'}</div>
                    </div>
                </div>
            )}

            {/* MENU */}
            {view === 'MENU' && (
                <div className="w-full max-w-md space-y-4 z-10">
                    <div className="border border-green-800 bg-black/80 p-6 text-center shadow-lg">
                        <div className="text-xs text-green-600 mb-2 font-mono">STATUS DO SISTEMA</div>
                        <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                            <div className="bg-green-900/20 p-2 border border-green-900">CPU v{user.hardware.cpu}</div>
                            <div className="bg-green-900/20 p-2 border border-green-900">RAM v{user.hardware.ram}</div>
                            <div className="bg-green-900/20 p-2 border border-green-900">COOL v{user.hardware.cooler}</div>
                        </div>
                        <div className="flex justify-between text-xs px-2 border-t border-green-900/50 pt-2">
                            <span className="text-red-400">ATK: Lv.{user.skills.offense}</span>
                            <span className="text-blue-400">DEF: Lv.{user.skills.defense}</span>
                        </div>
                    </div>
                    <button onClick={startGame} className="w-full py-4 bg-green-600 text-black font-bold text-xl hover:bg-green-500 flex items-center justify-center gap-2">
                        <Icons.Terminal /> INICIAR RUN
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setView('MARKET')} className="py-4 border border-yellow-700 text-yellow-500 font-bold flex items-center justify-center gap-2"><Icons.ShoppingBag /> MARKET</button>
                        <button onClick={() => setView('LOADOUT')} className="py-4 border border-blue-700 text-blue-500 font-bold flex items-center justify-center gap-2"><Icons.Cpu /> DECK</button>
                    </div>
                </div>
            )}

            {view === 'MARKET' && renderMarket()}
            
            {view === 'LOADOUT' && (
                <div className="flex-1 w-full max-w-4xl p-4 z-10">
                        <h2 className="text-2xl font-bold text-glow mb-6 border-b border-green-800 pb-2">DECK ({user.loadout.length}/4)</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {user.inventory.map(id => {
                            const sw = SOFTWARE_DB[id];
                            const equipped = user.loadout.includes(id);
                            return (
                                <button key={id} onClick={() => toggleEquip(id)} className={`p-4 border text-left transition relative ${equipped ? 'border-green-400 bg-green-900/20' : 'border-gray-800 text-gray-500'}`}>
                                    <div className="font-bold text-sm">{sw.name}</div>
                                    <div className="text-xs mt-1">{sw.desc}</div>
                                    <div className="text-xs font-mono mt-2">{sw.cost} BW</div>
                                    {sw.cooldown && <div className="text-xs text-red-400">CD: {sw.cooldown}</div>}
                                    {equipped && <div className="absolute top-0 right-0 p-1 bg-green-500 text-black text-[10px] font-bold">ON</div>}
                                </button>
                            )
                        })}
                        </div>
                        <button onClick={() => setView('MENU')} className="mt-8 w-full py-3 border border-green-800 text-green-500">CONFIRMAR</button>
                </div>
            )}

            {/* GAME INTERFACE */}
            {view === 'GAME' && (
                <div className="w-full max-w-4xl grid md:grid-cols-12 gap-4 h-full z-10">
                    <div className="md:col-span-4 space-y-4">
                        <div className="border border-red-900/50 bg-black/80 p-4 relative">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-red-500 font-bold flex items-center gap-2"><Icons.User/> {enemy.name}</span>
                                <span className="text-xs bg-red-900/20 px-2 py-1 rounded border border-red-900">{enemy.shield} SHIELD</span>
                            </div>
                            <div className="h-2 bg-red-900/20 w-full mb-1">
                                <div className="h-full bg-red-600 transition-all duration-300" style={{width: `${(enemy.hp/enemy.maxHp)*100}%`}}></div>
                            </div>
                            <div className="text-right text-xs text-red-400">{enemy.hp}/{enemy.maxHp}</div>
                        </div>

                        <div className="border border-green-500 bg-black/80 p-4 shadow-[0_0_10px_rgba(0,255,0,0.1)]">
                                <div className="flex justify-between items-center mb-2">
                                <span className="text-green-500 font-bold flex items-center gap-2"><Icons.Terminal/> YOU</span>
                                <span className="text-xs bg-green-900/20 px-2 py-1 rounded border border-green-900">{player.shield} SHIELD</span>
                            </div>
                            <div className="text-xs mb-1">INTEGRITY</div>
                            <div className="h-4 bg-green-900/20 w-full mb-1 relative border border-green-900">
                                <div className="h-full bg-green-500 transition-all duration-300" style={{width: `${(player.hp/player.maxHp)*100}%`}}></div>
                            </div>
                            <div className="text-right text-xs mb-4">{player.hp}/{player.maxHp}</div>
                            <div className="text-xs mb-1">BANDWIDTH (AP)</div>
                            <div className="flex gap-1 h-3">
                                {[...Array(player.maxAp)].map((_, i) => (
                                    <div key={i} className={`flex-1 border border-green-800 ${i < player.ap ? 'bg-yellow-500' : 'bg-transparent'}`}></div>
                                ))}
                            </div>
                        </div>
                        
                        {/* LIVE PATCHING PANEL */}
                        <div className="border border-yellow-600/50 bg-black/60 p-3">
                            <div className="text-xs text-yellow-500 mb-2 flex items-center gap-1 font-bold"><Icons.TrendingUp className="w-3 h-3"/> LIVE PATCHING (SESSION)</div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => buySessionUpgrade('offense')}
                                    disabled={!isPlayerTurn || (user.bits + sessionBits) < getUpgradeCost(sessionUpgrades.offense)}
                                    className="flex-1 border border-red-900/50 text-red-400 text-[10px] p-2 hover:bg-red-900/20 disabled:opacity-30"
                                >
                                    <div className="font-bold">ATK Lv.{sessionUpgrades.offense}</div>
                                    <div>COST: {getUpgradeCost(sessionUpgrades.offense)}</div>
                                </button>
                                <button 
                                    onClick={() => buySessionUpgrade('defense')}
                                    disabled={!isPlayerTurn || (user.bits + sessionBits) < getUpgradeCost(sessionUpgrades.defense)}
                                    className="flex-1 border border-blue-900/50 text-blue-400 text-[10px] p-2 hover:bg-blue-900/20 disabled:opacity-30"
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
                        <div className="flex-1 bg-black/90 border border-green-900 p-4 font-mono text-xs overflow-hidden flex flex-col justify-end min-h-[150px]">
                            {logs.map((l, i) => (
                                <div key={i} className={`mb-1 ${l.type === 'error' ? 'text-red-500' : l.type === 'success' ? 'text-green-400' : l.type === 'warning' ? 'text-yellow-500' : 'text-gray-400'}`}>
                                    <span className="opacity-30">[{l.time}]</span> {l.text}
                                </div>
                            ))}
                            <div ref={logsEndRef}></div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {user.loadout.map(id => {
                                const sw = SOFTWARE_DB[id];
                                const canAfford = player.ap >= sw.cost;
                                const onCooldown = player.cooldowns[id] > 0;
                                return (
                                    <button 
                                        key={id}
                                        disabled={!isPlayerTurn || !canAfford || onCooldown}
                                        onClick={() => useSoftware(id)}
                                        className={`p-2 border text-left h-20 relative overflow-hidden group transition-all ${
                                            !isPlayerTurn || onCooldown ? 'opacity-30 border-gray-800' : 
                                            !canAfford ? 'opacity-50 border-red-900 text-red-800' : 
                                            'border-green-600 hover:bg-green-900/20 active:translate-y-1'
                                        }`}
                                    >
                                        <div className="font-bold text-sm">{sw.name}</div>
                                        <div className="text-[10px] absolute top-2 right-2 border border-current px-1">{sw.cost} BW</div>
                                        <div className="text-[10px] mt-1 opacity-70 leading-tight">{sw.desc}</div>
                                        {onCooldown && (
                                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-red-500 font-bold text-lg border border-red-500">
                                                {player.cooldowns[id]}
                                            </div>
                                        )}
                                        {canAfford && isPlayerTurn && !onCooldown && <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-5"></div>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {view === 'RESULT' && (
                <div className="z-20 absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
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
                            <span className="font-bold">{(sessionBits + user.bits - user.bits).toFixed(0)}</span>
                        </div>
                    </div>

                    <button onClick={() => setView('MENU')} className="px-8 py-4 bg-green-600 text-black font-bold hover:bg-green-500">
                        VOLTAR À BASE
                    </button>
                </div>
            )}
        </div>
    );
}

// Inicializa o React
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);