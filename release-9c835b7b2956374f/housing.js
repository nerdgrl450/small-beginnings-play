export const decor = {
  lantern: { name: 'Brass lantern', cost: 600, description: 'A little pool of light after dark.' },
  planter: { name: 'Window-box flowers', cost: 1000, description: 'Terracotta and a spill of pink blooms.' },
  quilt: { name: 'Patchwork quilt', cost: 1400, description: 'A hand-stitched layer of warmth. Saves 75¢ in nightly shelter supplies when placed.' },
};

export const homes = {
  room: { name: 'Rented room', cost: 9500, description: 'A sunny upstairs room with a real bed. $95 to move in, first night included. Then $4 per night.' },
  house: { name: 'Willow Cottage', cost: 28000, description: 'A little cottage with a bedroom, a sitting room, and a garden. Pay once and the place is yours.' },
};

export const furniture = {
  'oak-bed': { name: 'Oak bed', cost: 3400, kind: 'bed' },
  'rose-bedding': { name: 'Rose bedding', cost: 900, kind: 'bedding' },
  'woven-rug': { name: 'Woven garden rug', cost: 1200, kind: 'rug' },
  'floor-lamp': { name: 'Brass floor lamp', cost: 1400, kind: 'tall' },
  curtains: { name: 'Botanical curtains', cost: 1000, kind: 'window' },
  dresser: { name: 'Pine dresser', cost: 2200, kind: 'large' },
  'wall-shelf': { name: 'Oak wall shelf', cost: 1100, kind: 'shelf' },
  mirror: { name: 'Oval brass mirror', cost: 850, kind: 'wall' },
  fern: { name: 'Potted fern', cost: 650, kind: 'small' },
  'side-table': { name: 'Round side table', cost: 1050, kind: 'small' },
  'botanical-print': { name: 'Foxglove print', cost: 500, kind: 'wall' },
  'striped-bench': { name: 'Striped window bench', cost: 1650, kind: 'large' },
  sofa: { name: 'Sage sofa', cost: 3100, kind: 'large', house: true },
  armchair: { name: 'Rose armchair', cost: 2100, kind: 'large', house: true },
  bookcase: { name: 'Cottage bookcase', cost: 2600, kind: 'large', house: true },
  'garden-pot': { name: 'Cottage flower pot', cost: 1200, kind: 'garden', house: true },
};

const spot = (name, kinds, x, y, width, depth = y) => ({ name, kinds: kinds.split(' '), x, y, width, depth });
export const rooms = {
  rental: { name: 'Rented room', art: 'room-basic', alt: 'Sage plaster walls, a timber ceiling, a garden window, and a simple bed.', spots: {
    bed: spot('Bed alcove', 'bed', 33, 83, 36, 2),
    bedding: spot('Foot of the bed', 'bedding', 27, 68, 14, 3),
    window: spot('Window', 'window', 15, 56, 30, 0),
    sill: spot('Window ledge', 'small', 12, 53, 9, 4),
    rug: spot('Middle of the floor', 'rug', 57, 90, 26, 1),
    corner: spot('Far corner', 'tall large', 86, 68, 22),
    wall: spot('Right wall', 'wall shelf', 82, 46, 13, 2),
    wallLeft: spot('Above the bed', 'wall shelf', 44, 33, 13, 2),
    wallMiddle: spot('Middle wall', 'wall', 58, 47, 8, 2),
    bedside: spot('Beside the bed', 'small tall', 56, 67, 10),
    right: spot('Right side of the floor', 'large', 79, 84, 21),
    front: spot('Near the window', 'small', 13, 82, 11),
    rightFront: spot('Near the right wall', 'small tall', 91, 87, 10),
  }},
  bedroom: { name: 'Bedroom', art: 'cottage-bedroom', alt: 'A sage bedroom with a garden window and warm wood flooring.', spots: {
    bed: spot('Bed alcove', 'bed', 29, 96, 36, 2),
    bedding: spot('Foot of the bed', 'bedding', 24, 80, 15, 3),
    window: spot('Window', 'window', 14, 62, 29, 0),
    sill: spot('Window ledge', 'small', 13, 60, 8, 4),
    rug: spot('Middle of the floor', 'rug', 60, 95, 24, 1),
    corner: spot('Far corner', 'tall large', 86, 78, 22),
    wall: spot('Right wall', 'wall shelf', 84, 49, 13, 2),
    wallLeft: spot('Above the bed', 'wall shelf', 40, 36, 12, 2),
    wallMiddle: spot('Middle wall', 'wall', 55, 51, 8, 2),
    bedside: spot('Beside the bed', 'small tall', 51, 78, 10),
    right: spot('Right side of the floor', 'large', 76, 90, 20),
    front: spot('Near the window', 'small', 10, 84, 9),
    rightFront: spot('Near the right wall', 'small tall', 94, 92, 9),
  }},
  sitting: { name: 'Sitting room', art: 'cottage-sitting', alt: 'A golden plaster sitting room with a stone fireplace and oak floor.', spots: {
    window: spot('Window', 'window', 12, 67, 26, 0),
    mantel: spot('Fireplace mantel', 'small', 36, 35, 7, 4),
    rug: spot('In front of the fireplace', 'rug', 53, 91, 31, 1),
    corner: spot('Far corner', 'tall large', 88, 75, 19),
    wall: spot('Right wall', 'wall shelf', 83, 45, 14, 2),
    wallLeft: spot('Left alcove', 'wall shelf', 55, 46, 11, 2),
    right: spot('Right side of the floor', 'large', 73, 83, 25),
    middle: spot('Beside the fireplace', 'large tall', 53, 77, 19),
    front: spot('Near the window', 'small', 18, 92, 10),
    rightFront: spot('Near the right wall', 'small tall', 92, 94, 11),
  }},
  garden: { name: 'Garden', art: 'cottage-garden', alt: 'A stone cottage with a sage door, flowers, and a little front garden.', spots: {
    path: spot('Along the path', 'garden', 63, 89, 12),
    patio: spot('On the patio', 'garden', 78, 90, 14),
    porch: spot('By the door', 'garden', 49, 77, 9),
  }},
};

export const houseRooms = ['garden', 'sitting', 'bedroom'];
export const homeRooms = state => state.home === 'house' ? houseRooms : state.home === 'room' ? ['rental'] : [];
export const blankHousing = () => ({ furnishings: {}, rentedBefore: false });
export const itemFor = id => Object.hasOwn(furniture, id) ? furniture[id] : Object.hasOwn(decor, id) ? decor[id] : undefined;
const oldKinds = { lantern: 'small', planter: 'garden', quilt: 'bedding' };
const oldSpots = { lantern: 'bedside', planter: 'rightFront', quilt: 'bedding' };

export function fitsSpot(id, room, slot) {
  const item = itemFor(id);
  const point = Object.hasOwn(rooms, room) && Object.hasOwn(rooms[room].spots, slot) ? rooms[room].spots[slot] : null;
  return Boolean(item && point && !(item.house && room === 'rental') &&
    (point.kinds.includes(item.kind ?? oldKinds[id]) || (id === 'planter' && point.kinds.includes('small'))));
}

export const ownedFurniture = state => [
  ...Object.keys(decor).filter(id => state.owned[id]), ...Object.keys(state.furnishings).filter(id => Object.hasOwn(furniture, id)),
];

export function availableSpots(state, id, room) {
  return Object.entries(rooms[room]?.spots ?? {}).filter(([slot]) => fitsSpot(id, room, slot) &&
    !Object.entries(state.furnishings).some(([other, position]) => other !== id && position?.room === room && position.slot === slot));
}

export function placeFirst(state, id, order = homeRooms(state)) {
  for (const room of order) {
    const [first] = availableSpots(state, id, room);
    if (first) {
      state.furnishings[id] = { room, slot: first[0] };
      return true;
    }
  }
  return false;
}

export function bringShelterDecor(state) {
  for (const id of Object.keys(decor)) {
    if (!state.owned[id] || Object.hasOwn(state.furnishings, id)) continue;
    state.furnishings[id] = null;
    if (!state.placed[id]) continue;
    if (availableSpots(state, id, 'rental').some(([slot]) => slot === oldSpots[id])) {
      state.furnishings[id] = { room: 'rental', slot: oldSpots[id] };
    } else {
      placeFirst(state, id, ['rental']);
    }
  }
}

export function moveToHouse(state) {
  for (const position of Object.values(state.furnishings)) {
    if (position?.room === 'rental') position.room = 'bedroom';
  }
}
