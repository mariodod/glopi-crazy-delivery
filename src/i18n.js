/**
 * M7.2 internationalization: Spanish (default) + Catalan + English.
 *
 * One flat dictionary per language; `t(key, params)` resolves the current
 * language, falls back to Spanish, then to the key itself. Cheap parameter
 * interpolation with `{name}` slots. In-game content (restaurant names,
 * dishes, customer notes) stays as Barcelona-flavored mixed-language
 * material by design — this layer only covers UI labels and popup phrasing.
 *
 * Language cycles with L (or a click) on the menu; stored in localStorage
 * under 'glopi-lang', falling back silently in non-browser contexts.
 */
const DICTIONARIES = {
  es: {
    // menu
    'menu.subtitle': 'Repartidor de Glovo en Barcelona · ¡a pedalear!',
    'menu.prompt': 'Pulsa ESPACIO para empezar',
    'menu.turno': 'TURNO:',
    'menu.lang': 'Idioma: {lang}',
    'menu.langHint': 'L · IDIOMA',
    'menu.rank': 'RANGO: {rank} · {d} entregas',
    // difficulty tiers
    'tier.calmado': 'CALMADO',
    'tier.calmado.desc': 'Cielo despejado',
    'tier.rush': 'HORA PUNTA',
    'tier.rush.desc': 'La calle aprieta',
    'tier.monsoon': 'MONZÓN DE PEDALES',
    'tier.monsoon.desc': 'Caos total',
    // order/hud card
    'hud.turno': 'TURNO {t}',
    'hud.waitTag': 'ESPERA',
    'hud.waitName': 'Sigue las flechas…',
    'hud.waitSub': 'nuevo pedido en camino',
    'hud.pickTag': 'RECOGER · FRENA EN EL CÍRCULO',
    'hud.deliverTag': 'ENTREGA · {word}',
    'hud.delivery1': 'entrega',
    'hud.deliveryN': 'entregas',
    'hud.streak': 'racha x{n}',
    'hud.stop': 'PARADA {i}/{n}',
    'hud.hint': 'W acelera · S frena · A/D virar · frena en el círculo para recoger/entregar · MAYÚS campana · H debug · ESC = menú',
    'ui.pedal': 'PEDAL',
    'ui.brake': 'FRENO',
    // popups
    'pop.newOrder': '¡NUEVO PEDIDO!',
    'pop.picked': '¡Recogido! €{n}',
    'pop.pay': '+€{n} · {word}',
    'pop.lost': '¡Pedido perdido!',
    'pop.bump': '¡AY!',
    'pop.near': '¡CASI! +€{n}{streak}',
    'pop.cashLose': '−€{n} ¡AY!',
    'pop.ding': '¡DING!',
    'pop.draft': '¡REBUFO!',
    'pop.next': '¡SIGUIENTE PARADA!',
    'pop.chain': '¡CADENA COMPLETA! +€{n}',
    // tip tier words
    'tier.word.fast': '¡RÁPIDO!',
    'tier.word.ok': 'BIEN',
    'tier.word.late': 'TARDE',
    'tier.word.slow': 'LENTO',
    // results
    'res.title': 'SE TERMINÓ EL TURNO',
    'res.rank': 'RANGO',
    'res.money': 'EUR {n}',
    'res.deliveries1': '1 entrega',
    'res.deliveriesN': '{n} entregas',
    'res.streak': 'mejor racha x{n}',
    'res.nearMiss': '{n} casi-accidentes',
    'res.timeBonus': '+{n}s por entregas',
    'res.best': 'mejor turno: €{m} · {d}',
    'res.newRecord': '  ¡NUEVO RÉCORD!',
    'res.firstSave': 'primer turno guardado',
    'res.again': 'Pulsa ESPACIO para otra ronda',
    'res.againTouch': 'Toca la pantalla para otra ronda',
    // rider rank (M8.2)
    'rank.novato': 'NOVATO',
    'rank.junior': 'JUNIOR',
    'rank.senior': 'SENIOR',
    'rank.experto': 'EXPERTO',
    'rank.guru': 'GURÚ GLOPI',
    'rank.leyenda': 'LEYENDA GLOPI',
    'res.career': 'CARRERA: {rank} · {d} entregas totales',
    'res.rankUp': '¡SUBISTE A RANGO {rank}!',
  },
  ca: {
    // menu
    'menu.subtitle': 'Repartidor de Glovo a Barcelona · a pedalar!',
    'menu.prompt': 'Prem ESPAI per començar',
    'menu.turno': 'TORN:',
    'menu.lang': 'Idioma: {lang}',
    'menu.langHint': 'L · IDIOMA',
    'menu.rank': 'RANG: {rank} · {d} comandes',
    // difficulty tiers
    'tier.calmado': 'TRANQUIL',
    'tier.calmado.desc': 'Cel serè',
    'tier.rush': 'HORA PUNTA',
    'tier.rush.desc': 'El carrer apreta',
    'tier.monsoon': 'MONSÓ DE PEDALS',
    'tier.monsoon.desc': 'Caos total',
    // order/hud card
    'hud.turno': 'TORN {t}',
    'hud.waitTag': 'ESPERA',
    'hud.waitName': 'Segueix les fletxes…',
    'hud.waitSub': 'comanda nova a camí',
    'hud.pickTag': 'RECOLLIR · FRENA DINS EL CERCLE',
    'hud.deliverTag': 'ENTREGAR · {word}',
    'hud.delivery1': 'comanda',
    'hud.deliveryN': 'comandes',
    'hud.streak': 'ratxa x{n}',
    'hud.stop': 'PARADA {i}/{n}',
    'hud.hint': 'W accelerar · S frenar · A/D girar · frena dins el cercle per recollir/entregar · MAJÙS campana · H debug · ESC = menú',
    'ui.pedal': 'PEDAL',
    'ui.brake': 'FRE',
    // popups
    'pop.newOrder': 'COMANDA NOVA!',
    'pop.picked': 'Recolzat! €{n}',
    'pop.pay': '+€{n} · {word}',
    'pop.lost': 'Comanda perduda!',
    'pop.bump': 'AI!',
    'pop.near': 'GAIREBÉ! +€{n}{streak}',
    'pop.cashLose': '−€{n} AI!',
    'pop.ding': 'DING!',
    'pop.draft': '¡A RESGUARD!',
    'pop.next': 'SEGÜENT PARADA!',
    'pop.chain': 'CADENA COMPLETADA! +€{n}',
    // tip tier words
    'tier.word.fast': 'RAPIDÍSSIM!',
    'tier.word.ok': 'BÉ',
    'tier.word.late': 'TARD',
    'tier.word.slow': 'PAUSAT',
    // results
    'res.title': 'S\u2019ACABA EL TORN',
    'res.rank': 'RANG',
    'res.money': 'EUR {n}',
    'res.deliveries1': '1 comanda',
    'res.deliveriesN': '{n} comandes',
    'res.streak': 'millor ratxa x{n}',
    'res.nearMiss': '{n} quasi-accidents',
    'res.timeBonus': '+{n}s per comandes',
    'res.best': 'millor torn: €{m} · {d}',
    'res.newRecord': '  RÈCORD NOU!',
    'res.firstSave': 'primer torn guardat',
    'res.again': 'Prem ESPAI per una altra ronda',
    'res.againTouch': 'Toca la pantalla per una altra ronda',
    // rider rank (M8.2)
    'rank.novato': 'NOVELL',
    'rank.junior': 'JÚNIOR',
    'rank.senior': 'SÈNIOR',
    'rank.experto': 'EXPERT',
    'rank.guru': 'GURÚ GLOPI',
    'rank.leyenda': 'LLEGENDA GLOPI',
    'res.career': 'CARRERA: {rank} · {d} comandes totals',
    'res.rankUp': 'HAS PUJAT A RANG {rank}!',
  },
  en: {
    // menu
    'menu.subtitle': 'Glovo courier in Barcelona · pedal to the metal!',
    'menu.prompt': 'Press SPACE to start',
    'menu.turno': 'SHIFT:',
    'menu.lang': 'Language: {lang}',
    'menu.langHint': 'L · LANGUAGE',
    'menu.rank': 'RANK: {rank} · {d} deliveries',
    // difficulty tiers
    'tier.calmado': 'CHILL',
    'tier.calmado.desc': 'Clear skies',
    'tier.rush': 'RUSH HOUR',
    'tier.rush.desc': 'The streets push back',
    'tier.monsoon': 'PEDAL MONSOON',
    'tier.monsoon.desc': 'Total chaos',
    // order/hud card
    'hud.turno': 'SHIFT {t}',
    'hud.waitTag': 'WAITING',
    'hud.waitName': 'Follow the arrows…',
    'hud.waitSub': 'new order incoming',
    'hud.pickTag': 'PICK UP · STOP IN THE CIRCLE',
    'hud.deliverTag': 'DELIVER · {word}',
    'hud.delivery1': 'delivery',
    'hud.deliveryN': 'deliveries',
    'hud.streak': 'combo x{n}',
    'hud.stop': 'STOP {i}/{n}',
    'hud.hint': 'W pedal · S brake · A/D steer · stop in the circle to pick up/deliver · SHIFT bell · H debug · ESC = menu',
    'ui.pedal': 'PEDAL',
    'ui.brake': 'BRAKE',
    // popups
    'pop.newOrder': 'NEW ORDER!',
    'pop.picked': 'Picked up! €{n}',
    'pop.pay': '+€{n} · {word}',
    'pop.lost': 'Order lost!',
    'pop.bump': 'OW!',
    'pop.near': 'CLOSE ONE! +€{n}{streak}',
    'pop.cashLose': '−€{n} OW!',
    'pop.ding': 'DING!',
    'pop.draft': 'DRAFT!',
    'pop.next': 'NEXT STOP!',
    'pop.chain': 'CHAIN COMPLETE! +€{n}',
    // tip tier words
    'tier.word.fast': 'FAST!',
    'tier.word.ok': 'NICE',
    'tier.word.late': 'LATE',
    'tier.word.slow': 'SLOW',
    // results
    'res.title': 'SHIFT OVER',
    'res.rank': 'RANK',
    'res.money': 'EUR {n}',
    'res.deliveries1': '1 delivery',
    'res.deliveriesN': '{n} deliveries',
    'res.streak': 'best combo x{n}',
    'res.nearMiss': '{n} close calls',
    'res.timeBonus': '+{n}s from deliveries',
    'res.best': 'best turn: €{m} · {d}',
    'res.newRecord': '  NEW RECORD!',
    'res.firstSave': 'first turn saved',
    'res.again': 'Press SPACE for another shift',
    'res.againTouch': 'Tap the screen for another shift',
    // rider rank (M8.2)
    'rank.novato': 'ROOKIE',
    'rank.junior': 'JUNIOR',
    'rank.senior': 'SENIOR',
    'rank.experto': 'EXPERT',
    'rank.guru': 'GLOPI GURU',
    'rank.leyenda': 'GLOPI LEGEND',
    'res.career': 'CAREER: {rank} · {d} total deliveries',
    'res.rankUp': 'PROMOTED TO RANK {rank}!',
  },
};

const LANGS = ['es', 'ca', 'en'];
const STORAGE_KEY = 'glopi-lang';
let current = null;

/** Current language code, resolving storage once. */
export function getLang() {
  if (!current) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      current = stored && LANGS.includes(stored) ? stored : 'es';
    } catch (_e) {
      current = 'es';
    }
  }
  return current;
}

/** Set the language explicitly (the menu cycle button lives on top of this). */
function setLang(lang) {
  if (LANGS.includes(lang)) {
    current = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_e) { /* storage unavailable */ }
  }
}

/** Advance to the next language in ES→CA→EN→ES. */
export function cycleLang() {
  const i = LANGS.indexOf(getLang());
  setLang(LANGS[(i + 1) % LANGS.length]);
}

/**
 * Translate a key for the active language. Unknown keys return the key
 * itself so a missing string can never blank the UI.
 */
export function t(key, params) {
  const pack = DICTIONARIES[getLang()] ?? DICTIONARIES.es;
  let s = pack[key] ?? DICTIONARIES.es[key] ?? key;
  if (params) {
    for (const k of Object.keys(params)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k]));
    }
  }
  return s;
}