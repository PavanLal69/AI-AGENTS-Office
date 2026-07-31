/**
 * Procedural Pixel-Art Sprite Generator (Matching Reference Image Pixel Characters & Furniture)
 */
class SpriteGenerator {
  constructor() {
    this.cache = new Map();
  }

  createCanvas(width = 32, height = 32) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  // 1. Wood Plank Floor Tile
  getWoodFloorTile() {
    if (this.cache.has('wood_floor')) return this.cache.get('wood_floor');

    const { canvas, ctx } = this.createCanvas(32, 32);
    ctx.fillStyle = '#6e4727';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#4c2e17';
    ctx.fillRect(0, 7, 32, 1);
    ctx.fillRect(0, 15, 32, 1);
    ctx.fillRect(0, 23, 32, 1);
    ctx.fillRect(0, 31, 32, 1);

    ctx.fillRect(12, 0, 1, 7);
    ctx.fillRect(26, 8, 1, 7);
    ctx.fillRect(10, 16, 1, 7);
    ctx.fillRect(20, 24, 1, 7);

    ctx.fillStyle = '#825631';
    ctx.fillRect(2, 3, 6, 1);
    ctx.fillRect(14, 11, 8, 1);
    ctx.fillRect(4, 19, 5, 1);
    ctx.fillRect(22, 27, 6, 1);

    this.cache.set('wood_floor', canvas);
    return canvas;
  }

  // 2. Blue Carpet Tile
  getBlueCarpetTile() {
    if (this.cache.has('blue_carpet')) return this.cache.get('blue_carpet');

    const { canvas, ctx } = this.createCanvas(32, 32);
    ctx.fillStyle = '#39587c';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#2c4563';
    ctx.fillRect(4, 4, 2, 2);
    ctx.fillRect(18, 12, 2, 2);
    ctx.fillRect(8, 22, 2, 2);
    ctx.fillRect(24, 20, 2, 2);

    ctx.fillStyle = '#486e9b';
    ctx.fillRect(10, 8, 2, 2);
    ctx.fillRect(22, 4, 2, 2);

    this.cache.set('blue_carpet', canvas);
    return canvas;
  }

  // 3. Black and White Checkered Tile
  getCheckeredTile() {
    if (this.cache.has('checkered_tile')) return this.cache.get('checkered_tile');

    const { canvas, ctx } = this.createCanvas(32, 32);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillRect(16, 16, 16, 16);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(16, 0, 16, 16);
    ctx.fillRect(0, 16, 16, 16);

    this.cache.set('checkered_tile', canvas);
    return canvas;
  }

  // 4. Wall Tile
  getWallTile() {
    if (this.cache.has('dark_wall')) return this.cache.get('dark_wall');

    const { canvas, ctx } = this.createCanvas(32, 32);
    ctx.fillStyle = '#17202a';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#0f171e';
    ctx.fillRect(0, 0, 32, 4);
    ctx.fillRect(0, 28, 32, 4);

    this.cache.set('dark_wall', canvas);
    return canvas;
  }

  // 5. Retro Desk with CRT & Stool
  getRetroDeskTile() {
    if (this.cache.has('retro_desk')) return this.cache.get('retro_desk');

    const { canvas, ctx } = this.createCanvas(32, 32);
    ctx.fillStyle = '#a0754c';
    ctx.fillRect(2, 10, 28, 16);
    ctx.fillStyle = '#6e4b2d';
    ctx.fillRect(2, 24, 28, 2);

    // CRT Monitor
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(8, 2, 16, 14);
    ctx.fillStyle = '#15803d'; // Green screen
    ctx.fillRect(10, 4, 12, 10);
    ctx.fillStyle = '#86efac';
    ctx.fillRect(12, 6, 6, 2);

    // Keyboard
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(10, 18, 10, 4);

    // Green Stool
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(16, 28, 5, 0, Math.PI * 2);
    ctx.fill();

    this.cache.set('retro_desk', canvas);
    return canvas;
  }

  // 6. Collaborative 4-Person Pod Desk
  getQuadPodDeskTile() {
    if (this.cache.has('quad_pod_desk')) return this.cache.get('quad_pod_desk');

    const { canvas, ctx } = this.createCanvas(64, 64);
    ctx.fillStyle = '#a0754c';
    ctx.fillRect(4, 4, 56, 56);
    ctx.fillStyle = '#6e4b2d';
    ctx.fillRect(4, 56, 56, 4);

    // 4 CRT Monitors facing in
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(10, 10, 14, 12);
    ctx.fillStyle = '#0284c7'; ctx.fillRect(12, 12, 10, 8);

    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(40, 10, 14, 12);
    ctx.fillStyle = '#16a34a'; ctx.fillRect(42, 12, 10, 8);

    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(10, 40, 14, 12);
    ctx.fillStyle = '#c026d3'; ctx.fillRect(12, 42, 10, 8);

    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(40, 40, 14, 12);
    ctx.fillStyle = '#ea580c'; ctx.fillRect(42, 42, 10, 8);

    this.cache.set('quad_pod_desk', canvas);
    return canvas;
  }

  // 7. Red Velvet Sofa
  getRedSofaTile(direction = 'down') {
    const cacheKey = `sofa_${direction}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const { canvas, ctx } = this.createCanvas(32, 32);
    ctx.fillStyle = '#9f1239';

    if (direction === 'horizontal' || direction === 'down') {
      ctx.fillRect(2, 6, 28, 20);
      ctx.fillStyle = '#881337';
      ctx.fillRect(0, 4, 4, 24);
      ctx.fillRect(28, 4, 4, 24);
      ctx.fillStyle = '#be123c';
      ctx.fillRect(2, 4, 28, 6);
    } else if (direction === 'vertical') {
      ctx.fillRect(6, 2, 20, 28);
      ctx.fillStyle = '#881337';
      ctx.fillRect(4, 0, 24, 4);
      ctx.fillRect(4, 28, 24, 4);
      ctx.fillStyle = '#be123c';
      ctx.fillRect(4, 2, 6, 28);
    }

    this.cache.set(cacheKey, canvas);
    return canvas;
  }

  // 8. Coffee Table
  getCoffeeTableTile() {
    if (this.cache.has('coffee_table')) return this.cache.get('coffee_table');

    const { canvas, ctx } = this.createCanvas(32, 32);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(4, 8, 24, 16);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 22, 24, 2);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 12, 4, 5);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(15, 13, 2, 1);

    this.cache.set('coffee_table', canvas);
    return canvas;
  }

  // 9. Decorations
  getDecorationTile(type) {
    if (this.cache.has(`decor_${type}`)) return this.cache.get(`decor_${type}`);

    const { canvas, ctx } = this.createCanvas(32, 32);

    if (type === 'bookshelf') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(2, 4, 28, 26);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(4, 14, 24, 2);
      ctx.fillRect(4, 24, 24, 2);
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(6 + i * 3, 6, 2, 8);
        ctx.fillRect(6 + i * 3, 16, 2, 8);
      }
    } else if (type === 'wall_clock') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(16, 16, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(16, 16, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.fillRect(15, 10, 2, 6); ctx.fillRect(16, 15, 4, 2);
    } else if (type === 'painting') {
      ctx.fillStyle = '#d97706';
      ctx.fillRect(4, 6, 24, 18);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, 8, 20, 14);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(7, 9, 18, 6);
      ctx.fillStyle = '#15803d'; ctx.fillRect(7, 15, 18, 6);
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(20, 10, 3, 3);
    } else if (type === 'potted_tree') {
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(8, 18, 16, 12);
      ctx.fillStyle = '#15803d';
      ctx.beginPath(); ctx.arc(16, 12, 10, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'cabinet') {
      ctx.fillStyle = '#a0754c';
      ctx.fillRect(4, 6, 24, 24);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, 8, 20, 10); ctx.fillRect(6, 20, 20, 8);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(14, 12, 4, 2); ctx.fillRect(14, 23, 4, 2);
    } else if (type === 'trash_bin') {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(10, 16, 12, 14);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(10, 16, 12, 3);
    }

    this.cache.set(`decor_${type}`, canvas);
    return canvas;
  }

  // 10. EXACT 4-Direction Pixel Character Sprites Matching Reference Picture
  getCharacterSprite(avatarType = 'spiky_brown', direction = 'down', animationFrame = 0) {
    const cacheKey = `char_${avatarType}_${direction}_${animationFrame}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const { canvas, ctx } = this.createCanvas(32, 32);
    const bobOffset = (animationFrame % 2 === 1) ? -1 : 0;

    // Default Palettes based on exact image characters
    let hairColor = '#4a2c11';
    let shirtColor = '#ffffff';
    let pantsColor = '#1e293b';
    let skinColor = '#f5d0a9';
    let hairStyle = 'spiky';

    if (avatarType === 'spiky_brown' || avatarType === 'architect_hero') {
      // Top Left CRT Desk Agent: Spiky brown hair, white shirt, dark trousers
      hairColor = '#5c3818';
      shirtColor = '#ffffff';
      pantsColor = '#334155';
      skinColor = '#f6d5a5';
      hairStyle = 'spiky';
    } else if (avatarType === 'blonde_walker' || avatarType === 'frontend_dev') {
      // Corridor Walker: Medium blonde hair, blue shirt
      hairColor = '#d97706';
      shirtColor = '#0284c7';
      pantsColor = '#1e293b';
      skinColor = '#fcd34d';
      hairStyle = 'medium';
    } else if (avatarType === 'black_hair_red' || avatarType === 'backend_dev') {
      // Lounge Left Couch: Long black hair, red top, dark skirt
      hairColor = '#1e1b18';
      shirtColor = '#be123c';
      pantsColor = '#0f172a';
      skinColor = '#fde047';
      hairStyle = 'long';
    } else if (avatarType === 'curly_blonde' || avatarType === 'security_dev') {
      // Lounge Right Couch: Wavy blonde hair, black jacket
      hairColor = '#eab308';
      shirtColor = '#1e293b';
      pantsColor = '#475569';
      skinColor = '#fef08a';
      hairStyle = 'curly';
    } else if (avatarType === 'silver_hair' || avatarType === 'devops_dev') {
      // Quad Pod Bottom Left: Silver/white hair, white top
      hairColor = '#e2e8f0';
      shirtColor = '#f8fafc';
      pantsColor = '#475569';
      skinColor = '#fed7aa';
      hairStyle = 'bob';
    } else if (avatarType === 'afro_orange') {
      // Quad Pod Bottom Right: Afro hair, dark skin, orange shirt
      hairColor = '#0f172a';
      shirtColor = '#ea580c';
      pantsColor = '#1e293b';
      skinColor = '#78350f'; // Dark skin
      hairStyle = 'afro';
    }

    // Draw Body & Head based on Direction (UP, DOWN, LEFT, RIGHT)
    if (direction === 'up') {
      // Facing UP (back to camera)
      // Torso & Pants
      ctx.fillStyle = shirtColor;
      ctx.fillRect(10, 14 + bobOffset, 12, 10);
      ctx.fillStyle = pantsColor;
      ctx.fillRect(11, 24 + bobOffset, 4, 8);
      ctx.fillRect(17, 24 + bobOffset, 4, 8);

      // Back of Head & Hair
      ctx.fillStyle = hairColor;
      ctx.fillRect(9, 4 + bobOffset, 14, 10);

    } else if (direction === 'left' || direction === 'right') {
      // Facing Side (Left or Right)
      const flipX = (direction === 'left');
      
      ctx.save();
      if (flipX) {
        ctx.translate(32, 0);
        ctx.scale(-1, 1);
      }

      // Torso
      ctx.fillStyle = shirtColor;
      ctx.fillRect(11, 14 + bobOffset, 10, 10);
      ctx.fillStyle = pantsColor;
      ctx.fillRect(13, 24 + bobOffset, 6, 8);

      // Face Side Profile
      ctx.fillStyle = skinColor;
      ctx.fillRect(14, 6 + bobOffset, 8, 8);

      // Eye
      ctx.fillStyle = '#000000';
      ctx.fillRect(20, 8 + bobOffset, 2, 2);

      // Hair Profile
      ctx.fillStyle = hairColor;
      ctx.fillRect(10, 3 + bobOffset, 10, 8);

      ctx.restore();

    } else {
      // Facing DOWN (Front view)
      // Torso
      ctx.fillStyle = shirtColor;
      ctx.fillRect(10, 14 + bobOffset, 12, 10);
      ctx.fillStyle = pantsColor;
      ctx.fillRect(11, 24 + bobOffset, 4, 8);
      ctx.fillRect(17, 24 + bobOffset, 4, 8);

      // Skin & Face
      ctx.fillStyle = skinColor;
      ctx.fillRect(10, 4 + bobOffset, 12, 10);

      // Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, 8 + bobOffset, 2, 2);
      ctx.fillRect(18, 8 + bobOffset, 2, 2);

      // Hair
      ctx.fillStyle = hairColor;
      ctx.fillRect(9, 2 + bobOffset, 14, 5);
      if (hairStyle === 'spiky') {
        ctx.fillRect(10, 0 + bobOffset, 4, 3);
        ctx.fillRect(16, 0 + bobOffset, 4, 3);
      } else if (hairStyle === 'long') {
        ctx.fillRect(8, 4 + bobOffset, 3, 10);
        ctx.fillRect(21, 4 + bobOffset, 3, 10);
      } else if (hairStyle === 'afro') {
        ctx.beginPath(); ctx.arc(16, 6 + bobOffset, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = skinColor;
        ctx.fillRect(10, 7 + bobOffset, 12, 7);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(12, 9 + bobOffset, 2, 2);
        ctx.fillRect(18, 9 + bobOffset, 2, 2);
      }
    }

    this.cache.set(cacheKey, canvas);
    return canvas;
  }
}

window.spriteGen = new SpriteGenerator();
