export function calculateBotShot(pucks, striker, pockets) {
  if (pucks.length === 0) return null;

  let bestShot = null;
  let minDistance = Infinity;

  pucks.forEach(puck => {
    pockets.forEach(pocket => {
      const dist = Math.hypot(puck.x - pocket.x, puck.y - pocket.y);
      if (dist < minDistance) {
        minDistance = dist;
        
        // Calculate vector from pocket to puck
        const dx = puck.x - pocket.x;
        const dy = puck.y - pocket.y;
        const angleToPocket = Math.atan2(dy, dx);
        
        // Target point is behind the puck relative to the pocket
        const targetX = puck.x + Math.cos(angleToPocket) * 20;
        const targetY = puck.y + Math.sin(angleToPocket) * 20;
        
        const shotAngle = Math.atan2(targetY - striker.y, targetX - striker.x);
        const shotPower = Math.min(Math.hypot(targetX - striker.y, targetY - striker.y) * 0.05, 1.0);
        
        bestShot = {
          angle: shotAngle + (Math.random() - 0.5) * 0.1, // ±5 degrees
          power: shotPower * (0.9 + Math.random() * 0.2) // ±10%
        };
      }
    });
  });

  return bestShot;
}
