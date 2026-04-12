import * as Phaser from 'phaser';

export default class CarromScene extends Phaser.Scene {
  constructor() {
    super('CarromScene');
    this.pucks = [];
    this.striker = null;
    this.isBotMode = false;
    this.isMyTurn = true;
  }

  init(data) {
    this.isBotMode = data.isBotMode || false;
    this.roomCode = data.roomCode;
  }

  preload() {
    // Generate simple graphics for now
    this.createTexture('puck_white', 0xffffff, 15);
    this.createTexture('puck_black', 0x333333, 15);
    this.createTexture('puck_queen', 0xff0000, 15);
    this.createTexture('striker', 0x00ff00, 20);
  }

  createTexture(key, color, radius) {
    const graphics = this.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillCircle(radius, radius, radius);
    graphics.generateTexture(key, radius * 2, radius * 2);
    graphics.destroy();
  }

  create() {
    const { width, height } = this.scale;
    
    // Board background
    this.add.rectangle(width / 2, height / 2, 740, 740, 0xdeb887);
    
    // Pockets
    const pockets = [
      { x: width / 2 - 370 + 30, y: height / 2 - 370 + 30 },
      { x: width / 2 + 370 - 30, y: height / 2 - 370 + 30 },
      { x: width / 2 - 370 + 30, y: height / 2 + 370 - 30 },
      { x: width / 2 + 370 - 30, y: height / 2 + 370 - 30 }
    ];

    pockets.forEach(p => {
      this.add.circle(p.x, p.y, 30, 0x000000);
    });

    // Matter.js world bounds
    this.matter.world.setBounds(width / 2 - 370, height / 2 - 370, 740, 740);

    // Initial setup (client-side for bot mode, server-sync for multiplayer)
    if (this.isBotMode) {
        this.setupInitialBoard();
    }
  }

  setupInitialBoard() {
      // Basic layout for testing
      const centerX = this.scale.width / 2;
      const centerY = this.scale.height / 2;
      
      this.striker = this.matter.add.image(centerX, centerY + 300, 'striker', null, {
          shape: 'circle',
          restitution: 0.7,
          frictionAir: 0.02
      });
      this.striker.setInteractive();
      this.input.setDraggable(this.striker);

      this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
          if (this.isMyTurn && !this.isShooting) {
              // Only allow dragging on the baseline
              gameObject.x = Phaser.Math.Clamp(dragX, centerX - 250, centerX + 250);
          }
      });

      this.input.on('pointerdown', (pointer) => {
          if (this.isMyTurn && !this.isShooting) {
              this.aimLine = this.add.line(0, 0, 0, 0, 0, 0, 0xffffff).setOrigin(0);
          }
      });

      this.input.on('pointermove', (pointer) => {
          if (this.aimLine && pointer.isDown) {
              const dx = pointer.x - this.striker.x;
              const dy = pointer.y - this.striker.y;
              this.aimLine.setTo(this.striker.x, this.striker.y, this.striker.x + dx, this.striker.y + dy);
          }
      });

      this.input.on('pointerup', (pointer) => {
          if (this.aimLine) {
              this.aimLine.destroy();
              this.aimLine = null;

              if (this.isMyTurn && !this.isShooting) {
                  const dx = pointer.x - this.striker.x;
                  const dy = pointer.y - this.striker.y;
                  const angle = Math.atan2(dy, dx);
                  const distance = Math.hypot(dx, dy);
                  const power = Math.min(distance / 200, 1) * 20; // Max power scaled

                  this.executeShot(angle, power);
              }
          }
      });
  }

  updateBoardState(newState) {
      // Synchronize pucks and striker from server state
      // This is a simplified sync - in a real app, we'd interpolate
      
      // Remove old pucks
      this.pucks.forEach(p => p.destroy());
      this.pucks = [];

      newState.pucks.forEach(pData => {
          const puck = this.matter.add.image(pData.x, pData.y, `puck_${pData.label}`, null, {
              shape: 'circle',
              isStatic: true // On client, we just show state for multiplayer
          });
          this.pucks.push(puck);
      });

      if (this.striker) {
          this.striker.setPosition(newState.striker.x, newState.striker.y);
          this.striker.setVelocity(0, 0);
      }
      
      this.isShooting = false;
  }

  executeShot(angle, power) {
      this.isShooting = true;
      if (this.isBotMode) {
          this.striker.applyForce({
              x: Math.cos(angle) * power * 0.05,
              y: Math.sin(angle) * power * 0.05
          });
      } else {
          this.game.events.emit('shoot', { angle, power });
      }
  }

  update() {
    if (this.isShooting) {
        // Check if all bodies have stopped moving
        const allStopped = this.matter.world.localWorld.bodies.every(body => 
            body.speed < 0.1
        );
        if (allStopped) {
            this.isShooting = false;
            if (!this.isBotMode) {
                this.events.emit('shotEnd');
            }
        }
    }
  }
}
