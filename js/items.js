/* Mikan Sort! — data: bins + waste items (with "why" facts) */
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
  { name: 'Plastic bottle', icon: '🥤', bin: 'recycle',
    fact: 'Rinsed bottles become new bottles — recycling one saves energy for hours of light.' },
  { name: 'Newspaper', icon: '📰', bin: 'recycle',
    fact: 'Paper can be recycled about 7 times before its fibers wear out.' },
  { name: 'Aluminum can', icon: '🥫', bin: 'recycle',
    fact: 'A recycled can is back on shelves in about 60 days.' },
  { name: 'Cardboard box', icon: '📦', bin: 'recycle',
    fact: 'Flatten boxes — they take up big space in bins and trucks.' },
  { name: 'Glass bottle', icon: '🍾', bin: 'recycle',
    fact: 'Glass can be recycled endlessly without losing quality.' },
  { name: 'Notebook paper', icon: '📄', bin: 'recycle',
    fact: 'Keep paper dry — wet or food-stained paper cannot be recycled.' },
  // ---- COMPOST ----
  { name: 'Banana peel', icon: '🍌', bin: 'compost',
    fact: 'Peels break down into compost in weeks — they jam recycling machines.' },
  { name: 'Apple core', icon: '🍎', bin: 'compost',
    fact: 'Food scraps become nutrient-rich compost instead of landfill methane.' },
  { name: 'Mikan peel', icon: '🍊', bin: 'compost',
    fact: 'Mikan peels are compost champions — citrus breaks down fast!' },
  { name: 'Carrot tops', icon: '🥕', bin: 'compost',
    fact: 'Veggie scraps feed the compost, not the trash truck.' },
  { name: 'Eggshells', icon: '🥚', bin: 'compost',
    fact: 'Eggshells add minerals that help plants grow.' },
  { name: 'Fallen leaves', icon: '🍂', bin: 'compost',
    fact: 'Leaves are garden gold — compost them into soil.' },
  // ---- TRASH ----
  { name: 'Greasy pizza box', icon: '🍕', bin: 'trash',
    fact: 'Grease ruins paper recycling — food-soiled boxes go in the trash.' },
  { name: 'Torn sock', icon: '🧦', bin: 'trash',
    fact: 'Textiles do not belong in recycling bins — trash or donate them.' },
  { name: 'Used bandage', icon: '🩹', bin: 'trash',
    fact: 'Soiled items belong in the trash — keep bins clean for workers.' },
  { name: 'Old toothbrush', icon: '🪥', bin: 'trash',
    fact: 'Mixed materials are hard to recycle — this one goes to trash.' },
  { name: 'Dirty sponge', icon: '🧽', bin: 'trash',
    fact: 'Sponges soaked with cleaners are trash, not recycling.' },
  { name: 'Broken mug', icon: '🏺', bin: 'trash',
    fact: 'Ceramics melt differently than glass — keep them out of glass recycling.' },
  // ---- HAZARD (unlocks at Level 2) ----
  { name: 'Battery', icon: '🔋', bin: 'hazard',
    fact: 'Batteries can spark fires in trash trucks — take them to e-waste.' },
  { name: 'Light bulb', icon: '💡', bin: 'hazard',
    fact: 'Bulbs break and cut workers — e-waste drop-off only.' },
  { name: 'Old phone', icon: '📱', bin: 'hazard',
    fact: 'E-waste holds valuable metals — recycle it separately.' },
  { name: 'Charging cable', icon: '🔌', bin: 'hazard',
    fact: 'Cables tangle recycling machines — e-waste bin, please.' },
];

// Items available for the current level (hazard items spawn only once unlocked)
function availableItems(level) {
  return ITEMS.filter((it) => {
    const bin = BINS.find((b) => b.id === it.bin);
    return !bin.unlockLevel || level >= bin.unlockLevel;
  });
}
