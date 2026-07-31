/**
 * A* Pathfinding Algorithm for Office Grid Tilemap Navigation
 */
class Pathfinding {
  constructor(cols = 24, rows = 16) {
    this.cols = cols;
    this.rows = rows;
    this.grid = Array(rows).fill(null).map(() => Array(cols).fill(0));
  }

  setObstacle(x, y, isObstacle = true) {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      this.grid[y][x] = isObstacle ? 1 : 0;
    }
  }

  findPath(startX, startY, endX, endY) {
    if (startX === endX && startY === endY) return [];

    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();

    const gScore = new Map();
    const fScore = new Map();

    const getKey = (x, y) => `${x},${y}`;

    const startKey = getKey(startX, startY);
    gScore.set(startKey, 0);
    fScore.set(startKey, this.heuristic(startX, startY, endX, endY));

    openSet.push({ x: startX, y: startY, f: fScore.get(startKey) });

    while (openSet.length > 0) {
      // Sort to get lowest fScore node
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      const currentKey = getKey(current.x, current.y);

      if (current.x === endX && current.y === endY) {
        // Reconstruct path
        const totalPath = [];
        let currKey = currentKey;
        while (cameFrom.has(currKey)) {
          const node = cameFrom.get(currKey);
          totalPath.unshift({ x: node.x, y: node.y });
          currKey = getKey(node.x, node.y);
        }
        totalPath.push({ x: endX, y: endY });
        return totalPath;
      }

      closedSet.add(currentKey);

      // Check 4 adjacent neighbors (Up, Down, Left, Right)
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ];

      for (const neighbor of neighbors) {
        const { x, y } = neighbor;
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) continue;

        const neighborKey = getKey(x, y);
        if (closedSet.has(neighborKey)) continue;

        // Skip obstacles unless it is the destination
        if (this.grid[y][x] === 1 && (x !== endX || y !== endY)) continue;

        const tentativeG = gScore.get(currentKey) + 1;

        if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);
          const f = tentativeG + this.heuristic(x, y, endX, endY);
          fScore.set(neighborKey, f);

          if (!openSet.some(n => n.x === x && n.y === y)) {
            openSet.push({ x, y, f });
          }
        }
      }
    }

    // Direct straight fallback if pathfinding blocked
    return [{ x: endX, y: endY }];
  }

  heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }
}

window.pathfinding = new Pathfinding();
