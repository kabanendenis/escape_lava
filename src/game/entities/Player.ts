import Phaser from 'phaser';
import { PLAYER, GAME_WIDTH, LAVA } from '../config';

interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  up: boolean;
  down: boolean;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private health: number;
  private maxHealth: number;
  private isOnGround = false;
  private isClimbing = false;
  private lastGroundedTime = 0;
  private jumpBufferedTime = 0;
  private isInvincible = false;
  private invincibilityTimer = 0;
  private portalCooldown = 0;
  private nearLadder: Phaser.Physics.Arcade.Sprite | null = null;
  private hasAirJump = true;
  private isInAirJump = false;
  private wasJumpPressed = false;
  private currentInput: PlayerInput = {
    left: false,
    right: false,
    jump: false,
    up: false,
    down: false,
  };

  constructor(scene: Phaser.Scene, x: number, y: number, maxHealth: number) {
    super(scene, x, y, 'player');

    this.maxHealth = maxHealth;
    this.health = maxHealth;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(PLAYER.WIDTH - 8, PLAYER.HEIGHT - 4);
    this.setOffset(4, 4);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(PLAYER.GRAVITY);
    body.setMaxVelocityY(PLAYER.MAX_FALL_SPEED);
  }

  handleInput(input: PlayerInput): void {
    this.currentInput = input;
  }

  update(delta: number): void {
    this.updateTimers(delta);
    this.updateMovement();
    this.updateJump();
    this.updateClimbing();
    this.updateVisuals();
  }

  private updateTimers(delta: number): void {
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= delta;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
      }
    }

    if (this.portalCooldown > 0) {
      this.portalCooldown -= delta;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) {
      this.isOnGround = true;
      this.lastGroundedTime = this.scene.time.now;
      // Reset air jump when landing
      this.hasAirJump = true;
      this.isInAirJump = false;
    } else {
      this.isOnGround = false;
    }

    if (this.currentInput.jump) {
      this.jumpBufferedTime = this.scene.time.now;
    }
  }

  private updateMovement(): void {
    if (this.isClimbing) return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.currentInput.left) {
      body.setVelocityX(-PLAYER.MOVE_SPEED);
      this.setFlipX(true);
    } else if (this.currentInput.right) {
      body.setVelocityX(PLAYER.MOVE_SPEED);
      this.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    if (this.x < PLAYER.WIDTH / 2) {
      this.x = PLAYER.WIDTH / 2;
    } else if (this.x > GAME_WIDTH - PLAYER.WIDTH / 2) {
      this.x = GAME_WIDTH - PLAYER.WIDTH / 2;
    }
  }

  private updateJump(): void {
    if (this.isClimbing) return;

    const canCoyoteJump =
      this.scene.time.now - this.lastGroundedTime < PLAYER.COYOTE_TIME_MS;
    const hasBufferedJump =
      this.scene.time.now - this.jumpBufferedTime < PLAYER.JUMP_BUFFER_MS;
    const canJump = this.isOnGround || canCoyoteJump;

    // Detect fresh jump press (not held from previous frame)
    const jumpJustPressed = this.currentInput.jump && !this.wasJumpPressed;

    if ((this.currentInput.jump && canJump) || (hasBufferedJump && this.isOnGround)) {
      this.jump();
      this.jumpBufferedTime = 0;
      this.lastGroundedTime = 0;
    } else if (jumpJustPressed && !this.isOnGround && this.hasAirJump) {
      // Air jump - can change direction
      this.airJump();
    }

    this.wasJumpPressed = this.currentInput.jump;
  }

  private airJump(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Set vertical velocity
    body.setVelocityY(PLAYER.AIR_JUMP_VELOCITY);

    // Apply horizontal boost based on input direction
    if (this.currentInput.left) {
      body.setVelocityX(-PLAYER.AIR_JUMP_HORIZONTAL_BOOST);
      this.setFlipX(true);
    } else if (this.currentInput.right) {
      body.setVelocityX(PLAYER.AIR_JUMP_HORIZONTAL_BOOST);
      this.setFlipX(false);
    }
    // If no direction pressed, keep current horizontal velocity

    this.hasAirJump = false;
    this.isInAirJump = true;

    if (this.scene.cache.audio.exists('jump')) {
      this.scene.sound.play('jump', { volume: 0.4, detune: 200 });
    }
  }

  private jump(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(PLAYER.JUMP_VELOCITY);

    if (this.scene.cache.audio.exists('jump')) {
      this.scene.sound.play('jump', { volume: 0.5 });
    }
  }

  private updateClimbing(): void {
    if (!this.nearLadder) {
      if (this.isClimbing) {
        this.stopClimbing();
      }
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;

    if ((this.currentInput.up || this.currentInput.down) && !this.isClimbing) {
      this.startClimbing();
    }

    if (this.isClimbing) {
      if (this.currentInput.up) {
        body.setVelocityY(-PLAYER.CLIMB_SPEED);
      } else if (this.currentInput.down) {
        body.setVelocityY(PLAYER.CLIMB_SPEED);
      } else {
        body.setVelocityY(0);
      }

      if (this.currentInput.jump) {
        this.stopClimbing();
        this.jump();
      }

      if (this.currentInput.left || this.currentInput.right) {
        const ladderLeft = this.nearLadder.x - this.nearLadder.width / 2;
        const ladderRight = this.nearLadder.x + this.nearLadder.width / 2;

        if (this.x < ladderLeft - 10 || this.x > ladderRight + 10) {
          this.stopClimbing();
        }
      }
    }
  }

  private startClimbing(): void {
    this.isClimbing = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityX(0);
    // Reset air jump when grabbing ladder
    this.hasAirJump = true;
    this.isInAirJump = false;
  }

  private stopClimbing(): void {
    this.isClimbing = false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
  }

  private updateVisuals(): void {
    if (this.isInvincible) {
      this.setAlpha(Math.sin(this.scene.time.now / 50) * 0.3 + 0.7);
    } else {
      this.setAlpha(1);
    }

    if (this.isClimbing) {
      this.setTint(0xaaffaa);
    } else if (this.isInAirJump) {
      // Cyan tint during air jump to indicate special state
      this.setTint(0x88ddff);
    } else if (!this.hasAirJump && !this.isOnGround) {
      // Slight dim when air jump is used
      this.setTint(0xcccccc);
    } else {
      this.clearTint();
    }
  }

  takeDamage(amount: number): void {
    if (this.isInvincible) return;

    this.health = Math.max(0, this.health - amount);
    this.isInvincible = true;
    this.invincibilityTimer = PLAYER.INVINCIBILITY_MS;
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  knockback(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(LAVA.KNOCKBACK_VELOCITY);
  }

  teleport(x: number, y: number): void {
    this.setPosition(x, y);
    this.portalCooldown = 500;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    // Reset air jump after teleport
    this.hasAirJump = true;
    this.isInAirJump = false;
  }

  setNearLadder(ladder: Phaser.Physics.Arcade.Sprite): void {
    this.nearLadder = ladder;
  }

  clearNearLadder(): void {
    this.nearLadder = null;
  }

  isInPortalCooldown(): boolean {
    return this.portalCooldown > 0;
  }

  canTakeDamage(): boolean {
    return !this.isInvincible;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }
}
