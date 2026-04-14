import * as Phaser from 'phaser';

const BOARD_SIZE = 740;
const HALF_BOARD = BOARD_SIZE / 2;
const POCKET_RADIUS = 30;

export default class CarromScene extends Phaser.Scene {
  constructor() {
    super('CarromScene');
    this.pucks = [];
    this.striker = null;
    this.pocketZones = [];
    this.pocketedBodies = new Set();
    this.isBotMode = false;
    this.isMyTurn = true;
    this.isShooting = false;
    this.currentPower = 0;
    this.theme = 'classic';
  }

  init(data) {
    this.isBotMode = data.isBotMode || false;
    this.roomCode = data.roomCode;
    this.theme = data.theme || 'classic';
  }

  preload() {
    this.createBoardTexture('board_classic', 0xb18655, 0x8b5f2f);
    this.createBoardTexture('board_noir', 0x42505f, 0x20242d);
    this.createCoinTexture('puck_white', [0xfefefe, 0xd7d7d7], 15);
    this.createCoinTexture('puck_black', [0x535353, 0x1d1d1d], 15);
    this.createCoinTexture('puck_queen', [0xff7272, 0x9b1f34], 15);
    this.createCoinTexture('striker', [0x8bf7ff, 0x2177cc], 20, true);
    this.createPocketTexture();
  }

  createBoardTexture(key, baseColor, edgeColor) {
    const size = BOARD_SIZE + 60;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x3b2b1f, 1);
    g.fillRoundedRect(0, 0, size, size, 40);

    g.fillStyle(edgeColor, 1);
    g.fillRoundedRect(20, 20, BOARD_SIZE + 20, BOARD_SIZE + 20, 30);

    g.fillStyle(baseColor, 1);
    g.fillRoundedRect(30, 30, BOARD_SIZE, BOARD_SIZE, 24);

    for (let i = 0; i < 180; i += 1) {
      const alpha = Phaser.Math.FloatBetween(0.03, 0.1);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(baseColor),
        Phaser.Display.Color.ValueToColor(0xffffff),
        100,
        Phaser.Math.Between(0, 100),
      );
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), alpha);
      g.fillRect(
        Phaser.Math.Between(35, size - 35),
        Phaser.Math.Between(35, size - 35),
        Phaser.Math.Between(40, 100),
        2,
      );
    }

    g.generateTexture(key, size, size);
    g.destroy();
  }

  createCoinTexture(key, [light, dark], radius, isStriker = false) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = radius * 2 + 8;
    const cx = size / 2;
    const cy = size / 2;

    g.fillStyle(0x000000, 0.2);
    g.fillCircle(cx + 2, cy + 3, radius);

    const gradientSteps = 9;
    for (let i = gradientSteps; i > 0; i -= 1) {
      const t = i / gradientSteps;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(dark),
        Phaser.Display.Color.ValueToColor(light),
        gradientSteps,
        i,
      );
      g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      g.fillCircle(cx - 1, cy - 1, radius * t);
    }

    g.lineStyle(isStriker ? 4 : 2, 0xffffff, isStriker ? 0.45 : 0.2);
    g.strokeCircle(cx, cy, radius - 1);

    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(cx - radius / 2.5, cy - radius / 2.5, radius / 3.5);

    g.generateTexture(key, size, size);
    g.destroy();
  }

  createPocketTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = POCKET_RADIUS * 2 + 16;
    const c = size / 2;

    g.fillStyle(0x0c0c0c, 1);
    g.fillCircle(c, c, POCKET_RADIUS + 6);
    g.fillStyle(0x161616, 1);
    g.fillCircle(c, c, POCKET_RADIUS);

    g.lineStyle(3, 0x4e3e2b, 0.8);
    g.strokeCircle(c, c, POCKET_RADIUS + 3);

    g.generateTexture('pocket', size, size);
    g.destroy();
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#11161f');

    this.add.image(width / 2, height / 2, this.theme === 'noir' ? 'board_noir' : 'board_classic').setDepth(-10);

    this.drawBoardDetails(width / 2, height / 2);
    this.createPockets(width / 2, height / 2);

    this.matter.world.setBounds(width / 2 - HALF_BOARD, height / 2 - HALF_BOARD, BOARD_SIZE, BOARD_SIZE);

    this.setupAudio();
    this.setupEffects();
    this.setupResizeHandling();

    if (this.isBotMode) {
      this.setupInitialBoard();
    }

    this.game.events.emit('powerChange', 0);

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
  }

  drawBoardDetails(centerX, centerY) {
    const rings = this.add.graphics();
    rings.lineStyle(4, 0x4e2c12, 0.65);
    rings.strokeCircle(centerX, centerY, 90);
    rings.lineStyle(2, 0x4e2c12, 0.5);
    rings.strokeCircle(centerX, centerY, 145);

    rings.lineStyle(3, 0x7a4320, 0.5);
    rings.strokeRect(centerX - 285, centerY - 285, 570, 570);

    rings.fillStyle(0x6f3f1f, 0.65);
    [
      [centerX - 285, centerY - 285],
      [centerX + 285, centerY - 285],
      [centerX - 285, centerY + 285],
      [centerX + 285, centerY + 285],
    ].forEach(([x, y]) => rings.fillCircle(x, y, 14));
  }

  createPockets(centerX, centerY) {
    const pockets = [
      { x: centerX - HALF_BOARD + POCKET_RADIUS, y: centerY - HALF_BOARD + POCKET_RADIUS },
      { x: centerX + HALF_BOARD - POCKET_RADIUS, y: centerY - HALF_BOARD + POCKET_RADIUS },
      { x: centerX - HALF_BOARD + POCKET_RADIUS, y: centerY + HALF_BOARD - POCKET_RADIUS },
      { x: centerX + HALF_BOARD - POCKET_RADIUS, y: centerY + HALF_BOARD - POCKET_RADIUS },
    ];

    this.pocketZones = pockets;
    pockets.forEach((pocket) => {
      this.add.image(pocket.x, pocket.y, 'pocket');
    });
  }

  setupInitialBoard() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.striker = this.matter.add.image(centerX, centerY + 300, 'striker', null, {
      shape: 'circle',
      restitution: 0.7,
      frictionAir: 0.02,
    });
    this.striker.setCircle(20);
    this.striker.setInteractive({ draggable: true });
    this.input.setDraggable(this.striker);

    const layout = [
      { x: centerX, y: centerY, key: 'puck_queen' },
      { x: centerX - 34, y: centerY, key: 'puck_white' },
      { x: centerX + 34, y: centerY, key: 'puck_black' },
      { x: centerX, y: centerY - 34, key: 'puck_black' },
      { x: centerX, y: centerY + 34, key: 'puck_white' },
      { x: centerX - 24, y: centerY - 24, key: 'puck_white' },
      { x: centerX + 24, y: centerY + 24, key: 'puck_black' },
    ];

    layout.forEach((piece) => {
      const puck = this.matter.add.image(piece.x, piece.y, piece.key, null, {
        shape: 'circle',
        restitution: 0.7,
        frictionAir: 0.02,
      });
      puck.setCircle(15);
      this.pucks.push(puck);
    });

    this.input.on('drag', (_, gameObject, dragX) => {
      if (this.isMyTurn && !this.isShooting && gameObject === this.striker) {
        gameObject.x = Phaser.Math.Clamp(dragX, centerX - 250, centerX + 250);
      }
    });
  }

  onPointerDown(pointer) {
    if (!this.striker || !this.isMyTurn || this.isShooting) {
      return;
    }

    this.aimLine = this.add.graphics({ lineStyle: { width: 5, color: 0xffffff, alpha: 0.8 } });
    this.aimLine.setDepth(8);
    this.drawAimGuide(pointer);
  }

  onPointerMove(pointer) {
    if (!this.aimLine || !pointer.isDown || !this.striker) {
      return;
    }
    this.drawAimGuide(pointer);
  }

  drawAimGuide(pointer) {
    const dx = pointer.x - this.striker.x;
    const dy = pointer.y - this.striker.y;
    const distance = Math.hypot(dx, dy);
    const maxGuide = Math.min(distance, 230);
    const angle = Math.atan2(dy, dx);

    this.currentPower = Phaser.Math.Clamp(distance / 220, 0, 1);
    this.game.events.emit('powerChange', this.currentPower);

    this.aimLine.clear();

    for (let i = 0; i < 14; i += 1) {
      const t = i / 13;
      const alpha = 0.9 - t * 0.7;
      const segStart = t * maxGuide;
      const segEnd = Math.min(segStart + 10, maxGuide);
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x84f7ff),
        Phaser.Display.Color.ValueToColor(0xffbf69),
        13,
        i,
      );

      this.aimLine.lineStyle(
        4,
        Phaser.Display.Color.GetColor(color.r, color.g, color.b),
        alpha,
      );
      this.aimLine.lineBetween(
        this.striker.x,
        this.striker.y,
        this.striker.x + Math.cos(angle) * segEnd,
        this.striker.y + Math.sin(angle) * segEnd,
      );
    }
  }

  onPointerUp(pointer) {
    if (this.aimLine) {
      this.aimLine.destroy();
      this.aimLine = null;
    }

    if (!this.striker || !this.isMyTurn || this.isShooting) {
      return;
    }

    const dx = pointer.x - this.striker.x;
    const dy = pointer.y - this.striker.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.hypot(dx, dy);
    const power = Math.min(distance / 200, 1) * 20;

    if (distance < 8) {
      this.game.events.emit('powerChange', 0);
      return;
    }

    this.executeShot(angle, power);
  }

  updateBoardState(newState) {
    this.pucks.forEach((puck) => puck.destroy());
    this.pucks = [];

    newState.pucks.forEach((pData) => {
      const puck = this.matter.add.image(pData.x, pData.y, `puck_${pData.label}`, null, {
        shape: 'circle',
        isStatic: true,
      });
      puck.setCircle(15);
      this.pucks.push(puck);
    });

    if (this.striker) {
      this.striker.setPosition(newState.striker.x, newState.striker.y);
      this.striker.setVelocity(0, 0);
    }

    this.isShooting = false;
    this.game.events.emit('powerChange', 0);
  }

  executeShot(angle, power) {
    this.isShooting = true;
    this.playStrikeSound(power);

    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.02,
      duration: 80,
      yoyo: true,
      ease: 'Sine.easeOut',
    });

    if (this.isBotMode) {
      this.striker.applyForce({
        x: Math.cos(angle) * power * 0.05,
        y: Math.sin(angle) * power * 0.05,
      });
    } else {
      this.game.events.emit('shoot', { angle, power });
    }
  }

  setupEffects() {
    this.matter.world.on('collisionstart', (event) => {
      if (event.pairs?.length) {
        this.playCollisionSound();
        this.cameras.main.shake(60, 0.0012, true);
      }
    });
  }

  setupAudio() {
    this.audioContext = this.game.sound.context;
    if (!this.audioContext) {
      return;
    }

    this.ambientGain = this.audioContext.createGain();
    this.ambientGain.gain.value = 0.0001;
    this.ambientGain.connect(this.audioContext.destination);

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 92;
    osc.connect(this.ambientGain);
    osc.start();

    this.ambientOsc = osc;
    this.tweens.add({
      targets: this.ambientGain.gain,
      value: 0.007,
      duration: 1200,
      ease: 'Sine.easeOut',
    });
  }

  playTone(type, startFreq, endFreq, volume = 0.04, duration = 0.08) {
    if (!this.audioContext) {
      return;
    }

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  playStrikeSound(power) {
    this.playTone('triangle', 220 + power * 10, 110, 0.045, 0.11);
  }

  playCollisionSound() {
    this.playTone('square', 410, 220, 0.02, 0.05);
  }

  playPocketSound() {
    this.playTone('sine', 260, 80, 0.05, 0.15);
  }

  checkPocketing() {
    const bodies = [this.striker, ...this.pucks].filter(Boolean);

    bodies.forEach((body) => {
      if (!body.body || this.pocketedBodies.has(body)) {
        return;
      }

      const inPocket = this.pocketZones.some((pocket) => {
        const d = Phaser.Math.Distance.Between(body.x, body.y, pocket.x, pocket.y);
        return d < POCKET_RADIUS - 5;
      });

      if (inPocket) {
        this.pocketedBodies.add(body);
        this.playPocketSound();

        this.tweens.add({
          targets: body,
          scale: 0.2,
          alpha: 0,
          duration: 210,
          onComplete: () => {
            if (this.isBotMode && body !== this.striker) {
              body.destroy();
              this.pucks = this.pucks.filter((item) => item !== body);
            }
          },
        });
      }
    });
  }

  setupResizeHandling() {
    this.scale.on('resize', (gameSize) => {
      const { width, height } = gameSize;
      this.cameras.resize(width, height);
    });
  }

  update() {
    this.checkPocketing();

    if (this.isShooting) {
      const allStopped = this.matter.world.localWorld.bodies.every((body) => body.speed < 0.1);
      if (allStopped) {
        this.isShooting = false;
        this.currentPower = 0;
        this.game.events.emit('powerChange', 0);
        if (!this.isBotMode) {
          this.events.emit('shotEnd');
        }
      }
    }
  }

  shutdown() {
    if (this.ambientOsc) {
      this.ambientOsc.stop();
      this.ambientOsc.disconnect();
      this.ambientOsc = null;
    }
  }
}