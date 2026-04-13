// ==UserScript==
// @name         Remilia Beetle Coach
// @namespace    http://tampermonkey.net/
// @version      12.1.0
// @description  BeetleBoy coach: state-machine automation, auto-claim/hunt/cheese, auto-login, smart pathways.
// @match        https://www.remilia.net/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  // Suppress OIDC auth error alerts that freeze the page
  var _origAlert = window.alert;
  window.alert = function(msg) {
    if (msg && /oidc|security|auth|framable|sessionRestoration/i.test(msg)) {
      console.warn('[BC] Suppressed OIDC alert:', msg);
      return;
    }
    _origAlert.call(window, msg);
  };

  /* ═══════════════════════════════════════════════════════
     1. CONFIG
     ═══════════════════════════════════════════════════════ */
  var VER = '12.1.0';
  var STORE_KEY = 'beetle_coach_v8_store';
  var PANEL_ID = 'bc8-panel';
  var BTN_ID = 'bc8-toggle';
  var STYLE_ID = 'bc8-style';
  var STALE_MS = 120000;
  var HUNT_COST = 20;
  var MIN_CHEESE = 100;
  var TICK_MS = 10000;        // 10s between ticks — app dislikes rapid polling
  var HUNT_DEBOUNCE = 3000;   // 3s between hunt clicks — game allows rapid hunts
  var ACTION_TIMEOUT = 30000;
  var LOGIN_COOLDOWN = 15000;
  var LOGIN_MAX = 10;
  var NAV_COOLDOWN = 60000;
  var BOOT_GRACE = 10000;     // 10s grace before any navigation
  var LOG_THROTTLE = 30000;

  /* ═══════════════════════════════════════════════════════
     2. DATA TABLES
     ═══════════════════════════════════════════════════════ */
  var LABELS = {
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

  var TIER_MAP = {
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
  var TIER_COLORS = {
    Tin:'#7a8a7a',Bronze:'#b87333',Mithril:'#5b8dd9',Adamantine:'#9b59b6',
    Rare:'#e67e22',Epic:'#e74c3c',Legendary:'#f1c40f',Bridge:'#1abc9c',
    Uncommon:'#6a9955',Special:'#e84393'
  };

  var ITEM_ALIASES = {
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

  var TIN_FLOWERS = ['daisy','poppy','sunflower'];
  var BRONZE_FLOWERS = ['marigold','gallic_rose','milk_thistle'];
  var MITHRIL_FLOWERS = ['royal_poinciana','camellia','morning_glory'];
  var ADAMANTINE_FLOWERS = ['pincushion','gazania'];
  var BRONZE_BEETLES = ['ladybug','purple'];
  var MITHRIL_BEETLES = ['pond','monarch'];
  var ADAMANTINE_BEETLES = ['goliath','stag','bombardier'];
  var ANY_JUNK = [
    'coffee_can','red_whistle','cracker_wrapper','stamp','marble','bottle_cap',
    'ramune_bottle','wine_cork','green_army_man','scratch_off','cigarette_butt',
    'train_ticket_stub','chip_bag','chocolate_wrapper','jack_adapter','paperclip',
    'pebble','soda_can_tab','chocolate_bar','empty_noodle_cup','juicebox',
    'smiley_pebble','watch_battery','bike_reflector','pokkiri_box','rubber_band','gum_wrapper'
  ];
  var JUNK_SET = new Set(ANY_JUNK);
  var SKIP_DISPLAY = new Set(['hammer_t1','hammer_t2','hammer_t3','hammer_t4','hammer_t5','beetleboy_key']);
  var TOKEN_GROUPS = {
    any_junk:ANY_JUNK, any_tin_flower:TIN_FLOWERS, any_bronze_flower:BRONZE_FLOWERS,
    any_mithril_flower:MITHRIL_FLOWERS, any_adamantine_flower:ADAMANTINE_FLOWERS,
    any_bronze_beetle:BRONZE_BEETLES, any_mithril_beetle:MITHRIL_BEETLES,
    any_adamantine_beetle:ADAMANTINE_BEETLES
  };
  var HAMMER_TIERS = ['hammer_t1','hammer_t2','hammer_t3','hammer_t4','hammer_t5'];
  var HAMMER_STATS = {
    hammer_t1:{bonus:0,baseBreak:10},hammer_t2:{bonus:5,baseBreak:5},
    hammer_t3:{bonus:20,baseBreak:10},hammer_t4:{bonus:35,baseBreak:2},
    hammer_t5:{bonus:90,baseBreak:1}
  };
  var HAMMER_RECIPE_KEY = {
    'Tin Hammer':'hammer_t1','Bronze Hammer':'hammer_t2','Mithril Hammer':'hammer_t3',
    'Adamantine Hammer':'hammer_t4','Diamond Hammer':'hammer_t5'
  };

  var ALL_BEETLES = ['green','ladybug','purple','pond','monarch','goliath','stag','bombardier',
    'giraffe_weevil','pillbug','imperial_tortoise','sabertooth_longhorn','sunset_moth',
    'mars_rhino','golden_scarab','hercules','skull','christmas'];
  var ALL_FLOWERS = ['daisy','poppy','sunflower','marigold','gallic_rose','milk_thistle',
    'royal_poinciana','camellia','morning_glory','pincushion','gazania','black_lotus'];
  var COLLECTIBLES = new Set([].concat(ALL_BEETLES, ALL_FLOWERS));

  var RECIPES = [
    {label:'Junk Cube',type:'assemble',inputs:['any_junk','any_junk']},
    {label:'Junk Tesseract',type:'assemble',inputs:['junk_cube_t1','junk_cube_t1','junk_cube_t1']},
    {label:'Tin Hammer',type:'assemble',inputs:['junk_cube_t1','junk_cube_t1']},
    {label:'Bronze Hammer',type:'assemble',inputs:['hammer_t1','junk_cube_t2','pollen_tin']},
    {label:'Mithril Hammer',type:'assemble',inputs:['hammer_t2','junk_cube_t2','pollen_bronze']},
    {label:'Adamantine Hammer',type:'assemble',inputs:['hammer_t3','junk_cube_t2','pollen_mithril']},
    {label:'Diamond Hammer',type:'assemble',inputs:['hammer_t4','junk_cube_t2','pollen_adamantine']},
    {label:'Tin Pollen',type:'assemble',inputs:['any_tin_flower','any_tin_flower']},
    {label:'Bronze Pollen',type:'assemble',inputs:['any_bronze_flower','any_bronze_flower']},
    {label:'Mithril Pollen',type:'assemble',inputs:['any_mithril_flower','any_mithril_flower']},
    {label:'Adamantine Pollen',type:'assemble',inputs:['any_adamantine_flower','any_adamantine_flower']},
    {label:'Nectar / Cattail Bridge',type:'smash',inputs:['any_bronze_beetle','pollen_bronze']},
    {label:'Pinecone / Moss / Gunpowder Bridge',type:'smash',inputs:['any_mithril_beetle','pollen_mithril']},
    {label:'Pond Beetle',type:'smash',inputs:['cattail','ladybug']},
    {label:'Monarch',type:'smash',inputs:['nectar','ladybug']},
    {label:'Monarch (alt)',type:'smash',inputs:['nectar','purple']},
    {label:'Bombardier Beetle',type:'smash',inputs:['gunpowder','pond']},
    {label:'Bombardier Beetle (alt)',type:'smash',inputs:['gunpowder','monarch']},
    {label:'Stag Beetle',type:'smash',inputs:['moss','pond']},
    {label:'Goliath Beetle',type:'smash',inputs:['pinecone','pond']},
    {label:'Goliath Beetle (alt)',type:'smash',inputs:['pinecone','monarch']},
    {label:'Giraffe Weevil',type:'smash',inputs:['royal_poinciana','pond']},
    {label:'Giraffe Weevil (alt)',type:'smash',inputs:['royal_poinciana','monarch']},
    {label:'Pillbug',type:'smash',inputs:['camellia','pond']},
    {label:'Pillbug (alt)',type:'smash',inputs:['camellia','monarch']},
    {label:'Imperial Tortoise Beetle',type:'smash',inputs:['morning_glory','pond']},
    {label:'Imperial Tortoise Beetle (alt)',type:'smash',inputs:['morning_glory','monarch']},
    {label:'Sabertooth Longhorn Beetle',type:'smash',inputs:['pincushion','goliath']},
    {label:'Sabertooth Longhorn (Stag)',type:'smash',inputs:['pincushion','stag']},
    {label:'Sabertooth Longhorn (Bomb)',type:'smash',inputs:['pincushion','bombardier']},
    {label:'Sunset Moth',type:'smash',inputs:['gazania','goliath']},
    {label:'Sunset Moth (Stag)',type:'smash',inputs:['gazania','stag']},
    {label:'Sunset Moth (Bomb)',type:'smash',inputs:['gazania','bombardier']},
    {label:'Black Lotus',type:'smash',inputs:['gunpowder','moss','pinecone']},
    {label:'Mars Rhino Beetle',type:'smash',inputs:['black_lotus','sunset_moth','sabertooth_longhorn']},
    {label:'Hercules Beetle',type:'smash',inputs:['golden_scarab','pollen_adamantine','purple']},
    {label:'Bronze Flower Transmute',type:'smash',inputs:['green','purple','junk_cube_t1']},
    {label:'Mithril Flower Transmute',type:'smash',inputs:['green','any_mithril_beetle','junk_cube_t1']},
    {label:'Adamantine Flower Transmute',type:'smash',inputs:['green','any_adamantine_beetle','junk_cube_t1']}
  ];
  var RECIPE_VALUE = {
    'Hercules Beetle':100,'Mars Rhino Beetle':95,'Black Lotus':88,'Diamond Hammer':82,
    'Sabertooth Longhorn Beetle':78,'Sunset Moth':78,'Sabertooth Longhorn (Stag)':78,'Sabertooth Longhorn (Bomb)':78,
    'Sunset Moth (Stag)':78,'Sunset Moth (Bomb)':78,'Adamantine Pollen':75,'Adamantine Hammer':65,
    'Goliath Beetle':60,'Goliath Beetle (alt)':60,'Stag Beetle':60,
    'Bombardier Beetle':55,'Bombardier Beetle (alt)':55,
    'Giraffe Weevil':55,'Giraffe Weevil (alt)':55,'Pillbug':55,'Pillbug (alt)':55,
    'Imperial Tortoise Beetle':55,'Imperial Tortoise Beetle (alt)':55,
    'Pinecone / Moss / Gunpowder Bridge':50,'Nectar / Cattail Bridge':40,'Mithril Pollen':40,
    'Mithril Hammer':30,'Pond Beetle':25,'Monarch':25,'Monarch (alt)':25,
    'Bronze Hammer':15,'Bronze Pollen':12,'Bronze Flower Transmute':10,'Mithril Flower Transmute':35,
    'Adamantine Flower Transmute':55,
    'Junk Tesseract':8,'Tin Hammer':6,'Tin Pollen':5,'Junk Cube':1
  };
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
  var NEEDED_AS_INGREDIENT = new Set(['sabertooth_longhorn','sunset_moth','black_lotus']);

  var PREREQ_RECIPES = {
    'pinecone':['Pinecone / Moss / Gunpowder Bridge'],'moss':['Pinecone / Moss / Gunpowder Bridge'],
    'gunpowder':['Pinecone / Moss / Gunpowder Bridge'],
    'nectar':['Nectar / Cattail Bridge'],'cattail':['Nectar / Cattail Bridge'],
    'pollen_tin':['Tin Pollen'],'pollen_bronze':['Bronze Pollen'],
    'pollen_mithril':['Mithril Pollen'],'pollen_adamantine':['Adamantine Pollen'],
    'gazania':['Adamantine Flower Transmute'],'pincushion':['Adamantine Flower Transmute'],
    'any_adamantine_beetle':['Goliath Beetle','Goliath Beetle (alt)','Stag Beetle','Bombardier Beetle','Bombardier Beetle (alt)'],
    'junk_cube_t1':['Junk Cube'],'junk_cube_t2':['Junk Tesseract']
  };

  var STAGES = [
    {n:1,name:'Gathering',check:['green']},
    {n:2,name:'Pollen & Bridges',check:['pollen_tin']},
    {n:3,name:'Mithril Beetles',check:['pond','monarch']},
    {n:4,name:'Adamantine Beetles',check:['bombardier','stag','goliath']},
    {n:5,name:'Rare Beetles',check:['giraffe_weevil','pillbug','imperial_tortoise']},
    {n:6,name:'Epic Beetles',check:['sabertooth_longhorn','sunset_moth']},
    {n:7,name:'Endgame',check:['black_lotus','mars_rhino','hercules']}
  ];
  var ENDGAME_CHAIN = [
    {key:'goliath',recipe:'Goliath Beetle',prereqs:['pinecone'],via:'Mithril Bridge for Pinecone'},
    {key:'sunset_moth',recipe:'Sunset Moth',prereqs:['gazania','any_adamantine_beetle'],via:'Need Gazania'},
    {key:'black_lotus',recipe:'Black Lotus',prereqs:['gunpowder','moss','pinecone'],via:'All 3 Mithril artifacts'},
    {key:'mars_rhino',recipe:'Mars Rhino Beetle',prereqs:['black_lotus','sunset_moth','sabertooth_longhorn'],via:'Black Lotus + Sunset + Sabertooth'},
    {key:'hercules',recipe:'Hercules Beetle',prereqs:['golden_scarab','pollen_adamantine'],via:'Golden Scarab is drop-only'}
  ];
  var BROAD_CHAIN = [
    {key:'pollen_bronze',recipe:'Bronze Pollen',prereqs:[],via:'Assemble 2 Bronze flowers',minQty:3},
    {key:'goliath',recipe:'Goliath Beetle',prereqs:['pinecone'],via:'Mithril Bridge for Pinecone'},
    {key:'stag',recipe:'Stag Beetle',prereqs:['moss'],via:'Mithril Bridge for Moss'},
    {key:'bombardier',recipe:'Bombardier Beetle',prereqs:['gunpowder'],via:'Mithril Bridge for Gunpowder'},
    {key:'gazania',recipe:'Adamantine Flower Transmute',prereqs:[],via:'Green + Adamantine beetle + Junk Cube'},
    {key:'pincushion',recipe:'Adamantine Flower Transmute',prereqs:[],via:'Green + Adamantine beetle + Junk Cube'},
    {key:'black_lotus',recipe:'Black Lotus',prereqs:['gunpowder','moss','pinecone'],via:'All 3 Mithril artifacts'},
    {key:'sabertooth_longhorn',recipe:'Sabertooth Longhorn Beetle',prereqs:['pincushion','any_adamantine_beetle'],via:'Pincushion + Adamantine beetle'},
    {key:'sunset_moth',recipe:'Sunset Moth',prereqs:['gazania','any_adamantine_beetle'],via:'Gazania + Adamantine beetle'},
    {key:'mars_rhino',recipe:'Mars Rhino Beetle',prereqs:['black_lotus','sunset_moth','sabertooth_longhorn'],via:'All 3 endgame pieces'},
    {key:'hercules',recipe:'Hercules Beetle',prereqs:['golden_scarab','pollen_adamantine'],via:'Golden Scarab + Adamantine Pollen'}
  ];
  var FLOWER_CHAIN = [
    {key:'pollen_bronze',recipe:'Bronze Pollen',prereqs:[],via:'Assemble 2 Bronze flowers',minQty:5},
    {key:'nectar',recipe:'Nectar / Cattail Bridge',prereqs:['pollen_bronze'],via:'Bronze beetle + Bronze Pollen',minQty:3},
    {key:'cattail',recipe:'Nectar / Cattail Bridge',prereqs:['pollen_bronze'],via:'Bronze beetle + Bronze Pollen',minQty:3},
    {key:'pollen_mithril',recipe:'Mithril Pollen',prereqs:[],via:'Assemble 2 Mithril flowers',minQty:3},
    {key:'pinecone',recipe:'Pinecone / Moss / Gunpowder Bridge',prereqs:['pollen_mithril'],via:'Mithril beetle + Mithril Pollen'},
    {key:'moss',recipe:'Pinecone / Moss / Gunpowder Bridge',prereqs:['pollen_mithril'],via:'Mithril beetle + Mithril Pollen'},
    {key:'gunpowder',recipe:'Pinecone / Moss / Gunpowder Bridge',prereqs:['pollen_mithril'],via:'Mithril beetle + Mithril Pollen'},
    {key:'gazania',recipe:'Adamantine Flower Transmute',prereqs:[],via:'Green + Adamantine beetle + Junk Cube'},
    {key:'pincushion',recipe:'Adamantine Flower Transmute',prereqs:[],via:'Green + Adamantine beetle + Junk Cube'},
    {key:'pollen_adamantine',recipe:'Adamantine Pollen',prereqs:[],via:'Assemble Pincushion + Gazania'}
  ];
  var FLOWER_CONSUMING = new Set(['Tin Pollen','Bronze Pollen','Mithril Pollen','Adamantine Pollen','Bronze Flower Transmute','Mithril Flower Transmute']);
  var BLOCKLIST = /^(svg|icon|button|slot|empty|more|smash|eject|assemble|home|search|left|right|go_back|show_password|claim|load|logo|dots|arrow|cheeseman|static\d*|beetleboy_logo|beetle_catch|craft|beetle_shader)$/i;
  var PFP_HASH = /^(pfp_\d+|retart|remilio|radbro|default|[a-f0-9]{20,})$/i;

  /* ═══════════════════════════════════════════════════════
     3. HELPERS
     ═══════════════════════════════════════════════════════ */
  function norm(raw) { if (!raw) return null; var k = String(raw).toLowerCase().trim().replace(/\.[a-z0-9]+$/i,'').replace(/%20/g,'_').replace(/[^\w]+/g,'_').replace(/^_+|_+$/g,''); return ITEM_ALIASES[k] || k; }
  function dn(k) { return LABELS[k] || k; }
  function cnt(inv, arr) { return arr.reduce(function(s,k) { return s + (inv[k]||0); }, 0); }
  function tokenCount(inv, t) { var g = TOKEN_GROUPS[t]; return g ? cnt(inv,g) : (inv[t]||0); }
  function tokHuman(t) { var m = {any_junk:'any junk',any_tin_flower:'Tin flowers x2',any_bronze_flower:'Bronze flower',any_mithril_flower:'Mithril flower',any_adamantine_flower:'Adamantine flower',any_bronze_beetle:'Bronze beetle',any_mithril_beetle:'Mithril beetle',any_adamantine_beetle:'Adamantine beetle'}; return m[t] || dn(t); }
  function isValid(k) { return k && !BLOCKLIST.test(k) && !PFP_HASH.test(k); }
  function isVisible(el) { return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length)); }
  function bodyText() { return (document.body && document.body.innerText) || ''; }
  function currentCartridge() { var m = window.location.href.match(/[?&]cartridge=([^&#]+)/i); return m ? m[1].toLowerCase() : ''; }
  function safeClick(el) { if (!el) return false; try { el.click(); return true; } catch(e) {} try { el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window})); return true; } catch(e2) {} return false; }
  function firstVisible(sels) { for (var i = 0; i < sels.length; i++) { var nodes = document.querySelectorAll(sels[i]); for (var j = 0; j < nodes.length; j++) if (isVisible(nodes[j])) return nodes[j]; } return null; }
  function findButton(sels) { var btn = firstVisible(sels); return (btn && !btn.disabled && !btn.classList.contains('disabled') && btn.getAttribute('aria-disabled') !== 'true') ? btn : null; }
  function bestHammerTier() { return S.ownedHammers.length ? Math.max.apply(null, S.ownedHammers.map(function(h) { return HAMMER_TIERS.indexOf(h); })) : -1; }

  /* ═══════════════════════════════════════════════════════
     4. STATE MANAGEMENT
     ═══════════════════════════════════════════════════════ */
  function defaultSession() {
    return {claims:0, hunts:0, cheeseClaims:0, cheeseGained:0, gains:[], totalXP:0, startTime:Date.now()};
  }
  function defaults() {
    return { ver:VER, mergedInventory:{}, currentHammer:null, ownedHammers:[], brokenHammers:[], discoveredHammers:[],
      currentHammerBonus:null, currentHammerBreakChance:null, timers:{}, lastFullScan:0, lastPassiveScan:0,
      autoClaim:true, autoHunt:true, panelOpen:true, level:null, craftMode:null, strategy:'endgame',
      log:[], machineState:'BOOTING', stateEnteredAt:Date.now(),
      session:defaultSession() };
  }
  function normalizeSession(rawSession) {
    var session = Object.assign(defaultSession(), rawSession || {});
    var gains = [];
    if (Array.isArray(session.gains)) {
      gains = session.gains.slice();
    } else if (session.gains && typeof session.gains === 'object') {
      Object.keys(session.gains).forEach(function(name) {
        var count = parseInt(session.gains[name], 10) || 0;
        for (var i = 0; i < count; i++) gains.push(name);
      });
    } else if (Array.isArray(session.beetles)) {
      gains = session.beetles.slice();
    }
    session.claims = parseInt(session.claims, 10) || 0;
    session.hunts = parseInt(session.hunts, 10) || 0;
    session.cheeseClaims = parseInt(session.cheeseClaims, 10) || 0;
    session.cheeseGained = parseInt(session.cheeseGained, 10) || 0;
    session.totalXP = parseInt(session.totalXP, 10) || 0;
    if (!session.startTime || !isFinite(session.startTime)) session.startTime = Date.now();
    session.gains = gains;
    return session;
  }
  function load() {
    try {
      var raw = GM_getValue(STORE_KEY, null);
      if (!raw) return defaults();
      var parsed = JSON.parse(raw);
      var p = Object.assign(defaults(), parsed);
      p.session = normalizeSession((parsed || {}).session);
      if ((p.ver||'0').split('.')[0] !== VER.split('.')[0]) { p.mergedInventory = {}; p.log = []; p.session = defaultSession(); }
      p.ver = VER; p.machineState = 'BOOTING'; p.stateEnteredAt = Date.now();
      return p;
    } catch(e) { return defaults(); }
  }
  function save() { try { GM_setValue(STORE_KEY, JSON.stringify(S)); } catch(e) {} }
  var S = load();
  function transition(state) { S.machineState = state; S.stateEnteredAt = Date.now(); save(); }
  function stateAge() { return Date.now() - S.stateEnteredAt; }

  var _throttled = {};
  function logEvent(msg) { var ts = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); S.log.push(ts+' '+msg); if (S.log.length > 30) S.log = S.log.slice(-30); save(); var el = document.getElementById('bc8-log'); if (el) el.innerHTML = S.log.slice().reverse().map(function(l) { return '<div class="bc8-log-line">'+l+'</div>'; }).join(''); }
  function logThrottled(key, msg, ms) { var now = Date.now(); if (now - (_throttled[key]||0) < (ms||LOG_THROTTLE)) return; _throttled[key] = now; logEvent(msg); }

  /* ═══════════════════════════════════════════════════════
     5. DOM PARSING
     ═══════════════════════════════════════════════════════ */
  function resolveItemKey(itemEl, imgEl) {
    if (imgEl) {
      var bg = (imgEl.style && imgEl.style.backgroundImage) || '';
      if (!bg || bg === 'none') try { bg = getComputedStyle(imgEl).backgroundImage || ''; } catch(e) {}
      var m = bg.match(/\/beetle\/images\/icons\/[^/]+\/([^."')]+)\.(png|jpg|webp|gif|svg)/i);
      if (m && m[1]) return norm(m[1]);
      var img = imgEl.querySelector('img') || (imgEl.tagName === 'IMG' ? imgEl : null);
      if (img) { var src = img.getAttribute('src') || ''; var m2 = src.match(/\/beetle\/images\/icons\/[^/]+\/([^."'?#]+)\.(png|jpg|webp|gif|svg)/i); if (m2 && m2[1]) return norm(m2[1]); var m3 = src.match(/\/([^/."'?#]+)\.(png|jpg|webp|gif|svg)/i); if (m3 && m3[1]) return norm(m3[1]); }
    }
    var cands = imgEl ? [imgEl, itemEl] : [itemEl];
    for (var i = 0; i < cands.length; i++) { var el = cands[i]; if (!el) continue; var txt = el.getAttribute('alt') || el.getAttribute('title') || el.getAttribute('aria-label') || ''; if (txt) return norm(txt); }
    return null;
  }
  function scanPage(sel, imgCls, cntCls) {
    var r = {}, unresolved = 0;
    document.querySelectorAll(sel).forEach(function(item) { var imgEl = item.querySelector(imgCls); var k = resolveItemKey(item, imgEl); if (!k || !isValid(k)) { unresolved++; return; } var el = item.querySelector(cntCls); r[k] = Math.max(r[k]||0, el ? (parseInt(el.textContent.trim(),10)||1) : 1); });
    return {items:r, unresolved:unresolved};
  }
  function fingerprint(items) { return Object.keys(items).sort().map(function(k) { return k+':'+items[k]; }).join(','); }

  var _scanning = false;
  async function fullScan() {
    if (_scanning || !tabVisible()) return;
    _scanning = true; var totalUnresolved = 0, oldInv = Object.assign({}, S.mergedInventory);
    try {
      var merged = {};
      var merge = function(r) { for (var k in r.items) merged[k] = Math.max(merged[k]||0, r.items[k]); totalUnresolved += r.unresolved; };
      var seenFP = {};
      merge(scanPage('.crafting-module__inventory-grid .crafting-module__beetle-item','.crafting-module__beetle-img','.crafting-module__beetle-item-count'));
      for (var i = 0; i < 20; i++) { var more = document.querySelector('.crafting-module__pagination-button'); if (!more || more.disabled || more.classList.contains('disabled')) break; more.click(); await new Promise(function(r){setTimeout(r,200);}); var page = scanPage('.crafting-module__inventory-grid .crafting-module__beetle-item','.crafting-module__beetle-img','.crafting-module__beetle-item-count'); var fp = fingerprint(page.items); if (seenFP[fp]) break; seenFP[fp] = true; merge(page); }
      var seenFP2 = {};
      merge(scanPage('.beetle-catch-module__beetle-item','.beetle-catch-module__beetle-img','.beetle-catch-module__beetle-item-count'));
      for (var j = 0; j < 20; j++) { var more2 = document.querySelector('.beetle-catch-module__pagination-button'); if (!more2 || more2.disabled || more2.classList.contains('disabled')) break; more2.click(); await new Promise(function(r){setTimeout(r,200);}); var page2 = scanPage('.beetle-catch-module__beetle-item','.beetle-catch-module__beetle-img','.beetle-catch-module__beetle-item-count'); var fp2 = fingerprint(page2.items); if (seenFP2[fp2]) break; seenFP2[fp2] = true; merge(page2); }
      if (Object.keys(merged).length > 0) {
        S.mergedInventory = merged;
        var changes = [];
        for (var k in merged) { var old = oldInv[k]||0; if (merged[k] > old && !JUNK_SET.has(k) && k !== 'cheese') { changes.push(dn(k)+' +'+(merged[k]-old)); if (ALL_BEETLES.indexOf(k) > -1 && k !== 'green') for (var bi = 0; bi < merged[k]-old; bi++) S.session.gains.push(dn(k)); } }
        var jd = cnt(merged,ANY_JUNK) - cnt(oldInv,ANY_JUNK); if (jd > 0) changes.push('Junk +'+jd);
        var cd = (merged.cheese||0) - (oldInv.cheese||0); if (cd !== 0) changes.push('Cheese '+(cd>0?'+':'')+cd);
        logEvent('Scan: '+(changes.length ? changes.join(', ') : 'no changes')+(totalUnresolved ? ' ('+totalUnresolved+' unresolved)' : ''));
        S.lastFullScan = Date.now(); S.lastPassiveScan = Date.now();
      } else { logEvent('Scan: no items found'); }
    } finally { _scanning = false; }
    parseTimers(); parseHammer(); parseLevel(); parseCraftMode(); save(); renderPanel();
  }

  function passiveScan() {
    if (_scanning || document.hidden) return;
    if (!document.querySelector('.crafting-module__beetle-item, .beetle-catch-module__beetle-item')) return;
    var vis = {}, updated = false;
    var r1 = scanPage('.crafting-module__inventory-grid .crafting-module__beetle-item','.crafting-module__beetle-img','.crafting-module__beetle-item-count');
    var r2 = scanPage('.beetle-catch-module__beetle-item','.beetle-catch-module__beetle-img','.beetle-catch-module__beetle-item-count');
    for (var k in r1.items) vis[k] = Math.max(vis[k]||0, r1.items[k]);
    for (var k2 in r2.items) vis[k2] = Math.max(vis[k2]||0, r2.items[k2]);
    if (!Object.keys(vis).length) return;
    for (var k3 in vis) {
      if (S.mergedInventory.hasOwnProperty(k3)) { if (vis[k3] !== S.mergedInventory[k3]) { S.mergedInventory[k3] = vis[k3]; updated = true; } }
      else if (isValid(k3) && LABELS[k3]) { if (!S._pending) S._pending = {}; if (S._pending[k3]) { S.mergedInventory[k3] = vis[k3]; updated = true; delete S._pending[k3]; } else S._pending[k3] = Date.now(); }
    }
    if (S._pending) { var now = Date.now(); for (var pk in S._pending) if (now - S._pending[pk] > 300000) delete S._pending[pk]; }
    S.lastPassiveScan = Date.now(); if (updated) save();
    parseTimers(); parseHammer();
  }

  function parseTimers() {
    var t = {beetleCatch:null, dailyCheese:null, huntCooldown:null};
    var bc = document.querySelector('.beetle-game-nav .info span:last-child');
    if (bc) { var v = bc.textContent.trim(); if (/\d/.test(v)) t.beetleCatch = v; }
    if (!t.beetleCatch) { var nav = document.querySelector('.beetle-game-nav .info'); if (nav && /ready/i.test(nav.textContent)) t.beetleCatch = 'Ready!'; }
    var dc = document.querySelector('.cheese-claim-nav .info span:last-child');
    if (dc) { var v2 = dc.textContent.trim(); if (/\d/.test(v2)) t.dailyCheese = v2; }
    if (!t.dailyCheese) { var navC = document.querySelector('.cheese-claim-nav .info'); if (navC && /ready/i.test(navC.textContent)) t.dailyCheese = 'Ready!'; }
    var cd = document.querySelector('.beetle-catch-module__cooldown-timer');
    if (cd) { var v3 = cd.textContent.trim().replace(/\s*to\s+next\s+claim\s*/i,'').trim(); if (/\d/.test(v3)) t.beetleCatch = v3; }
    var hc = document.querySelector('.beetle-catch-module__hunt-button-cheese-cost');
    if (hc) { var txt = hc.textContent.trim(); if (/cooldown/i.test(txt)) { var cl = txt.replace(/\s*cooldown\s*/i,'').trim(); if (/\d/.test(cl)) t.huntCooldown = cl; } else if (/cheese/i.test(txt)) t.huntCooldown = 'Ready!'; }
    S.timers = t;
  }
  function parseHammer() {
    var owned = [], broken = [], discovered = [];
    document.querySelectorAll('.crafting-module__hammer-row .crafting-module__hammer-slot').forEach(function(s) {
      if (s.classList.contains('crafting-module__hammer-slot--undiscovered')) return;
      var img = s.querySelector('.crafting-module__beetle-img'); if (!img) return;
      var k = resolveItemKey(s, img);
      if (k && k.indexOf('hammer_t') === 0) { discovered.push(k); if (s.classList.contains('crafting-module__hammer-slot--empty')) broken.push(k); else owned.push(k); }
    });
    function dedupe(a) { var s = {}; return a.filter(function(v) { return s[v] ? false : (s[v]=true); }); }
    S.ownedHammers = dedupe(owned).sort(function(a,b) { return HAMMER_TIERS.indexOf(b) - HAMMER_TIERS.indexOf(a); });
    S.brokenHammers = dedupe(broken); S.discoveredHammers = dedupe(discovered);
    S.currentHammer = S.ownedHammers[0] || null;
    var st = S.currentHammer ? HAMMER_STATS[S.currentHammer] : null;
    S.currentHammerBonus = st ? st.bonus : null; S.currentHammerBreakChance = st ? st.baseBreak : null;
  }
  function parseLevel() {
    var el = document.querySelector('.beetle-card__level');
    if (el) {
      var m = el.textContent.match(/(\d+)/);
      if (m) {
        var lv = parseInt(m[1],10);
        if (S.level && lv > S.level) logEvent('LEVEL UP! '+S.level+' -> '+lv);
        S.level = lv;
      }
    }
    var posts = document.querySelectorAll('.postBody');
    var xpValues = [];
    posts.forEach(function(p) {
      var xpM = (p.textContent || '').match(/\+(\d+)\s*XP/i);
      if (xpM) xpValues.push(parseInt(xpM[1], 10));
    });
    if (!S._xpPostsSeen) S._xpPostsSeen = 0;
    if (xpValues.length > S._xpPostsSeen) {
      if (!S.session.totalXP) S.session.totalXP = 0;
      S.session.totalXP += xpValues.slice(S._xpPostsSeen).reduce(function(sum, xp) { return sum + xp; }, 0);
      S._xpPostsSeen = xpValues.length;
    }
  }
  function parseCraftMode() { var cm = document.querySelector('.crafting-module'); S.craftMode = cm ? (cm.classList.contains('crafting-module--smash') ? 'Smash' : 'Assemble') : null; }
  function isFresh() { return Date.now() - (S.lastPassiveScan||0) < STALE_MS || Date.now() - (S.lastFullScan||0) < STALE_MS; }

  /* ═══════════════════════════════════════════════════════
     6. RECOMMENDATION ENGINE
     ═══════════════════════════════════════════════════════ */
  function canMake(r, inv) { var needed = {}; for (var i = 0; i < r.inputs.length; i++) { var t = r.inputs[i]; needed[t] = (needed[t]||0)+1; } for (var tok in needed) { var g = TOKEN_GROUPS[tok]; if (g ? cnt(inv,g) < needed[tok] : (inv[tok]||0) < needed[tok]) return false; } return true; }
  function wouldConsumeLastCollectible(recipe, inv) {
    if (S.strategy === 'flowers' && FLOWER_CONSUMING.has(recipe.label)) return false;
    var out = RECIPE_OUTPUT[recipe.label]||null, makesNew = out && COLLECTIBLES.has(out) && !(inv[out]||0);
    for (var i = 0; i < recipe.inputs.length; i++) {
      var t = recipe.inputs[i], g = TOKEN_GROUPS[t];
      if (g) { for (var gi = 0; gi < g.length; gi++) { if ((inv[g[gi]]||0) > 0 && COLLECTIBLES.has(g[gi]) && (inv[g[gi]]||0) <= 1) { var hasAlt = false; for (var ai = 0; ai < g.length; ai++) if (ai !== gi && (inv[g[ai]]||0) > 1) { hasAlt = true; break; } if (!hasAlt && !(makesNew && !isProtected(g[gi],inv,out))) return true; } } }
      else if (COLLECTIBLES.has(t) && (inv[t]||0) <= 1 && !(makesNew && !isProtected(t,inv,out))) return true;
      if (!g && isProtected(t,inv,out)) return true;
    }
    return false;
  }
  function isProtected(key, inv, forOut) {
    var needsAda = !(inv['bombardier']||0) || !(inv['stag']||0) || !(inv['goliath']||0);
    if (needsAda) { if (forOut === 'bombardier' || forOut === 'stag' || forOut === 'goliath') return false; if ((key === 'pond' || key === 'monarch') && (inv[key]||0) <= 2) return true; }
    if (!(inv['black_lotus']||0)) { if (forOut === 'black_lotus') return false; if ((key === 'pinecone' || key === 'moss' || key === 'gunpowder') && (inv[key]||0) <= 1) return true; }
    if (!(inv['sunset_moth']||0)) { if (forOut === 'sunset_moth') return false; if (key === 'gazania' && (inv[key]||0) <= 1) return true; }
    if (!(inv['sabertooth_longhorn']||0)) { if (forOut === 'sabertooth_longhorn') return false; if (key === 'pincushion' && (inv[key]||0) <= 1) return true; }
    if (!(inv['mars_rhino']||0)) { if (forOut === 'mars_rhino') return false; if ((key === 'black_lotus' || key === 'sunset_moth' || key === 'sabertooth_longhorn') && (inv[key]||0) <= 1) return true; }
    if (!(inv['hercules']||0)) { if (forOut === 'hercules') return false; if ((key === 'golden_scarab' || key === 'pollen_adamantine') && (inv[key]||0) <= 1) return true; }
    return false;
  }
  function getDirectCrafts(inv) {
    var ht = bestHammerTier();
    return RECIPES.filter(function(r) {
      if (r.label === 'Junk Cube' || !canMake(r,inv)) return false;
      var hk = HAMMER_RECIPE_KEY[r.label]; if (hk) { var isBroken = S.brokenHammers && S.brokenHammers.indexOf(hk) > -1; var ot = HAMMER_TIERS.indexOf(hk); if (!isBroken && (ot<=ht||ot>ht+1)) return false; }
      var out = RECIPE_OUTPUT[r.label]; if (out && COLLECTIBLES.has(out) && (inv[out]||0) > 0 && !NEEDED_AS_INGREDIENT.has(out)) return false;
      return !wouldConsumeLastCollectible(r,inv);
    }).sort(function(a,b) { return (RECIPE_VALUE[b.label]||5) - (RECIPE_VALUE[a.label]||5); });
  }
  function getStage(inv) { var c = 0; for (var i = 0; i < STAGES.length; i++) { if (STAGES[i].check.every(function(k) { return (inv[k]||0) > 0; })) c = STAGES[i].n; else break; } return c; }
  function getCollection(inv) { return { ownedB:ALL_BEETLES.filter(function(k){return (inv[k]||0)>0;}), ownedF:ALL_FLOWERS.filter(function(k){return (inv[k]||0)>0;}), missingB:ALL_BEETLES.filter(function(k){return !(inv[k]||0);}), missingF:ALL_FLOWERS.filter(function(k){return !(inv[k]||0);}), totalB:ALL_BEETLES.length, totalF:ALL_FLOWERS.length }; }
  function getProgressionMove(inv) {
    var chain = S.strategy === 'flowers' ? FLOWER_CHAIN : (S.strategy === 'broad' ? BROAD_CHAIN : ENDGAME_CHAIN);
    var bestD = null, bestP = null, bestB = null;
    for (var i = 0; i < chain.length; i++) {
      var g = chain[i]; if ((inv[g.key]||0) >= (g.minQty||1)) continue;
      var miss = g.prereqs.filter(function(p) { return tokenCount(inv,p) < 1; });
      var val = RECIPE_VALUE[g.recipe] || 30;
      if (miss.length === 0 && g.recipe) { var recs = RECIPES.filter(function(r) { return RECIPE_OUTPUT[r.label] === g.key || r.label === g.recipe; }); var d = recs.find(function(r) { return canMake(r,inv) && !wouldConsumeLastCollectible(r,inv); }); if (d && (!bestD || val > bestD.val)) { bestD = {val:val,type:'direct',goal:g.key,label:d.label}; } continue; }
      if (!bestP) { for (var mi = 0; mi < miss.length; mi++) { var pls = PREREQ_RECIPES[miss[mi]]; if (!pls) continue; for (var pi = 0; pi < pls.length; pi++) { var pr = RECIPES.find(function(r){return r.label===pls[pi];}); if (pr && canMake(pr,inv) && !wouldConsumeLastCollectible(pr,inv)) { bestP = {val:val,type:'prereq',goal:g.key,label:pls[pi],reason:'For '+dn(g.key)+': craft '+pls[pi]}; break; } } if (bestP) break; } }
      if (!bestB) bestB = {type:'blocked',goal:g.key,label:g.recipe,reason:miss.length?'Need: '+miss.map(tokHuman).join(', '):(g.via||'Need inputs'),via:g.via};
    }
    return bestD || bestP || bestB;
  }

  /* ═══════════════════════════════════════════════════════
     7. ACTIONS
     ═══════════════════════════════════════════════════════ */
  var _navBlockedUntil = 0, _bootTime = Date.now(), _lastHuntScan = 0, _lastHuntClick = 0;
  function authBlockReason() { var t = bodyText(); if (/oidc-spa:\s*for security reasons/i.test(t) || /auth response/i.test(t)) return 'auth'; if (/sign in\s*or\s*register/i.test(t)) return 'signed-out'; if (/\bsign in\b/i.test(t) && !document.querySelector('.beetle-game-nav .info, .cheese-claim-nav .info')) return 'signed-out'; return null; }
  function tabVisible() { return !document.visibilityState || document.visibilityState === 'visible'; }
  function gameReady() { return !authBlockReason() && !!document.querySelector('#root, #app, .navbar-content, header, nav'); }
  function navReady() { return gameReady() && tabVisible() && !(_navBlockedUntil && Date.now() < _navBlockedUntil) && Date.now() - _bootTime >= BOOT_GRACE && !!document.querySelector('.navbar-content, .search-input, .beetle-game-nav, .cheese-claim-nav'); }

  function ensureCartridge(cart, reason) {
    cart = (cart||'').toLowerCase(); if (currentCartridge() === cart) return true; if (!navReady()) return false;
    var target = cart === 'beetle' ? firstVisible(['.beetle-game-nav','a[href*="cartridge=beetle"]']) : cart === 'cheese' ? firstVisible(['.cheese-claim-nav','a[href*="cartridge=cheese"]']) : null;
    _navBlockedUntil = Date.now() + NAV_COOLDOWN;
    if (target && safeClick(target)) { logEvent('Switching to '+cart+' for '+reason); return false; }
    logEvent('Navigating to '+cart+' for '+reason); window.location.assign('https://www.remilia.net/home?cartridge='+cart); return false;
  }
  function ensureCatchView() {
    if (firstVisible(['.beetle-catch-module__catch-button','.beetle-catch-module__hunt-button','.beetle-catch-module'])) return true;
    var nav = firstVisible(['.beetle-game-nav']); if (nav && gameReady()) { safeClick(nav); return false; } return false;
  }
  function executeAction(cfg) {
    if (cfg.guards && !cfg.guards()) return false;
    if (cfg.cartridge && !ensureCartridge(cfg.cartridge, cfg.name)) return 'navigating';
    if (cfg.needCatchView && !ensureCatchView()) return 'navigating';
    var btn = findButton(cfg.selectors); if (!btn) return 'waiting';
    var text = (btn.textContent||'').replace(/\s+/g,' ').trim();
    if (/processing|loading/i.test(text)) return 'stuck';
    if (cfg.textBlock && cfg.textBlock.test(text)) return 'blocked';
    if (!safeClick(btn)) return 'failed'; cfg.onSuccess(); return 'fired';
  }
  var ACTIONS = {
    claim: { name:'claim', cartridge:'beetle', needCatchView:true, selectors:['.beetle-catch-module__catch-button'],
      guards:function() { if (!S.autoClaim) return false; if (currentCartridge() !== 'beetle') return false; var nav = document.querySelector('.beetle-game-nav .info'); return nav && /ready/i.test(nav.textContent); },
      onSuccess:function() { S.session.claims++; logEvent('Auto-claimed beetle!'); save(); } },
    hunt: { name:'hunt', cartridge:'beetle', needCatchView:true, selectors:['.beetle-catch-module__hunt-button'], textBlock:/cooldown/i,
      guards:function() {
        if (!S.autoHunt) return false;
        if (Date.now() - _lastHuntClick < HUNT_DEBOUNCE) return false;
        if (currentCartridge() !== 'beetle') return false;
        var ch = S.mergedInventory.cheese||0;
        if (ch === 0) { var m = bodyText().match(/YOU HAVE (\d[\d,]*) (?:PIECES OF )?CHEESE/i); if (m) ch = parseInt(m[1].replace(/,/g,''),10); }
        if (ch < HUNT_COST || ch - HUNT_COST < MIN_CHEESE) return false;
        var ce = firstVisible(['.beetle-catch-module__hunt-button-cheese-cost']);
        return !(ce && /cooldown/i.test(ce.textContent||''));
      },
      onSuccess:function() { _lastHuntClick = Date.now(); S.session.hunts++; logEvent('Auto-hunted (-'+HUNT_COST+' cheese)'); save(); } },
    cheese: { name:'daily cheese', cartridge:'cheese', selectors:['.claim-button'],
      guards:function() { var nav = document.querySelector('.cheese-claim-nav .info'); return nav && /ready/i.test(nav.textContent); },
      onSuccess:function() { S.session.cheeseClaims++; logEvent('Auto-claimed daily cheese!'); save(); } }
  };

  /* ═══════════════════════════════════════════════════════
     8. LOGIN FLOW
     ═══════════════════════════════════════════════════════ */
  var _loginAttempts = 0, _lastLoginTime = 0;
  function detectLoginScreen() {
    var url = window.location.href, body = bodyText();
    if (/\/oidc\/.*openid-connect/i.test(url)) {
      var email = document.querySelector('input[name="username"], input[type="email"], input[name="email"]');
      var pass = document.querySelector('input[name="password"], input[type="password"]');
      var submit = document.querySelector('input[type="submit"], button[type="submit"]');
      if (!submit) { var btns = document.querySelectorAll('button, input[type="button"], a'); for (var i = 0; i < btns.length; i++) if (/^\s*sign\s*in\s*$/i.test(btns[i].textContent.trim())) { submit = btns[i]; break; } }
      if (email && pass) {
        // Browser autofill shows values visually but .value stays empty in JS.
        // Clicking submit triggers HTML5 validation which rejects empty .value.
        // Fix: find the form and call .submit() directly to bypass validation,
        // or simulate Enter key on password field (browser commits autofill on Enter).
        var form = pass.closest('form') || email.closest('form');
        if (form) return {screen:3, el:form, desc:'Sign In (form.submit)', useFormSubmit:true};
        if (submit) return {screen:3, el:submit, desc:'Sign In (button click)'};
      }
      if (/AUTHENTICATION\s*PORTAL/i.test(body)) { var pb = document.querySelectorAll('button, a, div[role="button"]'); for (var j = 0; j < pb.length; j++) if (/^\s*SIGN\s*IN\s*$/i.test(pb[j].textContent.trim()) && !/NEW/i.test(pb[j].textContent)) return {screen:2,el:pb[j],desc:'Auth Portal SIGN IN'}; }
      return {screen:0,el:null,desc:'OIDC page, nothing actionable'};
    }
    if (/sign\s*in\s*(or\s*register)?/i.test(body) && !document.querySelector('.beetle-game-nav .info, .cheese-claim-nav .info')) {
      var si = null;
      document.querySelectorAll('a, button, div[role="button"]').forEach(function(el) { if (!si && /SIGN\s*IN/i.test(el.textContent) && el.closest('.navbar-content, header, nav, [class*="nav"]')) si = el; });
      if (!si) document.querySelectorAll('*').forEach(function(el) { if (!si && /^\s*SIGN\s*IN\s*$/i.test(el.textContent.trim()) && el.children.length <= 1) si = el; });
      if (si) return {screen:1,el:si,desc:'Main site SIGN IN'};
    }
    return {screen:0,el:null,desc:'Not a login screen'};
  }
  function tryAutoLogin() {
    if (Date.now() - _lastLoginTime < LOGIN_COOLDOWN) return false;
    if (_loginAttempts >= LOGIN_MAX) { logThrottled('login-max','Auto-login gave up after '+LOGIN_MAX+' attempts.',120000); return false; }
    var s = detectLoginScreen(); if (!s.el) return false;
    _lastLoginTime = Date.now(); _loginAttempts++;
    logEvent('Auto-login '+s.screen+'/3: '+s.desc); save();
    // Screen 3: use form.submit() to bypass HTML5 validation (autofill leaves .value empty)
    if (s.useFormSubmit && s.el.tagName === 'FORM') { s.el.submit(); }
    else { safeClick(s.el); }
    return true;
  }

  /* ═══════════════════════════════════════════════════════
     9. STATE MACHINE
     ═══════════════════════════════════════════════════════ */
  function tick() {
    parseTimers(); refreshTimerDisplay();
    switch (S.machineState) {
      case 'BOOTING': return handleBooting();
      case 'LOGGED_OUT': return handleLoggedOut();
      case 'LOGGING_IN': return handleLoggingIn();
      case 'IDLE': return handleIdle();
      case 'CLAIMING': case 'HUNTING': case 'CLAIMING_CHEESE': return handleWaiting();
      case 'SCANNING': return;
      case 'STUCK': return handleStuck();
    }
  }
  function handleBooting() {
    if (authBlockReason()) { transition('LOGGED_OUT'); return; }
    if (!document.querySelector('#root, #app, .navbar-content, header, nav')) { if (stateAge() > 30000) { logEvent('App never loaded, refreshing...'); window.location.reload(); } return; }
    if (document.querySelector('.beetle-game-nav .info, .cheese-claim-nav .info')) {
      logEvent('Game loaded, automation active.'); _loginAttempts = 0;
      parseHammer(); parseLevel(); parseCraftMode();
      // Don't auto-scan here — go straight to IDLE and let handleIdle
      // decide priorities (cheese claim > hunt > scan). Auto-scanning on boot
      // was fighting with cheese navigation by redirecting back to beetle.
      transition('IDLE');
      renderPanel(); return;
    }
    if (/\/oidc\/.*openid-connect/i.test(window.location.href)) { transition('LOGGED_OUT'); return; }
    if (stateAge() > 15000) { logEvent('Navigating to game...'); window.location.assign('https://www.remilia.net/home?cartridge=beetle'); }
  }
  function handleLoggedOut() {
    if (gameReady() && document.querySelector('.beetle-game-nav .info, .cheese-claim-nav .info')) { logEvent('Login successful.'); _loginAttempts = 0; transition('BOOTING'); return; }
    if (tryAutoLogin()) transition('LOGGING_IN');
    else if (stateAge() > 120000) logThrottled('login-stuck','Still logged out after 2min.',120000);
  }
  function handleLoggingIn() {
    if (gameReady() && document.querySelector('.beetle-game-nav .info, .cheese-claim-nav .info')) { transition('BOOTING'); return; }
    if (authBlockReason() && stateAge() > LOGIN_COOLDOWN) { transition('LOGGED_OUT'); return; }
    if (stateAge() > 30000) transition('BOOTING');
  }
  function handleIdle() {
    if (!gameReady()) { transition(authBlockReason() ? 'LOGGED_OUT' : 'BOOTING'); return; }
    var cb = document.querySelector('.beetle-catch-module__catch-button'), hb = document.querySelector('.beetle-catch-module__hunt-button');
    if ((cb && (cb.classList.contains('loading') || /PROCESSING/i.test(cb.textContent))) || (hb && (hb.classList.contains('loading') || /PROCESSING/i.test(hb.textContent)))) { logEvent('Buttons stuck on PROCESSING...'); transition('STUCK'); return; }
    // Passive scan only when tab visible (needs DOM rendering)
    if (tabVisible() && Date.now() - (S.lastPassiveScan||0) > 30000) passiveScan();
    // Actions run even in background tabs
    var r;
    r = executeAction(ACTIONS.claim); if (r === 'fired') { transition('CLAIMING'); schedulePostAction(); return; } if (r === 'navigating') return; if (r === 'stuck') { transition('STUCK'); return; }
    // Hunts fire rapidly — game allows 3-4 before cooldown. Schedule follow-up hunts.
    r = executeAction(ACTIONS.hunt);
    if (r === 'fired') {
      _lastHuntScan = Date.now();
      // Schedule follow-up hunts at 4s, 8s, 12s to catch all available hunts
      for (var hi = 1; hi <= 3; hi++) {
        (function(delay) {
          setTimeout(function() {
            if (S.machineState === 'IDLE') {
              var r2 = executeAction(ACTIONS.hunt);
              if (r2 === 'fired') _lastHuntScan = Date.now();
            }
          }, delay * 4000);
        })(hi);
      }
      return;
    }
    if (r === 'navigating') return; if (r === 'stuck') { transition('STUCK'); return; }
    // If hunts were firing recently and stopped (cooldown kicked in), do a post-hunt scan
    if (_lastHuntScan && Date.now() - _lastHuntScan > 20000) { _lastHuntScan = 0; schedulePostAction(); }
    r = executeAction(ACTIONS.cheese); if (r === 'fired') { transition('CLAIMING_CHEESE'); schedulePostAction(); return; } if (r === 'navigating') return;
    // Full scan only when tab visible
    if (tabVisible() && !_scanning && Date.now() - (S.lastFullScan||0) > STALE_MS && ensureCartridge('beetle','scan')) { transition('SCANNING'); fullScan().then(function() { transition('IDLE'); }); }
    if (tabVisible()) renderPanel();
  }
  var _postTimer = null;
  function schedulePostAction() {
    save(); if (_postTimer) clearTimeout(_postTimer);
    _postTimer = setTimeout(function() { _postTimer = null;
      if (tabVisible()) { passiveScan(); renderPanel(); }
      // Only scan if no urgent actions pending (cheese ready blocks scan)
      var cheeseNav = document.querySelector('.cheese-claim-nav .info');
      var cheeseReady = cheeseNav && /ready/i.test(cheeseNav.textContent);
      if (!cheeseReady) {
        setTimeout(function() { if (!_scanning && S.machineState !== 'SCANNING') { transition('SCANNING'); fullScan().then(function() { transition('IDLE'); }); } }, 5000);
      }
    }, 8000);
    setTimeout(function() { if (S.machineState === 'CLAIMING' || S.machineState === 'HUNTING' || S.machineState === 'CLAIMING_CHEESE') transition('IDLE'); }, ACTION_TIMEOUT);
  }
  function handleWaiting() { if (stateAge() > ACTION_TIMEOUT) transition('IDLE'); }
  function handleStuck() {
    if (stateAge() < 15000) return;
    var cb = document.querySelector('.beetle-catch-module__catch-button'), hb = document.querySelector('.beetle-catch-module__hunt-button');
    var still = (cb && (cb.classList.contains('loading') || /PROCESSING/i.test(cb.textContent))) || (hb && (hb.classList.contains('loading') || /PROCESSING/i.test(hb.textContent)));
    if (!still) { logEvent('Recovered from stuck.'); transition('IDLE'); return; }
    if (stateAge() < 60000) { logEvent('Refreshing to recover...'); save(); window.location.reload(); }
    else { logEvent('Hard reset.'); transition('BOOTING'); window.location.assign('https://www.remilia.net/home?cartridge=beetle'); }
  }

  /* ═══════════════════════════════════════════════════════
     10. UI
     ═══════════════════════════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style'); s.id = STYLE_ID;
    s.textContent = '#'+BTN_ID+'{position:fixed;left:20px;bottom:20px;z-index:999999;padding:10px 14px;background:#d7f4f7;color:#11383d;border:1px solid #9bd8e0;border-radius:12px;font-weight:700;cursor:pointer;font-size:14px;}#'+BTN_ID+':hover{background:#c0edf2;}#'+PANEL_ID+'{position:fixed;left:20px;top:50px;z-index:999999;width:380px;min-width:300px;max-width:90vw;background:#fff;border:2px solid #b8e6ec;border-radius:16px;padding:16px;box-shadow:0 14px 40px rgba(0,0,0,.18);font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;color:#163238;max-height:calc(100vh - 70px);display:flex;flex-direction:column;gap:6px;overflow:hidden;resize:both;}#'+PANEL_ID+'.hidden{display:none!important;}.bc8-header{display:flex;align-items:center;justify-content:space-between;cursor:move;user-select:none;padding-bottom:4px;border-bottom:1px solid #e8f4f7;margin-bottom:2px;}.bc8-title{font-size:18px;font-weight:800;}.bc8-sub{font-size:11px;color:#5a7379;font-weight:700;}.bc8-btns{display:flex;gap:3px;flex-wrap:wrap;}.bc8-btn{background:#d9f2f6;color:#17363b;border:1px solid #b8e6ec;border-radius:6px;padding:4px 7px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;}.bc8-btn:hover{background:#c0edf2;}.bc8-btn.on{background:#17363b;color:#fff;}.bc8-strip{display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#f7fcfd;border:1px solid #e0f0f3;border-radius:8px;font-size:11px;flex-shrink:0;}.bc8-strip-item{display:flex;align-items:center;gap:3px;}.bc8-strip-label{color:#6b8a90;font-weight:600;}.bc8-badge{display:inline-block;padding:1px 5px;border-radius:4px;font-size:10px;font-weight:700;}.bc8-ready{background:#d4edda;color:#155724;}.bc8-countdown{background:#fff3cd;color:#856404;}.bc8-stale{background:#f8d7da;color:#721c24;}.bc8-fresh{background:#d4edda;color:#155724;}.bc8-card{background:#fafeff;border:1px solid #d5eef2;border-radius:8px;padding:8px;flex-shrink:0;}.bc8-focus{background:#f0f9fb;border:1px solid #b8e6ec;border-radius:8px;padding:10px;flex-shrink:0;}.bc8-scroll{background:#fafeff;border:1px solid #d5eef2;border-radius:10px;padding:8px;overflow-y:auto;overflow-x:hidden;flex-shrink:1;flex-grow:1;min-height:60px;}.bc8-scroll::-webkit-scrollbar{width:5px;}.bc8-scroll::-webkit-scrollbar-thumb{background:#b8e6ec;border-radius:3px;}.bc8-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;font-size:11px;line-height:1.4;}.bc8-row-name{display:flex;align-items:center;gap:4px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:65%;}.bc8-h{font-weight:800;font-size:13px;margin-bottom:6px;color:#11383d;}.bc8-muted{color:#6b8a90;font-size:10px;}.bc8-tier{font-size:8px;font-weight:700;padding:1px 4px;border-radius:3px;color:#fff;flex-shrink:0;}.bc8-val{font-weight:700;text-align:right;white-space:nowrap;font-size:11px;}.bc8-recipe{padding:3px 0;border-bottom:1px solid #eef5f7;}.bc8-recipe:last-child{border-bottom:none;}.bc8-recipe-name{font-weight:700;font-size:11px;}.bc8-log-line{font-size:9px;color:#6b8a90;line-height:1.4;border-bottom:1px solid #f0f7f9;padding:1px 0;}.bc8-state{font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;background:#e8f4f7;color:#11383d;}';
    document.head.appendChild(s);
  }
  function refreshTimerDisplay() {
    var fmt = function(v) { return !v ? '\u2014' : /ready/i.test(v) ? '<span class="bc8-badge bc8-ready">Ready</span>' : '<span class="bc8-badge bc8-countdown">'+v+'</span>'; };
    var el; el = document.getElementById('bc8-t-claim'); if (el) el.innerHTML = fmt(S.timers.beetleCatch);
    el = document.getElementById('bc8-t-hunt'); if (el) el.innerHTML = fmt(S.timers.huntCooldown);
    el = document.getElementById('bc8-t-cheese'); if (el) el.innerHTML = fmt(S.timers.dailyCheese);
    el = document.getElementById('bc8-state'); if (el) el.textContent = S.machineState;
    el = document.getElementById('bc8-fresh'); if (el) { var f = isFresh(); el.className = 'bc8-badge '+(f?'bc8-fresh':'bc8-stale'); el.textContent = f?'OK':'STALE'; }
  }
  var _drag = {on:false,ox:0,oy:0}, _dragBound = false;
  function bindDrag() { if (_dragBound) return; _dragBound = true; document.addEventListener('mousemove',function(e) { if (!_drag.on) return; var p = document.getElementById(PANEL_ID); if (p) { p.style.left = Math.max(0,e.clientX-_drag.ox)+'px'; p.style.top = Math.max(0,e.clientY-_drag.oy)+'px'; } }); document.addEventListener('mouseup',function() { _drag.on = false; }); }

  function renderPanel() {
    var panel = document.getElementById(PANEL_ID); if (!panel || panel.classList.contains('hidden')) return; bindDrag();
    var inv = S.mergedInventory||{}, stale = !isFresh(), crafts = stale ? [] : getDirectCrafts(inv), prog = stale ? null : getProgressionMove(inv);
    var fmt = function(v) { return !v ? '\u2014' : /ready/i.test(v) ? '<span class="bc8-badge bc8-ready">Ready</span>' : '<span class="bc8-badge bc8-countdown">'+v+'</span>'; };
    var h = '', cheese = inv.cheese ? inv.cheese.toLocaleString() : '';
    // Header
    h += '<div class="bc8-header"><span class="bc8-title"><span id="bc8-minimize" style="cursor:pointer;">\u{1FAB2}</span> Beetle Coach</span>';
    h += '<span class="bc8-sub">'+(S.level?'Lv.'+S.level:'')+(cheese?' \u00B7 '+cheese+' \u{1F9C0}':'');
    h += ' \u00B7 <span id="bc8-fresh" class="bc8-badge '+(isFresh()?'bc8-fresh':'bc8-stale')+'">'+(isFresh()?'OK':'STALE')+'</span>';
    h += ' \u00B7 <span id="bc8-state" class="bc8-state">'+S.machineState+'</span></span></div>';
    // Buttons
    var sl = S.strategy==='endgame'?'Endgame':(S.strategy==='flowers'?'Flowers':'Broad');
    h += '<div class="bc8-btns"><button class="bc8-btn" id="bc8-fs">Full Scan</button>';
    h += '<button class="bc8-btn '+(S.autoClaim?'on':'')+'" id="bc8-ac">Claim '+(S.autoClaim?'ON':'OFF')+'</button>';
    h += '<button class="bc8-btn '+(S.autoHunt?'on':'')+'" id="bc8-ah">Hunt '+(S.autoHunt?'ON':'OFF')+'</button>';
    h += '<button class="bc8-btn '+(S.strategy!=='broad'?'on':'')+'" id="bc8-strat">'+sl+'</button>';
    h += '<button class="bc8-btn" id="bc8-rst" style="color:#c0392b;border-color:#e6b0aa;">Reset</button></div>';
    // Status strip
    h += '<div class="bc8-strip">';
    h += '<div class="bc8-strip-item"><span class="bc8-strip-label">Hammer:</span> '+(S.currentHammer?dn(S.currentHammer):'\u2014')+'</div>';
    if (S.currentHammerBonus!=null) h += '<div class="bc8-strip-item"><span class="bc8-strip-label">+'+S.currentHammerBonus+'%</span> / '+S.currentHammerBreakChance+'% break</div>';
    if (S.brokenHammers&&S.brokenHammers.length) h += '<div class="bc8-strip-item"><span style="color:#e74c3c;font-weight:700;">Broken:</span> '+S.brokenHammers.map(dn).join(', ')+'</div>';
    h += '<div class="bc8-strip-item"><span class="bc8-strip-label">Claim:</span> <span id="bc8-t-claim">'+fmt(S.timers.beetleCatch)+'</span></div>';
    h += '<div class="bc8-strip-item"><span class="bc8-strip-label">Hunt:</span> <span id="bc8-t-hunt">'+fmt(S.timers.huntCooldown)+'</span></div>';
    h += '<div class="bc8-strip-item"><span class="bc8-strip-label">Cheese:</span> <span id="bc8-t-cheese">'+fmt(S.timers.dailyCheese)+'</span></div>';
    if (S.craftMode) h += '<div class="bc8-strip-item"><span class="bc8-strip-label">Mode:</span> '+S.craftMode+'</div>';
    h += '</div>';
    if (stale) h += '<div style="background:#fff3f3;border:1px solid #e6b0aa;border-radius:8px;padding:6px;color:#c0392b;font-weight:800;font-size:11px;flex-shrink:0;">Inventory stale. Hit Full Scan.</div>';
    // Next moves
    var sb = S.strategy==='endgame'?'bc8-countdown':(S.strategy==='flowers'?'bc8-stale':'bc8-fresh');
    h += '<div class="bc8-focus"><div class="bc8-h">Next moves <span class="bc8-badge '+sb+'" style="font-size:8px;">'+sl.toUpperCase()+'</span></div>';
    if (prog && (prog.type==='direct'||prog.type==='prereq')) {
      var pr = RECIPES.find(function(r){return r.label===prog.label;});
      h += '<div style="font-weight:800;font-size:14px;">'+dn(prog.goal)+' <span class="bc8-badge bc8-fresh">GOAL</span></div>';
      if (pr) h += '<div class="bc8-muted">\u2705 '+pr.inputs.map(tokHuman).join(' + ')+'</div>';
      if (prog.type==='prereq') h += '<div class="bc8-muted">\u{1F536} '+prog.reason+'</div>';
    }
    var shown = 0; for (var ci = 0; ci < crafts.length && shown < 3; ci++) {
      if (prog && crafts[ci].label === prog.label) continue;
      h += '<div style="margin-top:4px;"><span style="font-weight:700;">'+crafts[ci].label+'</span> '+(crafts[ci].type==='assemble'?'<span class="bc8-badge bc8-fresh">SAFE</span>':'<span class="bc8-badge bc8-countdown">RNG</span>')+'</div>';
      h += '<div class="bc8-muted">'+crafts[ci].inputs.map(tokHuman).join(' + ')+'</div>'; shown++;
    }
    if (prog && prog.type==='blocked') { h += '<div class="bc8-muted" style="margin-top:4px;border-top:1px solid #e8f4f7;padding-top:4px;"><b>Goal: '+dn(prog.goal)+'</b> \u2014 '+prog.reason; if (prog.via) h += '<br><span style="color:#5b8dd9;">\u2192 '+prog.via+'</span>'; h += '</div>'; }
    if (!prog && !crafts.length) h += '<div class="bc8-muted">'+(stale?'Scan first.':'No craftable moves. Farm more.')+'</div>';
    h += '</div>';
    // Progression
    var stage = getStage(inv), col = getCollection(inv);
    h += '<div class="bc8-card"><div style="display:flex;gap:2px;margin-bottom:4px;">';
    var sc = ['#7a8a7a','#b87333','#5b8dd9','#9b59b6','#e67e22','#e74c3c','#f1c40f'];
    for (var si = 0; si < 7; si++) h += '<div style="flex:1;height:4px;border-radius:2px;background:'+(si<stage?sc[si]:'#d5e8ec')+';"></div>';
    h += '</div><div class="bc8-row"><div>Stage '+stage+'/7</div><div class="bc8-val">Beetles '+col.ownedB.length+'/'+col.totalB+' \u00B7 Flowers '+col.ownedF.length+'/'+col.totalF+'</div></div>';
    var miss = col.missingB.map(dn).concat(col.missingF.map(dn));
    if (miss.length > 0 && miss.length <= 8) h += '<div class="bc8-muted">Missing: '+miss.join(', ')+'</div>';
    h += '</div>';
    // You can make
    h += '<div class="bc8-scroll" style="max-height:120px;"><div class="bc8-h">You can make ('+crafts.length+')</div>';
    if (!crafts.length) h += '<div class="bc8-muted">'+(stale?'Scan first.':'No recipes available.')+'</div>';
    for (var di = 0; di < crafts.length; di++) { var dc = crafts[di]; h += '<div class="bc8-recipe"><div class="bc8-recipe-name">'+dc.label+' '+(dc.type==='assemble'?'<span class="bc8-badge bc8-fresh">SAFE</span>':'<span class="bc8-badge bc8-countdown">RNG</span>')+'</div><div class="bc8-muted">'+dc.inputs.map(tokHuman).join(' + ')+'</div></div>'; }
    h += '</div>';
    // Inventory
    h += '<div class="bc8-scroll" style="max-height:200px;"><div class="bc8-h">Inventory</div>';
    var items = Object.keys(inv).filter(function(k) { return !JUNK_SET.has(k) && !SKIP_DISPLAY.has(k) && k !== 'cheese'; }).sort(function(a,b) { return (inv[b]||0)-(inv[a]||0); });
    for (var ii = 0; ii < items.length; ii++) { var ik = items[ii], tier = TIER_MAP[ik]; h += '<div class="bc8-row"><div class="bc8-row-name">'+dn(ik)+' '+(tier?'<span class="bc8-tier" style="background:'+(TIER_COLORS[tier]||'#888')+'">'+tier+'</span>':'')+'</div><div class="bc8-val">'+inv[ik]+'</div></div>'; }
    var jt = cnt(inv,ANY_JUNK); if (jt > 0) { var jn = ANY_JUNK.filter(function(k){return (inv[k]||0)>0;}).length; h += '<div class="bc8-row"><div class="bc8-row-name">Junk <span class="bc8-tier" style="background:#888">Junk</span></div><div class="bc8-val">'+jt+' ('+jn+' types)</div></div>'; }
    h += '</div>';
    // Session
    var sess = S.session||{}, mins = Math.round((Date.now()-(sess.startTime||Date.now()))/60000);
    var dur = mins < 60 ? mins+'m' : Math.floor(mins/60)+'h'+(mins%60?' '+(mins%60)+'m':'');
    h += '<div class="bc8-card"><div class="bc8-row"><div class="bc8-h" style="margin:0;">Session</div><div class="bc8-val">'+dur+' \u00B7 '+(sess.claims||0)+'c/'+(sess.hunts||0)+'h'+(sess.totalXP?' \u00B7 '+sess.totalXP+' XP':'')+'</div></div>';
    if (sess.gains && sess.gains.length) { var gc = {}; for (var gi = 0; gi < sess.gains.length; gi++) gc[sess.gains[gi]] = (gc[sess.gains[gi]]||0)+1; h += '<div class="bc8-muted">Gained: '+Object.keys(gc).map(function(n){return gc[n]>1?n+' x'+gc[n]:n;}).join(', ')+'</div>'; }
    h += '</div>';
    // Log
    h += '<div class="bc8-scroll" style="max-height:80px;flex:1;"><div class="bc8-h">Log</div><div id="bc8-log">'+S.log.slice().reverse().map(function(l){return '<div class="bc8-log-line">'+l+'</div>';}).join('')+'</div></div>';
    panel.innerHTML = h;
    // Bind
    document.getElementById('bc8-fs').addEventListener('click',function() { transition('SCANNING'); fullScan().then(function(){transition('IDLE');}); });
    document.getElementById('bc8-ac').addEventListener('click',function() { S.autoClaim = !S.autoClaim; save(); renderPanel(); });
    document.getElementById('bc8-ah').addEventListener('click',function() { S.autoHunt = !S.autoHunt; save(); renderPanel(); });
    document.getElementById('bc8-strat').addEventListener('click',function() { var m = ['endgame','broad','flowers']; S.strategy = m[(m.indexOf(S.strategy)+1)%m.length]; save(); renderPanel(); });
    document.getElementById('bc8-rst').addEventListener('click',function() { if (confirm('Clear all data?')) { S = defaults(); save(); renderPanel(); fullScan(); } });
    document.getElementById('bc8-minimize').addEventListener('click',function(e) { e.stopPropagation(); var p = document.getElementById(PANEL_ID); if (p) { p.classList.add('hidden'); S.panelOpen = false; save(); } });
    var hdr = document.querySelector('.bc8-header'); if (hdr) hdr.addEventListener('mousedown',function(e) { if (e.target.id==='bc8-minimize') return; var p = document.getElementById(PANEL_ID); if (!p) return; _drag.on=true; _drag.ox=e.clientX-p.offsetLeft; _drag.oy=e.clientY-p.offsetTop; e.preventDefault(); });
  }

  function ensureUI() {
    injectStyles();
    if (!document.getElementById(BTN_ID)) { var btn = document.createElement('button'); btn.id = BTN_ID; btn.textContent = '\u{1FAB2} Beetle Coach'; btn.addEventListener('click',function() { var p = document.getElementById(PANEL_ID); if (!p) { p = document.createElement('div'); p.id = PANEL_ID; document.body.appendChild(p); } p.classList.toggle('hidden'); S.panelOpen = !p.classList.contains('hidden'); save(); if (S.panelOpen) { parseTimers(); renderPanel(); } }); document.body.appendChild(btn); }
    if (!document.getElementById(PANEL_ID)) { var p = document.createElement('div'); p.id = PANEL_ID; if (!S.panelOpen) p.classList.add('hidden'); document.body.appendChild(p); }
  }

  /* ═══════════════════════════════════════════════════════
     11. BOOT
     ═══════════════════════════════════════════════════════ */
  var _booted = false;
  function boot() { if (_booted) return; _booted = true; _bootTime = Date.now(); transition('BOOTING'); ensureUI(); renderPanel(); setInterval(tick, TICK_MS); setTimeout(tick, 1000); console.log('[BeetleCoach v12] booted'); }
  function safeBoot() { try { boot(); } catch(e) { console.warn('[BC] boot fail',e); } }
  if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(safeBoot,1500);
  else window.addEventListener('load',function() { setTimeout(safeBoot,1500); });
  setTimeout(safeBoot,3000); setTimeout(safeBoot,5000);
  var obs = new MutationObserver(function() { if (!document.getElementById(BTN_ID)) { _booted = false; setTimeout(safeBoot,500); } });
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
