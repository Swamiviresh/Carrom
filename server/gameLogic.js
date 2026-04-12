const Matter = require('matter-js');

const BOARD_SIZE = 740; // 74cm * 10 for scaling
const PUCK_RADIUS = 15;
const STRIKER_RADIUS = 20;
const POCKET_RADIUS = 30;
const FRICTION = 0.02;
const RESTITUTION = 0.7;

function createEngine() {
  const engine = Matter.Engine.create();
  engine.gravity.y = 0;
  return engine;
}

function createPuck(x, y, type) {
  return Matter.Bodies.circle(x, y, PUCK_RADIUS, {
    restitution: RESTITUTION,
    frictionAir: FRICTION,
    label: type
  });
}

function createStriker(x, y) {
  return Matter.Bodies.circle(x, y, STRIKER_RADIUS, {
    restitution: RESTITUTION,
    frictionAir: FRICTION,
    label: 'striker'
  });
}

function setupBoard() {
  const pucks = [];
  const centerX = BOARD_SIZE / 2;
  const centerY = BOARD_SIZE / 2;

  // Standard Carrom setup: 1 Queen (red), 9 White, 9 Black
  // Queen in the center
  pucks.push(createPuck(centerX, centerY, 'queen'));

  // First circle: 6 pucks (alternating White and Black)
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * (Math.PI / 180);
    const x = centerX + Math.cos(angle) * (PUCK_RADIUS * 2.1);
    const y = centerY + Math.sin(angle) * (PUCK_RADIUS * 2.1);
    pucks.push(createPuck(x, y, i % 2 === 0 ? 'white' : 'black'));
  }

  // Second circle: 12 pucks (alternating patterns)
  for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * (Math.PI / 180);
      const x = centerX + Math.cos(angle) * (PUCK_RADIUS * 4.2);
      const y = centerY + Math.sin(angle) * (PUCK_RADIUS * 4.2);
      // Simplified pattern for setup
      pucks.push(createPuck(x, y, (i % 3 === 0) ? 'black' : 'white'));
  }

  return pucks;
}

function checkPockets(pucks, striker) {
    const pockets = [
        { x: 30, y: 30 },
        { x: 710, y: 30 },
        { x: 30, y: 710 },
        { x: 710, y: 710 }
    ];

    const pottedPucks = [];
    let strikerPotted = false;

    pucks.forEach((puck, index) => {
        pockets.forEach(pocket => {
            const dist = Math.hypot(puck.position.x - pocket.x, puck.position.y - pocket.y);
            if (dist < POCKET_RADIUS) {
                pottedPucks.push(puck);
            }
        });
    });

    pockets.forEach(pocket => {
        const dist = Math.hypot(striker.position.x - pocket.x, striker.position.y - pocket.y);
        if (dist < POCKET_RADIUS) {
            strikerPotted = true;
        }
    });

    return { pottedPucks, strikerPotted };
}

function runSimulation(engine, striker, pucks, shot) {
    const { angle, power } = shot;
    Matter.Body.applyForce(striker, striker.position, {
        x: Math.cos(angle) * power * 0.05,
        y: Math.sin(angle) * power * 0.05
    });

    let result = {
        potted: [],
        strikerPotted: false
    };

    // Run engine until everything stops
    let maxSteps = 500;
    while (maxSteps > 0) {
        Matter.Engine.update(engine, 1000 / 60);
        
        const pocketStatus = checkPockets(pucks, striker);
        pocketStatus.pottedPucks.forEach(p => {
            if (!result.potted.includes(p)) {
                result.potted.push(p);
                Matter.World.remove(engine.world, p);
            }
        });
        if (pocketStatus.strikerPotted) {
            result.strikerPotted = true;
            // Reset striker position instead of removing? Rules say foul.
            Matter.Body.setPosition(striker, { x: 370, y: 670 });
            Matter.Body.setVelocity(striker, { x: 0, y: 0 });
        }

        const allStopped = engine.world.bodies.every(body => body.speed < 0.1);
        if (allStopped) break;
        maxSteps--;
    }

    return {
        bodies: engine.world.bodies.map(body => ({
            id: body.id,
            x: body.position.x,
            y: body.position.y,
            label: body.label
        })),
        potted: result.potted.map(p => p.label),
        strikerPotted: result.strikerPotted
    };
}

module.exports = {
  BOARD_SIZE,
  PUCK_RADIUS,
  STRIKER_RADIUS,
  POCKET_RADIUS,
  createEngine,
  createPuck,
  createStriker,
  setupBoard,
  runSimulation
};
