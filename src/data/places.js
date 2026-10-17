/**
 * Order locations for the Orders core loop (M3).
 * Coordinates sit on the street grid: horizontal streets at rows
 * 2-3, 8-9, 14-15, …, vertical streets at cols 2-3, 8-9, …, and the
 * pedestrian Rambla at cols 32-33. px = tile*32 + 16 (tile center).
 * Any spot that ends up on a collider tile is filtered at runtime by
 * GameScene.pickPassable().
 */

export const RESTAURANTS = [
  { name: 'Bar Locutorio Paco', dish: 'bocata mixto', x: 272, y: 272 },
  { name: 'La Parranda Vegan', dish: 'kale con instead-of-plátano', x: 656, y: 80 },
  { name: 'Pizza Catalana Nostra', dish: 'pizza baratas nadadoras', x: 1424, y: 272 },
  { name: 'El Rincón del Huevo Frito', dish: 'tres huevos dobles', x: 272, y: 848 },
  { name: 'Sushi Diagonal', dish: 'salmon moodon', x: 1616, y: 464 },
  { name: 'Bocadillos Rajoli', dish: 'calamari borracho', x: 1424, y: 1040 },
  { name: 'Kebab Arc de Triomf', dish: 'kebab tañerino doble', x: 1232, y: 80 },
  { name: 'Chorna Beach Grill', dish: 'fideuà a la mar', x: 656, y: 1424 },
];

export const CUSTOMERS = [
  { name: 'Mariona', note: 'terraça amb vistes', x: 464, y: 80 },
  { name: 'Pau', note: 'porta 3B, timbre roto', x: 848, y: 272 },
  { name: 'Laia', note: 'no miau, DÉJAME ENTRAR', x: 1808, y: 656 },
  { name: 'Oriol', note: 'sombrilla azul', x: 1040, y: 656 },
  { name: 'Núria', note: 'por la puerta de carbón', x: 272, y: 656 },
  { name: 'Santi', note: 'trabajo… chssst', x: 1616, y: 848 },
  { name: 'Aina', note: 'gatito grande y chaud', x: 848, y: 1232 },
  { name: 'Quim', note: 'siesta en curso', x: 1424, y: 656 },
  { name: 'Eduard', note: 'grupo pembes', x: 272, y: 464 },
  { name: 'Dolors', note: 'gracias mijo', x: 1232, y: 1232 },
];
