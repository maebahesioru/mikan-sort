/* Mikan Sort! — data: bins + waste item database (with "why" facts)
 *
 * 36 items across 4 bins. `minLevel` gates harder items:
 *   1 = everyday item (available from the start)
 *   2 = common tricky item (joins at Level 2)
 *   4 = expert trick (joins at Level 4)
 * `pts` = base score before level bonus and combo multiplier.
 *
 * Facts are simplified, generic municipal guidance — exact rules vary by city.
 */
'use strict';

const BINS = [
  { id: 'recycle', label: 'RECYCLE', icon: '♻️', color: '#3b82f6', key: '1',
    hint: 'Bottles, cans, paper, clean plastics' },
  { id: 'compost', label: 'COMPOST', icon: '🍃', color: '#22c55e', key: '2',
    hint: 'Food scraps, peels, leaves' },
  { id: 'trash', label: 'TRASH', icon: '🗑️', color: '#8b949e', key: '3',
    hint: 'Dirty or mixed items' },
  { id: 'hazard', label: 'HAZARD', icon: '⚠️', color: '#ef4444', key: '4', unlockLevel: 2,
    hint: 'Batteries, bulbs, e-waste' },
];

const ITEMS = [
  // ---- RECYCLE ----
  { name: 'Plastic bottle', icon: '🥤', bin: 'recycle', minLevel: 1, pts: 10,
    fact: 'Rinsed bottles become new bottles — recycling one saves energy for hours of light.' },
  { name: 'Newspaper', icon: '📰', bin: 'recycle', minLevel: 1, pts: 10,
    fact: 'Paper can be recycled about 7 times before its fibers wear out.' },
  { name: 'Aluminum can', icon: '🥫', bin: 'recycle', minLevel: 1, pts: 10,
    fact: 'A recycled can is back on shelves in about 60 days.' },
  { name: 'Cardboard box', icon: '📦', bin: 'recycle', minLevel: 1, pts: 10,
    fact: 'Flatten boxes — they take up big space in bins and trucks.' },
  { name: 'Glass bottle', icon: '🍾', bin: 'recycle', minLevel: 1, pts: 10,
    fact: 'Glass can be recycled endlessly without losing quality.' },
  { name: 'Notebook paper', icon: '📄', bin: 'recycle', minLevel: 1, pts: 10,
    fact: 'Keep paper dry — wet or food-stained paper cannot be recycled.' },
  { name: 'Glass jar', icon: '🫙', bin: 'recycle', minLevel: 2, pts: 15,
    fact: 'Glass recycles endlessly — rinse jars and remove the lids.' },
  { name: 'Junk mail', icon: '✉️', bin: 'recycle', minLevel: 2, pts: 15,
    fact: 'Paper mail recycles — plastic window films are best removed first.' },
  { name: 'Clean pizza box', icon: '🍕', bin: 'recycle', minLevel: 4, pts: 20,
    fact: 'A CLEAN pizza box recycles — just tear off the greasy part!' },
  // ---- COMPOST ----
  { name: 'Banana peel', icon: '🍌', bin: 'compost', minLevel: 1, pts: 10,
    fact: 'Peels break down into compost in weeks — they jam recycling machines.' },
  { name: 'Apple core', icon: '🍎', bin: 'compost', minLevel: 1, pts: 10,
    fact: 'Food scraps become nutrient-rich compost instead of landfill methane.' },
  { name: 'Mikan peel', icon: '🍊', bin: 'compost', minLevel: 1, pts: 10,
    fact: 'Mikan peels are compost champions — citrus breaks down fast!' },
  { name: 'Carrot tops', icon: '🥕', bin: 'compost', minLevel: 1, pts: 10,
    fact: 'Veggie scraps feed the compost, not the trash truck.' },
  { name: 'Eggshells', icon: '🥚', bin: 'compost', minLevel: 1, pts: 10,
    fact: 'Eggshells add minerals that help plants grow.' },
  { name: 'Fallen leaves', icon: '🍂', bin: 'compost', minLevel: 1, pts: 10,
    fact: 'Leaves are garden gold — compost them into soil.' },
  { name: 'Coffee grounds', icon: '☕', bin: 'compost', minLevel: 2, pts: 15,
    fact: 'Coffee grounds add nitrogen to compost — the paper filter can go in too.' },
  { name: 'Grass clippings', icon: '🌱', bin: 'compost', minLevel: 2, pts: 15,
    fact: 'Bagged grass makes methane in landfill — compost it into soil food.' },
  { name: 'Corn cob', icon: '🌽', bin: 'compost', minLevel: 4, pts: 20,
    fact: 'Corn cobs are slow to break down — chop them up and compost.' },
  // ---- TRASH ----
  { name: 'Greasy pizza box', icon: '🍕', bin: 'trash', minLevel: 1, pts: 10,
    fact: 'Grease ruins paper recycling — food-soiled boxes go in the trash.' },
  { name: 'Torn sock', icon: '🧦', bin: 'trash', minLevel: 1, pts: 10,
    fact: 'Textiles do not belong in recycling bins — trash or donate them.' },
  { name: 'Used bandage', icon: '🩹', bin: 'trash', minLevel: 1, pts: 10,
    fact: 'Soiled items belong in the trash — keep bins clean for workers.' },
  { name: 'Old toothbrush', icon: '🪥', bin: 'trash', minLevel: 1, pts: 10,
    fact: 'Mixed materials are hard to recycle — this one goes to trash.' },
  { name: 'Dirty sponge', icon: '🧽', bin: 'trash', minLevel: 1, pts: 10,
    fact: 'Sponges soaked with cleaners are trash, not recycling.' },
  { name: 'Broken mug', icon: '🏺', bin: 'trash', minLevel: 1, pts: 10,
    fact: 'Ceramics melt differently than glass — keep them out of glass recycling.' },
  { name: 'Plastic bag', icon: '🛍️', bin: 'trash', minLevel: 2, pts: 15,
    fact: 'Bags tangle the sorting machines — most stores take them back instead.' },
  { name: 'Foam takeout box', icon: '🥡', bin: 'trash', minLevel: 2, pts: 15,
    fact: 'Foam cannot be recycled curbside — it crumbles into litter.' },
  { name: 'Used paper towel', icon: '🧻', bin: 'trash', minLevel: 2, pts: 15,
    fact: 'Soiled towels cannot be recycled — trash them (or compost if you can).' },
  { name: 'Mirror', icon: '🪞', bin: 'trash', minLevel: 4, pts: 20,
    fact: 'Mirror glass is not container glass — it goes in the trash.' },
  { name: 'Old sneakers', icon: '👟', bin: 'trash', minLevel: 4, pts: 20,
    fact: 'Worn shoes go to trash or a textile drop-off — never the recycling bin.' },
  // ---- HAZARD (bin unlocks at Level 2) ----
  { name: 'Battery', icon: '🔋', bin: 'hazard', minLevel: 1, pts: 10,
    fact: 'Batteries can spark fires in trash trucks — take them to e-waste.' },
  { name: 'Light bulb', icon: '💡', bin: 'hazard', minLevel: 1, pts: 10,
    fact: 'Bulbs break and cut workers — e-waste drop-off only.' },
  { name: 'Old phone', icon: '📱', bin: 'hazard', minLevel: 2, pts: 15,
    fact: 'E-waste holds valuable metals — recycle it separately.' },
  { name: 'Charging cable', icon: '🔌', bin: 'hazard', minLevel: 2, pts: 15,
    fact: 'Cables tangle recycling machines — e-waste bin, please.' },
  { name: 'Expired medicine', icon: '💊', bin: 'hazard', minLevel: 2, pts: 15,
    fact: 'Never flush or trash medicine — pharmacy take-back boxes keep water clean.' },
  { name: 'Old laptop', icon: '💻', bin: 'hazard', minLevel: 4, pts: 20,
    fact: 'Laptops hold lithium batteries — e-waste drop-off recovers the metals.' },
  { name: 'Keyboard', icon: '⌨️', bin: 'hazard', minLevel: 4, pts: 20,
    fact: 'Keyboards are e-waste — their metals and plastics get recovered.' },
];

// Items available for the current level:
// the item's bin must be unlocked AND the item's difficulty tier must be reached.
function availableItems(level) {
  return ITEMS.filter((it) => {
    const bin = BINS.find((b) => b.id === it.bin);
    const binOpen = !bin.unlockLevel || level >= bin.unlockLevel;
    return binOpen && level >= (it.minLevel || 1);
  });
}
