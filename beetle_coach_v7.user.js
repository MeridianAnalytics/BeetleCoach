// ==UserScript==
// @name         Remilia Beetle Coach
// @namespace    http://tampermonkey.net/
// @version      8.6.0
// @description  BeetleBoy coach: auto-claim, smart pathways, tier labels, resilient scanning, activity log.
// @match        https://www.remilia.net/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
  'use strict';

  /* ─── Config ─── */
  const CURRENT_VER = '8.6.0';
  const OLD_STORE_KEY = 'beetle_coach_v7_store';
  const STORE_KEY = 'beetle_coach_v8_store';
  const PANEL_ID = 'bc8-panel';
  const BTN_ID = 'bc8-toggle';
  const STYLE_ID = 'bc8-style';
  const STALE_THRESHOLD = 120000; // 2 min
  const HUNT_COST = 20;
  const MIN_CHEESE_RESERVE = 100;
  const PASSIVE_SCAN_INTERVAL = 30000; // 30s
  const TIMER_INTERVAL = 5000;
  const ACTION_INTERVAL = 10000;

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
    {label:'Tin Pollen',type:'assemble',inputs:['any_tin_flower','any_tin_flower'],notes:'Any 2 Tin flowers.'},
    {label:'Bronze Pollen',type:'assemble',inputs:['any_bronze_flower','any_bronze_flower'],notes:'Any 2 Bronze flowers.'},
    {label:'Mithril Pollen',type:'assemble',inputs:['any_mithril_flower','any_mithril_flower'],notes:'Any 2 Mithril flowers.'},
    {label:'Adamantine Pollen',type:'assemble',inputs:['any_adamantine_flower','any_adamantine_flower'],notes:'Any 2 Adamantine flowers.'},
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
    {label:'Giraffe Weevil',type:'smash',inputs:['royal_poinciana','pond'],notes:'Royal Poinciana + Pond.'},
    {label:'Giraffe Weevil (alt)',type:'smash',inputs:['royal_poinciana','monarch'],notes:'Royal Poinciana + Monarch.'},
    {label:'Pillbug',type:'smash',inputs:['camellia','pond'],notes:'Camellia + Pond.'},
    {label:'Pillbug (alt)',type:'smash',inputs:['camellia','monarch'],notes:'Camellia + Monarch.'},
    {label:'Imperial Tortoise Beetle',type:'smash',inputs:['morning_glory','pond'],notes:'Morning Glory + Pond.'},
    {label:'Imperial Tortoise Beetle (alt)',type:'smash',inputs:['morning_glory','monarch'],notes:'Morning Glory + Monarch.'},
    {label:'Sabertooth Longhorn Beetle',type:'smash',inputs:['pincushion','goliath'],notes:'Pincushion + Goliath.'},
    {label:'Sabertooth Longhorn (Stag)',type:'smash',inputs:['pincushion','stag'],notes:'Pincushion + Stag.'},
    {label:'Sabertooth Longhorn (Bomb)',type:'smash',inputs:['pincushion','bombardier'],notes:'Pincushion + Bombardier.'},
    {label:'Sunset Moth',type:'smash',inputs:['gazania','goliath'],notes:'Gazania + Goliath.'},
    {label:'Sunset Moth (Stag)',type:'smash',inputs:['gazania','stag'],notes:'Gazania + Stag.'},
    {label:'Sunset Moth (Bomb)',type:'smash',inputs:['gazania','bombardier'],notes:'Gazania + Bombardier.'},
    {label:'Black Lotus',type:'smash',inputs:['gunpowder','moss','pinecone'],notes:'All 3 Mithril artifacts.'},
    {label:'Mars Rhino Beetle',type:'smash',inputs:['black_lotus','sunset_moth','sabertooth_longhorn'],notes:'Black Lotus + Sunset + Sabertooth.'},
    {label:'Hercules Beetle',type:'smash',inputs:['golden_scarab','pollen_adamantine','purple'],notes:'Golden Scarab + Adamantine Pollen + Purple.'}
  ];
  const RECIPE_VALUE = {
    'Hercules Beetle':100,'Mars Rhino Beetle':95,'Black Lotus':88,'Diamond Hammer':82,
    'Sabertooth Longhorn Beetle':78,'Sunset Moth':78,'Sabertooth Longhorn (Stag)':78,'Sabertooth Longhorn (Bomb)':78,
    'Sunset Moth (Stag)':78,'Sunset Moth (Bomb)':78,'Adamantine Pollen':75,'Adamantine Hammer':65,
    'Goliath Beetle':60,'Goliath Beetle (alt)':60,'Stag Beetle':60,
    'Bombardier Beetle':55,'Bombardier Beetle (alt)':55,
    'Giraffe Weevil':55,'Giraffe Weevil (alt)':55,'Pillbug':55,'Pillbug (alt)':55,
    'Imperial Tortoise Beetle':55,'Imperial Tortoise Beetle (alt)':55,
    'Pinecone / Moss / Gunpowder Bridge':50,'Nectar / Cattail Bridge':40,'Mithril Pollen':40,
    'Mithril Hammer':30,'Pond Beetle':25,'Monarch':25,'Monarch (alt)':25,
    'Bronze Hammer':15,'Bronze Pollen':12,'Junk Tesseract':8,'Tin Hammer':6,'Tin Pollen':5,'Junk Cube':1
  };

  /* ─── Progression ─── */
  const ALL_BEETLES = ['green','ladybug','purple','pond','monarch','goliath','stag','bombardier',
    'giraffe_weevil','pillbug','imperial_tortoise','sabertooth_longhorn','sunset_moth',
    'mars_rhino','golden_scarab','hercules','skull','christmas'];
  const ALL_FLOWERS = ['daisy','poppy','sunflower','marigold','gallic_rose','milk_thistle',
    'royal_poinciana','camellia','morning_glory','pincushion','gazania','black_lotus'];
  const COLLECTIBLES = new Set([...ALL_BEETLES, ...ALL_FLOWERS]);
  const STAGES = [
    {n:1,name:'Gathering',check:['green'],desc:'Farm beetles + junk'},
    {n:2,name:'Pollen & Bridges',check:['pollen_tin'],desc:'Craft pollen, generate bridges'},
    {n:3,name:'Mithril Beetles',check:['pond','monarch'],desc:'Craft Pond + Monarch'},
    {n:4,name:'Adamantine Beetles',check:['bombardier','stag','goliath'],desc:'Craft Goliath/Stag/Bombardier'},
    {n:5,name:'Rare Beetles',check:['giraffe_weevil','pillbug','imperial_tortoise'],desc:'Mithril flower + beetle'},
    {n:6,name:'Epic Beetles',check:['sabertooth_longhorn','sunset_moth'],desc:'Adamantine flower + beetle'},
    {n:7,name:'Endgame',check:['black_lotus','mars_rhino','hercules'],desc:'Black Lotus, Mars Rhino, Hercules'}
  ];
  function getStage(inv) {
    let completed = 0;
    for (const s of STAGES) {
      if (s.check.every(function(k) { return (inv[k]||0) > 0; })) { completed = s.n; }
      else { break; }
    }
    return completed;
  }
  function getNextStageGoals(inv, stage) {
    if (stage >= 7) { return {next:null, goals:[]}; }
    const next = STAGES[stage];
    if (!next) { return {next:null, goals:[]}; }
    const missing = next.check.filter(function(k) { return !(inv[k]||0); });
    return {next:next, goals:missing.map(function(k) { return dn(k); })};
  }
  function getCollection(inv) {
    var ownedB = ALL_BEETLES.filter(function(k) { return (inv[k]||0) > 0; });
    var ownedF = ALL_FLOWERS.filter(function(k) { return (inv[k]||0) > 0; });
    var missingB = ALL_BEETLES.filter(function(k) { return !(inv[k]||0); });
    var missingF = ALL_FLOWERS.filter(function(k) { return !(inv[k]||0); });
    return {ownedB:ownedB,ownedF:ownedF,missingB:missingB,missingF:missingF,totalB:ALL_BEETLES.length,totalF:ALL_FLOWERS.length};
  }

  /* ─── Filters ─── */
  const BLOCKLIST = /^(svg|icon|button|slot|empty|more|smash|eject|assemble|home|search|left|right|go_back|show_password|claim|load|logo|dots|arrow|cheeseman|static\d*|beetleboy_logo|beetle_catch|craft|beetle_shader)$/i;
  const PFP_HASH = /^(pfp_\d+|retart|remilio|radbro|default|[a-f0-9]{20,})$/i;

  /* ─── Store with migration ─── */
  function defaults() {
    return {ver:CURRENT_VER,mergedInventory:{},currentHammer:null,ownedHammers:[],brokenHammers:[],discoveredHammers:[],
      currentHammerBonus:null,currentHammerBreakChance:null,
      timers:{},lastFullScan:0,lastPassiveScan:0,autoClaim:true,autoHunt:false,panelOpen:true,level:null,craftMode:null,
      log:[],
      session:{claims:0,hunts:0,cheeseClaims:0,cheeseGained:0,beetles:[],startTime:Date.now()}};
  }
  function load() {
    try {
      // Try new key first
      var raw = GM_getValue(STORE_KEY, null);
      // Migrate from old key if needed
      if (!raw) {
        raw = GM_getValue(OLD_STORE_KEY, null);
        if (raw) {
          GM_setValue(STORE_KEY, raw);
          console.log('[BC] Migrated store from v7 to v8 key');
        }
      }
      if (!raw) { return defaults(); }
      var p = Object.assign(defaults(), JSON.parse(raw));
      if (p.ver !== CURRENT_VER) { p.mergedInventory = {}; p.ver = CURRENT_VER; p.log = []; }
      return p;
    } catch(e) { return defaults(); }
  }
  function save() { try { GM_setValue(STORE_KEY, JSON.stringify(S)); } catch(e) {} }
  function resetStore() { S = defaults(); save(); renderPanel(); }
  var S = load();

  /* ─── Activity Log ─── */
  function logEvent(msg) {
    var ts = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    S.log.push(ts + ' ' + msg);
    if (S.log.length > 30) { S.log = S.log.slice(-30); }
    save();
    var el = document.getElementById('bc8-log');
    if (el) {
      el.innerHTML = S.log.slice().reverse().map(function(l) { return '<div class="bc8-log-line">' + l + '</div>'; }).join('');
    }
  }

  /* ─── Helpers ─── */
  function norm(raw) {
    if (!raw) { return null; }
    var k = String(raw).toLowerCase().trim().replace(/\.[a-z0-9]+$/i,'')
      .replace(/%20/g,'_').replace(/[^\w]+/g,'_').replace(/^_+|_+$/g,'');
    return ITEM_ALIASES[k] || k;
  }
  function dn(k) { return LABELS[k] || k; }
  function cnt(inv, arr) { return arr.reduce(function(s,k) { return s + (inv[k]||0); }, 0); }
  function tokHuman(t) {
    var m = {any_junk:'any junk',any_tin_flower:'Tin flowers x2',any_bronze_flower:'Bronze flower',
      any_mithril_flower:'Mithril flower',any_adamantine_flower:'Adamantine flower',
      any_bronze_beetle:'Bronze beetle',any_mithril_beetle:'Mithril beetle'};
    return m[t] || dn(t);
  }
  function canMake(r, inv) {
    var needed = {};
    for (var i = 0; i < r.inputs.length; i++) {
      var t = r.inputs[i];
      needed[t] = (needed[t]||0) + 1;
    }
    for (var token in needed) {
      var times = needed[token];
      var group = TOKEN_GROUPS[token];
      if (group) { if (cnt(inv,group) < times) { return false; } }
      else { if ((inv[token]||0) < times) { return false; } }
    }
    return true;
  }
  function isValid(k) { return k && !BLOCKLIST.test(k) && !PFP_HASH.test(k); }

  /* ─── FIX 1: Layered Item Extraction ─── */
  var _unresolvedCount = 0;
  function resolveItemKey(itemEl, imgEl) {
    // Source 1: background-image URL (primary)
    if (imgEl) {
      var bg = (imgEl.style && imgEl.style.backgroundImage) || '';
      if (!bg || bg === 'none') {
        try { bg = getComputedStyle(imgEl).backgroundImage || ''; } catch(e) {}
      }
      var m = bg.match(/\/beetle\/images\/icons\/[^/]+\/([^."')]+)\.(png|jpg|webp|gif|svg)/i);
      if (m && m[1]) { return norm(m[1]); }
    }
    // Source 2: <img src> tag inside the image element
    if (imgEl) {
      var img = imgEl.querySelector('img') || (imgEl.tagName === 'IMG' ? imgEl : null);
      if (img) {
        var src = img.getAttribute('src') || '';
        var m2 = src.match(/\/beetle\/images\/icons\/[^/]+\/([^."'?#]+)\.(png|jpg|webp|gif|svg)/i);
        if (m2 && m2[1]) { return norm(m2[1]); }
        // Fallback: any filename from src
        var m3 = src.match(/\/([^/."'?#]+)\.(png|jpg|webp|gif|svg)/i);
        if (m3 && m3[1]) { return norm(m3[1]); }
      }
    }
    // Source 3: alt, title, aria-label
    var candidates = imgEl ? [imgEl, itemEl] : [itemEl];
    for (var ci = 0; ci < candidates.length; ci++) {
      var el = candidates[ci];
      if (!el) { continue; }
      var txt = el.getAttribute('alt') || el.getAttribute('title') || el.getAttribute('aria-label') || '';
      if (txt) { return norm(txt); }
    }
    return null;
  }

  /* ─── Scanning ─── */
  function scanPage(sel, imgCls, cntCls) {
    var r = {};
    var unresolved = 0;
    document.querySelectorAll(sel).forEach(function(item) {
      var imgEl = item.querySelector(imgCls);
      var k = resolveItemKey(item, imgEl);
      if (!k || !isValid(k)) { unresolved++; return; }
      var el = item.querySelector(cntCls);
      var c = el ? (parseInt(el.textContent.trim(), 10) || 1) : 1;
      r[k] = Math.max(r[k]||0, c);
    });
    _unresolvedCount += unresolved;
    return r;
  }

  /* ─── FIX 8: Pagination with fingerprinting ─── */
  function fingerprint(items) {
    return Object.keys(items).sort().map(function(k) { return k + ':' + items[k]; }).join(',');
  }

  var _scanning = false;
  async function fullScan() {
    if (_scanning) { return; }
    _scanning = true;
    _unresolvedCount = 0;
    var oldInv = Object.assign({}, S.mergedInventory);
    try {
      var merged = {};
      var merge = function(items) { for (var k in items) { merged[k] = Math.max(merged[k]||0, items[k]); } };
      // Crafting module with fingerprint-based pagination
      var lastFP = '';
      merge(scanPage('.crafting-module__beetle-item:not(.crafting-module__hammer-slot)','.crafting-module__beetle-img','.crafting-module__beetle-item-count'));
      for (var i = 0; i < 20; i++) {
        var more = document.querySelector('.crafting-module__pagination-button');
        if (!more || more.disabled || more.classList.contains('disabled')) { break; }
        more.click();
        await new Promise(function(r) { setTimeout(r, 400); });
        var page = scanPage('.crafting-module__beetle-item:not(.crafting-module__hammer-slot)','.crafting-module__beetle-img','.crafting-module__beetle-item-count');
        var fp = fingerprint(page);
        if (fp === lastFP) { break; } // Page didn't change
        lastFP = fp;
        merge(page);
      }
      // Catch module with fingerprint-based pagination
      lastFP = '';
      merge(scanPage('.beetle-catch-module__beetle-item','.beetle-catch-module__beetle-img','.beetle-catch-module__beetle-item-count'));
      for (var j = 0; j < 20; j++) {
        var more2 = document.querySelector('.beetle-catch-module__pagination-button');
        if (!more2 || more2.disabled || more2.classList.contains('disabled')) { break; }
        more2.click();
        await new Promise(function(r) { setTimeout(r, 400); });
        var page2 = scanPage('.beetle-catch-module__beetle-item','.beetle-catch-module__beetle-img','.beetle-catch-module__beetle-item-count');
        var fp2 = fingerprint(page2);
        if (fp2 === lastFP) { break; }
        lastFP = fp2;
        merge(page2);
      }
      if (Object.keys(merged).length > 0) {
        S.mergedInventory = merged;
        var changes = [];
        for (var k in merged) {
          var old = oldInv[k] || 0;
          if (merged[k] > old && !JUNK_SET.has(k) && k !== 'cheese') {
            changes.push(dn(k) + ' +' + (merged[k] - old));
            // Track high-tier beetle catches in session
            if (ALL_BEETLES.indexOf(k) > -1 && k !== 'green') {
              for (var bi = 0; bi < (merged[k] - old); bi++) { S.session.beetles.push(dn(k)); }
            }
          }
        }
        var junkDiff = cnt(merged, ANY_JUNK) - cnt(oldInv, ANY_JUNK);
        if (junkDiff > 0) { changes.push('Junk +' + junkDiff); }
        var cheeseDiff = (merged.cheese||0) - (oldInv.cheese||0);
        if (cheeseDiff !== 0) { changes.push('Cheese ' + (cheeseDiff > 0 ? '+' : '') + cheeseDiff); }
        var summary = changes.length ? changes.join(', ') : 'no changes';
        if (_unresolvedCount > 0) { summary += ' (' + _unresolvedCount + ' unresolved)'; }
        logEvent('Scan: ' + summary);
      } else {
        logEvent('Scan: no items found' + (_unresolvedCount ? ' (' + _unresolvedCount + ' unresolved)' : ''));
      }
    } finally { _scanning = false; }
    parseTimers(); parseHammer(); parseLevel(); parseCraftMode();
    S.lastFullScan = Date.now(); S.lastPassiveScan = Date.now(); save(); renderPanel();
  }

  /* ─── Passive inventory refresh (no pagination, visibility-gated) ─── */
  // Passive scans only CONFIRM existing items, never inflate authoritative inventory
  function passiveScan() {
    if (_scanning) { return; }
    if (document.hidden) { return; }
    var hasGame = document.querySelector('.crafting-module__beetle-item') || document.querySelector('.beetle-catch-module__beetle-item');
    if (!hasGame) { return; }
    var vis = {};
    var merge = function(items) { for (var k in items) { vis[k] = Math.max(vis[k]||0, items[k]); } };
    merge(scanPage('.crafting-module__beetle-item:not(.crafting-module__hammer-slot)','.crafting-module__beetle-img','.crafting-module__beetle-item-count'));
    merge(scanPage('.beetle-catch-module__beetle-item','.beetle-catch-module__beetle-img','.beetle-catch-module__beetle-item-count'));
    if (Object.keys(vis).length > 0) {
      var updated = false;
      for (var k in vis) {
        if (S.mergedInventory.hasOwnProperty(k)) {
          // Update existing items
          if (vis[k] !== S.mergedInventory[k]) {
            S.mergedInventory[k] = vis[k];
            updated = true;
          }
        } else if (isValid(k) && !BLOCKLIST.test(k) && !PFP_HASH.test(k) && vis[k] === 1) {
          // Allow adding genuinely new items (new drops) if:
          // - valid key, not blocklisted, count is exactly 1 (conservative)
          S.mergedInventory[k] = vis[k];
          updated = true;
          logEvent('New item detected: ' + dn(k));
        }
      }
      S.lastPassiveScan = Date.now();
      if (updated) { save(); }
    }
    parseTimers(); parseHammer();
  }

  /* ─── Timer refresh (in-place DOM update) ─── */
  function refreshTimers() {
    if (_scanning) { return; }
    parseTimers();
    var fmtT = function(v) {
      if (!v) { return '\u2014'; }
      if (/ready/i.test(v)) { return '<span class="bc8-badge bc8-ready">Ready</span>'; }
      return '<span class="bc8-badge bc8-countdown">' + v + '</span>';
    };
    var bc = document.getElementById('bc8-t-claim'); if (bc) { bc.innerHTML = fmtT(S.timers.beetleCatch); }
    var hc = document.getElementById('bc8-t-hunt'); if (hc) { hc.innerHTML = fmtT(S.timers.huntCooldown); }
    var dc = document.getElementById('bc8-t-cheese'); if (dc) { dc.innerHTML = fmtT(S.timers.dailyCheese); }
    // Update freshness chip (three-band)
    var fc = document.getElementById('bc8-fresh'); if (fc) {
      var conf = scanConfidence();
      var cls = conf === 'fresh' ? 'bc8-fresh-ok' : (conf === 'warming' ? 'bc8-warming' : 'bc8-stale');
      fc.className = 'bc8-badge ' + cls;
      fc.textContent = conf === 'stale' ? 'STALE' : (conf === 'warming' ? scanAge() + ' ~' : scanAge());
    }
  }

  /* ─── Parse Functions ─── */
  function parseTimers() {
    var t = {beetleCatch:null, dailyCheese:null, huntCooldown:null};
    var bc = document.querySelector('.beetle-game-nav .info span:last-child');
    if (bc) { var v = bc.textContent.trim(); if (/\d/.test(v)) { t.beetleCatch = v; } }
    if (!t.beetleCatch) {
      var nav = document.querySelector('.beetle-game-nav .info');
      if (nav && /ready/i.test(nav.textContent)) { t.beetleCatch = 'Ready!'; }
    }
    var dc = document.querySelector('.cheese-claim-nav .info span:last-child');
    if (dc) { var v2 = dc.textContent.trim(); if (/\d/.test(v2)) { t.dailyCheese = v2; } }
    if (!t.dailyCheese) {
      var navC = document.querySelector('.cheese-claim-nav .info');
      if (navC && /ready/i.test(navC.textContent)) { t.dailyCheese = 'Ready!'; }
    }
    var cooldown = document.querySelector('.beetle-catch-module__cooldown-timer');
    if (cooldown) {
      var v3 = cooldown.textContent.trim().replace(/\s*to\s+next\s+claim\s*/i,'').trim();
      if (/\d/.test(v3)) { t.beetleCatch = v3; }
    }
    var huntCost = document.querySelector('.beetle-catch-module__hunt-button-cheese-cost');
    if (huntCost) {
      var txt = huntCost.textContent.trim();
      if (/cooldown/i.test(txt)) {
        var cleaned = txt.replace(/\s*cooldown\s*/i,'').trim();
        if (/\d/.test(cleaned)) { t.huntCooldown = cleaned; }
      } else if (/cheese/i.test(txt)) { t.huntCooldown = 'Ready!'; }
    }
    S.timers = t;
  }
  function parseHammer() {
    var owned = [];   // Available hammers (not broken)
    var broken = [];  // Broken hammers (--empty class)
    var discovered = []; // All discovered (owned + broken)
    document.querySelectorAll('.crafting-module__hammer-row .crafting-module__hammer-slot').forEach(function(s) {
      if (s.classList.contains('crafting-module__hammer-slot--undiscovered')) { return; }
      var img = s.querySelector('.crafting-module__beetle-img'); if (!img) { return; }
      var k = resolveItemKey(s, img);
      if (k && k.indexOf('hammer_t') === 0) {
        discovered.push(k);
        if (s.classList.contains('crafting-module__hammer-slot--empty')) {
          broken.push(k);
        } else {
          owned.push(k);
        }
      }
    });
    owned.sort(function(a,b) { return HAMMER_TIERS.indexOf(b) - HAMMER_TIERS.indexOf(a); });
    S.ownedHammers = owned;
    S.brokenHammers = broken;
    S.discoveredHammers = discovered;
    S.currentHammer = owned[0] || null; // Highest non-broken hammer
    var st = S.currentHammer ? HAMMER_STATS[S.currentHammer] : null;
    S.currentHammerBonus = st ? st.bonus : null;
    S.currentHammerBreakChance = st ? st.baseBreak : null;
  }
  function parseLevel() {
    var el = document.querySelector('.beetle-card__level');
    if (el) { var m = el.textContent.match(/(\d+)/); if (m) { S.level = parseInt(m[1],10); } }
  }
  function parseCraftMode() {
    var cm = document.querySelector('.crafting-module');
    if (!cm) { S.craftMode = null; return; }
    S.craftMode = cm.classList.contains('crafting-module--smash') ? 'Smash' : 'Assemble';
  }

  /* ─── Staleness ─── */
  // Three-band confidence: fresh (full scan recent), warming (passive recent), stale (nothing recent)
  function scanConfidence() {
    var now = Date.now();
    var fullAge = now - (S.lastFullScan || 0);
    var passiveAge = now - (S.lastPassiveScan || 0);
    if (fullAge < STALE_THRESHOLD) { return 'fresh'; }
    if (passiveAge < STALE_THRESHOLD) { return 'warming'; }
    return 'stale';
  }
  function isStale() { return scanConfidence() === 'stale'; }
  function scanAge() {
    var conf = scanConfidence();
    var ts = (conf === 'warming') ? S.lastPassiveScan : S.lastFullScan;
    if (!ts) { return 'never'; }
    var s = Math.round((Date.now() - ts) / 1000);
    var age = s < 60 ? s + 's' : Math.round(s/60) + 'm';
    return conf === 'warming' ? age + ' passive' : age;
  }

  /* ─── Recommendation Engine ─── */
  function wouldConsumeLastCollectible(recipe, inv) {
    for (var i = 0; i < recipe.inputs.length; i++) {
      var token = recipe.inputs[i];
      var group = TOKEN_GROUPS[token];
      if (group) {
        // FIX 3: Check if the member that WOULD be consumed is a singleton collectible
        for (var gi = 0; gi < group.length; gi++) {
          if ((inv[group[gi]]||0) > 0 && COLLECTIBLES.has(group[gi]) && (inv[group[gi]]||0) <= 1) {
            // Check if there's a non-singleton alternative in the group
            var hasAlt = false;
            for (var ai = 0; ai < group.length; ai++) {
              if (ai !== gi && (inv[group[ai]]||0) > 1) { hasAlt = true; break; }
            }
            if (!hasAlt) { return true; }
          }
        }
      } else if (COLLECTIBLES.has(token) && (inv[token]||0) <= 1) {
        return true;
      }
      // Also protect endgame ingredients
      if (!group && isProtectedForGoal(token, inv)) { return true; }
    }
    return false;
  }

  // Map recipe labels to their output item key (for "already owned" filtering)
  var RECIPE_OUTPUT = {
    'Pond Beetle':'pond','Monarch':'monarch','Monarch (alt)':'monarch',
    'Goliath Beetle':'goliath','Goliath Beetle (alt)':'goliath',
    'Stag Beetle':'stag','Bombardier Beetle':'bombardier','Bombardier Beetle (alt)':'bombardier',
    'Giraffe Weevil':'giraffe_weevil','Giraffe Weevil (alt)':'giraffe_weevil',
    'Pillbug':'pillbug','Pillbug (alt)':'pillbug',
    'Imperial Tortoise Beetle':'imperial_tortoise','Imperial Tortoise Beetle (alt)':'imperial_tortoise',
    'Sabertooth Longhorn Beetle':'sabertooth_longhorn','Sabertooth Longhorn (Stag)':'sabertooth_longhorn','Sabertooth Longhorn (Bomb)':'sabertooth_longhorn',
    'Sunset Moth':'sunset_moth','Sunset Moth (Stag)':'sunset_moth','Sunset Moth (Bomb)':'sunset_moth',
    'Mars Rhino Beetle':'mars_rhino','Hercules Beetle':'hercules','Black Lotus':'black_lotus'
  };
  // Items that are consumed as ingredients in higher recipes (need duplicates)
  var NEEDED_AS_INGREDIENT = new Set(['sabertooth_longhorn','sunset_moth','black_lotus']);
  // Protect one copy of endgame ingredients if higher goals are still missing
  function isProtectedForGoal(key, inv) {
    // If Mars Rhino missing, protect one each of its ingredients
    if (!(inv['mars_rhino']||0)) {
      if ((key === 'black_lotus' || key === 'sunset_moth' || key === 'sabertooth_longhorn') && (inv[key]||0) <= 1) {
        return true;
      }
    }
    // If Hercules missing, protect Golden Scarab and Adamantine Pollen
    if (!(inv['hercules']||0)) {
      if ((key === 'golden_scarab' || key === 'pollen_adamantine') && (inv[key]||0) <= 1) {
        return true;
      }
    }
    return false;
  }

  function getDirectCrafts(inv) {
    var ht = S.ownedHammers.length ? Math.max.apply(null, S.ownedHammers.map(function(h) { return HAMMER_TIERS.indexOf(h); })) : -1;
    return RECIPES.filter(function(r) {
      if (r.label === 'Junk Cube') { return false; }
      if (!canMake(r, inv)) { return false; }
      // Hammer filter
      var hk = {'Tin Hammer':'hammer_t1','Bronze Hammer':'hammer_t2','Mithril Hammer':'hammer_t3',
        'Adamantine Hammer':'hammer_t4','Diamond Hammer':'hammer_t5'}[r.label];
      if (hk) { var ot = HAMMER_TIERS.indexOf(hk); if (ot<=ht||ot>ht+1) { return false; } }
      // Don't recommend crafting a beetle/flower you already own
      // UNLESS it's needed as an ingredient for a higher recipe
      var outputKey = RECIPE_OUTPUT[r.label];
      if (outputKey && COLLECTIBLES.has(outputKey) && (inv[outputKey]||0) > 0) {
        if (!NEEDED_AS_INGREDIENT.has(outputKey)) { return false; }
      }
      // Collection protection
      if (wouldConsumeLastCollectible(r, inv)) { return false; }
      return true;
    }).sort(function(a,b) { return (RECIPE_VALUE[b.label]||5) - (RECIPE_VALUE[a.label]||5); });
  }

  /* ─── Smart group consumption: strategic preference within groups ─── */
  // Lower = consume first (cheaper/more expendable)
  var STRATEGIC_VALUE = {
    // Bronze beetles: Ladybug is cheaper to use than Purple (Purple has more high-tier recipe utility)
    ladybug: 1, purple: 3,
    // Mithril beetles: both are bottlenecks, equal
    pond: 5, monarch: 5,
    // Mithril flowers: Royal Poinciana/Camellia/Morning Glory all similar
    royal_poinciana: 4, camellia: 4, morning_glory: 4,
    // Bronze flowers
    marigold: 2, gallic_rose: 2, milk_thistle: 2,
    // Adamantine flowers
    pincushion: 6, gazania: 6
  };
  function consumeInputs(vInv, recipe) {
    var vi = Object.assign({}, vInv);
    for (var i = 0; i < recipe.inputs.length; i++) {
      var token = recipe.inputs[i];
      var group = TOKEN_GROUPS[token];
      if (group) {
        var available = group.filter(function(k) { return (vi[k]||0) > 0; });
        available.sort(function(a,b) {
          // 1. Non-collectibles before collectibles
          var aCol = COLLECTIBLES.has(a) ? 1 : 0;
          var bCol = COLLECTIBLES.has(b) ? 1 : 0;
          if (aCol !== bCol) { return aCol - bCol; }
          // 2. Duplicates before singletons (never consume last copy)
          var aSingle = (vi[a]||0) <= 1 ? 1 : 0;
          var bSingle = (vi[b]||0) <= 1 ? 1 : 0;
          if (aSingle !== bSingle) { return aSingle - bSingle; }
          // 3. Lower strategic value first (expendable before precious)
          var aVal = STRATEGIC_VALUE[a] || 0;
          var bVal = STRATEGIC_VALUE[b] || 0;
          if (aVal !== bVal) { return aVal - bVal; }
          // 4. Highest quantity first (consume from abundance)
          return (vi[b]||0) - (vi[a]||0);
        });
        if (available.length > 0) { vi[available[0]]--; }
      } else {
        if ((vi[token]||0) > 0) { vi[token]--; }
      }
    }
    return vi;
  }

  function getActionPlans(inv) {
    if (isStale()) { return []; }
    var plans = [];
    var directCrafts = getDirectCrafts(inv);

    // Phase 1: Direct crafts
    for (var di = 0; di < directCrafts.length; di++) {
      var r = directCrafts[di];
      var value = RECIPE_VALUE[r.label] || 5;
      var fragile = r.inputs.some(function(t) {
        var group = TOKEN_GROUPS[t];
        if (group) { return cnt(inv, group) <= 1; }
        return (inv[t]||0) <= 1;
      });
      plans.push({
        goal: r.label, value: value, type: 'direct', fragile: fragile,
        steps: [{ label: r.label, inputs: r.inputs.map(tokHuman).join(' + '), ready: true }]
      });
    }

    // Phase 2: 2-step chains
    var ht = S.ownedHammers.length ? Math.max.apply(null, S.ownedHammers.map(function(h) { return HAMMER_TIERS.indexOf(h); })) : -1;
    var PREREQ_MAP = {
      'pollen_tin':['Tin Pollen'],'pollen_bronze':['Bronze Pollen'],
      'pollen_mithril':['Mithril Pollen'],'pollen_adamantine':['Adamantine Pollen'],
      'cattail':['Nectar / Cattail Bridge'],'nectar':['Nectar / Cattail Bridge'],
      'pinecone':['Pinecone / Moss / Gunpowder Bridge'],'moss':['Pinecone / Moss / Gunpowder Bridge'],
      'gunpowder':['Pinecone / Moss / Gunpowder Bridge'],
      'junk_cube_t1':['Junk Cube'],'junk_cube_t2':['Junk Tesseract']
    };
    for (var ri = 0; ri < RECIPES.length; ri++) {
      var recipe = RECIPES[ri];
      if (recipe.label === 'Junk Cube') { continue; }
      var hk = {'Tin Hammer':'hammer_t1','Bronze Hammer':'hammer_t2','Mithril Hammer':'hammer_t3',
        'Adamantine Hammer':'hammer_t4','Diamond Hammer':'hammer_t5'}[recipe.label];
      if (hk) { var ot = HAMMER_TIERS.indexOf(hk); if (ot<=ht||ot>ht+1) { continue; } }
      // Skip already-owned outputs (same filter as getDirectCrafts)
      var outputKey2 = RECIPE_OUTPUT[recipe.label];
      if (outputKey2 && COLLECTIBLES.has(outputKey2) && (inv[outputKey2]||0) > 0) {
        if (!NEEDED_AS_INGREDIENT.has(outputKey2)) { continue; }
      }
      if (canMake(recipe, inv)) { continue; }
      var needed = {};
      for (var ni = 0; ni < recipe.inputs.length; ni++) { needed[recipe.inputs[ni]] = (needed[recipe.inputs[ni]]||0) + 1; }
      var missing = [];
      for (var token in needed) {
        var group = TOKEN_GROUPS[token];
        var have = group ? cnt(inv, group) : (inv[token]||0);
        if (have < needed[token]) { missing.push(token); }
      }
      if (missing.length !== 1) { continue; }
      var missingToken = missing[0];
      var prereqLabels = PREREQ_MAP[missingToken];
      if (!prereqLabels) { continue; }
      for (var pi = 0; pi < prereqLabels.length; pi++) {
        var prereq = RECIPES.find(function(x) { return x.label === prereqLabels[pi]; });
        if (!prereq || !canMake(prereq, inv)) { continue; }
        if (wouldConsumeLastCollectible(prereq, inv)) { continue; }
        var vInv = consumeInputs(inv, prereq);
        vInv[missingToken] = (vInv[missingToken]||0) + 1;
        if (canMake(recipe, vInv) && !wouldConsumeLastCollectible(recipe, vInv)) {
          plans.push({
            goal: recipe.label, value: (RECIPE_VALUE[recipe.label]||5) - 5, type: '2-step',
            steps: [
              { label: prereq.label, inputs: prereq.inputs.map(tokHuman).join(' + '), ready: true, note: prereq.type === 'smash' ? 'RNG' : null },
              { label: recipe.label, inputs: recipe.inputs.map(tokHuman).join(' + '), ready: false }
            ]
          });
        }
      }
    }

    // Deduplicate
    var seen = {};
    var unique = [];
    plans.sort(function(a,b) { return b.value - a.value; });
    for (var ui = 0; ui < plans.length; ui++) {
      var base = plans[ui].goal.replace(/ \(alt\)$| \(Stag\)$| \(Bomb\)$/,'');
      if (!seen[base]) { seen[base] = true; unique.push(plans[ui]); }
    }

    // Cross-plan consumption check (credits recipe outputs for multi-step plans)
    var finalPlans = [];
    var sharedInv = Object.assign({}, inv);
    for (var fi = 0; fi < unique.length; fi++) {
      var plan = unique[fi];
      var ok = true;
      var testInv = Object.assign({}, sharedInv);
      for (var si = 0; si < plan.steps.length; si++) {
        var sr = RECIPES.find(function(x) { return x.label === plan.steps[si].label; });
        if (!sr || !canMake(sr, testInv)) { ok = false; break; }
        testInv = consumeInputs(testInv, sr);
        // Credit the output of prereq steps so subsequent steps can use them
        if (si < plan.steps.length - 1) {
          // For bridge/pollen recipes, credit the missing token that this step produces
          // The prereq step was chosen specifically to produce what the next step needs
          var nextStep = plan.steps[si + 1];
          var nextRecipe = RECIPES.find(function(x) { return x.label === nextStep.label; });
          if (nextRecipe) {
            for (var ni = 0; ni < nextRecipe.inputs.length; ni++) {
              var token = nextRecipe.inputs[ni];
              if (!TOKEN_GROUPS[token] && (testInv[token]||0) < 1) {
                testInv[token] = (testInv[token]||0) + 1; // Credit one output
              }
            }
          }
        }
      }
      if (ok) {
        finalPlans.push(plan);
        // Deduct from shared inventory
        for (var ci = 0; ci < plan.steps.length; ci++) {
          var cr = RECIPES.find(function(x) { return x.label === plan.steps[ci].label; });
          if (cr) { sharedInv = consumeInputs(sharedInv, cr); }
        }
      }
      if (finalPlans.length >= 3) { break; }
    }
    return finalPlans;
  }

  /* ─── FIX 4: Auto-Claim / Hunt / Cheese with explicit logging ─── */
  var _lastClaimTime = 0, _lastHuntTime = 0, _lastCheeseTime = 0;
  // After claim/hunt/cheese: wait for game to process, then re-parse state and full scan
  function postActionRefresh(reason, delay) {
    setTimeout(function() {
      logEvent(reason + ' — rescanning...');
      parseTimers();
      parseHammer();
      fullScan();
    }, delay);
  }

  function tryAutoClaim() {
    if (!S.autoClaim || _scanning) { return; }
    if (Date.now() - _lastClaimTime < 60000) { return; }
    var btn = document.querySelector('.beetle-catch-module__catch-button:not(.disabled):not(.disconnected)');
    if (btn && !btn.disabled) {
      var btnText = btn.textContent || '';
      if (/\d+[mhMs]\s/i.test(btnText)) { return; }
      btn.click(); _lastClaimTime = Date.now();
      S.session.claims++;
      logEvent('Auto-claimed beetle! Refreshing in 12s...');
      save();
      postActionRefresh('Post-claim', 12000);
    }
  }
  function tryAutoHunt() {
    if (!S.autoHunt || _scanning) { return; }
    var cheese = S.mergedInventory.cheese || 0;
    if (cheese < HUNT_COST) { return; }
    if (cheese - HUNT_COST < MIN_CHEESE_RESERVE) { return; }
    if (Date.now() - _lastHuntTime < 90000) { return; }
    var btn = document.querySelector('.beetle-catch-module__hunt-button:not(.disabled):not(.disconnected)');
    if (btn && !btn.disabled) {
      var btnText = btn.textContent || '';
      if (/cooldown/i.test(btnText)) { return; }
      btn.click(); _lastHuntTime = Date.now();
      S.session.hunts++;
      logEvent('Auto-hunted (-' + HUNT_COST + ' cheese). Refreshing in 12s...');
      save();
      postActionRefresh('Post-hunt', 12000);
    }
  }
  function tryClaimCheese() {
    if (_scanning) { return; }
    if (Date.now() - _lastCheeseTime < 60000) { return; }
    var navCheese = document.querySelector('.cheese-claim-nav .info');
    if (!navCheese || !/ready/i.test(navCheese.textContent)) { return; }
    var btn = document.querySelector('.claim-button:not(.disabled)');
    if (btn) {
      btn.click(); _lastCheeseTime = Date.now();
      S.session.cheeseClaims++;
      logEvent('Auto-claimed daily cheese! Refreshing in 8s...');
      save();
      postActionRefresh('Post-cheese', 8000);
    }
  }

  /* ─── FIX 5 + 6 + 7: Styles with status strip, freshness chip, timer badges, hammer honesty ─── */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) { return; }
    var s = document.createElement('style'); s.id = STYLE_ID;
    s.textContent = [
      '#',BTN_ID,'{position:fixed;left:20px;bottom:20px;z-index:999999;padding:10px 14px;background:#d7f4f7;color:#11383d;border:1px solid #9bd8e0;border-radius:12px;font-weight:700;cursor:pointer;font-size:14px;}',
      '#',BTN_ID,':hover{background:#c0edf2;}',
      '#',PANEL_ID,'{position:fixed;left:20px;top:50px;z-index:999999;width:350px;background:#fff;border:2px solid #b8e6ec;border-radius:16px;padding:14px;box-shadow:0 14px 40px rgba(0,0,0,.18);font-family:Arial,sans-serif;color:#163238;max-height:calc(100vh - 70px);display:flex;flex-direction:column;gap:5px;overflow:hidden;}',
      '#',PANEL_ID,'.hidden{display:none!important;}',
      '.bc8-header{display:flex;align-items:center;justify-content:space-between;}',
      '.bc8-title{font-size:18px;font-weight:800;}',
      '.bc8-sub{font-size:11px;color:#5a7379;font-weight:700;}',
      '.bc8-btns{display:flex;gap:3px;flex-wrap:wrap;}',
      '.bc8-btn{background:#d9f2f6;color:#17363b;border:1px solid #b8e6ec;border-radius:6px;padding:4px 7px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;}',
      '.bc8-btn:hover{background:#c0edf2;}.bc8-btn.on{background:#17363b;color:#fff;}',
      '.bc8-strip{display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#f7fcfd;border:1px solid #e0f0f3;border-radius:8px;font-size:11px;flex-shrink:0;}',
      '.bc8-strip-item{display:flex;align-items:center;gap:3px;}',
      '.bc8-strip-label{color:#6b8a90;font-weight:600;}',
      '.bc8-badge{display:inline-block;padding:1px 5px;border-radius:4px;font-size:10px;font-weight:700;}',
      '.bc8-ready{background:#d4edda;color:#155724;}.bc8-countdown{background:#fff3cd;color:#856404;}.bc8-stale{background:#f8d7da;color:#721c24;}.bc8-fresh-ok{background:#d4edda;color:#155724;}.bc8-warming{background:#fff3cd;color:#856404;}',
      '.bc8-card{background:#fafeff;border:1px solid #d5eef2;border-radius:10px;padding:10px;flex-shrink:0;}',
      '.bc8-focus{background:#f0f9fb;border:1px solid #b8e6ec;border-radius:10px;padding:12px;flex-shrink:0;}',
      '.bc8-scroll{background:#fafeff;border:1px solid #d5eef2;border-radius:10px;padding:10px;overflow-y:auto;overflow-x:hidden;flex-shrink:1;flex-grow:0;min-height:30px;}',
      '.bc8-scroll::-webkit-scrollbar{width:5px;}.bc8-scroll::-webkit-scrollbar-thumb{background:#b8e6ec;border-radius:3px;}',
      '.bc8-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;font-size:11px;line-height:1.4;}',
      '.bc8-row-name{display:flex;align-items:center;gap:4px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px;}',
      '.bc8-h{font-weight:800;font-size:13px;margin-bottom:6px;color:#11383d;}',
      '.bc8-muted{color:#6b8a90;font-size:10px;}',
      '.bc8-tier{font-size:8px;font-weight:700;padding:1px 4px;border-radius:3px;color:#fff;flex-shrink:0;}',
      '.bc8-val{font-weight:700;text-align:right;white-space:nowrap;font-size:11px;}',
      '.bc8-best-item{padding:5px 0;border-bottom:1px solid #e8f4f7;}.bc8-best-item:last-child{border-bottom:none;}',
      '.bc8-best-name{font-weight:800;font-size:14px;color:#11383d;}',
      '.bc8-recipe{padding:3px 0;border-bottom:1px solid #eef5f7;}.bc8-recipe:last-child{border-bottom:none;}',
      '.bc8-recipe-name{font-weight:700;font-size:11px;}',
      '.bc8-jd{font-size:9px;color:#8a9a9a;margin-left:4px;}',
      '.bc8-log-line{font-size:9px;color:#6b8a90;line-height:1.4;border-bottom:1px solid #f0f7f9;padding:1px 0;}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ─── Render ─── */
  function renderPanel() {
    var panel = document.getElementById(PANEL_ID);
    if (!panel || panel.classList.contains('hidden')) { return; }
    var inv = S.mergedInventory || {};
    var timers = S.timers || {};
    var stale = isStale();
    var plans = getActionPlans(inv);
    var directCrafts = stale ? [] : getDirectCrafts(inv);
    var fmtT = function(v) {
      if (!v) { return '\u2014'; }
      if (/ready/i.test(v)) { return '<span class="bc8-badge bc8-ready">Ready</span>'; }
      return '<span class="bc8-badge bc8-countdown">' + v + '</span>';
    };

    var h = '';
    // Header with freshness chip
    var cheeseStr = inv.cheese ? inv.cheese.toLocaleString() : '';
    h += '<div class="bc8-header"><span class="bc8-title"><span id="bc8-minimize" style="cursor:pointer;">\u{1FAB2}</span> Beetle Coach</span>';
    var conf = scanConfidence();
    var freshCls = conf === 'fresh' ? 'bc8-fresh-ok' : (conf === 'warming' ? 'bc8-warming' : 'bc8-stale');
    var freshTxt = conf === 'stale' ? 'STALE' : (conf === 'warming' ? scanAge() + ' ~' : scanAge());
    h += '<span class="bc8-sub">' + (S.level ? 'Lv.' + S.level : '') + (cheeseStr ? ' \u00B7 ' + cheeseStr + ' \u{1F9C0}' : '') + ' \u00B7 <span id="bc8-fresh" class="bc8-badge ' + freshCls + '">' + freshTxt + '</span></span></div>';

    // Buttons
    h += '<div class="bc8-btns">';
    h += '<button class="bc8-btn" id="bc8-fs">Full Scan</button>';
    h += '<button class="bc8-btn ' + (S.autoClaim ? 'on' : '') + '" id="bc8-ac">Claim ' + (S.autoClaim ? 'ON' : 'OFF') + '</button>';
    h += '<button class="bc8-btn ' + (S.autoHunt ? 'on' : '') + '" id="bc8-ah">Hunt ' + (S.autoHunt ? 'ON' : 'OFF') + '</button>';
    h += '<button class="bc8-btn" id="bc8-mc">Miladychan</button>';
    h += '<button class="bc8-btn" id="bc8-wk">Wiki</button>';
    h += '<button class="bc8-btn" id="bc8-rst" style="color:#c0392b;border-color:#e6b0aa;">Reset</button>';
    h += '</div>';

    // FIX 5: Status strip (compact, not a card)
    h += '<div class="bc8-strip">';
    h += '<div class="bc8-strip-item"><span class="bc8-strip-label">Hammer:</span> ' + (S.currentHammer ? dn(S.currentHammer) : '\u2014') + '</div>';
    if (S.currentHammerBonus != null) {
      h += '<div class="bc8-strip-item"><span class="bc8-strip-label">Base:</span> +' + S.currentHammerBonus + '% / ' + S.currentHammerBreakChance + '% break</div>';
    }
    if (S.brokenHammers && S.brokenHammers.length > 0) {
      h += '<div class="bc8-strip-item"><span style="color:#e74c3c;font-weight:700;">Broken:</span> ' + S.brokenHammers.map(dn).join(', ') + '</div>';
    }
    h += '<div class="bc8-strip-item"><span class="bc8-strip-label">Claim:</span> <span id="bc8-t-claim">' + fmtT(timers.beetleCatch) + '</span></div>';
    h += '<div class="bc8-strip-item"><span class="bc8-strip-label">Hunt:</span> <span id="bc8-t-hunt">' + fmtT(timers.huntCooldown) + '</span></div>';
    h += '<div class="bc8-strip-item"><span class="bc8-strip-label">Cheese:</span> <span id="bc8-t-cheese">' + fmtT(timers.dailyCheese) + '</span></div>';
    if (S.craftMode) { h += '<div class="bc8-strip-item"><span class="bc8-strip-label">Mode:</span> ' + S.craftMode + '</div>'; }
    h += '</div>';

    // Staleness warning
    if (stale) {
      h += '<div style="background:#fff3f3;border:1px solid #e6b0aa;border-radius:8px;padding:6px;color:#c0392b;font-weight:800;font-size:11px;flex-shrink:0;">Inventory stale. Hit Full Scan.</div>';
    }

    // FIX 5: Next moves as visual focal point
    h += '<div class="bc8-focus"><div class="bc8-h">Next moves</div>';
    if (!plans.length) {
      h += '<div class="bc8-muted">' + (stale ? 'Scan inventory first.' : 'No craftable moves. Farm more materials.') + '</div>';
    } else {
      for (var pi = 0; pi < plans.length; pi++) {
        var p = plans[pi];
        var fragileTag = p.fragile ? ' <span style="color:#e67e22;font-size:9px;">(verify qty)</span>' : '';
        h += '<div class="bc8-best-item"><div class="bc8-best-name">' + (pi+1) + '. ' + p.goal + fragileTag + '</div>';
        for (var si = 0; si < p.steps.length; si++) {
          var step = p.steps[si];
          var check = step.ready ? '\u2705' : '\u{1F536}';
          var rng = (step.note === 'RNG') ? ' <span style="color:#e67e22;font-size:9px;">(RNG)</span>' : '';
          if (p.steps.length === 1) {
            h += '<div class="bc8-muted">' + check + ' ' + step.inputs + rng + '</div>';
          } else {
            h += '<div class="bc8-muted">' + check + ' Step ' + (si+1) + ': ' + step.label + ' <span style="color:#9ab;">(' + step.inputs + ')</span>' + rng + '</div>';
          }
        }
        h += '</div>';
      }
    }
    h += '</div>';

    // Progression
    var stage = getStage(inv);
    var stageInfo = getNextStageGoals(inv, stage);
    h += '<div class="bc8-card"><div class="bc8-h">Progression</div><div style="display:flex;gap:2px;margin-bottom:4px;">';
    var stageColors = ['#7a8a7a','#b87333','#5b8dd9','#9b59b6','#e67e22','#e74c3c','#f1c40f'];
    for (var si2 = 0; si2 < 7; si2++) {
      h += '<div style="flex:1;height:5px;border-radius:3px;background:' + (si2 < stage ? stageColors[si2] : '#d5e8ec') + ';"></div>';
    }
    h += '</div><div class="bc8-row"><div>Stage ' + stage + ' / 7</div><div class="bc8-val">' + (STAGES[stage-1] ? STAGES[stage-1].name : 'Starting') + '</div></div>';
    if (stageInfo.next && stageInfo.goals.length) {
      h += '<div class="bc8-muted">Next: <b>' + stageInfo.next.name + '</b> \u2014 Need: ' + stageInfo.goals.join(', ') + '</div>';
    }
    h += '</div>';

    // Collection
    var col = getCollection(inv);
    h += '<div class="bc8-card"><div class="bc8-h">Collection</div>';
    h += '<div class="bc8-row"><div>Beetles</div><div class="bc8-val">' + col.ownedB.length + ' / ' + col.totalB + '</div></div>';
    h += '<div class="bc8-row"><div>Flowers</div><div class="bc8-val">' + col.ownedF.length + ' / ' + col.totalF + '</div></div>';
    var allMissing = col.missingB.map(dn).concat(col.missingF.map(dn));
    if (allMissing.length > 0 && allMissing.length <= 12) {
      h += '<div class="bc8-muted" style="margin-top:3px;">Missing: ' + allMissing.join(', ') + '</div>';
    }
    h += '</div>';

    // You can make (scrollable)
    h += '<div class="bc8-scroll" style="max-height:120px;"><div class="bc8-h">You can make (' + directCrafts.length + ')</div>';
    if (!directCrafts.length) {
      h += '<div class="bc8-muted">' + (stale ? 'Scan first.' : 'No recipes available.') + '</div>';
    } else {
      for (var dci = 0; dci < directCrafts.length; dci++) {
        var dc2 = directCrafts[dci];
        var craftBadge = dc2.type === 'assemble' ? '<span class="bc8-badge bc8-fresh-ok" style="margin-left:4px;">SAFE</span>' : '<span class="bc8-badge bc8-countdown" style="margin-left:4px;">RNG</span>';
        h += '<div class="bc8-recipe"><div class="bc8-recipe-name">' + dc2.label + craftBadge + '</div><div class="bc8-muted">' + dc2.inputs.map(tokHuman).join(' + ') + '</div></div>';
      }
    }
    h += '</div>';

    // Inventory (scrollable)
    h += '<div class="bc8-scroll" style="max-height:200px;"><div class="bc8-h">Inventory</div>';
    var junkTotal = cnt(inv, ANY_JUNK);
    var junkTypes = ANY_JUNK.filter(function(k) { return (inv[k]||0) > 0; }).length;
    var displayItems = Object.keys(inv).filter(function(k) { return !JUNK_SET.has(k) && !SKIP_DISPLAY.has(k) && k !== 'cheese'; })
      .sort(function(a,b) { return (inv[b]||0) - (inv[a]||0); });
    for (var ii = 0; ii < displayItems.length; ii++) {
      var ik = displayItems[ii];
      var tier = TIER_MAP[ik];
      var badge = tier ? '<span class="bc8-tier" style="background:' + (TIER_COLORS[tier]||'#888') + '">' + tier + '</span>' : '';
      h += '<div class="bc8-row"><div class="bc8-row-name">' + dn(ik) + ' ' + badge + '</div><div class="bc8-val">' + inv[ik] + '</div></div>';
    }
    if (junkTotal > 0) {
      h += '<div class="bc8-row"><div class="bc8-row-name">Junk Items <span class="bc8-tier" style="background:#888">Junk</span></div><div class="bc8-val">' + junkTotal + ' <span class="bc8-jd">(' + junkTypes + ' types)</span></div></div>';
    }
    h += '</div>';

    // Session Stats
    var sess = S.session || {};
    var sessionMins = Math.round((Date.now() - (sess.startTime || Date.now())) / 60000);
    h += '<div class="bc8-card"><div class="bc8-h">Session</div>';
    h += '<div class="bc8-row"><div>Duration</div><div class="bc8-val">' + (sessionMins < 60 ? sessionMins + 'm' : Math.floor(sessionMins/60) + 'h ' + (sessionMins%60) + 'm') + '</div></div>';
    h += '<div class="bc8-row"><div>Claims / Hunts</div><div class="bc8-val">' + (sess.claims||0) + ' / ' + (sess.hunts||0) + '</div></div>';
    h += '<div class="bc8-row"><div>Cheese claims</div><div class="bc8-val">' + (sess.cheeseClaims||0) + '</div></div>';
    if (sess.beetles && sess.beetles.length > 0) {
      h += '<div class="bc8-muted" style="margin-top:3px;">Gained: ' + sess.beetles.join(', ') + '</div>';
    }
    h += '</div>';

    // Resource Planner — show what's needed for next missing collectible goals
    var col2 = getCollection(inv);
    var plannerGoals = [];
    // Check each missing beetle and trace what's needed
    var GOAL_RECIPES = {
      'goliath': {name:'Goliath Beetle', needs:[{item:'pinecone',label:'Pinecone'},{item:'pond',label:'Pond Beetle'}], prereq:'Mithril Bridge (Mithril beetle + Mithril Pollen) for Pinecone'},
      'sunset_moth': {name:'Sunset Moth', needs:[{item:'gazania',label:'Gazania'},{item:'goliath',label:'Adamantine beetle'}], prereq:'Transmute Gazania (Green + Adamantine beetle + Junk Cube)'},
      'mars_rhino': {name:'Mars Rhino', needs:[{item:'black_lotus',label:'Black Lotus'},{item:'sunset_moth',label:'Sunset Moth'},{item:'sabertooth_longhorn',label:'Sabertooth'}], prereq:'Need all 3 Mithril artifacts for Black Lotus'},
      'hercules': {name:'Hercules Beetle', needs:[{item:'golden_scarab',label:'Golden Scarab'},{item:'pollen_adamantine',label:'Adamantine Pollen'},{item:'purple',label:'Purple Beetle'}], prereq:'Golden Scarab is drop-only (Diamond rarity)'}
    };
    for (var gk in GOAL_RECIPES) {
      if ((inv[gk]||0) > 0) { continue; } // Already have it
      var goal = GOAL_RECIPES[gk];
      var missing2 = [];
      var have2 = [];
      for (var ni = 0; ni < goal.needs.length; ni++) {
        var need = goal.needs[ni];
        if ((inv[need.item]||0) > 0) { have2.push(need.label); }
        else { missing2.push(need.label); }
      }
      if (missing2.length > 0) {
        plannerGoals.push({name: goal.name, have: have2, missing: missing2, prereq: goal.prereq});
      }
    }
    if (plannerGoals.length > 0) {
      h += '<div class="bc8-scroll" style="max-height:120px;"><div class="bc8-h">Resource Planner</div>';
      for (var gi = 0; gi < Math.min(plannerGoals.length, 3); gi++) {
        var g = plannerGoals[gi];
        h += '<div style="margin-bottom:6px;">';
        h += '<div style="font-weight:700;font-size:11px;">' + g.name + '</div>';
        if (g.have.length > 0) { h += '<div class="bc8-muted">\u2705 Have: ' + g.have.join(', ') + '</div>'; }
        h += '<div class="bc8-muted">\u274C Need: ' + g.missing.join(', ') + '</div>';
        h += '<div class="bc8-muted" style="color:#5b8dd9;">\u2192 ' + g.prereq + '</div>';
        h += '</div>';
      }
      h += '</div>';
    }

    // Activity Log
    h += '<div class="bc8-scroll" style="max-height:80px;flex:1;"><div class="bc8-h">Log</div>';
    h += '<div id="bc8-log">' + S.log.slice().reverse().map(function(l) { return '<div class="bc8-log-line">' + l + '</div>'; }).join('') + '</div></div>';

    panel.innerHTML = h;

    // Bind buttons
    document.getElementById('bc8-fs').addEventListener('click', function() { fullScan(); });
    document.getElementById('bc8-ac').addEventListener('click', function() { S.autoClaim = !S.autoClaim; save(); renderPanel(); });
    document.getElementById('bc8-ah').addEventListener('click', function() { S.autoHunt = !S.autoHunt; save(); renderPanel(); });
    document.getElementById('bc8-mc').addEventListener('click', function() { window.open('https://boards.miladychan.org/v/324142','_blank'); });
    document.getElementById('bc8-wk').addEventListener('click', function() { window.open('https://beetle.wiki/doku.php?id=start','_blank'); });
    document.getElementById('bc8-rst').addEventListener('click', function() {
      if (confirm('Clear all data and rescan?')) { resetStore(); fullScan(); }
    });
    document.getElementById('bc8-minimize').addEventListener('click', function() {
      var p = document.getElementById(PANEL_ID);
      if (p) { p.classList.add('hidden'); S.panelOpen = false; save(); }
    });
  }

  /* ─── UI ─── */
  function ensureUI() {
    injectStyles();
    if (!document.getElementById(BTN_ID)) {
      var btn = document.createElement('button'); btn.id = BTN_ID;
      btn.textContent = '\u{1FAB2} Beetle Coach';
      btn.addEventListener('click', function() {
        var p = document.getElementById(PANEL_ID);
        if (!p) { p = document.createElement('div'); p.id = PANEL_ID; document.body.appendChild(p); }
        p.classList.toggle('hidden');
        S.panelOpen = !p.classList.contains('hidden'); save();
        if (S.panelOpen) { parseTimers(); renderPanel(); }
      });
      document.body.appendChild(btn);
    }
    if (!document.getElementById(PANEL_ID)) {
      var p = document.createElement('div'); p.id = PANEL_ID;
      if (!S.panelOpen) { p.classList.add('hidden'); }
      document.body.appendChild(p);
    }
  }

  /* ─── Boot ─── */
  var _booted = false;
  var _intervals = [];
  function boot() {
    if (_booted) { return; }
    _booted = true;
    _intervals.forEach(function(id) { clearInterval(id); });
    _intervals = [];
    ensureUI();
    fullScan();
    _intervals.push(setInterval(refreshTimers, TIMER_INTERVAL));
    _intervals.push(setInterval(passiveScan, PASSIVE_SCAN_INTERVAL));
    _intervals.push(setInterval(function() { tryAutoClaim(); tryAutoHunt(); tryClaimCheese(); }, ACTION_INTERVAL));
    console.log('[BeetleCoach v8.6] booted');
  }
  function safeBoot() { try { boot(); } catch(e) { console.warn('[BC] boot fail', e); } }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(safeBoot, 1500);
  } else {
    window.addEventListener('load', function() { setTimeout(safeBoot, 1500); });
  }
  setTimeout(safeBoot, 3000);
  setTimeout(safeBoot, 5000);
  var obs = new MutationObserver(function() {
    if (!document.getElementById(BTN_ID)) { _booted = false; setTimeout(safeBoot, 500); }
  });
  obs.observe(document.documentElement, {childList:true, subtree:true});
})();
