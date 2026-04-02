// ==UserScript==
// @name         Remilia Beetle Coach
// @namespace    http://tampermonkey.net/
// @version      8.0.0
// @description  BeetleBoy coach: auto-claim, pathways, value-sorted recipes, tier labels, activity log.
// @match        https://www.remilia.net/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
  'use strict';

  const STORE_KEY = 'beetle_coach_v7_store';
  const PANEL_ID = 'bc7-panel';
  const BTN_ID = 'bc7-toggle';
  const STYLE_ID = 'bc7-style';
  const CURRENT_VER = '8.0.0';

  /* ─── Labels ─── */
  const LABELS = {
    green:'Green Beetle',ladybug:'Ladybug',purple:'Purple Beetle',pond:'Pond Beetle',
    monarch:'Monarch',goliath:'Goliath Beetle',stag:'Stag Beetle',bombardier:'Bombardier Beetle',
    giraffe_weevil:'Giraffe Weevil',pillbug:'Pillbug',imperial_tortoise:'Imperial Tortoise Beetle',
    sabertooth_longhorn:'Sabertooth Longhorn Beetle',sunset_moth:'Sunset Moth',
    mars_rhino:'Mars Rhino Beetle',golden_scarab:'Golden Scarab',hercules:'Hercules Beetle',
    skull:'Skull Beetle',christmas:'Christmas Beetle',
    daisy:'Daisy',poppy:'Poppy',sunflower:'Sunflower',marigold:'Marigold',
    gallic_rose:'Gallic Rose',milk_thistle:'Milk Thistle',royal_poinciana:'Royal Poinciana',
    camellia:'Camellia',morning_glory:'Morning Glory',pincushion:'Pincushion',gazania:'Gazania',
    black_lotus:'Black Lotus',
    nectar:'Nectar',cattail:'Cattail',pinecone:'Pinecone',moss:'Moss',gunpowder:'Gunpowder',
    junk_cube_t1:'Junk Cube',junk_cube_t2:'Junk Tesseract',beetleboy_key:'BeetleBoy Key',
    pollen_tin:'Tin Pollen',pollen_bronze:'Bronze Pollen',pollen_mithril:'Mithril Pollen',
    pollen_adamantine:'Adamantine Pollen',
    cheese:'Cheese',
    hammer_t1:'Tin Hammer',hammer_t2:'Bronze Hammer',hammer_t3:'Mithril Hammer',
    hammer_t4:'Adamantine Hammer',hammer_t5:'Diamond Hammer',
    coffee_can:'Coffee Can',red_whistle:'Red Whistle',cracker_wrapper:'Cracker Wrapper',
    stamp:'Stamp',marble:'Marble',bottle_cap:'Bottle Cap',ramune_bottle:'Ramune Bottle',
    wine_cork:'Wine Cork',green_army_man:'Green Army Man',scratch_off:'Scratch Off',
    cigarette_butt:'Cigarette Butt',train_ticket_stub:'Train Ticket Stub',chip_bag:'Chip Bag',
    chocolate_wrapper:'Chocolate Wrapper',jack_adapter:'Jack Adapter',paperclip:'Paperclip',
    pebble:'Pebble',soda_can_tab:'Soda Can Tab',chocolate_bar:'Chocolate Bar',
    empty_noodle_cup:'Empty Noodle Cup',juicebox:'Juicebox',smiley_pebble:'Smiley Pebble',
    watch_battery:'Watch Battery',bike_reflector:'Bike Reflector',pokkiri_box:'Pokkiri Box',
    rubber_band:'Rubber Band',gum_wrapper:'Gum Wrapper'
  };

  /* ─── Tiers ─── */
  const TIER_MAP = {
    green:'Tin',ladybug:'Bronze',purple:'Bronze',pond:'Mithril',monarch:'Mithril',
    goliath:'Adamantine',stag:'Adamantine',bombardier:'Adamantine',
    giraffe_weevil:'Rare',pillbug:'Rare',imperial_tortoise:'Rare',
    sabertooth_longhorn:'Epic',sunset_moth:'Epic',
    mars_rhino:'Legendary',golden_scarab:'Legendary',hercules:'Legendary',
    skull:'Uncommon',christmas:'Special',
    daisy:'Tin',poppy:'Tin',sunflower:'Tin',
    marigold:'Bronze',gallic_rose:'Bronze',milk_thistle:'Bronze',
    royal_poinciana:'Mithril',camellia:'Mithril',morning_glory:'Mithril',
    pincushion:'Adamantine',gazania:'Adamantine',black_lotus:'Legendary',
    pollen_tin:'Tin',pollen_bronze:'Bronze',pollen_mithril:'Mithril',pollen_adamantine:'Adamantine',
    nectar:'Bridge',cattail:'Bridge',pinecone:'Bridge',moss:'Bridge',gunpowder:'Bridge'
  };
  const TIER_COLORS = {
    Tin:'#7a8a7a',Bronze:'#b87333',Mithril:'#5b8dd9',Adamantine:'#9b59b6',
    Rare:'#e67e22',Epic:'#e74c3c',Legendary:'#f1c40f',Bridge:'#1abc9c',
    Uncommon:'#6a9955',Special:'#e84393'
  };

  /* ─── Aliases ─── */
  const ITEM_ALIASES = {
    pollen_common:'pollen_tin',pollen_uncommon:'pollen_bronze',pollen_rare:'pollen_mithril',
    tin_hammer:'hammer_t1',bronze_hammer:'hammer_t2',mithril_hammer:'hammer_t3',
    adamantine_hammer:'hammer_t4',diamond_hammer:'hammer_t5',
    junk_cube:'junk_cube_t1',junk_tesseract:'junk_cube_t2',
    green_beetle:'green',purple_beetle:'purple',pond_beetle:'pond',
    goliath_beetle:'goliath',stag_beetle:'stag',bombardier_beetle:'bombardier',
    imperial_tortoise_beetle:'imperial_tortoise',sabertooth_longhorn_beetle:'sabertooth_longhorn',
    mars_rhino_beetle:'mars_rhino',hercules_beetle:'hercules',
    gallicrose:'gallic_rose',royalpoinciana:'royal_poinciana',
    morningglory:'morning_glory',milkthistle:'milk_thistle',blacklotus:'black_lotus'
  };

  /* ─── Item Groups ─── */
  const TIN_FLOWERS = ['daisy','poppy','sunflower'];
  const BRONZE_FLOWERS = ['marigold','gallic_rose','milk_thistle'];
  const MITHRIL_FLOWERS = ['royal_poinciana','camellia','morning_glory'];
  const ADAMANTINE_FLOWERS = ['pincushion','gazania'];
  const BRONZE_BEETLES = ['ladybug','purple'];
  const MITHRIL_BEETLES = ['pond','monarch'];
  const ANY_JUNK = [
    'coffee_can','red_whistle','cracker_wrapper','stamp','marble','bottle_cap',
    'ramune_bottle','wine_cork','green_army_man','scratch_off','cigarette_butt',
    'train_ticket_stub','chip_bag','chocolate_wrapper','jack_adapter','paperclip',
    'pebble','soda_can_tab','chocolate_bar','empty_noodle_cup','juicebox',
    'smiley_pebble','watch_battery','bike_reflector','pokkiri_box','rubber_band','gum_wrapper'
  ];
  const JUNK_SET = new Set(ANY_JUNK);
  const SKIP_DISPLAY = new Set(['hammer_t1','hammer_t2','hammer_t3','hammer_t4','hammer_t5','beetleboy_key']);
  const HAMMER_STATS = {
    hammer_t1:{bonus:0,baseBreak:10},hammer_t2:{bonus:5,baseBreak:5},
    hammer_t3:{bonus:20,baseBreak:10},hammer_t4:{bonus:35,baseBreak:2},
    hammer_t5:{bonus:90,baseBreak:1}
  };
  const HAMMER_TIERS = ['hammer_t1','hammer_t2','hammer_t3','hammer_t4','hammer_t5'];
  const TOKEN_GROUPS = {
    any_junk:ANY_JUNK, any_tin_flower:TIN_FLOWERS, any_bronze_flower:BRONZE_FLOWERS,
    any_mithril_flower:MITHRIL_FLOWERS, any_adamantine_flower:ADAMANTINE_FLOWERS,
    any_bronze_beetle:BRONZE_BEETLES, any_mithril_beetle:MITHRIL_BEETLES
  };

  /* ─── Recipes ─── */
  const RECIPES = [
    {label:'Junk Cube',type:'assemble',inputs:['any_junk','any_junk'],notes:'Any 2 junk items.'},
    {label:'Junk Tesseract',type:'assemble',inputs:['junk_cube_t1','junk_cube_t1','junk_cube_t1'],notes:'3 Junk Cubes.'},
    {label:'Tin Hammer',type:'assemble',inputs:['junk_cube_t1','junk_cube_t1'],notes:'2 Junk Cubes.'},
    {label:'Bronze Hammer',type:'assemble',inputs:['hammer_t1','junk_cube_t2','pollen_tin'],notes:'Deterministic.'},
    {label:'Mithril Hammer',type:'assemble',inputs:['hammer_t2','junk_cube_t2','pollen_bronze'],notes:'Deterministic.'},
    {label:'Adamantine Hammer',type:'assemble',inputs:['hammer_t3','junk_cube_t2','pollen_mithril'],notes:'Deterministic.'},
    {label:'Diamond Hammer',type:'assemble',inputs:['hammer_t4','junk_cube_t2','pollen_adamantine'],notes:'Deterministic.'},
    {label:'Tin Pollen',type:'smash',inputs:['any_tin_flower','any_tin_flower'],notes:'Any 2 Tin flowers.'},
    {label:'Bronze Pollen',type:'smash',inputs:['any_bronze_flower','any_bronze_flower'],notes:'Any 2 Bronze flowers.'},
    {label:'Mithril Pollen',type:'smash',inputs:['any_mithril_flower','any_mithril_flower'],notes:'Any 2 Mithril flowers.'},
    {label:'Adamantine Pollen',type:'smash',inputs:['any_adamantine_flower','any_adamantine_flower'],notes:'Any 2 Adamantine flowers.'},
    {label:'Nectar / Cattail Bridge',type:'smash',inputs:['any_bronze_beetle','pollen_bronze'],notes:'Bronze beetle + Bronze Pollen.'},
    {label:'Pinecone / Moss / Gunpowder Bridge',type:'smash',inputs:['any_mithril_beetle','pollen_mithril'],notes:'Mithril beetle + Mithril Pollen.'},
    {label:'Pond Beetle',type:'smash',inputs:['cattail','ladybug'],notes:'Cattail + Ladybug.'},
    {label:'Monarch',type:'smash',inputs:['nectar','ladybug'],notes:'Nectar + Ladybug.'},
    {label:'Monarch (alt)',type:'smash',inputs:['nectar','purple'],notes:'Nectar + Purple Beetle.'},
    {label:'Bombardier Beetle',type:'smash',inputs:['gunpowder','pond'],notes:'Gunpowder + Pond Beetle.'},
    {label:'Bombardier Beetle (alt)',type:'smash',inputs:['gunpowder','monarch'],notes:'Gunpowder + Monarch.'},
    {label:'Stag Beetle',type:'smash',inputs:['moss','pond'],notes:'Moss + Pond Beetle.'},
    {label:'Goliath Beetle',type:'smash',inputs:['pinecone','pond'],notes:'Pinecone + Pond Beetle.'},
    {label:'Goliath Beetle (alt)',type:'smash',inputs:['pinecone','monarch'],notes:'Pinecone + Monarch.'},
    // Rare beetles (Mithril flower + Mithril beetle)
    {label:'Giraffe Weevil',type:'smash',inputs:['royal_poinciana','pond'],notes:'Royal Poinciana + Pond Beetle.'},
    {label:'Giraffe Weevil (alt)',type:'smash',inputs:['royal_poinciana','monarch'],notes:'Royal Poinciana + Monarch.'},
    {label:'Pillbug',type:'smash',inputs:['camellia','pond'],notes:'Camellia + Pond Beetle.'},
    {label:'Pillbug (alt)',type:'smash',inputs:['camellia','monarch'],notes:'Camellia + Monarch.'},
    {label:'Imperial Tortoise Beetle',type:'smash',inputs:['morning_glory','pond'],notes:'Morning Glory + Pond Beetle.'},
    {label:'Imperial Tortoise Beetle (alt)',type:'smash',inputs:['morning_glory','monarch'],notes:'Morning Glory + Monarch.'},
    // Epic beetles (Adamantine flower + Adamantine beetle)
    {label:'Sabertooth Longhorn Beetle',type:'smash',inputs:['pincushion','goliath'],notes:'Pincushion + Goliath.'},
    {label:'Sabertooth Longhorn (Stag)',type:'smash',inputs:['pincushion','stag'],notes:'Pincushion + Stag.'},
    {label:'Sabertooth Longhorn (Bomb)',type:'smash',inputs:['pincushion','bombardier'],notes:'Pincushion + Bombardier.'},
    {label:'Sunset Moth',type:'smash',inputs:['gazania','goliath'],notes:'Gazania + Goliath.'},
    {label:'Sunset Moth (Stag)',type:'smash',inputs:['gazania','stag'],notes:'Gazania + Stag.'},
    {label:'Sunset Moth (Bomb)',type:'smash',inputs:['gazania','bombardier'],notes:'Gazania + Bombardier.'},
    // Endgame
    {label:'Black Lotus',type:'smash',inputs:['gunpowder','moss','pinecone'],notes:'Gunpowder + Moss + Pinecone.'},
    {label:'Mars Rhino Beetle',type:'smash',inputs:['black_lotus','sunset_moth','sabertooth_longhorn'],notes:'Black Lotus + Sunset Moth + Sabertooth.'},
    {label:'Hercules Beetle',type:'smash',inputs:['golden_scarab','pollen_adamantine','purple'],notes:'Golden Scarab + Adamantine Pollen + Purple.'}
  ];
  // Value scores from mathematical model (see beetleboy_value_model.md)
  // Based on: base cost, craft depth, collection value, crafting utility
  const RECIPE_VALUE = {
    // Tier 10 — Legendary
    'Hercules Beetle':100,'Mars Rhino Beetle':95,
    // Tier 9 — Endgame
    'Black Lotus':88,'Diamond Hammer':82,
    // Tier 8 — Epic
    'Sabertooth Longhorn Beetle':78,'Sunset Moth':78,
    'Sabertooth Longhorn (Stag)':78,'Sabertooth Longhorn (Bomb)':78,
    'Sunset Moth (Stag)':78,'Sunset Moth (Bomb)':78,
    'Adamantine Pollen':75,
    // Tier 7 — Adamantine
    'Adamantine Hammer':65,
    'Goliath Beetle':60,'Goliath Beetle (alt)':60,'Stag Beetle':60,
    'Bombardier Beetle':55,'Bombardier Beetle (alt)':55,
    // Tier 5-6 — Rare + Artifacts
    'Giraffe Weevil':55,'Giraffe Weevil (alt)':55,
    'Pillbug':55,'Pillbug (alt)':55,
    'Imperial Tortoise Beetle':55,'Imperial Tortoise Beetle (alt)':55,
    'Pinecone / Moss / Gunpowder Bridge':50,'Nectar / Cattail Bridge':40,
    'Mithril Pollen':40,
    // Tier 4 — Mithril
    'Mithril Hammer':30,'Pond Beetle':25,'Monarch':25,'Monarch (alt)':25,
    // Tier 3 — Bronze Bridge
    'Bronze Hammer':15,'Bronze Pollen':12,
    // Tier 2 — Compression
    'Junk Tesseract':8,'Tin Hammer':6,
    // Tier 1 — Base crafts
    'Tin Pollen':5,'Junk Cube':1
  };

  /* ─── Progression Stages ─── */
  const ALL_BEETLES = ['green','ladybug','purple','pond','monarch','goliath','stag','bombardier',
    'giraffe_weevil','pillbug','imperial_tortoise','sabertooth_longhorn','sunset_moth',
    'mars_rhino','golden_scarab','hercules','skull','christmas'];
  const ALL_FLOWERS = ['daisy','poppy','sunflower','marigold','gallic_rose','milk_thistle',
    'royal_poinciana','camellia','morning_glory','pincushion','gazania','black_lotus'];
  const STAGES = [
    {n:1, name:'Gathering', check:['green'], desc:'Farm beetles + junk, build Junk Cubes'},
    {n:2, name:'Pollen & Bridges', check:['pollen_tin'], desc:'Craft pollen, generate Nectar/Cattail'},
    {n:3, name:'Mithril Beetles', check:['pond','monarch'], desc:'Craft Pond Beetle + Monarch'},
    {n:4, name:'Adamantine Beetles', check:['bombardier','stag','goliath'], desc:'Craft Goliath/Stag/Bombardier'},
    {n:5, name:'Rare Beetles', check:['giraffe_weevil','pillbug','imperial_tortoise'], desc:'Mithril flower + Mithril beetle routes'},
    {n:6, name:'Epic Beetles', check:['sabertooth_longhorn','sunset_moth'], desc:'Adamantine flower + Adamantine beetle routes'},
    {n:7, name:'Endgame', check:['black_lotus','mars_rhino','hercules'], desc:'Black Lotus, Mars Rhino, Hercules'}
  ];
  function getStage(inv) {
    // Return the highest COMPLETED stage (all check items owned)
    // Fall back to highest partially-started stage
    let completed = 0;
    for (const s of STAGES) {
      if (s.check.every(k => (inv[k]||0) > 0)) {
        completed = s.n;
      } else {
        break; // First incomplete stage = this is where you are
      }
    }
    return completed;
  }
  function getNextStageGoals(inv, stage) {
    if (stage >= 7) return {next:null, goals:[]};
    const next = STAGES[stage]; // stage is 0-indexed offset by +1
    if (!next) return {next:null, goals:[]};
    const missing = next.check.filter(k => !(inv[k]||0));
    return {next, goals:missing.map(k=>dn(k))};
  }

  /* ─── Collection ─── */
  function getCollection(inv) {
    const ownedB = ALL_BEETLES.filter(k => (inv[k]||0) > 0);
    const ownedF = ALL_FLOWERS.filter(k => (inv[k]||0) > 0);
    const missingB = ALL_BEETLES.filter(k => !(inv[k]||0));
    const missingF = ALL_FLOWERS.filter(k => !(inv[k]||0));
    return {ownedB, ownedF, missingB, missingF,
      totalB:ALL_BEETLES.length, totalF:ALL_FLOWERS.length};
  }

  /* ─── Filters ─── */
  const BLOCKLIST = /^(svg|icon|button|slot|empty|more|smash|eject|assemble|home|search|left|right|go_back|show_password|claim|load|logo|dots|arrow|cheeseman|static\d*|beetleboy_logo|beetle_catch|craft|beetle_shader)$/i;
  const PFP_HASH = /^(pfp_\d+|retart|remilio|radbro|default|[a-f0-9]{20,})$/i;

  /* ─── Store ─── */
  function defaults() {
    return {ver:CURRENT_VER,mergedInventory:{},currentHammer:null,ownedHammers:[],
      currentHammerBonus:null,currentHammerBreakChance:null,
      timers:{},lastScanTime:0,autoClaim:true,autoHunt:false,panelOpen:true,level:null,craftMode:null,
      log:[]};
  }
  function load() {
    try {
      const r=GM_getValue(STORE_KEY,null);
      if (!r) return defaults();
      const p=Object.assign(defaults(),JSON.parse(r));
      if (p.ver!==CURRENT_VER) { p.mergedInventory={}; p.ver=CURRENT_VER; p.log=[]; }
      return p;
    } catch { return defaults(); }
  }
  function save() { try { GM_setValue(STORE_KEY,JSON.stringify(S)); } catch {} }
  function resetStore() { S=defaults(); save(); renderPanel(); }
  let S = load();

  /* ─── Activity Log ─── */
  function logEvent(msg) {
    const ts = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    S.log.push(ts + ' ' + msg);
    if (S.log.length > 30) S.log = S.log.slice(-30);
    save();
    // Update log DOM in-place if visible
    const el = document.getElementById('bc7-log');
    if (el) {
      el.innerHTML = S.log.slice().reverse().map(l => '<div class="bc7-log-line">' + l + '</div>').join('');
    }
  }

  /* ─── Helpers ─── */
  function norm(raw) {
    if (!raw) return null;
    let k=String(raw).toLowerCase().trim().replace(/\.[a-z0-9]+$/i,'')
      .replace(/%20/g,'_').replace(/[^\w]+/g,'_').replace(/^_+|_+$/g,'');
    return ITEM_ALIASES[k]||k;
  }
  function dn(k) { return LABELS[k]||k; }
  function cnt(inv,arr) { return arr.reduce((s,k)=>s+(inv[k]||0),0); }
  function tokHuman(t) {
    const m={any_junk:'any junk',any_tin_flower:'Tin flowers x2',any_bronze_flower:'Bronze flower',
      any_mithril_flower:'Mithril flower',any_adamantine_flower:'Adamantine flower',
      any_bronze_beetle:'Bronze beetle',any_mithril_beetle:'Mithril beetle'};
    return m[t]||dn(t);
  }
  function canMake(r, inv) {
    const needed = {};
    for (const t of r.inputs) needed[t] = (needed[t]||0) + 1;
    for (const [token, times] of Object.entries(needed)) {
      const group = TOKEN_GROUPS[token];
      if (group) { if (cnt(inv,group) < times) return false; }
      else { if ((inv[token]||0) < times) return false; }
    }
    return true;
  }
  function isValid(k) { return k && !BLOCKLIST.test(k) && !PFP_HASH.test(k); }
  function extractKey(el) {
    if (!el) return null;
    const bg=(el.style&&el.style.backgroundImage)||getComputedStyle(el).backgroundImage||'';
    const m=bg.match(/\/beetle\/images\/icons\/[^/]+\/([^."')]+)\.(png|jpg|webp|gif)/i);
    return m&&m[1]?norm(m[1]):null;
  }

  /* ─── Scanning ─── */
  function scanPage(sel, imgCls, cntCls) {
    const r={};
    document.querySelectorAll(sel).forEach(item => {
      const k=extractKey(item.querySelector(imgCls));
      if (!isValid(k)) return;
      const el=item.querySelector(cntCls);
      const c=el?parseInt(el.textContent.trim(),10)||1:1;
      r[k]=Math.max(r[k]||0,c);
    });
    return r;
  }

  let _scanning = false;
  async function fullScan() {
    if (_scanning) return;
    _scanning = true;
    const oldInv = Object.assign({}, S.mergedInventory);
    try {
      const merged = {};
      const merge = (items) => { for (const [k,v] of Object.entries(items)) merged[k]=Math.max(merged[k]||0,v); };
      // Crafting module pages
      merge(scanPage('.crafting-module__beetle-item:not(.crafting-module__hammer-slot)','.crafting-module__beetle-img','.crafting-module__beetle-item-count'));
      for (let i=0;i<20;i++) {
        const more=document.querySelector('.crafting-module__pagination-button');
        if (!more || more.disabled || more.classList.contains('disabled')) break; more.click();
        await new Promise(r=>setTimeout(r,400));
        merge(scanPage('.crafting-module__beetle-item:not(.crafting-module__hammer-slot)','.crafting-module__beetle-img','.crafting-module__beetle-item-count'));
      }
      // Catch module pages
      merge(scanPage('.beetle-catch-module__beetle-item','.beetle-catch-module__beetle-img','.beetle-catch-module__beetle-item-count'));
      for (let i=0;i<20;i++) {
        const more=document.querySelector('.beetle-catch-module__pagination-button');
        if (!more || more.disabled || more.classList.contains('disabled')) break; more.click();
        await new Promise(r=>setTimeout(r,400));
        merge(scanPage('.beetle-catch-module__beetle-item','.beetle-catch-module__beetle-img','.beetle-catch-module__beetle-item-count'));
      }
      if (Object.keys(merged).length > 0) {
        S.mergedInventory = merged;
        // Log changes
        const changes = [];
        for (const [k,v] of Object.entries(merged)) {
          const old = oldInv[k] || 0;
          if (v > old && !JUNK_SET.has(k) && k !== 'cheese') changes.push(dn(k) + ' +' + (v - old));
        }
        const junkNew = cnt(merged, ANY_JUNK);
        const junkOld = cnt(oldInv, ANY_JUNK);
        if (junkNew > junkOld) changes.push('Junk +' + (junkNew - junkOld));
        const cheeseNew = merged.cheese || 0;
        const cheeseOld = oldInv.cheese || 0;
        if (cheeseNew !== cheeseOld) changes.push('Cheese ' + (cheeseNew > cheeseOld ? '+' : '') + (cheeseNew - cheeseOld));
        if (changes.length) {
          logEvent('Scan: ' + changes.join(', '));
        } else {
          logEvent('Scan: no changes');
        }
      } else {
        logEvent('Scan: no items found');
      }
    } finally { _scanning = false; }
    parseTimers(); parseHammer(); parseLevel(); parseCraftMode();
    S.lastScanTime = Date.now(); save(); renderPanel();
  }

  /* ─── Timer Refresh (in-place, no re-render) ─── */
  function refreshTimers() {
    if (_scanning) return;
    parseTimers();
    const fmtT = (v) => {
      if (!v) return '\u2014';
      if (/ready/i.test(v)) return '<span class="bc7-ready">Ready!</span>';
      return '<span class="bc7-timer">' + v + '</span>';
    };
    const bc=document.getElementById('bc7-t-claim'); if(bc) bc.innerHTML=fmtT(S.timers.beetleCatch);
    const hc=document.getElementById('bc7-t-hunt'); if(hc) hc.innerHTML=fmtT(S.timers.huntCooldown);
    const dc=document.getElementById('bc7-t-cheese'); if(dc) dc.innerHTML=fmtT(S.timers.dailyCheese);
  }

  /* ─── Parse Functions ─── */
  function parseTimers() {
    const t={beetleCatch:null,dailyCheese:null,huntCooldown:null};
    const bc=document.querySelector('.beetle-game-nav .info span:last-child');
    if (bc) { const v=bc.textContent.trim(); if(/\d/.test(v)) t.beetleCatch=v; }
    if (!t.beetleCatch) {
      const nav=document.querySelector('.beetle-game-nav .info');
      if (nav&&/ready/i.test(nav.textContent)) t.beetleCatch='Ready!';
    }
    const dc=document.querySelector('.cheese-claim-nav .info span:last-child');
    if (dc) { const v=dc.textContent.trim(); if(/\d/.test(v)) t.dailyCheese=v; }
    const cooldown=document.querySelector('.beetle-catch-module__cooldown-timer');
    if (cooldown) {
      let v=cooldown.textContent.trim().replace(/\s*to\s+next\s+claim\s*/i,'').trim();
      if(/\d/.test(v)) t.beetleCatch=v;
    }
    const huntCost=document.querySelector('.beetle-catch-module__hunt-button-cheese-cost');
    if (huntCost) {
      const txt=huntCost.textContent.trim();
      if (/cooldown/i.test(txt)) {
        const cleaned=txt.replace(/\s*cooldown\s*/i,'').trim();
        if (/\d/.test(cleaned)) t.huntCooldown=cleaned;
      } else if (/cheese/i.test(txt)) { t.huntCooldown='Ready!'; }
    }
    S.timers=t;
  }
  function parseHammer() {
    const owned=[];
    document.querySelectorAll('.crafting-module__hammer-row .crafting-module__hammer-slot').forEach(s => {
      if (s.classList.contains('crafting-module__hammer-slot--undiscovered')) return;
      const img=s.querySelector('.crafting-module__beetle-img'); if (!img) return;
      const k=extractKey(img);
      if (k&&k.startsWith('hammer_t')) owned.push(k);
    });
    owned.sort((a,b)=>HAMMER_TIERS.indexOf(b)-HAMMER_TIERS.indexOf(a));
    S.ownedHammers=owned; S.currentHammer=owned[0]||null;
    const st=S.currentHammer?HAMMER_STATS[S.currentHammer]:null;
    S.currentHammerBonus=st?st.bonus:null; S.currentHammerBreakChance=st?st.baseBreak:null;
  }
  function parseLevel() {
    const el=document.querySelector('.beetle-card__level');
    if (el) { const m=el.textContent.match(/(\d+)/); if(m) S.level=parseInt(m[1],10); }
  }
  function parseCraftMode() {
    const cm=document.querySelector('.crafting-module');
    if (!cm) { S.craftMode=null; return; }
    S.craftMode=cm.classList.contains('crafting-module--smash')?'Smash':'Assemble';
  }

  /* ─── Inventory Staleness ─── */
  const STALE_THRESHOLD = 120000; // 2 minutes
  function isStale() { return !S.lastScanTime || (Date.now() - S.lastScanTime > STALE_THRESHOLD); }
  function scanAge() {
    if (!S.lastScanTime) return 'never';
    const s = Math.round((Date.now() - S.lastScanTime) / 1000);
    if (s < 60) return s + 's ago';
    return Math.round(s/60) + 'm ago';
  }

  /* ─── Smart Recommendations Engine ─── */
  // Only recommend recipes where ALL ingredients exist in current inventory
  // For multi-step: simulate consumption between steps
  function getDirectCrafts(inv) {
    const ht = S.ownedHammers.length ? Math.max(...S.ownedHammers.map(h=>HAMMER_TIERS.indexOf(h))) : -1;
    return RECIPES.filter(r => {
      if (r.label === 'Junk Cube') return false;
      if (!canMake(r, inv)) return false;
      // Filter owned hammers
      const hk = {'Tin Hammer':'hammer_t1','Bronze Hammer':'hammer_t2','Mithril Hammer':'hammer_t3',
        'Adamantine Hammer':'hammer_t4','Diamond Hammer':'hammer_t5'}[r.label];
      if (hk) { const ot = HAMMER_TIERS.indexOf(hk); if (ot<=ht||ot>ht+1) return false; }
      return true;
    }).sort((a,b) => (RECIPE_VALUE[b.label]||5) - (RECIPE_VALUE[a.label]||5));
  }

  // Consume items from a virtual inventory copy
  function consumeInputs(vInv, recipe) {
    const vi = Object.assign({}, vInv);
    for (const token of recipe.inputs) {
      const group = TOKEN_GROUPS[token];
      if (group) {
        // Consume from the first available group member
        for (const k of group) {
          if ((vi[k]||0) > 0) { vi[k]--; break; }
        }
      } else {
        if ((vi[token]||0) > 0) vi[token]--;
      }
    }
    return vi;
  }

  // Build top 3 action plans: direct crafts + 2-step chains with consumption
  function getActionPlans(inv) {
    if (isStale()) return []; // Don't recommend on stale data

    const plans = [];
    const directCrafts = getDirectCrafts(inv);

    // Phase 1: Direct crafts (all ingredients in hand)
    for (const r of directCrafts) {
      const value = RECIPE_VALUE[r.label] || 5;
      const fragile = r.inputs.some(t => {
        const group = TOKEN_GROUPS[t];
        if (group) return cnt(inv, group) <= 1;
        return (inv[t]||0) <= 1;
      });
      plans.push({
        goal: r.label, value, type: 'direct', fragile,
        steps: [{ label: r.label, inputs: r.inputs.map(tokHuman).join(' + '), ready: true }]
      });
    }

    // Phase 2: 2-step chains (craft prereq → then craft goal)
    // Only if prereq is directly craftable AND after consuming prereq inputs, goal is craftable
    const ht = S.ownedHammers.length ? Math.max(...S.ownedHammers.map(h=>HAMMER_TIERS.indexOf(h))) : -1;
    const PREREQ_MAP = {
      'pollen_tin':['Tin Pollen'],'pollen_bronze':['Bronze Pollen'],
      'pollen_mithril':['Mithril Pollen'],'pollen_adamantine':['Adamantine Pollen'],
      'cattail':['Nectar / Cattail Bridge'],'nectar':['Nectar / Cattail Bridge'],
      'pinecone':['Pinecone / Moss / Gunpowder Bridge'],'moss':['Pinecone / Moss / Gunpowder Bridge'],
      'gunpowder':['Pinecone / Moss / Gunpowder Bridge'],
      'junk_cube_t1':['Junk Cube'],'junk_cube_t2':['Junk Tesseract']
    };

    for (const recipe of RECIPES) {
      if (recipe.label === 'Junk Cube') continue;
      const hk = {'Tin Hammer':'hammer_t1','Bronze Hammer':'hammer_t2','Mithril Hammer':'hammer_t3',
        'Adamantine Hammer':'hammer_t4','Diamond Hammer':'hammer_t5'}[recipe.label];
      if (hk) { const ot = HAMMER_TIERS.indexOf(hk); if (ot<=ht||ot>ht+1) continue; }
      if (canMake(recipe, inv)) continue; // Already a direct craft, skip

      // Find what's missing
      const needed = {};
      for (const t of recipe.inputs) needed[t] = (needed[t]||0) + 1;
      const missing = [];
      for (const [token, times] of Object.entries(needed)) {
        const group = TOKEN_GROUPS[token];
        const have = group ? cnt(inv, group) : (inv[token]||0);
        if (have < times) missing.push(token);
      }

      // Only handle 1 missing ingredient (2-step chain)
      if (missing.length !== 1) continue;
      const missingToken = missing[0];
      const prereqLabels = PREREQ_MAP[missingToken];
      if (!prereqLabels) continue; // Can't craft this ingredient

      for (const prereqLabel of prereqLabels) {
        const prereq = RECIPES.find(x => x.label === prereqLabel);
        if (!prereq || !canMake(prereq, inv)) continue;

        // Simulate: consume prereq inputs, add output, check if goal is now craftable
        let vInv = consumeInputs(inv, prereq);
        // Add the prereq output to virtual inventory
        vInv[missingToken] = (vInv[missingToken]||0) + 1;
        if (canMake(recipe, vInv)) {
          const value = RECIPE_VALUE[recipe.label] || 5;
          plans.push({
            goal: recipe.label, value: value - 5, type: '2-step',
            steps: [
              { label: prereq.label, inputs: prereq.inputs.map(tokHuman).join(' + '), ready: true, note: prereq.type === 'smash' ? 'RNG' : null },
              { label: recipe.label, inputs: recipe.inputs.map(tokHuman).join(' + '), ready: false }
            ]
          });
        }
      }
    }

    // Deduplicate: keep highest-value version of each goal
    const seen = new Set();
    const unique = [];
    plans.sort((a,b) => b.value - a.value);
    for (const p of plans) {
      // Normalize goal name (strip alt/variant suffixes)
      const base = p.goal.replace(/ \(alt\)$| \(Stag\)$| \(Bomb\)$/,'');
      if (!seen.has(base)) {
        seen.add(base);
        unique.push(p);
      }
    }

    // Cross-plan consumption check: deduct shared resources
    const finalPlans = [];
    let sharedInv = Object.assign({}, inv);
    for (const plan of unique) {
      // Verify all steps still work with shared inventory
      let ok = true;
      let testInv = Object.assign({}, sharedInv);
      for (const step of plan.steps) {
        const r = RECIPES.find(x => x.label === step.label);
        if (!r || !canMake(r, testInv)) { ok = false; break; }
        testInv = consumeInputs(testInv, r);
      }
      if (ok) {
        finalPlans.push(plan);
        // Deduct from shared inventory so next plan doesn't double-count
        for (const step of plan.steps) {
          const r = RECIPES.find(x => x.label === step.label);
          if (r) sharedInv = consumeInputs(sharedInv, r);
        }
      }
      if (finalPlans.length >= 3) break;
    }

    return finalPlans;
  }

  /* ─── Auto-Claim / Hunt ─── */
  let _lastClaimTime = 0, _lastHuntTime = 0;
  function tryAutoClaim() {
    if (!S.autoClaim || _scanning) return;
    if (Date.now() - _lastClaimTime < 30000) return;
    const btn=document.querySelector('.beetle-catch-module__catch-button:not(.disabled):not(.disconnected)');
    if (btn) {
      btn.click(); _lastClaimTime = Date.now();
      logEvent('Auto-claimed beetle! Waiting for reward...');
      setTimeout(() => { logEvent('Post-claim scan'); fullScan(); }, 10000);
    }
  }
  function tryAutoHunt() {
    if (!S.autoHunt || _scanning) return;
    if ((S.mergedInventory.cheese||0) < 100) return;
    if (Date.now() - _lastHuntTime < 30000) return;
    const btn=document.querySelector('.beetle-catch-module__hunt-button:not(.disabled):not(.disconnected)');
    if (btn) {
      btn.click(); _lastHuntTime = Date.now();
      logEvent('Auto-hunted! (-20 cheese)');
      setTimeout(() => { logEvent('Post-hunt scan'); fullScan(); }, 10000);
    }
  }

  /* ─── Styles ─── */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style'); s.id=STYLE_ID;
    s.textContent = `
#${BTN_ID}{position:fixed;left:20px;bottom:20px;z-index:999999;padding:10px 14px;
  background:#d7f4f7;color:#11383d;border:1px solid #9bd8e0;border-radius:12px;
  font-weight:700;cursor:pointer;font-size:14px;}
#${BTN_ID}:hover{background:#c0edf2;}
#${PANEL_ID}{position:fixed;left:20px;top:60px;z-index:999999;width:340px;
  background:#fff;border:2px solid #b8e6ec;border-radius:16px;padding:14px;
  box-shadow:0 14px 40px rgba(0,0,0,.18);font-family:Arial,sans-serif;color:#163238;
  max-height:calc(100vh - 80px);display:flex;flex-direction:column;gap:6px;overflow:hidden;}
#${PANEL_ID}.hidden{display:none!important;}
.bc7-header{display:flex;align-items:center;justify-content:space-between;}
.bc7-title{font-size:20px;font-weight:800;}
.bc7-lv{font-size:12px;color:#5a7379;font-weight:700;}
.bc7-btns{display:flex;gap:4px;flex-wrap:wrap;}
.bc7-btn{background:#d9f2f6;color:#17363b;border:1px solid #b8e6ec;border-radius:8px;
  padding:5px 8px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;}
.bc7-btn:hover{background:#c0edf2;}.bc7-btn.on{background:#17363b;color:#fff;}
.bc7-card{background:#fafeff;border:1px solid #d5eef2;border-radius:10px;padding:10px;flex-shrink:0;}
.bc7-scroll{background:#fafeff;border:1px solid #d5eef2;border-radius:10px;padding:10px;
  overflow-y:auto;overflow-x:hidden;flex-shrink:1;flex-grow:0;min-height:40px;}
.bc7-scroll::-webkit-scrollbar{width:5px;}
.bc7-scroll::-webkit-scrollbar-thumb{background:#b8e6ec;border-radius:3px;}
.bc7-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;font-size:12px;line-height:1.4;}
.bc7-row-name{display:flex;align-items:center;gap:4px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px;}
.bc7-h{font-weight:800;font-size:13px;margin-bottom:6px;color:#11383d;}
.bc7-muted{color:#6b8a90;font-size:11px;}
.bc7-tier{font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;color:#fff;flex-shrink:0;}
.bc7-val{font-weight:700;text-align:right;white-space:nowrap;}
.bc7-best-item{padding:4px 0;border-bottom:1px solid #e8f4f7;}
.bc7-best-item:last-child{border-bottom:none;}
.bc7-best-name{font-weight:800;font-size:14px;color:#11383d;}
.bc7-recipe{padding:4px 0;border-bottom:1px solid #eef5f7;}
.bc7-recipe:last-child{border-bottom:none;}
.bc7-recipe-name{font-weight:700;font-size:12px;}
.bc7-jd{font-size:10px;color:#8a9a9a;margin-left:4px;}
.bc7-ready{color:#27ae60;font-weight:800;}
.bc7-timer{color:#e67e22;font-weight:700;}
.bc7-log-line{font-size:10px;color:#6b8a90;line-height:1.5;border-bottom:1px solid #f0f7f9;padding:1px 0;}
.bc7-bar{display:flex;gap:3px;margin-bottom:6px;}
    `;
    document.head.appendChild(s);
  }

  /* ─── Render ─── */
  function renderPanel() {
    let panel=document.getElementById(PANEL_ID);
    if (!panel || panel.classList.contains('hidden')) return;
    const inv=S.mergedInventory||{};
    const timers=S.timers||{};
    const stale = isStale();
    const plans = getActionPlans(inv);
    const directCrafts = stale ? [] : getDirectCrafts(inv);
    const fmtT = (v) => {
      if (!v) return '<span class="bc7-muted">\u2014</span>';
      if (/ready/i.test(v)) return '<span class="bc7-ready">Ready!</span>';
      return '<span class="bc7-timer">'+v+'</span>';
    };

    let h='';
    // Header
    const cheeseStr = inv.cheese ? inv.cheese.toLocaleString() + ' \u{1F9C0}' : '';
    h+=`<div class="bc7-header"><span class="bc7-title">\u{1FAB2} Beetle Coach</span>
      <span class="bc7-lv">${S.level?'Lv.'+S.level:''}${cheeseStr?' \u00B7 '+cheeseStr:''}</span></div>`;

    // Buttons
    h+=`<div class="bc7-btns">
      <button class="bc7-btn" id="bc7-fs">Full Scan</button>
      <button class="bc7-btn ${S.autoClaim?'on':''}" id="bc7-ac">Claim ${S.autoClaim?'ON':'OFF'}</button>
      <button class="bc7-btn ${S.autoHunt?'on':''}" id="bc7-ah">Hunt ${S.autoHunt?'ON':'OFF'}</button>
      <button class="bc7-btn" id="bc7-mc">Miladychan</button>
      <button class="bc7-btn" id="bc7-wk">Wiki</button>
      <button class="bc7-btn" id="bc7-rst" style="color:#c0392b;border-color:#e6b0aa;">Reset</button></div>`;

    // Status
    h+=`<div class="bc7-card"><div class="bc7-h">Status</div>
      <div class="bc7-row"><div>Hammer</div><div class="bc7-val">${S.currentHammer?dn(S.currentHammer):'\u2014'}</div></div>
      <div class="bc7-row"><div>Bonus / Break</div><div class="bc7-val">${S.currentHammerBonus!=null?'+'+S.currentHammerBonus+'% / '+S.currentHammerBreakChance+'%':'\u2014'}</div></div>
      <div class="bc7-row"><div>Beetle Claim</div><div class="bc7-val" id="bc7-t-claim">${fmtT(timers.beetleCatch)}</div></div>
      <div class="bc7-row"><div>Hunt Cooldown</div><div class="bc7-val" id="bc7-t-hunt">${fmtT(timers.huntCooldown)}</div></div>
      <div class="bc7-row"><div>Daily Cheese</div><div class="bc7-val" id="bc7-t-cheese">${fmtT(timers.dailyCheese)}</div></div>
      ${S.craftMode?`<div class="bc7-row"><div>Mode</div><div class="bc7-val">${S.craftMode}</div></div>`:''}
      <div class="bc7-row"><div>Inventory</div><div class="bc7-val">${stale?'<span style="color:#e74c3c;font-weight:800">STALE</span>':'<span style="color:#27ae60">'+scanAge()+'</span>'}</div></div></div>`;

    // Staleness warning
    if (stale) {
      h+=`<div class="bc7-card" style="background:#fff3f3;border-color:#e6b0aa;">
        <div style="color:#c0392b;font-weight:800;font-size:12px;">Inventory data is stale. Hit Full Scan for accurate recommendations.</div></div>`;
    }

    // Best moves (top 3 action plans)
    h+=`<div class="bc7-card"><div class="bc7-h">Next moves</div>`;
    if (!plans.length) {
      if (stale) {
        h+=`<div class="bc7-muted">Scan inventory first.</div>`;
      } else {
        h+=`<div class="bc7-muted">No craftable moves found. Farm more materials.</div>`;
      }
    } else {
      plans.forEach((p,i) => {
        const fragileTag = p.fragile ? ' <span style="color:#e67e22;font-size:10px;">(verify qty)</span>' : '';
        h+=`<div class="bc7-best-item">
          <div class="bc7-best-name">${i+1}. ${p.goal}${fragileTag}</div>`;
        p.steps.forEach((step, si) => {
          const check = step.ready ? '\u2705' : '\u{1F536}';
          const rng = step.note === 'RNG' ? ' <span style="color:#e67e22;font-size:10px;">(RNG)</span>' : '';
          if (p.steps.length === 1) {
            h+=`<div class="bc7-muted">${check} ${step.inputs}${rng}</div>`;
          } else {
            h+=`<div class="bc7-muted">${check} Step ${si+1}: ${step.label} <span style="color:#9ab">(${step.inputs})</span>${rng}</div>`;
          }
        });
        h+=`</div>`;
      });
    }
    h+=`</div>`;

    // Progression tracker
    const stage = getStage(inv);
    const {next, goals} = getNextStageGoals(inv, stage);
    h+=`<div class="bc7-card"><div class="bc7-h">Progression</div>
      <div style="display:flex;gap:3px;margin-bottom:6px;">`;
    for (let i=1;i<=7;i++) {
      const color = i<=stage ? TIER_COLORS[['Tin','Bronze','Mithril','Adamantine','Rare','Epic','Legendary'][i-1]] : '#d5e8ec';
      h+=`<div style="flex:1;height:6px;border-radius:3px;background:${color};" title="Stage ${i}"></div>`;
    }
    h+=`</div><div class="bc7-row"><div>Stage ${stage} / 7</div><div class="bc7-val">${STAGES[stage-1]?STAGES[stage-1].name:'Starting'}</div></div>`;
    if (next && goals.length) {
      h+=`<div class="bc7-muted" style="margin-top:4px;">Next: <b>${next.name}</b> \u2014 ${next.desc}</div>`;
      h+=`<div class="bc7-muted">Need: ${goals.join(', ')}</div>`;
    } else if (stage >= 7) {
      h+=`<div class="bc7-muted" style="margin-top:4px;">Endgame reached. Push for Hercules!</div>`;
    }
    h+=`</div>`;

    // Collection tracker
    const col = getCollection(inv);
    h+=`<div class="bc7-card"><div class="bc7-h">Collection</div>
      <div class="bc7-row"><div>Beetles</div><div class="bc7-val">${col.ownedB.length} / ${col.totalB}</div></div>
      <div class="bc7-row"><div>Flowers</div><div class="bc7-val">${col.ownedF.length} / ${col.totalF}</div></div>`;
    const allMissing = [...col.missingB.map(k=>dn(k)), ...col.missingF.map(k=>dn(k))];
    if (allMissing.length && allMissing.length <= 10) {
      h+=`<div class="bc7-muted" style="margin-top:4px;">Missing: ${allMissing.join(', ')}</div>`;
    } else if (allMissing.length > 10) {
      h+=`<div class="bc7-muted" style="margin-top:4px;">Missing ${allMissing.length} items</div>`;
    }
    h+=`</div>`;

    // You can make (scrollable) - only direct crafts
    h+=`<div class="bc7-scroll" style="max-height:140px;"><div class="bc7-h">You can make (${directCrafts.length})</div>`;
    if (!directCrafts.length) {
      h+=`<div class="bc7-muted">${stale ? 'Scan first.' : 'No recipes available.'}</div>`;
    } else {
      directCrafts.forEach(r => {
        h+=`<div class="bc7-recipe"><div class="bc7-recipe-name">${r.label}</div>
          <div class="bc7-muted">${r.inputs.map(tokHuman).join(' + ')}</div></div>`;
      });
    }
    h+=`</div>`;

    // Inventory (scrollable)
    h+=`<div class="bc7-scroll" style="max-height:250px;"><div class="bc7-h">Inventory</div>`;
    const junkTotal=cnt(inv,ANY_JUNK); const junkTypes=ANY_JUNK.filter(k=>(inv[k]||0)>0).length;
    const displayItems=Object.keys(inv).filter(k=>!JUNK_SET.has(k)&&!SKIP_DISPLAY.has(k)&&k!=='cheese')
      .sort((a,b)=>(inv[b]||0)-(inv[a]||0));
    displayItems.forEach(k => {
      const tier=TIER_MAP[k];
      const badge=tier?`<span class="bc7-tier" style="background:${TIER_COLORS[tier]||'#888'}">${tier}</span>`:'';
      h+=`<div class="bc7-row"><div class="bc7-row-name">${dn(k)} ${badge}</div><div class="bc7-val">${inv[k]}</div></div>`;
    });
    if (junkTotal > 0) {
      h+=`<div class="bc7-row"><div class="bc7-row-name">Junk Items <span class="bc7-tier" style="background:#888">Junk</span></div>
        <div class="bc7-val">${junkTotal} <span class="bc7-jd">(${junkTypes} types)</span></div></div>`;
    }
    h+=`</div>`;

    // Activity Log (scrollable)
    h+=`<div class="bc7-scroll" style="max-height:120px;flex:1;"><div class="bc7-h">Activity Log</div>
      <div id="bc7-log">${S.log.slice().reverse().map(l=>'<div class="bc7-log-line">'+l+'</div>').join('')}</div></div>`;

    panel.innerHTML=h;

    // Bind
    document.getElementById('bc7-fs').addEventListener('click', function() {
      fullScan();
    });
    document.getElementById('bc7-ac').addEventListener('click', function() {
      S.autoClaim = !S.autoClaim;
      save();
      renderPanel();
    });
    document.getElementById('bc7-ah').addEventListener('click', function() {
      S.autoHunt = !S.autoHunt;
      save();
      renderPanel();
    });
    document.getElementById('bc7-mc').addEventListener('click', function() {
      window.open('https://boards.miladychan.org/v/324142', '_blank');
    });
    document.getElementById('bc7-wk').addEventListener('click', function() {
      window.open('https://beetle.wiki/doku.php?id=start', '_blank');
    });
    document.getElementById('bc7-rst').addEventListener('click', function() {
      if (confirm('Clear all data and rescan?')) {
        resetStore();
        fullScan();
      }
    });
  }

  /* ─── UI ─── */
  function ensureUI() {
    injectStyles();
    if (!document.getElementById(BTN_ID)) {
      const btn=document.createElement('button'); btn.id=BTN_ID;
      btn.textContent='\u{1FAB2} Beetle Coach';
      btn.addEventListener('click',() => {
        let p=document.getElementById(PANEL_ID);
        if (!p) { p=document.createElement('div'); p.id=PANEL_ID; document.body.appendChild(p); }
        p.classList.toggle('hidden');
        S.panelOpen=!p.classList.contains('hidden'); save();
        if (S.panelOpen) { parseTimers(); renderPanel(); }
      });
      document.body.appendChild(btn);
    }
    if (!document.getElementById(PANEL_ID)) {
      const p=document.createElement('div'); p.id=PANEL_ID;
      if (!S.panelOpen) p.classList.add('hidden');
      document.body.appendChild(p);
    }
  }

  /* ─── Boot ─── */
  let _booted = false;
  let _intervals = [];
  function boot() {
    if (_booted) return; _booted = true;
    // Clear any existing intervals from previous boot cycles
    _intervals.forEach(id => clearInterval(id));
    _intervals = [];
    ensureUI();
    fullScan();
    _intervals.push(setInterval(refreshTimers, 5000));
    _intervals.push(setInterval(() => { tryAutoClaim(); tryAutoHunt(); }, 10000));
    console.log('[BeetleCoach v8.0] booted');
  }
  function safeBoot() { try { boot(); } catch(e) { console.warn('[BC] boot fail',e); } }
  if (document.readyState==='complete'||document.readyState==='interactive') {
    setTimeout(safeBoot,1500);
  } else {
    window.addEventListener('load',()=>setTimeout(safeBoot,1500));
  }
  setTimeout(safeBoot,3000); setTimeout(safeBoot,5000);
  const obs=new MutationObserver(()=>{
    if (!document.getElementById(BTN_ID)) { _booted=false; setTimeout(safeBoot,500); }
  });
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
