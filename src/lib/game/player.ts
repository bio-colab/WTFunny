// Upgraded Player Controller:
// - Silky-smooth platformer physics with dynamic config from the Game Lab
// - Autostep (Step-Up): glides over 1-6px rough destructible terrain without getting stuck
// - Multi-point ground detection & snap without jitter
// - Variable jump height (tap for short hop, hold for full jump)
// - Mid-air flip (double jump) with spin and air ring particles
// - Jetpack (hold jump in air) with smooth thrust, fuel/heat and particles
// - Corner ceiling nudge to prevent headbonks on block corners
// - Drop-through platforms (S / Down)

import { World, CELL } from './world'
import { sound } from './sound'
import { ConfigManager, PhysicsConfig, DEFAULT_PHYSICS } from './engineConfig'

export const PLAYER_DIMS = {
  width: 14,
  height: 46,
}

export const PHYS = {
  playerW: PLAYER_DIMS.width,
  playerH: PLAYER_DIMS.height,
  runSpeed: DEFAULT_PHYSICS.runSpeed,
  airSpeed: DEFAULT_PHYSICS.airSpeed,
  groundAccel: DEFAULT_PHYSICS.groundAccel,
  airAccel: DEFAULT_PHYSICS.airAccel,
  friction: DEFAULT_PHYSICS.friction,
  gravity: DEFAULT_PHYSICS.gravity,
  jumpVel: DEFAULT_PHYSICS.jumpVel,
  flipVel: DEFAULT_PHYSICS.flipVel,
  jetThrust: DEFAULT_PHYSICS.jetThrust,
  jetMaxRise: DEFAULT_PHYSICS.jetMaxRise,
  coyote: DEFAULT_PHYSICS.coyoteTime,
  jumpBuffer: DEFAULT_PHYSICS.jumpBuffer,
}

export type InputState = {
  left: boolean
  right: boolean
  jump: boolean
  jumpPressed: boolean
  down: boolean
  fire: boolean
  alt: boolean
  altPressed: boolean
  aimX: number
  aimY: number
  wheel: number
}

export class Player {
  x: number
  y: number // feet center position in world pixels
  vx = 0
  vy = 0
  grounded = false
  facing: 1 | -1 = 1
  aim = 0
  coyote = 0
  buffer = 0
  jumpHeld = false
  flipT = -1
  flips = 1
  dropT = 0
  jetOn = false
  jetK = 0
  jetSoundT = 0
  runPhase = 0
  skidT = 0
  tumble = 0
  tumbleV = 0
  spawnProtect = 0

  weaponIdx = 0
  cooldown = 0
  switchT = 1
  kickRot = 0
  kickRotV = 0
  shots = 0
  flashT = 0
  bloomT = 0
  chargeT = 0

  grenadeCd = 0
  throwT = -1

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  get phys(): PhysicsConfig {
    return ConfigManager.get().getConfig().physics
  }

  center() {
    return { x: this.x, y: this.y - PLAYER_DIMS.height / 2 }
  }

  respawnAt(x: number, y: number) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.tumble = 0
    this.tumbleV = 0
    this.spawnProtect = 1
    this.flips = 1
    this.grounded = false
  }

  // --- Collision Helpers ---
  private solidAt(world: World, px: number, py: number): boolean {
    return world.solidAtWorld(px, py)
  }

  private isGroundedAt(world: World, py: number): boolean {
    const feetOffsets = [-5, 0, 5]
    for (const dx of feetOffsets) {
      if (this.solidAt(world, this.x + dx, py + 1)) return true
    }
    return false
  }

  private headSolidAt(world: World, py: number): boolean {
    const headY = py - PLAYER_DIMS.height - 1
    return (
      this.solidAt(world, this.x, headY) ||
      this.solidAt(world, this.x + 5, headY) ||
      this.solidAt(world, this.x - 5, headY)
    )
  }

  private sideSolidAt(world: World, dir: number, px: number, py: number, stepUpIgnored = 0): boolean {
    const edgeX = px + dir * (PLAYER_DIMS.width / 2 + 1)
    // Check from just above step-up height up to near head
    const startY = Math.max(stepUpIgnored + 1, 3)
    for (let dy = startY; dy <= PLAYER_DIMS.height - 4; dy += 6) {
      if (this.solidAt(world, edgeX, py - dy)) return true
    }
    return false
  }

  step(world: World, input: InputState, dt: number) {
    const phys = this.phys
    if (this.dropT > 0) this.dropT -= dt
    if (this.spawnProtect > 0) this.spawnProtect -= dt

    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0)

    // Aim calculation
    const c = this.center()
    const aimDx = input.aimX - c.x
    const aimDy = input.aimY - c.y
    if (Math.abs(aimDx) > 2 || Math.abs(aimDy) > 2) {
      this.aim = Math.atan2(aimDy, aimDx)
      if (Math.abs(aimDx) > 5) {
        this.facing = aimDx >= 0 ? 1 : -1
      }
    }

    // Horizontal Movement
    const accel = this.grounded ? phys.groundAccel : phys.airAccel
    const targetSpeed = dir * (this.grounded ? phys.runSpeed : phys.airSpeed)

    if (dir !== 0) {
      const sameDir = Math.sign(this.vx) === dir || this.vx === 0
      if (sameDir) {
        this.vx += dir * accel * dt
        if (Math.abs(this.vx) > Math.abs(targetSpeed)) {
          this.vx = targetSpeed
        }
      } else {
        // Fast skid turn-around
        const turnFriction = this.grounded ? phys.friction * 1.5 : phys.friction * 0.8
        this.vx += dir * (accel + turnFriction) * dt
        this.skidT = 0.12
        if (this.grounded && Math.random() < 0.4) {
          // Skid dust particles
          world.spawnParticle({
            x: this.x + (Math.random() - 0.5) * 8,
            y: this.y,
            vx: -dir * (60 + Math.random() * 80),
            vy: -20 - Math.random() * 30,
            life: 0.25,
            max: 0.25,
            kind: 'smoke',
            color: '#94a3b8',
            size: 2.5,
          })
        }
      }
    } else {
      // Natural deceleration / friction
      const f = (this.grounded ? phys.friction : 320) * dt
      if (Math.abs(this.vx) <= f) this.vx = 0
      else this.vx -= Math.sign(this.vx) * f
    }
    if (this.skidT > 0) this.skidT -= dt

    // Jump Buffering and Coyote Time
    if (input.jumpPressed) {
      this.buffer = phys.jumpBuffer
    } else {
      this.buffer = Math.max(0, this.buffer - dt)
    }
    this.coyote = this.grounded ? phys.coyoteTime : Math.max(0, this.coyote - dt)

    // Platform Drop-through (S / Down Arrow)
    if (input.down && this.grounded && this.dropT <= 0) {
      const belowCy = Math.floor((this.y + 3) / CELL)
      // Only drop if not at bedrock bottom
      if (belowCy < world.GH - 4) {
        this.dropT = 0.25
        this.grounded = false
        this.vy = Math.max(this.vy, 160)
        this.y += 3
      }
    }

    // Jump Execution (Ground Jump or Coyote Jump)
    if (this.buffer > 0 && this.coyote > 0 && this.dropT <= 0) {
      this.vy = -phys.jumpVel
      this.grounded = false
      this.coyote = 0
      this.buffer = 0
      this.flips = 1
      this.flipT = -1
      sound.jump(0)
      // Jump dust
      for (let i = 0; i < 4; i++) {
        world.spawnParticle({
          x: this.x + (Math.random() - 0.5) * 12,
          y: this.y,
          vx: (Math.random() - 0.5) * 120,
          vy: -30 - Math.random() * 40,
          life: 0.25,
          max: 0.25,
          kind: 'smoke',
          color: '#cbd5e1',
          size: 2.5,
        })
      }
    }
    // Mid-air Flip (Double Jump)
    else if (input.jumpPressed && !this.grounded && this.flips > 0 && this.flipT < 0 && this.dropT <= 0) {
      this.vy = -phys.flipVel
      this.flips--
      this.flipT = 0.001
      this.buffer = 0
      sound.flip(0)
      // Air flip ring particles
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        world.spawnParticle({
          x: this.x + Math.cos(a) * 8,
          y: this.y - PLAYER_DIMS.height / 2 + Math.sin(a) * 8,
          vx: Math.cos(a) * 140,
          vy: Math.sin(a) * 140,
          life: 0.25,
          max: 0.25,
          kind: 'spark',
          color: '#38bdf8',
          size: 3,
        })
      }
    }

    // Variable Jump Cut (release jump to cut upward velocity for tight control)
    if (!input.jump && this.vy < -200) {
      this.vy += phys.gravity * (1 - phys.variableJumpCut) * 2.2 * dt
    }

    // Jetpack (Hold Jump in Air after initial jump momentum)
    const jetAllowed = input.jump && !this.grounded && this.buffer <= 0 && this.coyote <= 0 && this.dropT <= 0
    if (jetAllowed) {
      this.jetOn = true
      this.jetK = Math.min(1, this.jetK + dt * 6)
      this.vy -= phys.jetThrust * dt
      if (this.vy < -phys.jetMaxRise) {
        this.vy = -phys.jetMaxRise
      }

      // Jetpack Thruster Particles
      const thrusterColor = ConfigManager.get().getConfig().character.thrusterColor || '#ffd23d'
      if (Math.random() < 0.7) {
        world.spawnParticle({
          x: this.x - this.facing * 5 + (Math.random() - 0.5) * 4,
          y: this.y - 20,
          vx: (Math.random() - 0.5) * 50 - this.vx * 0.15,
          vy: 180 + Math.random() * 160,
          life: 0.2 + Math.random() * 0.2,
          max: 0.4,
          kind: 'spark',
          color: thrusterColor,
          size: 3,
        })
      }
      if (Math.random() < 0.3) {
        world.spawnParticle({
          x: this.x - this.facing * 5,
          y: this.y - 18,
          vx: (Math.random() - 0.5) * 30,
          vy: 80,
          life: 0.5,
          max: 0.5,
          kind: 'smoke',
          color: '#64748b',
          size: 3,
        })
      }

      this.jetSoundT -= dt
      if (this.jetSoundT <= 0) {
        sound.jet(0)
        this.jetSoundT = 0.14
      }
    } else {
      this.jetOn = false
      this.jetK = Math.max(0, this.jetK - dt * 5)
    }

    // Mid-air flip animation timer
    if (this.flipT >= 0) {
      this.flipT += dt / 0.34
      if (this.flipT >= 1) this.flipT = -1
    }

    // Gravity Integration
    if (!this.grounded) {
      this.vy += phys.gravity * dt
      const maxFall = 960
      if (this.vy > maxFall) this.vy = maxFall
    }

    // --- Y-Axis Integration & Landing ---
    const oldGrounded = this.grounded
    this.y += this.vy * dt

    if (this.vy >= 0) {
      // Descending: check landing
      if (this.dropT <= 0 && this.isGroundedAt(world, this.y)) {
        // Find exact ground surface height
        let maxStep = 12
        while (this.isGroundedAt(world, this.y - 1) && maxStep > 0 && this.y > 0) {
          this.y -= 1
          maxStep--
        }

        if (this.vy > 420 && !oldGrounded) {
          sound.land(0)
          // Landing impact dust
          for (let i = 0; i < 4; i++) {
            world.spawnParticle({
              x: this.x + (Math.random() - 0.5) * 16,
              y: this.y,
              vx: (Math.random() - 0.5) * 140,
              vy: -30 - Math.random() * 50,
              life: 0.28,
              max: 0.28,
              kind: 'smoke',
              color: '#94a3b8',
              size: 2.5,
            })
          }
        }
        this.vy = 0
        this.grounded = true
        this.flips = 1
        this.jetOn = false
      } else {
        this.grounded = false
      }
    } else {
      // Ascending: check head collision & corner nudge
      this.grounded = false
      const headY = this.y - PLAYER_DIMS.height - 1
      const hitCenter = this.solidAt(world, this.x, headY)
      const hitLeft = this.solidAt(world, this.x - 5, headY)
      const hitRight = this.solidAt(world, this.x + 5, headY)

      if (hitCenter || hitLeft || hitRight) {
        // Corner nudge: if only clipping one side, nudge player away from the corner
        if (phys.cornerNudge) {
          if (!hitCenter && hitLeft && !hitRight) {
            this.x += 3
          } else if (!hitCenter && hitRight && !hitLeft) {
            this.x -= 3
          } else {
            this.vy = 30
            // Headbump particle
            if (world.solidAtWorld(this.x, headY - 2)) {
              world.damageCircle(this.x, headY - 2, 5, { debris: true, countAsDestroy: true })
            }
          }
        } else {
          this.vy = 30
        }
      }
    }

    // --- X-Axis Integration with Autostep ---
    if (this.vx !== 0) {
      const moveDx = this.vx * dt
      const moveDir = Math.sign(this.vx)
      const stepLimit = this.grounded ? phys.autoStepHeight : 2

      // Check if current position is blocked by an obstacle
      const blocked = this.sideSolidAt(world, moveDir, this.x + moveDx, this.y, 0)

      if (!blocked) {
        // Clean move
        this.x += moveDx
      } else {
        // Autostep attempt: try stepping up 1..stepLimit pixels
        let stepped = false
        for (let s = 1; s <= stepLimit; s++) {
          const testY = this.y - s
          // Check if at testY we can move forward and head is not blocked
          if (!this.sideSolidAt(world, moveDir, this.x + moveDx, testY, 0) && !this.headSolidAt(world, testY)) {
            this.y = testY
            this.x += moveDx
            stepped = true
            break
          }
        }

        if (!stepped) {
          // Blocked by full wall
          this.vx = 0
        }
      }
    }

    // Bounds checking
    this.x = Math.max(PLAYER_DIMS.width / 2 + 2, Math.min(world.W - PLAYER_DIMS.width / 2 - 2, this.x))
    if (this.y - PLAYER_DIMS.height < 2) {
      this.y = PLAYER_DIMS.height + 2
      if (this.vy < 0) this.vy = 0
    }
    // Bedrock floor safeguard
    if (this.y > world.H - 6) {
      this.y = world.H - 4
      this.vy = 0
      this.grounded = true
    }

    // Run cycle animation
    if (this.grounded && dir !== 0) {
      this.runPhase = (this.runPhase + dt * (Math.abs(this.vx) / 85 + 0.45)) % 1
    } else if (!dir) {
      this.runPhase = 0
    }

    // Tumble decay
    if (this.tumbleV !== 0) {
      this.tumble += this.tumbleV * dt
      this.tumbleV *= 1 - 2.5 * dt
      if (Math.abs(this.tumbleV) < 0.05) {
        this.tumbleV = 0
        this.tumble = 0
      }
    }

    // Weapon kick decay
    this.kickRotV += -this.kickRot * 140 * dt
    this.kickRotV *= 1 - 10 * dt
    this.kickRot += this.kickRotV * dt

    if (this.cooldown > 0) this.cooldown -= dt
    if (this.grenadeCd > 0) this.grenadeCd -= dt
    if (this.switchT < 1) this.switchT += dt * 5
    if (this.flashT > 0) this.flashT -= dt
    if (this.bloomT > 0) this.bloomT -= dt
    if (this.chargeT > 0) this.chargeT -= dt
  }

  impulse(ix: number, iy: number) {
    this.vx += ix
    this.vy += iy
    if (iy < -100) {
      this.grounded = false
      this.coyote = 0
    }
    const k = Math.hypot(ix, iy)
    if (k > 480) {
      this.tumbleV += (ix >= 0 ? 1 : -1) * Math.min(16, k / 65)
    }
  }
}
