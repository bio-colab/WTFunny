"use strict";
(() => {
  // src/lib/game/engineConfig.ts
  var DEFAULT_PHYSICS = {
    runSpeed: 275,
    airSpeed: 330,
    groundAccel: 3800,
    airAccel: 2600,
    friction: 1650,
    gravity: 2950,
    jumpVel: 960,
    flipVel: 820,
    variableJumpCut: 0.5,
    jetThrust: 4800,
    jetMaxRise: 540,
    autoStepHeight: 6,
    // 6px autostep allows smooth traversal over destroyed tiles and ragged text
    cornerNudge: true,
    coyoteTime: 0.1,
    jumpBuffer: 0.12
  };
  var PHYSICS_PRESETS = {
    arcade: {
      name: "\u0627\u0644\u0646\u0645\u0637 \u0627\u0644\u0645\u062A\u0648\u0627\u0632\u0646 (\u0623\u0635\u0644\u064A \u0645\u062A\u0642\u0646)",
      desc: "\u062D\u0631\u0643\u0629 \u0631\u0634\u064A\u0642\u0629 \u0648\u0645\u0631\u064A\u062D\u0629 \u0645\u0633\u062A\u0648\u062D\u0627\u0629 \u0645\u0646 \u0627\u0644\u0644\u0639\u0628\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0645\u0639 \u0625\u0635\u0644\u0627\u062D \u0627\u0644\u062A\u0639\u062B\u0631 \u0648\u0633\u0644\u0627\u0633\u0629 \u0627\u0644\u0642\u0641\u0632",
      config: { ...DEFAULT_PHYSICS }
    },
    hyper: {
      name: "\u0627\u0644\u0646\u064A\u0646\u062C\u0627 \u0627\u0644\u062E\u0627\u0631\u0642 (Hyper Agile)",
      desc: "\u0633\u0631\u0639\u0629 \u062C\u0631\u064A \u0641\u0627\u0626\u0642\u0629\u060C \u0642\u0641\u0632\u0627\u062A \u0639\u0645\u0644\u0627\u0642\u0629\u060C \u0648\u062A\u062D\u0643\u0645 \u0647\u0648\u0627\u0626\u064A \u062D\u0627\u062F \u0644\u0644\u0645\u062D\u062A\u0631\u0641\u064A\u0646",
      config: {
        ...DEFAULT_PHYSICS,
        runSpeed: 420,
        airSpeed: 460,
        groundAccel: 6e3,
        friction: 2400,
        jumpVel: 1150,
        flipVel: 950,
        jetThrust: 6200,
        jetMaxRise: 700,
        autoStepHeight: 8
      }
    },
    moon: {
      name: "\u062C\u0627\u0630\u0628\u064A\u0629 \u0627\u0644\u0642\u0645\u0631 (Low Gravity)",
      desc: "\u0642\u0641\u0632\u0627\u062A \u0639\u0627\u0626\u0645\u0629 \u0639\u0627\u0644\u064A\u0629 \u062C\u062F\u0627\u064B\u060C \u0648\u062A\u062D\u0644\u064A\u0642 \u0647\u0627\u062F\u0626 \u0628\u0637\u064A\u0621 \u0641\u064A \u0627\u0644\u0647\u0648\u0627\u0621",
      config: {
        ...DEFAULT_PHYSICS,
        runSpeed: 250,
        gravity: 1200,
        jumpVel: 750,
        flipVel: 650,
        jetThrust: 2800,
        jetMaxRise: 420,
        variableJumpCut: 0.7
      }
    },
    heavy: {
      name: "\u0627\u0644\u0645\u062F\u0631\u0639 \u0627\u0644\u062B\u0642\u064A\u0644 (Heavy Juggernaut)",
      desc: "\u0648\u0632\u0646 \u062B\u0642\u064A\u0644\u060C \u0633\u0642\u0648\u0637 \u0633\u0631\u064A\u0639\u060C \u0648\u062A\u062F\u0645\u064A\u0631 \u0645\u062A\u0645\u0627\u0633\u0643",
      config: {
        ...DEFAULT_PHYSICS,
        runSpeed: 220,
        airSpeed: 240,
        gravity: 4200,
        jumpVel: 1050,
        flipVel: 750,
        friction: 2600,
        jetThrust: 5400,
        jetMaxRise: 450
      }
    }
  };
  var CHARACTER_SKINS = {
    stickman: {
      nameAr: "\u062C\u064E\u062D\u0652\u062F\u064E\u0631 (\u0627\u0644\u0641\u0627\u0631\u0633 \u0627\u0644\u0635\u063A\u064A\u0631)",
      nameEn: "Jahdar the Intrepid",
      desc: "\u0627\u0644\u0628\u0637\u0644 \u0627\u0644\u0623\u0633\u0637\u0648\u0631\u064A \u0627\u0644\u0635\u063A\u064A\u0631 \u0630\u0648 \u0627\u0644\u0639\u0632\u064A\u0645\u0629 \u0627\u0644\u0641\u0648\u0644\u0627\u0630\u064A\u0629\u060C \u062E\u0641\u064A\u0641 \u0648\u0633\u0631\u064A\u0639 \u0648\u0644\u0627 \u064A\u0642\u0641 \u0641\u064A \u0648\u062C\u0647\u0647 \u0623\u064A \u0645\u0648\u0642\u0639 \u0639\u0645\u0644\u0627\u0642",
      defaults: {
        skin: "stickman",
        name: "\u062C\u064E\u062D\u0652\u062F\u064E\u0631 (\u0627\u0644\u0641\u0627\u0631\u0633 \u0627\u0644\u0635\u063A\u064A\u0631)",
        headColor: "#f59e0b",
        bodyColor: "#d97706",
        accentColor: "#fbbf24",
        outlineColor: "#16121f",
        thrusterColor: "#ffd23d",
        scale: 1,
        trail: "sparks"
      }
    },
    robot: {
      nameAr: "\u0627\u0644\u0631\u0648\u0628\u0648\u062A \u0627\u0644\u0645\u062F\u0645\u0631 9000",
      nameEn: "Destructor Bot-9000",
      desc: "\u0622\u0644\u0629 \u0639\u0633\u0643\u0631\u064A\u0629 \u0645\u062A\u0637\u0648\u0631\u0629 \u0645\u0639 \u0639\u064A\u0648\u0646 \u0633\u064A\u0627\u0646 \u0645\u062A\u0648\u0647\u062C\u0629 \u0648\u062C\u0633\u0645 \u0645\u062F\u0631\u0639 \u0648\u0634\u0631\u0627\u0631\u0627\u062A \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629",
      defaults: {
        skin: "robot",
        name: "\u0627\u0644\u0631\u0648\u0628\u0648\u062A \u0627\u0644\u0645\u062F\u0645\u0631 9000",
        headColor: "#38bdf8",
        bodyColor: "#475569",
        accentColor: "#0ea5e9",
        outlineColor: "#0f172a",
        thrusterColor: "#38bdf8",
        scale: 1.05,
        trail: "sparks"
      }
    },
    commando: {
      nameAr: "\u0645\u063A\u0648\u0627\u0631 \u0627\u0644\u0628\u0643\u0633\u0644 \u0627\u0644\u0639\u0633\u0643\u0631\u064A",
      nameEn: "Pixel Commando",
      desc: "\u0645\u0642\u0627\u062A\u0644 \u0642\u0648\u0627\u062A \u062E\u0627\u0635\u0629 \u0645\u0632\u0648\u062F \u0628\u062E\u0648\u0630\u0629 \u0642\u062A\u0627\u0644\u064A\u0629 \u0648\u062F\u0631\u0648\u0639 \u062A\u0643\u062A\u064A\u0643\u064A\u0629",
      defaults: {
        skin: "commando",
        name: "\u0645\u063A\u0648\u0627\u0631 \u0627\u0644\u0628\u0643\u0633\u0644 \u0627\u0644\u0639\u0633\u0643\u0631\u064A",
        headColor: "#84cc16",
        bodyColor: "#3f6212",
        accentColor: "#eab308",
        outlineColor: "#142006",
        thrusterColor: "#f97316",
        scale: 1,
        trail: "smoke"
      }
    },
    voidMage: {
      nameAr: "\u0633\u0627\u062D\u0631 \u0627\u0644\u0641\u0631\u0627\u063A \u0648\u0627\u0644\u0638\u0644\u0627\u0644",
      nameEn: "Void Specter",
      desc: "\u0643\u064A\u0627\u0646 \u063A\u0627\u0645\u0636 \u064A\u0631\u062A\u062F\u064A \u0631\u062F\u0627\u0621\u064B \u0628\u0646\u0641\u0633\u062C\u064A\u0627\u064B \u0648\u064A\u0637\u0644\u0642 \u0645\u0642\u0630\u0648\u0641\u0627\u062A \u0627\u0644\u0637\u0627\u0642\u0629 \u0627\u0644\u0645\u0638\u0644\u0645\u0629",
      defaults: {
        skin: "voidMage",
        name: "\u0633\u0627\u062D\u0631 \u0627\u0644\u0641\u0631\u0627\u063A \u0648\u0627\u0644\u0638\u0644\u0627\u0644",
        headColor: "#c084fc",
        bodyColor: "#581c87",
        accentColor: "#a855f7",
        outlineColor: "#1e0b36",
        thrusterColor: "#d8b4fe",
        scale: 1,
        trail: "void"
      }
    },
    custom: {
      nameAr: "\u0628\u0637\u0644 \u0627\u0644\u0628\u0643\u0633\u0644 \u0627\u0644\u0645\u062E\u0635\u0635",
      nameEn: "Custom Pixel Hero",
      desc: "\u062E\u0635\u0651\u0635 \u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0648\u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0628\u0646\u0641\u0633\u0643 \u0639\u0628\u0631 \u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0645\u0639\u0645\u0644",
      defaults: {
        skin: "custom",
        name: "\u0628\u0637\u0644 \u0627\u0644\u0628\u0643\u0633\u0644 \u0627\u0644\u0645\u062E\u0635\u0635",
        headColor: "#ec4899",
        bodyColor: "#06b6d4",
        accentColor: "#facc15",
        outlineColor: "#18181b",
        thrusterColor: "#f43f5e",
        scale: 1,
        trail: "rainbow"
      }
    }
  };
  function getDefaultEngineConfig() {
    const defaultWeaponTune = {
      damageMul: 1,
      speedMul: 1,
      cooldownMul: 1,
      blastMul: 1,
      shakeMul: 1
    };
    const weapons = {
      pistol: { ...defaultWeaponTune },
      smg: { ...defaultWeaponTune },
      shotgun: { ...defaultWeaponTune },
      launcher: { ...defaultWeaponTune },
      railgun: { ...defaultWeaponTune },
      flamer: { ...defaultWeaponTune },
      overkill: { ...defaultWeaponTune },
      drone: { ...defaultWeaponTune },
      neutron: { ...defaultWeaponTune },
      wand: { ...defaultWeaponTune },
      grenade: { ...defaultWeaponTune }
    };
    return {
      physics: { ...DEFAULT_PHYSICS },
      character: { ...CHARACTER_SKINS.stickman.defaults },
      weapons,
      audio: {
        masterVolume: 0.85,
        sfxVolume: 1,
        bassBoost: true,
        pitchVariance: 0.05,
        profile: "retro",
        muted: false
      },
      visual: {
        particleDensity: "high",
        maxDebris: 320,
        crtScanlines: false,
        retroGlow: true,
        showFps: false,
        fireSpreadRate: 1,
        shakeMultiplier: 1,
        milestonePopups: true,
        hdVectorMode: true
      }
    };
  }
  var STORAGE_KEY = "vapor_destroy_engine_config_v1";
  var ConfigManager = class _ConfigManager {
    constructor() {
      this.config = getDefaultEngineConfig();
      this.listeners = /* @__PURE__ */ new Set();
      this.loadFromStorage();
    }
    static {
      this.instance = null;
    }
    static get() {
      if (!_ConfigManager.instance) {
        _ConfigManager.instance = new _ConfigManager();
      }
      return _ConfigManager.instance;
    }
    getConfig() {
      return this.config;
    }
    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }
    notify() {
      for (const listener of this.listeners) {
        try {
          listener(this.config);
        } catch {
        }
      }
    }
    updatePhysics(partial) {
      this.config.physics = { ...this.config.physics, ...partial };
      this.saveToStorage();
      this.notify();
    }
    applyPhysicsPreset(presetKey) {
      const preset = PHYSICS_PRESETS[presetKey];
      if (preset) {
        this.config.physics = { ...preset.config };
        this.saveToStorage();
        this.notify();
      }
    }
    updateCharacter(partial) {
      this.config.character = { ...this.config.character, ...partial };
      this.saveToStorage();
      this.notify();
    }
    selectCharacterSkin(skin) {
      const def = CHARACTER_SKINS[skin];
      if (def) {
        this.config.character = { ...def.defaults };
        this.saveToStorage();
        this.notify();
      }
    }
    updateWeapon(id, partial) {
      if (!this.config.weapons[id]) {
        this.config.weapons[id] = { damageMul: 1, speedMul: 1, cooldownMul: 1, blastMul: 1, shakeMul: 1 };
      }
      this.config.weapons[id] = { ...this.config.weapons[id], ...partial };
      this.saveToStorage();
      this.notify();
    }
    resetWeapon(id) {
      this.config.weapons[id] = { damageMul: 1, speedMul: 1, cooldownMul: 1, blastMul: 1, shakeMul: 1 };
      this.saveToStorage();
      this.notify();
    }
    updateAudio(partial) {
      this.config.audio = { ...this.config.audio, ...partial };
      this.saveToStorage();
      this.notify();
    }
    updateVisual(partial) {
      this.config.visual = { ...this.config.visual, ...partial };
      this.saveToStorage();
      this.notify();
    }
    resetToDefaults() {
      this.config = getDefaultEngineConfig();
      this.saveToStorage();
      this.notify();
    }
    exportJson() {
      return JSON.stringify(this.config, null, 2);
    }
    importJson(json) {
      try {
        const parsed = JSON.parse(json);
        if (parsed && parsed.physics && parsed.character) {
          this.config = {
            ...getDefaultEngineConfig(),
            ...parsed,
            physics: { ...DEFAULT_PHYSICS, ...parsed.physics || {} },
            character: { ...CHARACTER_SKINS.stickman.defaults, ...parsed.character || {} }
          };
          this.saveToStorage();
          this.notify();
          return true;
        }
      } catch {
      }
      return false;
    }
    loadFromStorage() {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.config = {
            ...getDefaultEngineConfig(),
            ...parsed,
            physics: { ...DEFAULT_PHYSICS, ...parsed.physics || {} },
            character: { ...CHARACTER_SKINS.stickman.defaults, ...parsed.character || {} },
            weapons: { ...getDefaultEngineConfig().weapons, ...parsed.weapons || {} },
            audio: { ...getDefaultEngineConfig().audio, ...parsed.audio || {} },
            visual: { ...getDefaultEngineConfig().visual, ...parsed.visual || {} }
          };
        }
      } catch {
      }
    }
    saveToStorage() {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      } catch {
      }
    }
  };

  // src/lib/game/world.ts
  var CELL = 1;
  var SKY_ROWS = 160;
  var MAT_EMPTY = 0;
  var MAT_SOLID = 1;
  var MAT_BEDROCK = 3;
  var FIRE_COLORS = ["#fff3a6", "#ffd23d", "#ff8a2a", "#f2561d"];
  var SMOKE_COLORS = ["#5b5566", "#3f3a4a", "#2a2633", "#6e6670"];
  var World = class {
    constructor() {
      this.GW = 0;
      this.GH = 0;
      this.W = 0;
      this.H = 0;
      // Spatial Grid for O(1) Collision:
      // cell size 4px
      this.GRID_CELL = 4;
      this.gridW = 0;
      this.gridH = 0;
      this.dirty = true;
      // Solid Bodies Engine:
      this.bodies = [];
      this.dynamicBodies = [];
      this.settledBodies = [];
      this.shards = [];
      this.particles = [];
      this.burns = [];
      this.burnAcc = 0;
      this.elements = /* @__PURE__ */ new Map();
      this.totalMass = 1;
      this.destroyedMass = 0;
      this.totalCells = 1;
      this.destroyedCells = 0;
      this.blocksBroken = 0;
      this.lettersPopped = 0;
      this.explosions = 0;
      this.chunks = [];
    }
    init(W2, H) {
      this.W = W2;
      this.H = H;
      this.GW = Math.ceil(W2 / CELL);
      this.GH = Math.ceil(H / CELL);
      this.gridW = Math.ceil(W2 / this.GRID_CELL);
      this.gridH = Math.ceil(H / this.GRID_CELL);
      const nGrid = this.gridW * this.gridH;
      this.spatialGrid = new Int32Array(nGrid).fill(-1);
      const n = this.GW * this.GH;
      this.mat = new Uint8Array(n);
      this.color = new Uint32Array(n);
      this.owner = new Int32Array(n).fill(-1);
      this.heat = new Uint8Array(n);
      this.pixBuf = new Uint32Array(n);
      this.imgData = new ImageData(this.GW, this.GH);
      new Uint32Array(this.imgData.data.buffer).set(this.pixBuf);
      this.levelCanvas = document.createElement("canvas");
      this.levelCanvas.width = Math.min(32, this.GW);
      this.levelCanvas.height = Math.min(32, this.GH);
      this.levelCtx = this.levelCanvas.getContext("2d");
      this.bodies = [];
      this.dynamicBodies = [];
      this.settledBodies = [];
      this.shards = [];
      this.particles = [];
      this.burns = [];
      this.elements.clear();
      this.chunks = [];
      this.destroyedCells = 0;
      this.destroyedMass = 0;
      this.blocksBroken = 0;
      this.lettersPopped = 0;
      this.explosions = 0;
      this.totalCells = 1;
      this.totalMass = 1;
      const bedrockY0 = Math.max(0, H - 28);
      const gy0 = Math.floor(bedrockY0 / this.GRID_CELL);
      for (let gy = gy0; gy < this.gridH; gy++) {
        for (let gx = 0; gx < this.gridW; gx++) {
          this.spatialGrid[gy * this.gridW + gx] = -2;
        }
      }
      const bedCy0 = Math.floor(bedrockY0 / CELL);
      for (let cy = bedCy0; cy < this.GH; cy++) {
        for (let cx = 0; cx < this.GW; cx++) {
          this.mat[cy * this.GW + cx] = MAT_BEDROCK;
        }
      }
    }
    idx(cx, cy) {
      return cy * this.GW + cx;
    }
    // Load crisp Solid Bodies parsed by loader
    loadBodies(bodies, W2, H, skyOffset = 0) {
      this.bodies = bodies;
      let totalM = 0;
      for (let bIdx = 0; bIdx < bodies.length; bIdx++) {
        const b = bodies[bIdx];
        b.y += skyOffset;
        if (b.baseY !== void 0) b.baseY += skyOffset;
        b.id = bIdx;
        totalM += b.mass;
        this.stampBodyToGrid(b, bIdx);
        const el = {
          id: b.id,
          kind: b.kind === "word" ? "glyph" : b.kind,
          cells: [],
          lost: 0,
          hp: b.hp,
          alive: true,
          label: b.text || b.tag || "SolidBody",
          text: b.text,
          font: b.font,
          colorStr: b.color,
          w: b.w,
          h: b.h,
          image: b.image,
          svgXml: b.svgXml,
          href: b.href,
          tag: b.tag,
          semanticRole: b.semanticRole
        };
        this.elements.set(b.id, el);
      }
      this.totalMass = Math.max(1, totalM);
      this.totalCells = Math.max(1, totalM);
      this.dirty = true;
    }
    // Fallback / legacy bridge loader
    loadFromLoader(colors, owners, elements, pageGW, pageGH) {
      this.color.fill(0);
      this.owner.fill(-1);
      this.mat.fill(MAT_EMPTY);
      this.elements = elements;
      for (let cy = 0; cy < pageGH; cy++) {
        const dstRow = (cy + SKY_ROWS) * this.GW;
        const srcRow = cy * pageGW;
        for (let cx = 0; cx < pageGW; cx++) {
          const c = colors[srcRow + cx];
          const own = owners[srcRow + cx];
          if (c !== 0 && own >= 0) {
            const i = dstRow + cx;
            this.mat[i] = MAT_SOLID;
            this.color[i] = c;
            this.pixBuf[i] = c;
            this.owner[i] = own;
          }
        }
      }
      const bed = packColor("#1e1e1e");
      for (let cy = this.GH - 28; cy < this.GH; cy++) {
        for (let cx = 0; cx < this.GW; cx++) {
          const i = this.idx(cx, cy);
          this.mat[i] = MAT_BEDROCK;
          this.color[i] = bed;
          this.pixBuf[i] = bed;
        }
      }
      this.totalCells = Math.max(1, elements.size * 100);
      this.dirty = true;
    }
    stampBodyToGrid(b, bIdx) {
      const gx0 = Math.max(0, Math.floor(b.x / this.GRID_CELL));
      const gy0 = Math.max(0, Math.floor(b.y / this.GRID_CELL));
      const gx1 = Math.min(this.gridW - 1, Math.floor((b.x + b.w) / this.GRID_CELL));
      const gy1 = Math.min(this.gridH - 1, Math.floor((b.y + b.h) / this.GRID_CELL));
      for (let gy = gy0; gy <= gy1; gy++) {
        const row = gy * this.gridW;
        for (let gx = gx0; gx <= gx1; gx++) {
          if (this.spatialGrid[row + gx] === -1) {
            this.spatialGrid[row + gx] = bIdx;
          }
        }
      }
      const cx0 = Math.max(0, Math.floor(b.x / CELL));
      const cy0 = Math.max(0, Math.floor(b.y / CELL));
      const cx1 = Math.min(this.GW - 1, Math.floor((b.x + b.w) / CELL));
      const cy1 = Math.min(this.GH - 1, Math.floor((b.y + b.h) / CELL));
      for (let cy = cy0; cy <= cy1; cy++) {
        const row = cy * this.GW;
        for (let cx = cx0; cx <= cx1; cx++) {
          if (this.mat[row + cx] === MAT_EMPTY) {
            this.mat[row + cx] = MAT_SOLID;
            this.owner[row + cx] = b.id;
          }
        }
      }
    }
    clearBodyFromGrid(b, bIdx) {
      const gx0 = Math.max(0, Math.floor(b.x / this.GRID_CELL));
      const gy0 = Math.max(0, Math.floor(b.y / this.GRID_CELL));
      const gx1 = Math.min(this.gridW - 1, Math.floor((b.x + b.w) / this.GRID_CELL));
      const gy1 = Math.min(this.gridH - 1, Math.floor((b.y + b.h) / this.GRID_CELL));
      for (let gy = gy0; gy <= gy1; gy++) {
        const row = gy * this.gridW;
        for (let gx = gx0; gx <= gx1; gx++) {
          if (this.spatialGrid[row + gx] === bIdx) {
            this.spatialGrid[row + gx] = -1;
          }
        }
      }
      const cx0 = Math.max(0, Math.floor(b.x / CELL));
      const cy0 = Math.max(0, Math.floor(b.y / CELL));
      const cx1 = Math.min(this.GW - 1, Math.floor((b.x + b.w) / CELL));
      const cy1 = Math.min(this.GH - 1, Math.floor((b.y + b.h) / CELL));
      for (let cy = cy0; cy <= cy1; cy++) {
        const row = cy * this.GW;
        for (let cx = cx0; cx <= cx1; cx++) {
          if (this.owner[row + cx] === b.id) {
            this.mat[row + cx] = MAT_EMPTY;
            this.owner[row + cx] = -1;
          }
        }
      }
    }
    // --- O(1) Collision Check ---
    solidAtWorld(wx, wy) {
      if (wx < 0 || wx >= this.W) return true;
      if (wy < 0) return false;
      if (wy >= this.H - 24) return true;
      const gx = Math.floor(wx / this.GRID_CELL);
      const gy = Math.floor(wy / this.GRID_CELL);
      if (gx >= 0 && gx < this.gridW && gy >= 0 && gy < this.gridH) {
        const val = this.spatialGrid[gy * this.gridW + gx];
        if (val === -2) return true;
        if (val >= 0) {
          const b = this.bodies[val];
          if (b && b.anchored && !b.destroyed) {
            return true;
          }
        }
      }
      for (let i = 0; i < this.settledBodies.length; i++) {
        const b = this.settledBodies[i];
        if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) {
          return true;
        }
      }
      if (this.mat) {
        const cx = Math.floor(wx / CELL);
        const cy = Math.floor(wy / CELL);
        if (cx >= 0 && cx < this.GW && cy >= 0 && cy < this.GH) {
          const m = this.mat[cy * this.GW + cx];
          if (m === MAT_SOLID || m === MAT_BEDROCK) return true;
        }
      }
      return false;
    }
    destroyedPct() {
      if (this.totalMass <= 0) return 0;
      return Math.min(1, this.destroyedMass / this.totalMass);
    }
    // Find solid body at world coords
    findBodyAt(wx, wy) {
      const gx = Math.floor(wx / this.GRID_CELL);
      const gy = Math.floor(wy / this.GRID_CELL);
      if (gx >= 0 && gx < this.gridW && gy >= 0 && gy < this.gridH) {
        const idx = this.spatialGrid[gy * this.gridW + gx];
        if (idx >= 0 && this.bodies[idx] && !this.bodies[idx].destroyed) {
          return this.bodies[idx];
        }
      }
      for (const b of this.dynamicBodies) {
        if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h && !b.destroyed) return b;
      }
      for (const b of this.settledBodies) {
        if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h && !b.destroyed) return b;
      }
      return null;
    }
    // Direct weapon hit on a body
    hitBodyAt(wx, wy, dmg, impulseX = 0, impulseY = 0) {
      const b = this.findBodyAt(wx, wy);
      if (!b || b.destroyed) return null;
      b.hp -= dmg;
      b.damageDecals.push({
        rx: Math.max(2, Math.min(b.w - 2, wx - b.x)),
        ry: Math.max(2, Math.min(b.h - 2, wy - b.y)),
        r: Math.min(8, 2 + dmg * 0.12)
      });
      const dislodgeThresh = b.maxHp * 0.75;
      if (b.anchored && (b.hp <= dislodgeThresh || Math.hypot(impulseX, impulseY) > 80)) {
        this.dislodgeBody(b, impulseX, impulseY);
      } else if (!b.anchored) {
        const pushFactor = Math.min(12, 180 / b.mass);
        b.vx += impulseX * pushFactor;
        b.vy += impulseY * pushFactor;
        b.vrot += (Math.random() - 0.5) * 4;
      }
      if (b.hp <= 0) {
        this.shatterBody(b, wx, wy, Math.hypot(impulseX, impulseY) || 300);
      }
      return b;
    }
    // Break anchor from layout: body becomes dynamic rigid body
    dislodgeBody(b, impulseX = 0, impulseY = 0) {
      if (!b.anchored || b.destroyed) return;
      b.anchored = false;
      this.clearBodyFromGrid(b, b.id);
      const pushFactor = Math.min(14, 220 / b.mass);
      b.vx = impulseX * pushFactor + (Math.random() - 0.5) * 80;
      b.vy = impulseY * pushFactor - 80 - Math.random() * 120;
      b.vrot = (Math.random() - 0.5) * 8;
      b.settled = false;
      b.settleT = 0;
      if (!this.dynamicBodies.includes(b)) {
        this.dynamicBodies.push(b);
      }
      if (b.kind === "word") this.lettersPopped++;
      else this.blocksBroken++;
      const el = this.elements.get(b.id);
      if (el) {
        el.alive = false;
        this.onElementGone?.(el);
      }
    }
    // Fracture and shatter a body into vector shards
    shatterBody(b, hitX, hitY, force = 380) {
      if (b.destroyed) return;
      b.destroyed = true;
      b.hp = 0;
      if (b.anchored) {
        this.clearBodyFromGrid(b, b.id);
        b.anchored = false;
      }
      const dynIdx = this.dynamicBodies.indexOf(b);
      if (dynIdx >= 0) this.dynamicBodies.splice(dynIdx, 1);
      const setIdx = this.settledBodies.indexOf(b);
      if (setIdx >= 0) this.settledBodies.splice(setIdx, 1);
      this.destroyedMass += b.mass;
      this.destroyedCells += Math.round(b.mass * 2);
      if (b.kind === "word") {
        const wordShards = generateWordShards(b, hitX, hitY, force);
        this.shards.push(...wordShards);
        this.lettersPopped++;
        for (let i = 0; i < 8; i++) {
          this.spawnParticle({
            x: b.x + Math.random() * b.w,
            y: b.y + Math.random() * b.h,
            vx: (Math.random() - 0.5) * 240,
            vy: -80 - Math.random() * 200,
            life: 0.6 + Math.random() * 0.6,
            max: 1.2,
            kind: "paper",
            color: b.color || "#ffffff",
            size: 2.5 + Math.random() * 2.5,
            rot: Math.random() * Math.PI,
            vrot: (Math.random() - 0.5) * 12,
            grav: 1200
          });
        }
      } else {
        const polyShards = generatePolygonShards(b, hitX, hitY, force);
        this.shards.push(...polyShards);
        this.blocksBroken++;
        this.puffAt(b.x + b.w / 2, b.y + b.h / 2, Math.max(12, Math.min(40, b.w / 2)));
        for (let i = 0; i < 10; i++) {
          this.spawnParticle({
            x: b.x + Math.random() * b.w,
            y: b.y + Math.random() * b.h,
            vx: (Math.random() - 0.5) * 280,
            vy: -100 - Math.random() * 220,
            life: 0.5 + Math.random() * 0.5,
            max: 1,
            kind: "spark",
            color: FIRE_COLORS[Math.random() * FIRE_COLORS.length | 0],
            size: 3 + Math.random() * 2,
            grav: 900
          });
        }
      }
      const el = this.elements.get(b.id);
      if (el) {
        el.alive = false;
        this.onElementGone?.(el);
      }
      if (this.shards.length > 400) {
        this.shards.splice(0, this.shards.length - 400);
      }
    }
    popElement(target, fromX, fromY, impulse = 300) {
      const id = target.id;
      const b = this.bodies[id] || target;
      if (b && !b.destroyed) {
        if (b.anchored) {
          this.dislodgeBody(b, b.x - fromX, b.y - fromY);
        } else {
          this.shatterBody(b, fromX, fromY, impulse);
        }
      }
    }
    // Blast circle damage (for rockets, grenades, nukes, and shotgun)
    damageCircle(wx, wy, r, opts = {}) {
      const imp = opts.impulse ?? 360;
      const hitBodies = /* @__PURE__ */ new Set();
      const minX = wx - r;
      const maxX = wx + r;
      const minY = wy - r;
      const maxY = wy + r;
      for (let i = 0; i < this.bodies.length; i++) {
        const b = this.bodies[i];
        if (b.destroyed) continue;
        if (b.x + b.w < minX || b.x > maxX || b.y + b.h < minY || b.y > maxY) continue;
        const bcx = b.x + b.w / 2;
        const bcy = b.y + b.h / 2;
        const d = Math.hypot(bcx - wx, bcy - wy);
        if (d <= r + Math.min(b.w, b.h) / 2) {
          hitBodies.add(b);
        }
      }
      for (const b of hitBodies) {
        const bcx = b.x + b.w / 2;
        const bcy = b.y + b.h / 2;
        let dx = bcx - wx;
        let dy = bcy - wy;
        const d = Math.hypot(dx, dy) || 1;
        dx /= d;
        dy /= d;
        const falloff = Math.max(0.2, 1 - d / (r * 1.3));
        const dmg = (opts.full ? 220 : 45 + r * 1.2) * falloff;
        b.hp -= dmg;
        if (opts.scorch) {
          b.damageDecals.push({
            rx: Math.max(2, Math.min(b.w - 2, wx - b.x + dx * 6)),
            ry: Math.max(2, Math.min(b.h - 2, wy - b.y + dy * 6)),
            r: Math.min(16, 4 + r * 0.15)
          });
        }
        if (b.hp <= 0) {
          this.shatterBody(b, wx, wy, imp * falloff);
        } else {
          this.dislodgeBody(b, dx * imp * falloff, dy * imp * falloff - 120);
        }
      }
      if (opts.debris !== false && this.particles.length < 18e3) {
        for (let i = 0; i < Math.min(16, Math.floor(r * 0.4)); i++) {
          this.spawnParticle({
            x: wx + (Math.random() - 0.5) * r * 0.7,
            y: wy + (Math.random() - 0.5) * r * 0.7,
            vx: (Math.random() - 0.5) * 320,
            vy: -120 - Math.random() * 260,
            life: 0.5 + Math.random() * 0.6,
            max: 1.1,
            kind: "debris",
            color: FIRE_COLORS[Math.random() * FIRE_COLORS.length | 0],
            size: 2.5 + Math.random() * 3,
            grav: 1500
          });
        }
      }
    }
    // Knock elements near blast outward
    blastImpulse(wx, wy, r, power) {
      const minX = wx - r;
      const maxX = wx + r;
      const minY = wy - r;
      const maxY = wy + r;
      for (let i = 0; i < this.bodies.length; i++) {
        const b = this.bodies[i];
        if (b.destroyed) continue;
        if (b.x + b.w < minX || b.x > maxX || b.y + b.h < minY || b.y > maxY) continue;
        const bcx = b.x + b.w / 2;
        const bcy = b.y + b.h / 2;
        let dx = bcx - wx;
        let dy = bcy - wy;
        const d = Math.hypot(dx, dy) || 1;
        dx /= d;
        dy /= d;
        const falloff = Math.max(0.15, 1 - d / r);
        const applied = power * falloff;
        b.hp -= applied * 0.4;
        if (b.hp <= 0) {
          this.shatterBody(b, wx, wy, applied);
        } else if (b.anchored) {
          this.dislodgeBody(b, dx * applied, dy * applied - 100);
        } else {
          const pushFactor = Math.min(12, 180 / b.mass);
          b.vx += dx * applied * pushFactor;
          b.vy += dy * applied * pushFactor - 60;
          b.vrot += (Math.random() - 0.5) * 6;
        }
      }
    }
    igniteCell(i, strength = 220) {
      if (this.mat[i] !== MAT_SOLID || this.heat[i] > 0) return;
      if (this.burns.length > 9e3) return;
      this.heat[i] = Math.min(255, strength);
      this.burns.push({ idx: i, t: 0, dur: 1.1 + Math.random() * 1.3 });
      this.dirty = true;
    }
    igniteWorld(wx, wy, r) {
      for (const b of this.bodies) {
        if (b.destroyed) continue;
        const bcx = b.x + b.w / 2;
        const bcy = b.y + b.h / 2;
        if (Math.hypot(bcx - wx, bcy - wy) < r + Math.min(b.w, b.h) / 2) {
          b.burning = 3.5;
        }
      }
    }
    puffAt(wx, wy, r) {
      for (let k = 0; k < 6; k++) {
        this.spawnParticle({
          x: wx + (Math.random() - 0.5) * r,
          y: wy + (Math.random() - 0.5) * r,
          vx: (Math.random() - 0.5) * 80,
          vy: -40 - Math.random() * 80,
          life: 0.8,
          max: 0.8,
          kind: "smoke",
          color: SMOKE_COLORS[Math.random() * SMOKE_COLORS.length | 0],
          size: 3 + Math.random() * 4
        });
      }
    }
    spawnParticle(p) {
      if (this.particles.length > 24e3) return;
      p.max = p.max || p.life;
      this.particles.push(p);
    }
    raycast(x, y, dx, dy, maxDist) {
      const step = 4;
      let cx = x;
      let cy = y;
      for (let d = 0; d < maxDist; d += step) {
        cx += dx * step;
        cy += dy * step;
        if (cx < 0 || cx >= this.W || cy >= this.H) return { x: cx, y: cy, hit: true };
        if (cy < 0) continue;
        if (this.solidAtWorld(cx, cy)) {
          return { x: cx, y: cy, hit: true };
        }
      }
      return { x: cx, y: cy, hit: false };
    }
    step(dt) {
      const floorY = this.H - 24;
      for (let i = this.dynamicBodies.length - 1; i >= 0; i--) {
        const b = this.dynamicBodies[i];
        if (b.destroyed) {
          this.dynamicBodies.splice(i, 1);
          continue;
        }
        if (b.burning > 0) {
          b.burning -= dt;
          b.hp -= 24 * dt;
          if (Math.random() < 0.25) {
            this.spawnParticle({
              x: b.x + Math.random() * b.w,
              y: b.y + Math.random() * b.h,
              vx: (Math.random() - 0.5) * 50,
              vy: -60 - Math.random() * 60,
              life: 0.5,
              max: 0.5,
              kind: "ember",
              color: FIRE_COLORS[Math.random() * FIRE_COLORS.length | 0],
              size: 2,
              grav: -120
            });
          }
          if (b.hp <= 0) {
            this.shatterBody(b, b.x + b.w / 2, b.y + b.h / 2, 220);
            continue;
          }
        }
        if (!b.settled) {
          b.vy += 2200 * dt;
          b.vx *= 1 - 0.4 * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.rot += b.vrot * dt;
          b.vrot *= 1 - 0.8 * dt;
          if (b.x < 0) {
            b.x = 0;
            b.vx = -b.vx * 0.4;
            b.vrot *= 0.6;
          } else if (b.x + b.w > this.W) {
            b.x = this.W - b.w;
            b.vx = -b.vx * 0.4;
            b.vrot *= 0.6;
          }
          if (b.y + b.h >= floorY) {
            b.y = floorY - b.h;
            if (Math.abs(b.vy) > 130) {
              b.vy = -b.vy * 0.32;
              b.vx *= 0.65;
              b.vrot *= 0.5;
            } else {
              b.vy = 0;
              b.settleT += dt;
              if (b.settleT > 0.35) {
                b.settled = true;
                b.vx = 0;
                b.vrot = 0;
                b.rot = 0;
                this.dynamicBodies.splice(i, 1);
                this.settledBodies.push(b);
              }
            }
          }
        }
      }
      for (let i = this.shards.length - 1; i >= 0; i--) {
        const s = this.shards[i];
        s.life -= dt;
        if (s.life <= 0) {
          this.shards.splice(i, 1);
          continue;
        }
        if (!s.settled) {
          s.vy += 2300 * dt;
          s.vx *= 1 - 0.45 * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.rot += s.vrot * dt;
          if (s.y >= floorY) {
            s.y = floorY;
            if (Math.abs(s.vy) > 140) {
              s.vy = -s.vy * 0.3;
              s.vx *= 0.65;
              s.vrot *= 0.55;
            } else {
              s.settled = true;
              s.vy = 0;
              s.vx *= 0.4;
              s.vrot = 0;
            }
          }
        }
      }
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        if (p.grav) p.vy += p.grav * dt;
        if (p.kind === "smoke") {
          p.vx *= 1 - 0.6 * dt;
          p.vy *= 1 - 0.6 * dt;
          p.size += 14 * dt;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.rot !== void 0 && p.vrot) p.rot += p.vrot * dt;
      }
    }
    // --- Rendering Orchestration ---
    draw(ctx, camX, camY, viewW, viewH) {
      const isHd = ConfigManager.get().getConfig().visual.hdVectorMode;
      const vLeft = camX - 80;
      const vRight = camX + viewW + 80;
      const vTop = camY - 80;
      const vBottom = camY + viewH + 80;
      const floorY = this.H - 28;
      if (floorY < vBottom) {
        ctx.save();
        const scrY = floorY - camY;
        ctx.fillStyle = "#111319";
        ctx.fillRect(-camX, scrY, this.W, 140);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-camX, scrY);
        ctx.lineTo(-camX + this.W, scrY);
        ctx.stroke();
        ctx.fillStyle = "rgba(245, 158, 11, 0.12)";
        for (let hx = 0; hx < this.W; hx += 40) {
          ctx.fillRect(hx - camX, scrY + 2, 20, 6);
        }
        ctx.restore();
      }
      for (let i = 0; i < this.bodies.length; i++) {
        const b = this.bodies[i];
        if (!b.anchored || b.destroyed) continue;
        if (b.x + b.w < vLeft || b.x > vRight || b.y + b.h < vTop || b.y > vBottom) continue;
        const scrX = b.x - camX;
        const scrY = b.y - camY;
        if (b.kind === "word") {
          ctx.save();
          ctx.font = b.font || "16px sans-serif";
          ctx.fillStyle = b.color || "#ffffff";
          ctx.textBaseline = "top";
          ctx.fillText(b.text || "", scrX, scrY);
          if (b.underline) {
            ctx.fillRect(scrX, scrY + b.h - 1, b.w, 1.5);
          }
          if (b.damageDecals.length > 0) {
            ctx.fillStyle = "rgba(25, 25, 25, 0.8)";
            for (const d of b.damageDecals) {
              ctx.beginPath();
              ctx.arc(scrX + d.rx, scrY + d.ry, d.r, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
        } else if (b.kind === "box") {
          drawVectorBox(ctx, scrX, scrY, b.w, b.h, b.radius, b.bg, b.grad, b.border, b.shadow);
          if (b.damageDecals.length > 0) {
            ctx.fillStyle = "rgba(20, 20, 20, 0.75)";
            for (const d of b.damageDecals) {
              ctx.beginPath();
              ctx.arc(scrX + d.rx, scrY + d.ry, d.r, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (b.kind === "image") {
          if (b.image && b.image.complete && b.image.naturalWidth > 0) {
            ctx.save();
            if (b.radius) {
              applyRadiusPath(ctx, scrX, scrY, b.w, b.h, b.radius);
              ctx.clip();
            }
            ctx.drawImage(b.image, scrX, scrY, b.w, b.h);
            if (b.damageDecals.length > 0) {
              ctx.fillStyle = "rgba(20, 20, 20, 0.82)";
              for (const d of b.damageDecals) {
                ctx.beginPath();
                ctx.arc(scrX + d.rx, scrY + d.ry, d.r, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            ctx.restore();
          }
        }
      }
      for (let i = 0; i < this.settledBodies.length; i++) {
        const b = this.settledBodies[i];
        if (b.destroyed) continue;
        if (b.x + b.w < vLeft || b.x > vRight || b.y + b.h < vTop || b.y > vBottom) continue;
        const scrX = b.x - camX;
        const scrY = b.y - camY;
        if (b.kind === "word") {
          ctx.save();
          ctx.font = b.font || "16px sans-serif";
          ctx.fillStyle = b.color || "#ffffff";
          ctx.textBaseline = "top";
          ctx.fillText(b.text || "", scrX, scrY);
          ctx.restore();
        } else if (b.kind === "box") {
          drawVectorBox(ctx, scrX, scrY, b.w, b.h, b.radius, b.bg, b.grad, b.border, null);
        } else if (b.kind === "image" && b.image) {
          ctx.drawImage(b.image, scrX, scrY, b.w, b.h);
        }
      }
      for (let i = 0; i < this.dynamicBodies.length; i++) {
        const b = this.dynamicBodies[i];
        if (b.destroyed) continue;
        const cx = b.x + b.w / 2 - camX;
        const cy = b.y + b.h / 2 - camY;
        if (cx < -100 || cx > viewW + 100 || cy < -100 || cy > viewH + 100) continue;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(b.rot);
        if (b.kind === "word") {
          ctx.font = b.font || "16px sans-serif";
          ctx.fillStyle = b.color || "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
          ctx.shadowBlur = 6;
          ctx.fillText(b.text || "", 0, 0);
        } else if (b.kind === "box") {
          drawVectorBox(ctx, -b.w / 2, -b.h / 2, b.w, b.h, b.radius, b.bg, b.grad, b.border, null);
        } else if (b.kind === "image" && b.image) {
          ctx.drawImage(b.image, -b.w / 2, -b.h / 2, b.w, b.h);
        }
        ctx.restore();
      }
      for (let i = 0; i < this.shards.length; i++) {
        const s = this.shards[i];
        const sx = s.x - camX;
        const sy = s.y - camY;
        if (sx < -60 || sx > viewW + 60 || sy < -60 || sy > viewH + 60) continue;
        const alpha = s.life < 0.8 ? Math.max(0, s.life / 0.8) : 1;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(s.rot);
        ctx.globalAlpha = alpha;
        if (s.kind === "glyph" && s.text) {
          ctx.font = s.font || "16px sans-serif";
          ctx.fillStyle = s.color || "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
          ctx.shadowBlur = 4;
          ctx.fillText(s.text, 0, 0);
        } else if (s.kind === "polygon" && s.poly && s.poly.length >= 3) {
          ctx.beginPath();
          ctx.moveTo(s.poly[0].x, s.poly[0].y);
          for (let pIdx = 1; pIdx < s.poly.length; pIdx++) {
            ctx.lineTo(s.poly[pIdx].x, s.poly[pIdx].y);
          }
          ctx.closePath();
          if (s.image && s.image.complete && s.image.naturalWidth > 0) {
            ctx.save();
            ctx.clip();
            ctx.drawImage(s.image, -(s.uvX ?? 0), -(s.uvY ?? 0), s.uvW ?? 100, s.uvH ?? 100);
            ctx.restore();
          } else {
            ctx.fillStyle = s.colorStr || "#718096";
            ctx.fill();
          }
          ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    drawParticles(ctx, camX, camY) {
      for (const p of this.particles) {
        const t = p.life / p.max;
        const px = p.x - camX;
        const py = p.y - camY;
        if (px < -30 || py < -30 || px > 4e3 || py > 4e3) continue;
        switch (p.kind) {
          case "smoke": {
            ctx.globalAlpha = Math.min(0.55, t * 0.8);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case "ember":
          case "spark": {
            ctx.globalAlpha = t;
            ctx.fillStyle = p.color;
            const s2 = p.size;
            ctx.fillRect(px - s2 / 2, py - s2 / 2, s2, s2);
            break;
          }
          case "debris":
          case "paper":
          case "shell": {
            ctx.globalAlpha = Math.min(1, t * 2);
            ctx.fillStyle = p.color;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(p.rot ?? 0);
            ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
            ctx.restore();
            break;
          }
          case "star": {
            ctx.globalAlpha = t;
            ctx.fillStyle = p.color;
            const s3 = p.size * t;
            ctx.fillRect(px - s3, py - s3 / 6, s3 * 2, s3 / 3);
            ctx.fillRect(px - s3 / 6, py - s3, s3 / 3, s3 * 2);
            break;
          }
          case "glow": {
            ctx.globalAlpha = t * 0.5;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(px, py, p.size * (2 - t), 0, Math.PI * 2);
            ctx.fill();
            break;
          }
        }
      }
      ctx.globalAlpha = 1;
    }
  };
  function applyRadiusPath(ctx, x, y, w, h, rad) {
    const maxr = Math.min(w, h) / 2;
    const rtl = Math.min(rad[0], maxr);
    const rtr = Math.min(rad[1], maxr);
    const rbr = Math.min(rad[2], maxr);
    const rbl = Math.min(rad[3], maxr);
    ctx.beginPath();
    ctx.moveTo(x + rtl, y);
    ctx.lineTo(x + w - rtr, y);
    if (rtr > 0) ctx.quadraticCurveTo(x + w, y, x + w, y + rtr);
    ctx.lineTo(x + w, y + h - rbr);
    if (rbr > 0) ctx.quadraticCurveTo(x + w, y + h, x + w - rbr, y + h);
    ctx.lineTo(x + rbl, y + h);
    if (rbl > 0) ctx.quadraticCurveTo(x, y + h, x, y + h - rbl);
    ctx.lineTo(x, y + rtl);
    if (rtl > 0) ctx.quadraticCurveTo(x, y, x + rtl, y);
    ctx.closePath();
  }
  function drawVectorBox(ctx, x, y, w, h, radius, bg, grad, border, shadow) {
    ctx.save();
    if (shadow && shadow.blur > 0) {
      ctx.shadowColor = shadow.color;
      ctx.shadowBlur = shadow.blur;
      ctx.shadowOffsetX = shadow.x;
      ctx.shadowOffsetY = shadow.y;
    }
    const rad = radius || [0, 0, 0, 0];
    applyRadiusPath(ctx, x, y, w, h, rad);
    if (grad && grad.stops && grad.stops.length >= 2) {
      const radAngle = (grad.angle - 90) * Math.PI / 180;
      const cx = x + w / 2;
      const cy = y + h / 2;
      const diag = Math.hypot(w, h) / 2;
      const x0 = cx - Math.cos(radAngle) * diag;
      const y0 = cy - Math.sin(radAngle) * diag;
      const x1 = cx + Math.cos(radAngle) * diag;
      const y1 = cy + Math.sin(radAngle) * diag;
      const lg = ctx.createLinearGradient(x0, y0, x1, y1);
      for (const stop of grad.stops) {
        lg.addColorStop(Math.max(0, Math.min(1, stop.p)), stop.c);
      }
      ctx.fillStyle = lg;
      ctx.fill();
    } else if (bg) {
      ctx.fillStyle = bg;
      ctx.fill();
    }
    if (border && border.w > 0 && border.c) {
      ctx.strokeStyle = border.c;
      ctx.lineWidth = border.w;
      ctx.stroke();
    }
    ctx.restore();
  }
  function generatePolygonShards(body, hitX, hitY, force) {
    const shards = [];
    const w = body.w;
    const h = body.h;
    const localX = Math.max(w * 0.15, Math.min(w * 0.85, hitX - body.x));
    const localY = Math.max(h * 0.15, Math.min(h * 0.85, hitY - body.y));
    const pts = [
      { x: 0, y: 0 },
      { x: w * (0.35 + Math.random() * 0.3), y: 0 },
      { x: w, y: 0 },
      { x: w, y: h * (0.35 + Math.random() * 0.3) },
      { x: w, y: h },
      { x: w * (0.35 + Math.random() * 0.3), y: h },
      { x: 0, y: h },
      { x: 0, y: h * (0.35 + Math.random() * 0.3) }
    ];
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const cx = (localX + p1.x + p2.x) / 3;
      const cy = (localY + p1.y + p2.y) / 3;
      const poly = [
        { x: localX - cx, y: localY - cy },
        { x: p1.x - cx, y: p1.y - cy },
        { x: p2.x - cx, y: p2.y - cy }
      ];
      const wx = body.x + cx;
      const wy = body.y + cy;
      const dx = cx - localX;
      const dy = cy - localY;
      const d = Math.hypot(dx, dy) || 1;
      const blastSpeed = force * (0.6 + Math.random() * 0.6);
      shards.push({
        x: wx,
        y: wy,
        vx: body.vx * 0.4 + dx / d * blastSpeed + (Math.random() - 0.5) * 140,
        vy: body.vy * 0.4 + dy / d * blastSpeed - 120 - Math.random() * 160,
        rot: 0,
        vrot: (Math.random() - 0.5) * (10 + force / 60),
        life: 3.2 + Math.random() * 1.6,
        maxLife: 4.8,
        kind: "polygon",
        poly,
        colorStr: body.bg || "#7a828e",
        border: body.border,
        image: body.image,
        uvX: cx,
        uvY: cy,
        uvW: w,
        uvH: h,
        settled: false
      });
    }
    return shards;
  }
  function generateWordShards(body, hitX, hitY, force) {
    const shards = [];
    const txt = body.text || "";
    if (!txt) return shards;
    const clusters = [];
    if (txt.length <= 3) {
      for (let i = 0; i < txt.length; i++) {
        clusters.push({ str: txt[i], relX: body.w / txt.length * (i + 0.5) });
      }
    } else {
      for (let i = 0; i < txt.length; i += 2) {
        const sub = txt.slice(i, i + 2);
        clusters.push({ str: sub, relX: body.w / txt.length * (i + sub.length / 2) });
      }
    }
    for (const c of clusters) {
      const wx = body.x + c.relX;
      const wy = body.y + body.h / 2;
      let dx = wx - hitX;
      let dy = wy - hitY;
      const d = Math.hypot(dx, dy) || 1;
      dx /= d;
      dy /= d;
      const mag = force * (0.65 + Math.random() * 0.65);
      shards.push({
        x: wx,
        y: wy,
        vx: body.vx * 0.35 + dx * mag + (Math.random() - 0.5) * 160,
        vy: body.vy * 0.35 + dy * mag - 140 - Math.random() * 180,
        rot: 0,
        vrot: (Math.random() - 0.5) * (14 + force / 40),
        life: 3.5 + Math.random() * 1.5,
        maxLife: 5,
        kind: "glyph",
        text: c.str,
        font: body.font,
        color: body.color,
        settled: false
      });
    }
    return shards;
  }
  function packColor(hex) {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return 255 << 24 | b << 16 | g << 8 | r;
  }

  // src/lib/game/loader.ts
  var MAX_GLYPHS = 4200;
  var MAX_BOXES = 2600;
  var MAX_IMAGES = 260;
  var MAX_H = 3400;
  function parseColor(s) {
    if (!s) return null;
    const t = s.trim();
    if (t === "transparent" || t === "none" || t === "") return null;
    let m = t.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.%]+))?\s*\)$/i);
    if (m) {
      const a = m[4] ? m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]) : 1;
      if (a <= 0.03) return null;
      const r = Math.round(+m[1]);
      const g = Math.round(+m[2]);
      const b = Math.round(+m[3]);
      return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    }
    if (/^#[0-9a-f]{3,8}$/i.test(t)) {
      if (t.length === 4 || t.length === 5) {
        const r = t[1];
        const g = t[2];
        const b = t[3];
        return `#${r}${r}${g}${g}${b}${b}`;
      }
      if (t.length === 9) {
        const a = parseInt(t.slice(7, 9), 16) / 255;
        if (a <= 0.03) return null;
        return t.slice(0, 7);
      }
      return t.slice(0, 7);
    }
    return null;
  }
  function parseGradient(bg) {
    const m = bg.match(/linear-gradient\(([^)]*)\)/i);
    if (!m) return null;
    const inner = m[1];
    let angle = 180;
    const parts = [];
    let depth = 0;
    let cur = "";
    for (const ch of inner) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) {
        parts.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());
    let i = 0;
    const first = parts[0];
    const am = first.match(/^([\d.]+)(deg|turn)/i);
    const am2 = first.match(/to\s+(top|bottom|left|right)/i);
    if (am) {
      angle = parseFloat(am[1]);
      if (am[2] === "turn") angle = parseFloat(am[1]) * 360;
      i = 1;
    } else if (am2) {
      const dirs = { top: 0, right: 90, bottom: 180, left: 270 };
      angle = dirs[am2[1]];
      i = 1;
    }
    const stops = [];
    for (; i < parts.length; i++) {
      const pm = parts[i].match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|[a-z]+)\s*([\d.]+%)?/i);
      if (!pm) continue;
      const c = parseColor(pm[1]) ?? "#888888";
      const p = pm[2] ? parseFloat(pm[2]) / 100 : -1;
      stops.push({ c, p });
    }
    if (stops.length < 2) return null;
    for (let k = 0; k < stops.length; k++) {
      if (stops[k].p < 0) stops[k].p = k / (stops.length - 1);
    }
    return { type: "linear", angle, stops };
  }
  function radiusOf(s) {
    const raw = (v) => {
      const f = parseFloat(v) || 0;
      return Math.max(0, Math.min(f, 999));
    };
    const tl = raw(s.borderTopLeftRadius);
    const tr = raw(s.borderTopRightRadius);
    const br = raw(s.borderBottomRightRadius);
    const bl = raw(s.borderBottomLeftRadius);
    return [tl, tr, br, bl];
  }
  function parseBoxShadow(s) {
    if (!s || s === "none" || s.trim() === "") return null;
    const m1 = s.match(/(rgba?\([^)]+\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/);
    if (m1) {
      const blur = parseFloat(m1[4]) || 0;
      if (blur > 0.5) {
        return {
          color: m1[1],
          x: parseFloat(m1[2]) || 0,
          y: parseFloat(m1[3]) || 0,
          blur: Math.min(24, blur)
        };
      }
    }
    return null;
  }
  var SKIP_TAGS = /* @__PURE__ */ new Set([
    "script",
    "style",
    "noscript",
    "template",
    "head",
    "meta",
    "link",
    "title",
    "iframe",
    "br",
    "source",
    "track",
    "param",
    "object",
    "embed",
    "sup",
    "sub"
  ]);
  var SKIP_CLASSES = [
    "mw-jump-link",
    "mw-editsection",
    "noprint",
    "navbox",
    "vector-menu",
    "visually-hidden",
    "sr-only",
    "reference",
    "citation",
    "reflist",
    "mw-indicator",
    "hatnote",
    "infobox-navbar"
  ];
  async function buildLevel(html, baseUrl, layoutW, onProgress) {
    onProgress("\u062A\u062D\u0636\u064A\u0631 \u0627\u0644\u0635\u0641\u062D\u0629\u2026", 0.12);
    const iframe = document.createElement("iframe");
    iframe.sandbox.add("allow-same-origin");
    iframe.style.cssText = `position:fixed;left:0;top:0;width:${layoutW}px;height:3600px;z-index:-9999;opacity:0.001;pointer-events:none;border:0;`;
    document.body.appendChild(iframe);
    const cleanup = () => {
      try {
        iframe.remove();
      } catch {
      }
    };
    try {
      const doc = iframe.contentDocument;
      if (!doc) throw new Error("\u062A\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0625\u0637\u0627\u0631 \u0627\u0644\u0635\u0641\u062D\u0629");
      doc.open();
      doc.write(html);
      doc.close();
      await new Promise((resolve) => {
        let done = false;
        const finish = () => {
          if (!done) {
            done = true;
            resolve();
          }
        };
        iframe.onload = finish;
        setTimeout(finish, 2500);
      });
      try {
        await iframe.contentWindow?.document.fonts?.ready;
      } catch {
      }
      await new Promise((r) => setTimeout(r, 150));
      const win = iframe.contentWindow;
      const idoc = win.document;
      const body = idoc.body;
      if (!body) throw new Error("\u0635\u0641\u062D\u0629 \u0628\u0644\u0627 \u0645\u062D\u062A\u0648\u0649");
      onProgress("\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0635\u0641\u062D\u0629\u2026", 0.25);
      const pageH = Math.min(MAX_H, Math.max(600, Math.ceil(idoc.documentElement.scrollHeight)));
      const W2 = layoutW;
      const H = pageH;
      const backdropCv = document.createElement("canvas");
      backdropCv.width = W2;
      backdropCv.height = H;
      const bctx = backdropCv.getContext("2d");
      const cv2 = document.createElement("canvas");
      cv2.width = W2;
      cv2.height = H;
      const ctx = cv2.getContext("2d", { willReadFrequently: true });
      ctx.textBaseline = "alphabetic";
      const csHtml = win.getComputedStyle(idoc.documentElement);
      const csBody = win.getComputedStyle(body);
      let pageBg = parseColor(csBody.backgroundColor) ?? parseColor(csHtml.backgroundColor) ?? "#ffffff";
      bctx.fillStyle = pageBg;
      bctx.fillRect(0, 0, W2, H);
      bctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
      bctx.lineWidth = 2;
      bctx.strokeRect(1, 1, W2 - 2, H - 2);
      ctx.clearRect(0, 0, W2, H);
      const boxes = [];
      const glyphs = [];
      const images = [];
      let glyphCount = 0;
      let boxCount = 0;
      let imgCount = 0;
      let elemId = 0;
      const newElement = (kind, approxCells) => {
        const el = {
          id: elemId++,
          kind,
          cells: [],
          lost: 0,
          hp: 20 + (kind === "image" ? 0.32 : 0.4) * Math.sqrt(Math.max(16, approxCells * CELL * CELL)),
          alive: true
        };
        return el;
      };
      let blockIdCounter = 0;
      const walk = (node, curBlockId = 0) => {
        if (boxes.length + glyphs.length > MAX_BOXES + MAX_GLYPHS) return;
        const tag = node.tagName.toLowerCase();
        if (SKIP_TAGS.has(tag)) return;
        if (node.className && typeof node.className === "string") {
          const cls = node.className.toLowerCase();
          if (SKIP_CLASSES.some((sc) => cls.includes(sc))) return;
        }
        const cs = win.getComputedStyle(node);
        if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") return;
        const op = parseFloat(cs.opacity || "1");
        if (op < 0.02) return;
        let blockId = curBlockId;
        const isButton = tag === "button" || node.getAttribute("role") === "button";
        const isHeading = /^h[1-6]$/.test(tag);
        const isBlockTag = /^(p|h[1-6]|li|blockquote|pre|td|th|dt|dd|article|section|header|footer|aside)$/i.test(tag) || isButton || isHeading;
        if (isBlockTag) {
          blockId = ++blockIdCounter;
        }
        const rect = node.getBoundingClientRect();
        const x = rect.left;
        const y = rect.top;
        const w = rect.width;
        const h = rect.height;
        const isImg = tag === "img";
        const inlineSvg = tag === "svg";
        const anchor = node.closest("a");
        const href = anchor ? anchor.getAttribute("href") : null;
        const shadow = parseBoxShadow(cs.boxShadow);
        const hasBg = parseColor(cs.backgroundColor) !== null || /gradient\(/i.test(cs.backgroundImage || "") || isImg || inlineSvg;
        const visibleBox = (hasBg || parseColor(cs.borderTopColor)) && w >= 3 && h >= 3 && boxCount < MAX_BOXES;
        let box = null;
        if (visibleBox) {
          let bg = parseColor(cs.backgroundColor);
          let grad = /gradient\(/i.test(cs.backgroundImage || "") ? parseGradient(cs.backgroundImage) : null;
          let image = null;
          let imgSrc = null;
          let svgXml = null;
          let imgFit = cs.objectFit || "cover";
          if (isImg) {
            imgSrc = node.getAttribute("src");
            if (!imgSrc) {
              const srcset = node.getAttribute("srcset");
              if (srcset) imgSrc = srcset.split(",")[0]?.trim().split(" ")[0] ?? null;
            }
          } else if (inlineSvg) {
            svgXml = new XMLSerializer().serializeToString(node);
          } else {
            const bm = (cs.backgroundImage || "").match(/url\(["']?([^"')]+)["']?\)/i);
            if (bm) imgSrc = bm[1];
          }
          if ((imgSrc || svgXml) && imgCount < MAX_IMAGES && w >= 8 && h >= 8) {
            imgCount++;
            const bw = Math.ceil(w);
            const bh = Math.ceil(h);
            const bel = newElement("image", bw * bh);
            bel.w = w;
            bel.h = h;
            bel.svgXml = svgXml ?? void 0;
            bel.label = svgXml ? "SVG Icon" : "Image";
            bel.tag = tag;
            bel.semanticRole = anchor && href ? "portal" : "heavy";
            if (anchor && href) bel.href = href;
            box = {
              x,
              y,
              w,
              h,
              radius: radiusOf(cs),
              bg: bg ?? (tag === "img" ? "#c8c8c8" : "#9aa4b0"),
              grad,
              border: null,
              shadow,
              image: null,
              imgFit,
              opacity: op,
              el: bel
            };
            images.push({ box, src: imgSrc ?? "", svg: svgXml ?? void 0 });
            boxes.push(box);
            boxCount++;
          } else {
            const bw = Math.ceil(w);
            const bh = Math.ceil(h);
            const isScenery = bw >= W2 - 12 && bh >= H - 12 || bw >= W2 * 0.72 && bh >= 160 || bw >= W2 * 0.5 && bh >= 280;
            const bel = isScenery ? null : newElement("box", bw * bh);
            if (bel) {
              bel.tag = tag;
              if (anchor && href) {
                bel.href = href;
                bel.semanticRole = "portal";
              } else if (isButton) {
                bel.semanticRole = "trigger";
              } else if (isHeading) {
                bel.semanticRole = "structure";
              } else {
                bel.semanticRole = "platform";
              }
            }
            box = {
              x,
              y,
              w,
              h,
              radius: radiusOf(cs),
              bg,
              grad,
              border: null,
              shadow,
              image: null,
              imgFit,
              opacity: op,
              el: bel
            };
            const bwid = parseFloat(cs.borderLeftWidth) || 0;
            if (bwid > 0) {
              const bc = parseColor(cs.borderLeftColor);
              if (bc) box.border = { w: Math.min(14, bwid), c: bc };
            }
            boxes.push(box);
            boxCount++;
          }
        }
        if (glyphCount < MAX_GLYPHS) {
          const childNodes = Array.from(node.childNodes);
          for (let cIdx = 0; cIdx < childNodes.length && glyphCount < MAX_GLYPHS; cIdx++) {
            const childNode = childNodes[cIdx];
            if (childNode.nodeType !== Node.TEXT_NODE) continue;
            const tn = childNode;
            const txt = tn.data;
            if (txt.trim().length > 0) {
              const pcs = win.getComputedStyle(node);
              const fs = parseFloat(pcs.fontSize) || 16;
              if (fs >= 7) {
                const fill = parseColor(pcs.webkitTextFillColor) ?? parseColor(pcs.color) ?? "#111111";
                const fam = pcs.fontFamily || "sans-serif";
                const weight = pcs.fontWeight || "400";
                const style = pcs.fontStyle === "italic" ? "italic " : "";
                const font = `${style}${weight} ${fs}px ${fam}`;
                const range = idoc.createRange();
                const len = txt.length;
                let i = 0;
                while (i < len && glyphCount < MAX_GLYPHS) {
                  while (i < len && !txt[i].trim()) i++;
                  if (i >= len) break;
                  let j = i;
                  while (j < len && txt[j].trim()) j++;
                  if (j > i) {
                    try {
                      range.setStart(tn, i);
                      range.setEnd(tn, j);
                      const r = range.getBoundingClientRect();
                      if (r.width > 0 && r.height > 0 && r.right > -50 && r.left < W2 + 50 && r.bottom > -20 && r.top < H && r.top > -10) {
                        const wordText = txt.slice(i, j);
                        const el = newElement("glyph", Math.max(9, Math.ceil(r.width) * Math.ceil(r.height)));
                        el.label = wordText;
                        el.text = wordText;
                        el.font = font;
                        el.colorStr = fill;
                        el.w = r.width;
                        el.h = r.height;
                        el.isWord = true;
                        el.tag = tag;
                        if (anchor && href) {
                          el.href = href;
                          el.semanticRole = "portal";
                        } else if (isHeading) {
                          el.semanticRole = "structure";
                        } else if (isButton) {
                          el.semanticRole = "trigger";
                        } else {
                          el.semanticRole = "platform";
                        }
                        glyphs.push({
                          ch: wordText,
                          x: r.left,
                          y: r.top,
                          w: r.width,
                          h: r.height,
                          base: r.bottom - (r.height - fs * 0.78) * 0.32,
                          font,
                          color: fill,
                          underline: (pcs.textDecorationLine || "").includes("underline"),
                          el,
                          fs,
                          blockId
                        });
                        glyphCount++;
                      }
                    } catch {
                    }
                  }
                  i = j;
                }
              }
            }
          }
        }
        for (const child of Array.from(node.children)) {
          if (child.tagName.toLowerCase() === "svg" && !inlineSvg) {
          }
          walk(child, blockId);
        }
      };
      for (const child of Array.from(body.children)) walk(child, 0);
      const blockMap = /* @__PURE__ */ new Map();
      for (const g of glyphs) {
        let list = blockMap.get(g.blockId);
        if (!list) {
          list = [];
          blockMap.set(g.blockId, list);
        }
        list.push(g);
      }
      for (const [, words] of blockMap) {
        if (words.length === 0) continue;
        words.sort((a, b) => a.y - b.y);
        const lines = [];
        let curLine = [];
        let curY = -1e9;
        let curH = 16;
        for (const w of words) {
          if (curLine.length === 0) {
            curLine.push(w);
            curY = w.y;
            curH = w.h;
          } else {
            if (Math.abs(w.y - curY) <= curH * 0.48) {
              curLine.push(w);
              curY = Math.min(curY, w.y);
            } else {
              lines.push(curLine);
              curLine = [w];
              curY = w.y;
              curH = w.h;
            }
          }
        }
        if (curLine.length > 0) lines.push(curLine);
        for (const line of lines) {
          line.sort((a, b) => a.x - b.x);
          const dominantFs = Math.max(...line.map((w) => w.fs));
          const minGap = Math.max(5, Math.round(dominantFs * 0.28));
          const maxBase = Math.max(...line.map((w) => w.base));
          for (let k = 0; k < line.length; k++) {
            const curr = line[k];
            if (k > 0) {
              const prev = line[k - 1];
              if (curr.x < prev.x + prev.w + minGap) {
                curr.x = prev.x + prev.w + minGap;
              }
            }
            curr.base = maxBase;
            curr.y = maxBase - curr.h * 0.82;
          }
        }
        for (let l = 1; l < lines.length; l++) {
          const prevLine = lines[l - 1];
          const currLine = lines[l];
          const prevBottom = Math.max(...prevLine.map((w) => w.y + w.h));
          const fs = Math.max(...currLine.map((w) => w.fs));
          const minLineTop = prevBottom + Math.max(4, Math.round(fs * 0.35));
          const curTop = Math.min(...currLine.map((w) => w.y));
          if (curTop < minLineTop) {
            const shiftY = minLineTop - curTop;
            for (const w of currLine) {
              w.y += shiftY;
              w.base += shiftY;
            }
          }
        }
      }
      const sortedBlocks = Array.from(blockMap.values()).filter((list) => list.length > 0);
      sortedBlocks.sort((a, b) => {
        const topA = Math.min(...a.map((w) => w.y));
        const topB = Math.min(...b.map((w) => w.y));
        return topA - topB;
      });
      for (let b = 1; b < sortedBlocks.length; b++) {
        const prevBlock = sortedBlocks[b - 1];
        const currBlock = sortedBlocks[b];
        const prevBottom = Math.max(...prevBlock.map((w) => w.y + w.h));
        const prevLeft = Math.min(...prevBlock.map((w) => w.x));
        const prevRight = Math.max(...prevBlock.map((w) => w.x + w.w));
        const currTop = Math.min(...currBlock.map((w) => w.y));
        const currLeft = Math.min(...currBlock.map((w) => w.x));
        const currRight = Math.max(...currBlock.map((w) => w.x + w.w));
        const horizOverlap = Math.min(prevRight, currRight) - Math.max(prevLeft, currLeft);
        if (horizOverlap > 40) {
          const minBlockTop = prevBottom + 14;
          if (currTop < minBlockTop) {
            const shiftY = minBlockTop - currTop;
            for (const w of currBlock) {
              w.y += shiftY;
              w.base += shiftY;
            }
          }
        }
      }
      for (const im of images) {
        const b = im.box;
        const imgLeft = b.x - 16;
        const imgRight = b.x + b.w + 16;
        const imgTop = b.y - 12;
        const imgBottom = b.y + b.h + 16;
        for (const g of glyphs) {
          if (g.y + g.h > imgTop && g.y < imgBottom) {
            if (g.x + g.w > imgLeft && g.x < imgRight) {
              if (g.x < imgLeft) {
                g.y = imgBottom + 8;
                g.base = g.y + g.h * 0.82;
              }
            }
          }
        }
      }
      onProgress("\u0631\u0633\u0645 \u0627\u0644\u0635\u0641\u062D\u0629\u2026", 0.5);
      const rr2 = (c, x, y, w, h, r) => {
        const maxr = Math.min(w / 2, h / 2);
        const [tl, tr, br, bl] = r.map((v) => Math.min(v, maxr));
        c.beginPath();
        c.moveTo(x + tl, y);
        c.lineTo(x + w - tr, y);
        c.arcTo(x + w, y, x + w, y + tr, tr);
        c.lineTo(x + w, y + h - br);
        c.arcTo(x + w, y + h, x + w - br, y + h, br);
        c.lineTo(x + bl, y + h);
        c.arcTo(x, y + h, x, y + h - bl, bl);
        c.lineTo(x, y + tl);
        c.arcTo(x, y, x + tl, y, tl);
        c.closePath();
      };
      const paintBox = (c, b) => {
        c.save();
        c.globalAlpha = b.opacity;
        rr2(c, b.x, b.y, b.w, b.h, b.radius);
        if (b.grad) {
          const rad = b.grad.angle * Math.PI / 180;
          const cx = b.x + b.w / 2;
          const cy = b.y + b.h / 2;
          const len = (Math.abs(Math.cos(rad)) * b.w + Math.abs(Math.sin(rad)) * b.h) / 2;
          const dx = Math.cos(rad) * len;
          const dy = Math.sin(rad) * len;
          const gr = c.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
          for (const s of b.grad.stops) gr.addColorStop(Math.max(0, Math.min(1, s.p)), s.c);
          c.fillStyle = gr;
        } else if (b.bg) {
          c.fillStyle = b.bg;
        } else {
          c.fillStyle = "rgba(0,0,0,0)";
        }
        c.fill();
        if (b.border) {
          c.strokeStyle = b.border.c;
          c.lineWidth = b.border.w * 2;
          rr2(c, b.x + b.border.w / 2, b.y + b.border.w / 2, b.w - b.border.w, b.h - b.border.w, b.radius);
          c.stroke();
        }
        c.restore();
      };
      for (const b of boxes) {
        if (!b.el) {
          paintBox(bctx, b);
        } else {
          paintBox(ctx, b);
        }
      }
      for (const im of images) {
        const b = im.box;
        if (b.w >= 24 && b.h >= 24) {
          bctx.save();
          bctx.fillStyle = "#f8fafc";
          bctx.shadowColor = "rgba(15, 23, 42, 0.08)";
          bctx.shadowBlur = 18;
          bctx.shadowOffsetY = 6;
          rr2(bctx, b.x - 8, b.y - 8, b.w + 16, b.h + 16, [10, 10, 10, 10]);
          bctx.fill();
          bctx.strokeStyle = "#cbd5e1";
          bctx.lineWidth = 1.2;
          bctx.stroke();
          bctx.restore();
        }
      }
      if (glyphs.length > 0) {
        const minX = Math.max(16, Math.min(...glyphs.map((w) => w.x)) - 16);
        const minY = Math.max(16, Math.min(...glyphs.map((w) => w.y)) - 20);
        const maxX = Math.min(W2 - 16, Math.max(...glyphs.map((w) => w.x + w.w)) + 16);
        const maxY = Math.min(H - 16, Math.max(...glyphs.map((w) => w.y + w.h)) + 24);
        if (maxX > minX + 60 && maxY > minY + 60) {
          bctx.save();
          bctx.fillStyle = "#ffffff";
          bctx.shadowColor = "rgba(15, 23, 42, 0.04)";
          bctx.shadowBlur = 20;
          bctx.shadowOffsetY = 8;
          rr2(bctx, minX, minY, maxX - minX, maxY - minY, [16, 16, 16, 16]);
          bctx.fill();
          bctx.strokeStyle = "rgba(226, 232, 240, 0.85)";
          bctx.lineWidth = 1.2;
          bctx.stroke();
          bctx.restore();
        }
      }
      if (images.length) onProgress("\u062A\u0646\u0632\u064A\u0644 \u0627\u0644\u0635\u0648\u0631\u2026", 0.6);
      const imgJobs = images.map(async (im) => {
        try {
          let url = null;
          if (im.svg) {
            url = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(im.svg)));
          } else if (im.src) {
            const abs = new URL(im.src, baseUrl).href;
            url = `/api/img?url=${encodeURIComponent(abs)}`;
          }
          if (!url) return;
          const image = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = url;
            setTimeout(() => resolve(null), 9e3);
          });
          if (!image) return;
          im.box.image = image;
          if (im.box.el) {
            im.box.el.image = image;
          }
          const b = im.box;
          ctx.save();
          ctx.globalAlpha = b.opacity;
          rr2(ctx, b.x, b.y, b.w, b.h, b.radius);
          ctx.clip();
          const ir = image.width / image.height;
          const br = b.w / b.h;
          let dw = b.w;
          let dh = b.h;
          if (b.imgFit === "contain" ? ir > br : ir < br) {
            dh = b.w / ir;
          } else {
            dw = b.h * ir;
          }
          if (b.imgFit === "fill") {
            dw = b.w;
            dh = b.h;
          }
          ctx.drawImage(image, b.x + (b.w - dw) / 2, b.y + (b.h - dh) / 2, dw, dh);
          ctx.restore();
        } catch {
        }
      });
      await Promise.all(imgJobs);
      onProgress("\u0631\u0633\u0645 \u0627\u0644\u0646\u0635\u0648\u0635\u2026", 0.72);
      ctx.textBaseline = "alphabetic";
      for (const g of glyphs) {
        ctx.save();
        ctx.font = g.font;
        ctx.fillStyle = g.color;
        ctx.fillText(g.ch, g.x, g.base);
        if (g.underline) {
          ctx.fillRect(g.x, g.base + Math.max(1.5, g.h * 0.08), g.w, Math.max(1.5, g.h / 15));
        }
        ctx.restore();
      }
      onProgress("\u0628\u0646\u0627\u0621 \u0627\u0644\u0645\u0633\u062A\u0648\u0649\u2026", 0.82);
      const GW = Math.ceil(W2 / CELL);
      const GH = Math.ceil(H / CELL);
      const layout = ctx.getImageData(0, 0, W2, H);
      const lbuf = new Uint32Array(layout.data.buffer);
      const colors = new Uint32Array(GW * GH);
      if (CELL === 1) {
        for (let i = 0; i < GW * GH; i++) {
          const c = lbuf[i];
          if (c >>> 24 > 28) {
            colors[i] = c;
          }
        }
      } else {
        for (let cy = 0; cy < GH; cy++) {
          for (let cx = 0; cx < GW; cx++) {
            let best = 0;
            let bestA = 0;
            let r = 0;
            let g = 0;
            let b = 0;
            let n = 0;
            for (let sy = 0; sy < CELL; sy++) {
              const ly = Math.min(H - 1, cy * CELL + sy);
              for (let sx = 0; sx < CELL; sx++) {
                const lx = Math.min(W2 - 1, cx * CELL + sx);
                const c = lbuf[ly * W2 + lx];
                const a = c >>> 24;
                if (a > bestA) {
                  bestA = a;
                  best = c;
                }
                if (a > 24) {
                  r += c & 255;
                  g += c >>> 8 & 255;
                  b += c >>> 16 & 255;
                  n++;
                }
              }
            }
            if (n > 0 && bestA > 40) {
              const rr22 = Math.round(r / n);
              const gg = Math.round(g / n);
              const bb = Math.round(b / n);
              const aa = bestA;
              colors[cy * GW + cx] = aa << 24 | bb << 16 | gg << 8 | rr22;
            }
          }
        }
      }
      const owners = new Int32Array(GW * GH).fill(-1);
      const elements = /* @__PURE__ */ new Map();
      const markRect = (el, bx, by, bw, bh, rad) => {
        const cx0 = Math.max(0, Math.floor(bx / CELL));
        const cy0 = Math.max(0, Math.floor(by / CELL));
        const cx1 = Math.min(GW - 1, Math.ceil((bx + bw) / CELL) - 1);
        const cy1 = Math.min(GH - 1, Math.ceil((by + bh) / CELL) - 1);
        const maxr = Math.min(bw, bh) / 2;
        const rtl = Math.min(rad[0], maxr);
        const rtr = Math.min(rad[1], maxr);
        const rbr = Math.min(rad[2], maxr);
        const rbl = Math.min(rad[3], maxr);
        for (let cy = cy0; cy <= cy1; cy++) {
          for (let cx = cx0; cx <= cx1; cx++) {
            const i = cy * GW + cx;
            if (colors[i] === 0) continue;
            const wx = (cx + 0.5) * CELL;
            const wy = (cy + 0.5) * CELL;
            if (rtl > 0 && wx < bx + rtl && wy < by + rtl) {
              if (Math.hypot(wx - (bx + rtl), wy - (by + rtl)) > rtl) continue;
            }
            if (rtr > 0 && wx > bx + bw - rtr && wy < by + rtr) {
              if (Math.hypot(wx - (bx + bw - rtr), wy - (by + rtr)) > rtr) continue;
            }
            if (rbr > 0 && wx > bx + bw - rbr && wy > by + bh - rbr) {
              if (Math.hypot(wx - (bx + bw - rbr), wy - (by + bh - rbr)) > rbr) continue;
            }
            if (rbl > 0 && wx < bx + rbl && wy > by + bh - rbl) {
              if (Math.hypot(wx - (bx + rbl), wy - (by + bh - rbl)) > rbl) continue;
            }
            owners[i] = el.id;
            el.cells.push(i);
          }
        }
        if (el.cells.length < (CELL === 1 ? 8 : 3)) {
          for (const i of el.cells) owners[i] = -1;
          el.cells.length = 0;
        }
      };
      for (const b of boxes) {
        if (b.el) markRect(b.el, b.x, b.y, b.w, b.h, b.radius);
      }
      const maskCv = document.createElement("canvas");
      const maskCtx = maskCv.getContext("2d", { willReadFrequently: true });
      for (const g of glyphs) {
        const mw = Math.max(2, Math.ceil(g.w) + 2);
        const mh = Math.max(2, Math.ceil(g.h) + 2);
        if (maskCv.width < mw || maskCv.height < mh) {
          maskCv.width = Math.max(mw, maskCv.width, 64);
          maskCv.height = Math.max(mh, maskCv.height, 64);
        }
        maskCtx.clearRect(0, 0, maskCv.width, maskCv.height);
        maskCtx.font = g.font;
        maskCtx.textBaseline = "alphabetic";
        maskCtx.fillStyle = "#000";
        maskCtx.fillText(g.ch, 1, 1 + (g.base - g.y));
        const md = maskCtx.getImageData(0, 0, mw, mh).data;
        const gx0 = Math.floor(g.x / CELL);
        const gy0 = Math.floor(g.y / CELL);
        const gCol = packColor(g.color);
        for (let py = 0; py < mh; py += CELL) {
          for (let px = 0; px < mw; px += CELL) {
            if (md[(py * mw + px) * 4 + 3] > 60) {
              const cx = gx0 + Math.floor((px - 1) / CELL);
              const cy = gy0 + Math.floor((py - 1) / CELL);
              if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) continue;
              const i = cy * GW + cx;
              if (colors[i] === 0) colors[i] = gCol;
              if (owners[i] >= 0) {
                const prev = elements.get(owners[i]);
                if (prev && prev !== g.el) {
                  const k = prev.cells.indexOf(i);
                  if (k >= 0) prev.cells.splice(k, 1);
                }
              }
              owners[i] = g.el.id;
              if (!g.el.cells.includes(i)) g.el.cells.push(i);
            }
          }
        }
        const baseCy = Math.floor((g.base - 1) / CELL);
        const cxStart = Math.max(0, Math.floor(g.x / CELL));
        const cxEnd = Math.min(GW - 1, Math.floor((g.x + g.w) / CELL));
        for (let cx = cxStart; cx <= cxEnd; cx++) {
          if (baseCy >= 0 && baseCy < GH) {
            const i = baseCy * GW + cx;
            if (colors[i] === 0) colors[i] = gCol;
            owners[i] = g.el.id;
            if (!g.el.cells.includes(i)) g.el.cells.push(i);
          }
        }
        elements.set(g.el.id, g.el);
      }
      for (const im of images) {
        if (!im.box.image || !im.box.el) continue;
        const b = im.box;
        const iw = Math.max(2, Math.ceil(b.w));
        const ih = Math.max(2, Math.ceil(b.h));
        maskCtx.clearRect(0, 0, Math.max(maskCv.width, iw), Math.max(maskCv.height, ih));
        if (maskCv.width < iw) maskCv.width = iw;
        if (maskCv.height < ih) maskCv.height = ih;
        maskCtx.clearRect(0, 0, maskCv.width, maskCv.height);
        rr2(maskCtx, 0, 0, iw, ih, b.radius);
        maskCtx.clip();
        if (b.image) maskCtx.drawImage(b.image, 0, 0, iw, ih);
        const md = maskCtx.getImageData(0, 0, iw, ih).data;
        const gx0 = Math.floor(b.x / CELL);
        const gy0 = Math.floor(b.y / CELL);
        for (let py = 0; py < ih; py += CELL) {
          for (let px = 0; px < iw; px += CELL) {
            if (md[(py * iw + px) * 4 + 3] > 90) {
              const cx = gx0 + Math.floor(px / CELL);
              const cy = gy0 + Math.floor(py / CELL);
              if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) continue;
              const i = cy * GW + cx;
              if (colors[i] === 0) continue;
              if (owners[i] >= 0 && owners[i] !== b.el.id) {
                const prev = elements.get(owners[i]);
                if (prev && prev.kind !== "box") continue;
                if (prev) {
                  const k = prev.cells.indexOf(i);
                  if (k >= 0) prev.cells.splice(k, 1);
                }
              }
              owners[i] = b.el.id;
              if (!b.el.cells.includes(i)) b.el.cells.push(i);
            }
          }
        }
      }
      for (const b of boxes) {
        if (b.el && b.el.cells.length > 0) elements.set(b.el.id, b.el);
      }
      const bodies = [];
      let bodyId = 0;
      for (const g of glyphs) {
        const mass = Math.max(8, Math.round(g.w * g.h * 0.07));
        const hp = Math.max(15, Math.round(15 + g.w * 0.35));
        const b = {
          id: bodyId++,
          kind: "word",
          x: g.x,
          y: g.y,
          w: g.w,
          h: g.h,
          baseY: g.base,
          vx: 0,
          vy: 0,
          rot: 0,
          vrot: 0,
          mass,
          hp,
          maxHp: hp,
          anchored: true,
          settled: false,
          settleT: 0,
          destroyed: false,
          burning: 0,
          text: g.ch,
          font: g.font,
          color: g.color,
          underline: g.underline,
          tag: g.el.tag,
          semanticRole: g.el.semanticRole,
          href: g.el.href,
          damageDecals: []
        };
        bodies.push(b);
      }
      for (const bx of boxes) {
        if (!bx.el) continue;
        const isImg = bx.image !== null;
        const mass = Math.max(25, Math.round(bx.w * bx.h * 0.03));
        const hp = Math.max(30, Math.round(30 + Math.sqrt(bx.w * bx.h) * 1.2));
        const b = {
          id: bodyId++,
          kind: isImg ? "image" : "box",
          x: bx.x,
          y: bx.y,
          w: bx.w,
          h: bx.h,
          vx: 0,
          vy: 0,
          rot: 0,
          vrot: 0,
          mass,
          hp,
          maxHp: hp,
          anchored: true,
          settled: false,
          settleT: 0,
          destroyed: false,
          burning: 0,
          bg: bx.bg,
          grad: bx.grad,
          radius: bx.radius,
          border: bx.border,
          shadow: bx.shadow,
          image: bx.image,
          imgFit: bx.imgFit,
          tag: bx.el.tag,
          semanticRole: bx.el.semanticRole,
          href: bx.el.href,
          damageDecals: []
        };
        bodies.push(b);
      }
      const title = idoc.title || baseUrl;
      cleanup();
      return { W: W2, H, bodies, colors, owners, elements, title, backdropCanvas: backdropCv };
    } catch (e) {
      cleanup();
      throw e;
    }
  }

  // src/lib/game/backgrounds.ts
  function cv(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  function makeCitiesLayer(w, h, layer) {
    const c = cv(w, h);
    const ctx = c.getContext("2d");
    const P = ["#241a3d", "#1a1230", "#16102a", "#2a1f4a", "#120d22"];
    const win = ["#ffd23d", "#7ff3ff", "#ff3d8b", "#f97316"];
    if (layer === 0) {
      ctx.fillStyle = P[3];
      let x = 0;
      while (x < w) {
        const bw = 30 + Math.random() * 70;
        const bh = 40 + Math.random() * 90;
        ctx.fillRect(x, h - bh, bw, bh);
        if (Math.random() < 0.3) ctx.fillRect(x + bw / 2, h - bh - 14, 2, 14);
        ctx.fillStyle = Math.random() < 0.5 ? win[0] : win[1];
        for (let k = 0; k < 4; k++) {
          if (Math.random() < 0.5) ctx.fillRect(x + 4 + Math.random() * (bw - 8), h - bh + 6 + Math.random() * (bh - 12), 2, 3);
        }
        ctx.fillStyle = P[3];
        x += bw + 2 + Math.random() * 10;
      }
    } else if (layer === 1) {
      const bw0 = 46;
      let x = -10;
      while (x < w) {
        const bw = bw0 + Math.floor(Math.random() * 3) * 14;
        const bh = 90 + Math.random() * 190;
        const yy = h - bh;
        ctx.fillStyle = Math.random() < 0.5 ? P[0] : P[1];
        ctx.fillRect(x, yy, bw, bh);
        ctx.fillStyle = P[4];
        ctx.fillRect(x, yy, 3, bh);
        for (let wy = yy + 8; wy < h - 8; wy += 10) {
          for (let wx = x + 5; wx < x + bw - 5; wx += 8) {
            if (Math.random() < 0.42) {
              ctx.fillStyle = win[Math.random() * win.length | 0];
              ctx.globalAlpha = 0.5 + Math.random() * 0.5;
              ctx.fillRect(wx, wy, 4, 5);
              ctx.globalAlpha = 1;
            }
          }
        }
        if (Math.random() < 0.4) {
          ctx.fillStyle = P[4];
          ctx.fillRect(x + bw * 0.3, yy - 10, 6, 10);
          ctx.fillStyle = "#ff3d8b";
          ctx.fillRect(x + bw * 0.3 + 2, yy - 12, 2, 2);
        }
        x += bw + 4;
      }
    } else {
      let x = -20;
      while (x < w) {
        const bw = 80 + Math.random() * 120;
        const bh = 40 + Math.random() * 120;
        const yy = h - bh;
        ctx.fillStyle = P[2];
        ctx.fillRect(x, yy, bw, bh);
        ctx.fillStyle = "#2a1f4a";
        ctx.fillRect(x, yy, bw, 4);
        ctx.fillStyle = "#ff3d8b";
        ctx.globalAlpha = 0.75;
        ctx.fillRect(x, yy + 4, bw, 2);
        ctx.globalAlpha = 1;
        if (Math.random() < 0.5) {
          ctx.fillStyle = P[4];
          ctx.fillRect(x + 10, yy - 12, 14, 12);
        }
        x += bw + 6;
      }
    }
    return c;
  }
  function buildCities(viewW, viewH) {
    const sky = cv(viewW, viewH);
    const sctx = sky.getContext("2d");
    const g = sctx.createLinearGradient(0, 0, 0, viewH);
    g.addColorStop(0, "#1a0f33");
    g.addColorStop(0.45, "#3d1d52");
    g.addColorStop(0.72, "#8a2f52");
    g.addColorStop(0.88, "#e0633e");
    g.addColorStop(1, "#f9a03f");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, viewW, viewH);
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * viewW;
      const y = Math.random() * viewH * 0.55;
      sctx.fillStyle = Math.random() < 0.3 ? "#ffd23d" : "#ffffff";
      sctx.globalAlpha = 0.3 + Math.random() * 0.7;
      sctx.fillRect(x, y, 2, 2);
      sctx.globalAlpha = 1;
    }
    const sx = viewW * 0.5;
    const sy = viewH * 0.62;
    const R = Math.min(viewW, viewH) * 0.16;
    const sg = sctx.createLinearGradient(0, sy - R, 0, sy + R);
    sg.addColorStop(0, "#ffe26b");
    sg.addColorStop(0.5, "#ff8a2a");
    sg.addColorStop(1, "#ff3d8b");
    sctx.save();
    sctx.beginPath();
    sctx.arc(sx, sy, R, 0, Math.PI * 2);
    sctx.clip();
    sctx.fillStyle = sg;
    sctx.fillRect(sx - R, sy - R, R * 2, R * 2);
    sctx.fillStyle = "rgba(26,15,51,0.55)";
    for (let yy = sy; yy < sy + R; yy += 7) {
      sctx.fillRect(sx - R, yy, R * 2, 2 + (yy - sy) / (R / 3));
    }
    sctx.restore();
    return {
      id: "cities",
      name: "\u0645\u062F\u0646 \u0627\u0644\u063A\u0631\u0648\u0628",
      sky: (ctx, w, h) => {
        ctx.drawImage(sky, 0, 0, w, h);
      },
      layers: [
        { canvas: makeCitiesLayer(Math.max(1600, viewW * 1.4), viewH, 0), factor: 0.06, repeat: true, yOffset: 0 },
        { canvas: makeCitiesLayer(Math.max(1900, viewW * 1.6), viewH, 1), factor: 0.16, repeat: true, yOffset: 0 },
        { canvas: makeCitiesLayer(Math.max(2200, viewW * 1.8), viewH, 2), factor: 0.32, repeat: true, yOffset: 0 }
      ]
    };
  }
  function buildMountain(viewW, viewH) {
    const sky = cv(viewW, viewH);
    const sctx = sky.getContext("2d");
    const g = sctx.createLinearGradient(0, 0, 0, viewH);
    g.addColorStop(0, "#2a2440");
    g.addColorStop(0.5, "#5b3a5e");
    g.addColorStop(0.78, "#c96a4a");
    g.addColorStop(1, "#e8a05c");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, viewW, viewH);
    sctx.fillStyle = "#ffd23d";
    sctx.beginPath();
    sctx.arc(viewW * 0.68, viewH * 0.6, Math.min(viewW, viewH) * 0.09, 0, Math.PI * 2);
    sctx.fill();
    for (let i = 0; i < 60; i++) {
      sctx.fillStyle = "#ffffff";
      sctx.globalAlpha = 0.25 + Math.random() * 0.5;
      sctx.fillRect(Math.random() * viewW, Math.random() * viewH * 0.5, 2, 2);
      sctx.globalAlpha = 1;
    }
    const mkRidge = (w, h, color, amp, base, snow) => {
      const c = cv(w, h);
      const ctx = c.getContext("2d");
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, h);
      let x = 0;
      let up = true;
      const peaks = [];
      while (x < w) {
        const px = x + 120 + Math.random() * 180;
        const py = h - base - Math.random() * amp;
        peaks.push({ x: px, y: py });
        ctx.lineTo(px, py);
        x = px;
        up = !up;
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      if (snow) {
        for (const p of peaks) {
          ctx.fillStyle = "#ededed";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 16, p.y + 22);
          ctx.lineTo(p.x - 8, p.y + 18);
          ctx.lineTo(p.x, p.y + 26);
          ctx.lineTo(p.x + 8, p.y + 18);
          ctx.lineTo(p.x + 16, p.y + 22);
          ctx.closePath();
          ctx.fill();
        }
      }
      return c;
    };
    const mkTrees = (w, h, color, count, minH) => {
      const c = cv(w, h);
      const ctx = c.getContext("2d");
      ctx.fillStyle = color;
      for (let i = 0; i < count; i++) {
        const x = Math.random() * w;
        const th = minH + Math.random() * minH;
        const base = h - 6 - Math.random() * 10;
        ctx.beginPath();
        ctx.moveTo(x, base - th);
        ctx.lineTo(x - th * 0.3, base);
        ctx.lineTo(x + th * 0.3, base);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(x - 1.5, base - 4, 3, 6);
      }
      return c;
    };
    return {
      id: "mountain",
      name: "\u062C\u0628\u0644 \u0627\u0644\u0634\u0641\u0642",
      sky: (ctx, w, h) => ctx.drawImage(sky, 0, 0, w, h),
      layers: [
        { canvas: mkRidge(Math.max(1700, viewW * 1.4), viewH, "#4a3a6b", 140, 130, true), factor: 0.05, repeat: true, yOffset: 0 },
        { canvas: mkRidge(Math.max(1900, viewW * 1.6), viewH, "#37294f", 170, 70, false), factor: 0.12, repeat: true, yOffset: 0 },
        { canvas: mkRidge(Math.max(2200, viewW * 1.8), viewH, "#241a38", 120, 30, false), factor: 0.24, repeat: true, yOffset: 0 },
        { canvas: mkTrees(Math.max(2200, viewW * 1.8), viewH, "#160f26", 70, 44), factor: 0.38, repeat: true, yOffset: 0 }
      ]
    };
  }
  function buildSunny(viewW, viewH) {
    const sky = cv(viewW, viewH);
    const sctx = sky.getContext("2d");
    const g = sctx.createLinearGradient(0, 0, 0, viewH);
    g.addColorStop(0, "#7fd4ff");
    g.addColorStop(0.7, "#b8ecff");
    g.addColorStop(1, "#e8fbff");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, viewW, viewH);
    sctx.fillStyle = "#fff3a6";
    sctx.beginPath();
    sctx.arc(viewW * 0.16, viewH * 0.16, Math.min(viewW, viewH) * 0.07, 0, Math.PI * 2);
    sctx.fill();
    const cloud = (x, y, s) => {
      sctx.fillStyle = "#ffffff";
      sctx.fillRect(x, y, 34 * s, 10 * s);
      sctx.fillRect(x + 6 * s, y - 6 * s, 20 * s, 8 * s);
      sctx.fillRect(x + 10 * s, y - 11 * s, 12 * s, 7 * s);
    };
    for (let i = 0; i < 8; i++) cloud(Math.random() * viewW, viewH * 0.08 + Math.random() * viewH * 0.3, 0.8 + Math.random() * 1.4);
    const mkHills = (w, h, color, amp, base, deco) => {
      const c = cv(w, h);
      const ctx = c.getContext("2d");
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, h);
      let x = 0;
      while (x < w) {
        const cw = 90 + Math.random() * 160;
        const cy = h - base - Math.random() * amp;
        ctx.quadraticCurveTo(x + cw / 2, cy, x + cw, cy + Math.random() * amp * 0.3);
        x += cw;
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      if (deco) {
        for (let i = 0; i < 10; i++) deco(ctx, Math.random() * w, h - base - Math.random() * amp * 0.5);
      }
      return c;
    };
    const tree = (ctx, x, y) => {
      ctx.fillStyle = "#5b4023";
      ctx.fillRect(x, y - 14, 4, 14);
      ctx.fillStyle = "#2f7a3a";
      ctx.fillRect(x - 8, y - 26, 20, 12);
      ctx.fillRect(x - 5, y - 32, 14, 8);
    };
    return {
      id: "sunny",
      name: "\u0623\u0631\u0636 \u0627\u0644\u0634\u0645\u0633",
      sky: (ctx, w, h) => ctx.drawImage(sky, 0, 0, w, h),
      layers: [
        { canvas: mkHills(Math.max(1700, viewW * 1.4), viewH, "#9fd98f", 90, 150), factor: 0.05, repeat: true, yOffset: 0 },
        { canvas: mkHills(Math.max(2e3, viewW * 1.7), viewH, "#5cb85c", 70, 90, tree), factor: 0.14, repeat: true, yOffset: 0 },
        { canvas: mkHills(Math.max(2300, viewW * 1.9), viewH, "#2f7a3a", 50, 40), factor: 0.3, repeat: true, yOffset: 0 }
      ]
    };
  }
  function buildBackgrounds(viewW, viewH, which) {
    const theme = which === "mountain" ? buildMountain(viewW, viewH) : which === "sunny" ? buildSunny(viewW, viewH) : buildCities(viewW, viewH);
    const draw = (ctx, camX, camY, vw, vh, worldH) => {
      theme.sky(ctx, vw, vh);
      for (const layer of theme.layers) {
        const lw = layer.canvas.width;
        const lx = (-camX * layer.factor % lw + lw) % lw;
        const ly = worldH - vh - camY * (layer.factor * 0.55) - (worldH - vh) * 0;
        if (layer.repeat) {
          for (let x = -lx; x < vw; x += lw) {
            ctx.drawImage(layer.canvas, x, ly - (worldH - vh) * 0, lw, vh);
          }
        } else {
          ctx.drawImage(layer.canvas, -camX * layer.factor, ly, lw, vh);
        }
      }
    };
    return { ...theme, draw };
  }

  // src/lib/game/sound.ts
  var SoundEngine = class {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.busFx = null;
      this.busBoom = null;
      this.busUi = null;
      this.noiseBuf = null;
      this.loops = /* @__PURE__ */ new Map();
      this.muted = false;
    }
    ensure() {
      if (this.ctx) {
        if (this.ctx.state === "suspended") void this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC({ latencyHint: "interactive" });
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -10;
      comp.knee.value = 8;
      comp.ratio.value = 4;
      comp.attack.value = 3e-3;
      comp.release.value = 0.2;
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.85;
      comp.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.busFx = this.ctx.createGain();
      this.busBoom = this.ctx.createGain();
      this.busUi = this.ctx.createGain();
      this.busFx.connect(comp);
      this.busBoom.connect(comp);
      this.busUi.connect(comp);
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    setMuted(m) {
      this.muted = m;
      if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.85, this.ctx.currentTime, 0.03);
    }
    noise(dur) {
      if (!this.ctx || !this.noiseBuf) return null;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      src.start(this.ctx.currentTime, Math.random() * 1.5, dur + 0.05);
      return src;
    }
    env(gain, t0, a, peak, d) {
      gain.gain.setValueAtTime(1e-4, t0);
      gain.gain.linearRampToValueAtTime(peak, t0 + a);
      gain.gain.exponentialRampToValueAtTime(1e-4, t0 + a + d);
    }
    out(bus, pan) {
      if (!this.ctx) return null;
      const b = bus === "boom" ? this.busBoom : bus === "ui" ? this.busUi : this.busFx;
      if (!b) return null;
      if (this.ctx.createStereoPanner) {
        const p = this.ctx.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        p.connect(b);
        return p;
      }
      return b;
    }
    // gunshot-ish: noise burst through lowpass + tiny click
    shot(kind, vol = 1, pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("fx", pan);
      if (!o) return;
      const dur = kind === "shotgun" ? 0.28 : kind === "pistol" ? 0.14 : 0.09;
      const n = this.noise(dur);
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      const base = kind === "shotgun" ? 1400 : kind === "pistol" ? 2e3 : 2600;
      f.frequency.setValueAtTime(base, t);
      f.frequency.exponentialRampToValueAtTime(base * 0.25, t + dur);
      const g = ctx.createGain();
      this.env(g, t, 2e-3, (kind === "shotgun" ? 0.55 : 0.3) * vol, dur);
      n?.connect(f);
      f.connect(g);
      g.connect(o);
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(kind === "shotgun" ? 320 : 700, t);
      const g2 = ctx.createGain();
      this.env(g2, t, 1e-3, 0.12 * vol, 0.03);
      osc.connect(g2);
      g2.connect(o);
      osc.start(t);
      osc.stop(t + 0.05);
      if (kind === "shotgun") {
        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(110, t);
        osc2.frequency.exponentialRampToValueAtTime(45, t + 0.25);
        const g3 = ctx.createGain();
        this.env(g3, t, 4e-3, 0.5 * vol, 0.25);
        osc2.connect(g3);
        g3.connect(this.out("boom", pan) ?? o);
        osc2.start(t);
        osc2.stop(t + 0.3);
      }
    }
    boom(power = 1, pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("boom", pan);
      if (!o) return;
      const dur = 0.7 * power;
      const n = this.noise(dur);
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(3e3, t);
      f.frequency.exponentialRampToValueAtTime(120, t + dur);
      const g = ctx.createGain();
      this.env(g, t, 5e-3, 0.9 * power, dur);
      n?.connect(f);
      f.connect(g);
      g.connect(o);
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(160 * power, t);
      sub.frequency.exponentialRampToValueAtTime(30, t + dur * 0.9);
      const g2 = ctx.createGain();
      this.env(g2, t, 5e-3, 0.8 * power, dur * 0.9);
      sub.connect(g2);
      g2.connect(o);
      sub.start(t);
      sub.stop(t + dur);
    }
    rail(pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("boom", pan);
      if (!o) return;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(3800, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.3);
      const g = ctx.createGain();
      this.env(g, t, 3e-3, 0.5, 0.3);
      osc.connect(g);
      g.connect(o);
      osc.start(t);
      osc.stop(t + 0.35);
      const n = this.noise(0.25);
      const f = ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = 1200;
      const g2 = ctx.createGain();
      this.env(g2, t, 2e-3, 0.4, 0.25);
      n?.connect(f);
      f.connect(g2);
      g2.connect(o);
    }
    railCharge(pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("fx", pan);
      if (!o) return;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(1500, t + 0.5);
      const g = ctx.createGain();
      this.env(g, t, 0.1, 0.18, 0.45);
      osc.connect(g);
      g.connect(o);
      osc.start(t);
      osc.stop(t + 0.6);
    }
    whoosh(pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("fx", pan);
      if (!o) return;
      const n = this.noise(0.5);
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(400, t);
      f.frequency.exponentialRampToValueAtTime(2400, t + 0.4);
      f.Q.value = 1.2;
      const g = ctx.createGain();
      this.env(g, t, 0.03, 0.4, 0.45);
      n?.connect(f);
      f.connect(g);
      g.connect(o);
    }
    flameBurst(vol = 1, pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("fx", pan);
      if (!o) return;
      const n = this.noise(0.22);
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 900 + Math.random() * 700;
      f.Q.value = 0.7;
      const g = ctx.createGain();
      this.env(g, t, 0.02, 0.16 * vol, 0.2);
      n?.connect(f);
      f.connect(g);
      g.connect(o);
    }
    hit(kind, vol = 1, pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("fx", pan);
      if (!o) return;
      const n = this.noise(0.08);
      const f = ctx.createBiquadFilter();
      f.type = kind === "paper" ? "highpass" : kind === "image" ? "bandpass" : "lowpass";
      f.frequency.value = kind === "paper" ? 2500 : kind === "image" ? 1800 : 700;
      const g = ctx.createGain();
      this.env(g, t, 1e-3, (kind === "block" ? 0.22 : 0.14) * vol, 0.07);
      n?.connect(f);
      f.connect(g);
      g.connect(o);
    }
    pop(pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("fx", pan);
      if (!o) return;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600 + Math.random() * 500, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);
      const g = ctx.createGain();
      this.env(g, t, 2e-3, 0.2, 0.08);
      osc.connect(g);
      g.connect(o);
      osc.start(t);
      osc.stop(t + 0.1);
    }
    chutePop(pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("fx", pan);
      if (!o) return;
      const n = this.noise(0.15);
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(600, t);
      f.frequency.exponentialRampToValueAtTime(1600, t + 0.12);
      const g = ctx.createGain();
      this.env(g, t, 4e-3, 0.3, 0.14);
      n?.connect(f);
      f.connect(g);
      g.connect(o);
    }
    split(pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("fx", pan);
      if (!o) return;
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(900, t);
      osc.frequency.exponentialRampToValueAtTime(2400, t + 0.15);
      const g = ctx.createGain();
      this.env(g, t, 5e-3, 0.25, 0.15);
      osc.connect(g);
      g.connect(o);
      osc.start(t);
      osc.stop(t + 0.2);
    }
    jet(pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("fx", pan);
      if (!o) return;
      const n = this.noise(0.3);
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 800;
      const g = ctx.createGain();
      this.env(g, t, 0.03, 0.1, 0.26);
      n?.connect(f);
      f.connect(g);
      g.connect(o);
    }
    // Magical arpeggio for the wand
    wandCast(pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("boom", pan);
      if (!o) return;
      const notes = [523, 659, 784, 1046, 1318];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        const t0 = t + i * 0.08;
        g.gain.setValueAtTime(1e-4, t0);
        g.gain.linearRampToValueAtTime(0.16, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(1e-4, t0 + 0.5);
        osc.connect(g);
        g.connect(o);
        osc.start(t0);
        osc.stop(t0 + 0.55);
      });
    }
    wandBlast(power = 1, pan = 0) {
      this.boom(1.2 * power, pan);
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("boom", pan);
      if (!o) return;
      [1318, 1568, 2093].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(1e-4, t);
        g.gain.linearRampToValueAtTime(0.12, t + 0.02 + i * 0.04);
        g.gain.exponentialRampToValueAtTime(1e-4, t + 0.8);
        osc.connect(g);
        g.connect(o);
        osc.start(t);
        osc.stop(t + 0.85);
      });
    }
    starHum(pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("boom", pan);
      if (!o) return;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(60, t);
      osc.frequency.linearRampToValueAtTime(52, t + 2.5);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 6.5;
      const lg = ctx.createGain();
      lg.gain.value = 8;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(1e-4, t);
      g.gain.linearRampToValueAtTime(0.4, t + 0.3);
      g.gain.setValueAtTime(0.4, t + 2.2);
      g.gain.exponentialRampToValueAtTime(1e-4, t + 2.8);
      osc.connect(g);
      g.connect(o);
      osc.start(t);
      osc.stop(t + 2.9);
      lfo.start(t);
      lfo.stop(t + 2.9);
    }
    droneBeep(pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("ui", pan);
      if (!o) return;
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = 1200;
      const g = ctx.createGain();
      this.env(g, t, 5e-3, 0.08, 0.09);
      osc.connect(g);
      g.connect(o);
      osc.start(t);
      osc.stop(t + 0.1);
    }
    switch(pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("ui", pan);
      if (!o) return;
      const n = this.noise(0.05);
      const f = ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = 1800;
      const g = ctx.createGain();
      this.env(g, t, 1e-3, 0.15, 0.05);
      n?.connect(f);
      f.connect(g);
      g.connect(o);
    }
    click() {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("ui", 0);
      if (!o) return;
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = 880;
      const g = ctx.createGain();
      this.env(g, t, 1e-3, 0.08, 0.04);
      osc.connect(g);
      g.connect(o);
      osc.start(t);
      osc.stop(t + 0.06);
    }
    start() {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("ui", 0);
      if (!o) return;
      [392, 523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        const t0 = t + i * 0.09;
        g.gain.setValueAtTime(1e-4, t0);
        g.gain.linearRampToValueAtTime(0.14, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(1e-4, t0 + 0.4);
        osc.connect(g);
        g.connect(o);
        osc.start(t0);
        osc.stop(t0 + 0.45);
      });
    }
    complete() {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("ui", 0);
      if (!o) return;
      [523, 659, 784, 1046, 784, 1046, 1318].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        const t0 = t + i * 0.13;
        g.gain.setValueAtTime(1e-4, t0);
        g.gain.linearRampToValueAtTime(0.16, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(1e-4, t0 + 0.6);
        osc.connect(g);
        g.connect(o);
        osc.start(t0);
        osc.stop(t0 + 0.65);
      });
    }
    jump(pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("fx", pan);
      if (!o) return;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(650, t + 0.12);
      const g = ctx.createGain();
      this.env(g, t, 4e-3, 0.12, 0.12);
      osc.connect(g);
      g.connect(o);
      osc.start(t);
      osc.stop(t + 0.15);
    }
    // Mid-air flip double-jump sound: rising sine whoosh with chirp
    flip(pan = 0) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("fx", pan);
      if (!o) return;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(1100, t + 0.16);
      const g = ctx.createGain();
      this.env(g, t, 3e-3, 0.15, 0.16);
      osc.connect(g);
      g.connect(o);
      osc.start(t);
      osc.stop(t + 0.18);
      const n = this.noise(0.14);
      if (n) {
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.setValueAtTime(1200, t);
        f.Q.value = 2;
        const ng = ctx.createGain();
        this.env(ng, t, 5e-3, 0.1, 0.14);
        n.connect(f);
        f.connect(ng);
        ng.connect(o);
      }
    }
    // Milestone announcement sound (e.g. 25%, 50%, 75%, 100% destroyed)
    milestone() {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("ui", 0);
      if (!o) return;
      const notes = [587.33, 739.99, 880, 1174.66];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        const t0 = t + idx * 0.07;
        g.gain.setValueAtTime(1e-4, t0);
        g.gain.linearRampToValueAtTime(0.12, t0 + 0.015);
        g.gain.exponentialRampToValueAtTime(1e-4, t0 + 0.35);
        osc.connect(g);
        g.connect(o);
        osc.start(t0);
        osc.stop(t0 + 0.38);
      });
    }
    // UI feedback chirp for Game Lab adjustments
    labBeep(pitchHigh = false) {
      this.ensure();
      const ctx = this.ctx;
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = this.out("ui", 0);
      if (!o) return;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(pitchHigh ? 880 : 540, t);
      osc.frequency.exponentialRampToValueAtTime(pitchHigh ? 1320 : 720, t + 0.06);
      const g = ctx.createGain();
      this.env(g, t, 2e-3, 0.09, 0.06);
      osc.connect(g);
      g.connect(o);
      osc.start(t);
      osc.stop(t + 0.08);
    }
    land(pan = 0) {
      this.hit("block", 0.7, pan);
    }
  };
  var sound = new SoundEngine();

  // src/lib/game/player.ts
  var PLAYER_DIMS = {
    width: 14,
    height: 46
  };
  var PHYS = {
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
    jumpBuffer: DEFAULT_PHYSICS.jumpBuffer
  };
  var Player = class {
    constructor(x, y) {
      // feet center position in world pixels
      this.vx = 0;
      this.vy = 0;
      this.grounded = false;
      this.facing = 1;
      this.aim = 0;
      this.coyote = 0;
      this.buffer = 0;
      this.jumpHeld = false;
      this.flipT = -1;
      this.flips = 1;
      this.dropT = 0;
      this.jetOn = false;
      this.jetK = 0;
      this.jetSoundT = 0;
      this.runPhase = 0;
      this.skidT = 0;
      this.tumble = 0;
      this.tumbleV = 0;
      this.spawnProtect = 0;
      this.weaponIdx = 0;
      this.cooldown = 0;
      this.switchT = 1;
      this.kickRot = 0;
      this.kickRotV = 0;
      this.shots = 0;
      this.flashT = 0;
      this.bloomT = 0;
      this.chargeT = 0;
      this.grenadeCd = 0;
      this.throwT = -1;
      this.x = x;
      this.y = y;
    }
    get phys() {
      return ConfigManager.get().getConfig().physics;
    }
    center() {
      return { x: this.x, y: this.y - PLAYER_DIMS.height / 2 };
    }
    respawnAt(x, y) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.tumble = 0;
      this.tumbleV = 0;
      this.spawnProtect = 1;
      this.flips = 1;
      this.grounded = false;
    }
    // --- Collision Helpers ---
    solidAt(world, px, py) {
      return world.solidAtWorld(px, py);
    }
    isGroundedAt(world, py) {
      const feetOffsets = [-5, 0, 5];
      for (const dx of feetOffsets) {
        if (this.solidAt(world, this.x + dx, py + 1)) return true;
      }
      return false;
    }
    headSolidAt(world, py) {
      const headY = py - PLAYER_DIMS.height - 1;
      return this.solidAt(world, this.x, headY) || this.solidAt(world, this.x + 5, headY) || this.solidAt(world, this.x - 5, headY);
    }
    sideSolidAt(world, dir, px, py, stepUpIgnored = 0) {
      const edgeX = px + dir * (PLAYER_DIMS.width / 2 + 1);
      const startY = Math.max(stepUpIgnored + 1, 3);
      for (let dy = startY; dy <= PLAYER_DIMS.height - 4; dy += 6) {
        if (this.solidAt(world, edgeX, py - dy)) return true;
      }
      return false;
    }
    step(world, input, dt) {
      const phys = this.phys;
      if (this.dropT > 0) this.dropT -= dt;
      if (this.spawnProtect > 0) this.spawnProtect -= dt;
      const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const c = this.center();
      const aimDx = input.aimX - c.x;
      const aimDy = input.aimY - c.y;
      if (Math.abs(aimDx) > 2 || Math.abs(aimDy) > 2) {
        this.aim = Math.atan2(aimDy, aimDx);
        if (Math.abs(aimDx) > 5) {
          this.facing = aimDx >= 0 ? 1 : -1;
        }
      }
      const accel = this.grounded ? phys.groundAccel : phys.airAccel;
      const targetSpeed = dir * (this.grounded ? phys.runSpeed : phys.airSpeed);
      if (dir !== 0) {
        const sameDir = Math.sign(this.vx) === dir || this.vx === 0;
        if (sameDir) {
          this.vx += dir * accel * dt;
          if (Math.abs(this.vx) > Math.abs(targetSpeed)) {
            this.vx = targetSpeed;
          }
        } else {
          const turnFriction = this.grounded ? phys.friction * 1.5 : phys.friction * 0.8;
          this.vx += dir * (accel + turnFriction) * dt;
          this.skidT = 0.12;
          if (this.grounded && Math.random() < 0.4) {
            world.spawnParticle({
              x: this.x + (Math.random() - 0.5) * 8,
              y: this.y,
              vx: -dir * (60 + Math.random() * 80),
              vy: -20 - Math.random() * 30,
              life: 0.25,
              max: 0.25,
              kind: "smoke",
              color: "#94a3b8",
              size: 2.5
            });
          }
        }
      } else {
        const f = (this.grounded ? phys.friction : 320) * dt;
        if (Math.abs(this.vx) <= f) this.vx = 0;
        else this.vx -= Math.sign(this.vx) * f;
      }
      if (this.skidT > 0) this.skidT -= dt;
      if (input.jumpPressed) {
        this.buffer = phys.jumpBuffer;
      } else {
        this.buffer = Math.max(0, this.buffer - dt);
      }
      this.coyote = this.grounded ? phys.coyoteTime : Math.max(0, this.coyote - dt);
      if (input.down && this.grounded && this.dropT <= 0) {
        const belowCy = Math.floor((this.y + 3) / CELL);
        if (belowCy < world.GH - 4) {
          this.dropT = 0.25;
          this.grounded = false;
          this.vy = Math.max(this.vy, 160);
          this.y += 3;
        }
      }
      if (this.buffer > 0 && this.coyote > 0 && this.dropT <= 0) {
        this.vy = -phys.jumpVel;
        this.grounded = false;
        this.coyote = 0;
        this.buffer = 0;
        this.flips = 1;
        this.flipT = -1;
        sound.jump(0);
        for (let i = 0; i < 4; i++) {
          world.spawnParticle({
            x: this.x + (Math.random() - 0.5) * 12,
            y: this.y,
            vx: (Math.random() - 0.5) * 120,
            vy: -30 - Math.random() * 40,
            life: 0.25,
            max: 0.25,
            kind: "smoke",
            color: "#cbd5e1",
            size: 2.5
          });
        }
      } else if (input.jumpPressed && !this.grounded && this.flips > 0 && this.flipT < 0 && this.dropT <= 0) {
        this.vy = -phys.flipVel;
        this.flips--;
        this.flipT = 1e-3;
        this.buffer = 0;
        sound.flip(0);
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          world.spawnParticle({
            x: this.x + Math.cos(a) * 8,
            y: this.y - PLAYER_DIMS.height / 2 + Math.sin(a) * 8,
            vx: Math.cos(a) * 140,
            vy: Math.sin(a) * 140,
            life: 0.25,
            max: 0.25,
            kind: "spark",
            color: "#38bdf8",
            size: 3
          });
        }
      }
      if (!input.jump && this.vy < -200) {
        this.vy += phys.gravity * (1 - phys.variableJumpCut) * 2.2 * dt;
      }
      const jetAllowed = input.jump && !this.grounded && this.buffer <= 0 && this.coyote <= 0 && this.dropT <= 0;
      if (jetAllowed) {
        this.jetOn = true;
        this.jetK = Math.min(1, this.jetK + dt * 6);
        this.vy -= phys.jetThrust * dt;
        if (this.vy < -phys.jetMaxRise) {
          this.vy = -phys.jetMaxRise;
        }
        const thrusterColor = ConfigManager.get().getConfig().character.thrusterColor || "#ffd23d";
        if (Math.random() < 0.7) {
          world.spawnParticle({
            x: this.x - this.facing * 5 + (Math.random() - 0.5) * 4,
            y: this.y - 20,
            vx: (Math.random() - 0.5) * 50 - this.vx * 0.15,
            vy: 180 + Math.random() * 160,
            life: 0.2 + Math.random() * 0.2,
            max: 0.4,
            kind: "spark",
            color: thrusterColor,
            size: 3
          });
        }
        if (Math.random() < 0.3) {
          world.spawnParticle({
            x: this.x - this.facing * 5,
            y: this.y - 18,
            vx: (Math.random() - 0.5) * 30,
            vy: 80,
            life: 0.5,
            max: 0.5,
            kind: "smoke",
            color: "#64748b",
            size: 3
          });
        }
        this.jetSoundT -= dt;
        if (this.jetSoundT <= 0) {
          sound.jet(0);
          this.jetSoundT = 0.14;
        }
      } else {
        this.jetOn = false;
        this.jetK = Math.max(0, this.jetK - dt * 5);
      }
      if (this.flipT >= 0) {
        this.flipT += dt / 0.34;
        if (this.flipT >= 1) this.flipT = -1;
      }
      if (!this.grounded) {
        this.vy += phys.gravity * dt;
        const maxFall = 960;
        if (this.vy > maxFall) this.vy = maxFall;
      }
      const oldGrounded = this.grounded;
      this.y += this.vy * dt;
      if (this.vy >= 0) {
        if (this.dropT <= 0 && this.isGroundedAt(world, this.y)) {
          let maxStep = 12;
          while (this.isGroundedAt(world, this.y - 1) && maxStep > 0 && this.y > 0) {
            this.y -= 1;
            maxStep--;
          }
          if (this.vy > 420 && !oldGrounded) {
            sound.land(0);
            for (let i = 0; i < 4; i++) {
              world.spawnParticle({
                x: this.x + (Math.random() - 0.5) * 16,
                y: this.y,
                vx: (Math.random() - 0.5) * 140,
                vy: -30 - Math.random() * 50,
                life: 0.28,
                max: 0.28,
                kind: "smoke",
                color: "#94a3b8",
                size: 2.5
              });
            }
          }
          this.vy = 0;
          this.grounded = true;
          this.flips = 1;
          this.jetOn = false;
        } else {
          this.grounded = false;
        }
      } else {
        this.grounded = false;
        const headY = this.y - PLAYER_DIMS.height - 1;
        const hitCenter = this.solidAt(world, this.x, headY);
        const hitLeft = this.solidAt(world, this.x - 5, headY);
        const hitRight = this.solidAt(world, this.x + 5, headY);
        if (hitCenter || hitLeft || hitRight) {
          if (phys.cornerNudge) {
            if (!hitCenter && hitLeft && !hitRight) {
              this.x += 3;
            } else if (!hitCenter && hitRight && !hitLeft) {
              this.x -= 3;
            } else {
              this.vy = 30;
              if (world.solidAtWorld(this.x, headY - 2)) {
                world.damageCircle(this.x, headY - 2, 5, { debris: true, countAsDestroy: true });
              }
            }
          } else {
            this.vy = 30;
          }
        }
      }
      if (this.vx !== 0) {
        const moveDx = this.vx * dt;
        const moveDir = Math.sign(this.vx);
        const stepLimit = this.grounded ? phys.autoStepHeight : 2;
        const blocked = this.sideSolidAt(world, moveDir, this.x + moveDx, this.y, 0);
        if (!blocked) {
          this.x += moveDx;
        } else {
          let stepped = false;
          for (let s = 1; s <= stepLimit; s++) {
            const testY = this.y - s;
            if (!this.sideSolidAt(world, moveDir, this.x + moveDx, testY, 0) && !this.headSolidAt(world, testY)) {
              this.y = testY;
              this.x += moveDx;
              stepped = true;
              break;
            }
          }
          if (!stepped) {
            this.vx = 0;
          }
        }
      }
      this.x = Math.max(PLAYER_DIMS.width / 2 + 2, Math.min(world.W - PLAYER_DIMS.width / 2 - 2, this.x));
      if (this.y - PLAYER_DIMS.height < 2) {
        this.y = PLAYER_DIMS.height + 2;
        if (this.vy < 0) this.vy = 0;
      }
      if (this.y > world.H - 6) {
        this.y = world.H - 4;
        this.vy = 0;
        this.grounded = true;
      }
      if (this.grounded && dir !== 0) {
        this.runPhase = (this.runPhase + dt * (Math.abs(this.vx) / 85 + 0.45)) % 1;
      } else if (!dir) {
        this.runPhase = 0;
      }
      if (this.tumbleV !== 0) {
        this.tumble += this.tumbleV * dt;
        this.tumbleV *= 1 - 2.5 * dt;
        if (Math.abs(this.tumbleV) < 0.05) {
          this.tumbleV = 0;
          this.tumble = 0;
        }
      }
      this.kickRotV += -this.kickRot * 140 * dt;
      this.kickRotV *= 1 - 10 * dt;
      this.kickRot += this.kickRotV * dt;
      if (this.cooldown > 0) this.cooldown -= dt;
      if (this.grenadeCd > 0) this.grenadeCd -= dt;
      if (this.switchT < 1) this.switchT += dt * 5;
      if (this.flashT > 0) this.flashT -= dt;
      if (this.bloomT > 0) this.bloomT -= dt;
      if (this.chargeT > 0) this.chargeT -= dt;
    }
    impulse(ix, iy) {
      this.vx += ix;
      this.vy += iy;
      if (iy < -100) {
        this.grounded = false;
        this.coyote = 0;
      }
      const k = Math.hypot(ix, iy);
      if (k > 480) {
        this.tumbleV += (ix >= 0 ? 1 : -1) * Math.min(16, k / 65);
      }
    }
  };

  // src/lib/game/sprites.ts
  var METAL = {
    o: "#16121f",
    // outline
    d: "#2c3352",
    // dark metal
    m: "#46538c",
    // mid metal
    l: "#6b7bc4",
    // light metal
    h: "#9fb0e8",
    // highlight
    c: "#7ff3ff",
    // cyan glow
    C: "#1ab8e6",
    // deep cyan
    y: "#ffd23d",
    // yellow
    r: "#ff3d8b",
    // pink/red accent
    R: "#c9281f",
    // red
    g: "#7cff6b",
    // green
    w: "#ededed",
    // white
    b: "#5b4023",
    // wood/brown
    B: "#8a6531",
    // light wood
    k: "#0d0b12",
    // near black
    p: "#c05ae0",
    // purple
    P: "#7a2bd0",
    // deep purple
    s: "#a0a0a0"
    // gray
  };
  function buildSpriteCanvas(spr, scale = 1) {
    const cv2 = document.createElement("canvas");
    cv2.width = spr.w * scale;
    cv2.height = spr.h * scale;
    const ctx = cv2.getContext("2d");
    for (let y = 0; y < spr.h; y++) {
      const row = spr.data[y];
      for (let x = 0; x < spr.w; x++) {
        const ch = row[x];
        if (!ch || ch === ".") continue;
        const col = spr.palette[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    return cv2;
  }
  var W = (rows) => ({ w: rows[0].length, h: rows.length, data: rows, palette: METAL });
  var SPR_PISTOL = W([
    "..................",
    "..................",
    "..............cc..",
    ".ddddddddddddddd..",
    "ommmmmmmmmmmmmmmo.",
    ".odmmmmmmmmmmdddo.",
    "...odd........oo..",
    "....oddo..........",
    ".....odo..........",
    ".....oo..........."
  ]);
  var SPR_SMG = W([
    "......................",
    "......................",
    "...................cc.",
    ".dddddddddddddddddddo.",
    "ommmmmmmmmmmmmmmmmmmmo",
    ".ommmmmllllmmmmmmmddo.",
    "..oddo..odd..oddo.....",
    "...oddo..oddo.odo.....",
    "....oo....oo..oo......"
  ]);
  var SPR_SHOTGUN = W([
    "..........................",
    "..........................",
    "......................cc..",
    ".bbbb.....................",
    "oBBBBbbbbbbbbbbbbbbbbbbbbo",
    "obbBBmmmllllllllmmmmmdddo.",
    "..obbodddddddddddddddo....",
    "....oddo......oddo........",
    ".....oo........oo........."
  ]);
  var SPR_LAUNCHER = W([
    "..............................",
    ".....ooooo....................",
    "....oyyyyyo...................",
    "....oyRRRRyo..................",
    "....oyRRRRyooddddddddddddo....",
    ".oooooyyyyommmmmmmmmmmmmmmo...",
    "ommmmmmmmmmmmmmmmmmmmdddho....",
    ".ommmmmmmmooddddddmmddo.......",
    "..oddo..oddo......oddo........",
    "...oo....oo........oo........."
  ]);
  var SPR_RAILGUN = W([
    "..............................",
    "..oooooooo....................",
    ".oyyyyyyyyo...................",
    ".oyCCCCCyooddddddddddddddo....",
    ".oyCcCCCmmmmmmmmmmmmmmmmmo....",
    ".oyCCCCCmmlllccllmmmmmmddo....",
    ".oyyyyyyooddddooodddddo.......",
    "..ooooo.oddo.....oddo.........",
    ".........oo.......oo.........."
  ]);
  var SPR_FLAMER = W([
    "..........................",
    "..................oo......",
    ".....oooooo.....oRRo......",
    "...ooRRRRRRooo.oRRRo......",
    "..oRyyyRRRRRRoRRRRRo......",
    ".oRRyyyRRRRRRRRRRRddo.....",
    ".oRRRRRRRRRRRRRmmmmo......",
    "..oRRRRRRRRRmmmmmo........",
    "...ooddddddmmmoo..........",
    ".....oddo..oddo...........",
    "......oo....oo............"
  ]);
  var SPR_OVERKILL = W([
    "..............................",
    "..............................",
    "...oooooooooo.................",
    "..oyyyyyyyyyyo...oooooooo.....",
    "..oypppppppppyooddddddddo.....",
    "..oyPPppppppPmmmmmmmmmmmmo....",
    "..oyppppppppmmmccccmmmmdo.....",
    "..oyyyyyyyyyoommmmmmmmo.......",
    "...oooooooo.ooddddo...........",
    "............oddo..............",
    ".............oo..............."
  ]);
  var SPR_REMOTE = W([
    "..............",
    "..oooooooooo..",
    ".ommmmmmmmmmo.",
    ".omdgcccgdmo..",
    ".ommmmmmmmmo..",
    ".odmmmmmmmdo..",
    "..oooooooodo..",
    "........odo...",
    ".........o...."
  ]);
  var SPR_NEUTRON = W([
    "..............................",
    "..........ooo.................",
    ".......oooypyo................",
    "......oyyppppyyo..............",
    ".....oyppwwwwppyoddoooo.......",
    "....oyppwccccwppmmmmmmmo......",
    "....oyppwccccwppmmllmmmmo.....",
    ".....oyppwwwwppmmmmmddo.......",
    "......oyyppppyyodddo..........",
    ".......oooypyo.oddo...........",
    "..........ooo...oo............"
  ]);
  var SPR_WAND = W([
    "....................",
    "...............yy...",
    "..............ywwy..",
    "..............ywwy..",
    "...............yy...",
    "..............oo....",
    ".........ooooob.....",
    "...ooooodbbbbbo.....",
    "..oyyyyodbbbo.......",
    "...ooooodbbo........",
    ".........oo........."
  ]);
  var SPR_GRENADE = W([
    "........",
    "...oo...",
    "..osso..",
    ".osssso.",
    "ossggsso",
    "ossggsso",
    "osssssso",
    ".osssso.",
    "..oooo.."
  ]);
  var SPR_DRONE = W([
    "..........................",
    ".....o.....oo.....o.......",
    "...oMMMoooMMMMoooMMMo.....",
    "..ommmmmmmmmmmmmmmmmmo....",
    ".ommmmcmmmmmmmmmmcmmmmo...",
    "ommmllooCccccccccCoolmmmo.",
    "ommmmo.ommmmmmmmmmo.ommmo.",
    ".oddo..ommccccmmmo..oddo..",
    "........oodddoo...........",
    "..........o..o............"
  ]);
  var SPR_PARACHUTE = W([
    "....oooooooo....",
    "..ooRRyyRRyyoo..",
    ".oRRyyyyyyRRyo..",
    "oRRyyywwyyyRRyo.",
    "oRyywwwwwwyyRo..",
    ".oyywwwwwwyyo...",
    "..oyywwwwyyo....",
    "...oyywwyyo.....",
    "....oyyyyoo.....",
    ".....oyyo.......",
    "......oy........"
  ]);
  var SPR_BOMBLET = W([
    "..oooo..",
    ".oCCCCo.",
    "oCCCCCCo",
    "oCCCCCCo",
    "oCCwwCCo",
    "oCCCCCCo",
    ".oCCCCo.",
    "..oooo.."
  ]);
  var SPR_ROCKET = W([
    ".....oooo...",
    "....oRRRRo..",
    "..ooRRwwRRo.",
    "oRRRRwwRRRRo",
    "oyyyywwyyyyo",
    "..ooRRRRoo..",
    "....oyyo....",
    ".....oo....."
  ]);
  var SPR_MIRV = W([
    ".....oo.....",
    "....oRRo....",
    "...oRwwRo...",
    "...oRRRRo...",
    "..oRRRRRRo..",
    "..oRwRRwRo..",
    "..oRRRRRRo..",
    "..oyyyyyyo..",
    "...oyyyyyo..",
    "....oyyo....",
    ".....oo....."
  ]);
  var SPR_JETPACK = W([
    "...oooo...",
    "..ommmmo..",
    ".omddddmo.",
    ".omdllmdo.",
    ".omdllmdo.",
    ".omddddmo.",
    "..ommmmo..",
    "..oRRRRo..",
    "...oRRo...",
    "....oo...."
  ]);
  var WEAPON_ICONS = {
    pistol: SPR_PISTOL,
    smg: SPR_SMG,
    shotgun: SPR_SHOTGUN,
    launcher: SPR_LAUNCHER,
    railgun: SPR_RAILGUN,
    flamer: SPR_FLAMER,
    overkill: SPR_OVERKILL,
    drone: SPR_REMOTE,
    neutron: SPR_NEUTRON,
    wand: SPR_WAND,
    grenade: SPR_GRENADE,
    rocket: SPR_ROCKET,
    mirv: SPR_MIRV,
    bomblet: SPR_BOMBLET,
    parachute: SPR_PARACHUTE,
    jetpack: SPR_JETPACK,
    droneBody: SPR_DRONE
  };
  function drawCharacter(ctx, x, y, opts) {
    const activeChar = ConfigManager.get().getConfig().character;
    const skin = opts.skin ?? activeChar.skin ?? "stickman";
    const colors = {
      head: opts.colors?.head ?? activeChar.headColor ?? "#ff8a2a",
      body: opts.colors?.body ?? activeChar.bodyColor ?? "#ff8a2a",
      accent: opts.colors?.accent ?? activeChar.accentColor ?? "#f2561d",
      outline: opts.colors?.outline ?? activeChar.outlineColor ?? "#16121f",
      thruster: opts.colors?.thruster ?? activeChar.thrusterColor ?? "#ffd23d"
    };
    const s = (opts.scale ?? 1) * (activeChar.scale ?? 1);
    ctx.save();
    ctx.translate(x, y);
    if (opts.tumble) ctx.rotate(opts.tumble);
    ctx.scale(opts.facing * s, s);
    ctx.lineCap = "round";
    const flip = opts.flipT >= 0 ? opts.flipT * Math.PI * 2 : 0;
    ctx.save();
    ctx.translate(0, -22);
    ctx.rotate(flip);
    ctx.translate(0, 22);
    const hipY = -22;
    ctx.strokeStyle = colors.body;
    ctx.lineWidth = skin === "robot" || skin === "commando" ? 5.5 : 4.5;
    if (opts.grounded && !opts.jetOn) {
      const p = Math.sin(opts.runPhase * Math.PI * 2);
      const p2 = Math.sin(opts.runPhase * Math.PI * 2 + Math.PI);
      ctx.beginPath();
      ctx.moveTo(0, hipY);
      ctx.lineTo(p * 8, hipY + 10);
      ctx.lineTo(p * 11, 0);
      ctx.stroke();
      if (skin === "commando" || skin === "robot") {
        ctx.fillStyle = colors.outline;
        ctx.fillRect(p * 11 - 3, -3, 8, 3.5);
      }
      ctx.beginPath();
      ctx.moveTo(0, hipY);
      ctx.lineTo(p2 * 8, hipY + 10);
      ctx.lineTo(p2 * 11, 0);
      ctx.stroke();
      if (skin === "commando" || skin === "robot") {
        ctx.fillStyle = colors.outline;
        ctx.fillRect(p2 * 11 - 3, -3, 8, 3.5);
      }
    } else if (opts.jetOn) {
      ctx.beginPath();
      ctx.moveTo(0, hipY);
      ctx.lineTo(-5, hipY + 11);
      ctx.lineTo(-9, hipY + 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, hipY);
      ctx.lineTo(-2, hipY + 12);
      ctx.lineTo(-6, hipY + 22);
      ctx.stroke();
    } else {
      const dy = opts.vy < 0 ? -2 : 3;
      ctx.beginPath();
      ctx.moveTo(0, hipY);
      ctx.lineTo(6, hipY + 9 + dy);
      ctx.lineTo(10, hipY + 16 + dy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, hipY);
      ctx.lineTo(-4, hipY + 10 + dy);
      ctx.lineTo(-7, hipY + 15 + dy);
      ctx.stroke();
    }
    if (skin === "robot") {
      ctx.fillStyle = colors.body;
      ctx.strokeStyle = colors.outline;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-6, -38, 12, 16, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = colors.head;
      ctx.fillRect(-3, -34, 6, 4);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-1.5, -33, 3, 2);
    } else if (skin === "commando") {
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, hipY);
      ctx.lineTo(0, -38);
      ctx.stroke();
      ctx.fillStyle = colors.body;
      ctx.strokeStyle = colors.outline;
      ctx.lineWidth = 1;
      ctx.fillRect(-5, -36, 10, 12);
      ctx.strokeRect(-5, -36, 10, 12);
      ctx.fillStyle = colors.accent;
      ctx.fillRect(-5, -31, 10, 2.5);
    } else if (skin === "voidMage") {
      ctx.fillStyle = colors.body;
      ctx.beginPath();
      ctx.moveTo(-7, hipY + 2);
      ctx.lineTo(-2, -38);
      ctx.lineTo(2, -38);
      ctx.lineTo(7, hipY + 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -36);
      ctx.lineTo(0, hipY);
      ctx.stroke();
    } else {
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(0, hipY);
      ctx.lineTo(0, -38);
      ctx.stroke();
    }
    if (opts.jetOn || opts.jetK > 0) {
      ctx.fillStyle = skin === "robot" ? "#334155" : "#46538c";
      ctx.fillRect(-9, -36, 7, 14);
      ctx.fillStyle = skin === "robot" ? "#0f172a" : "#2c3352";
      ctx.fillRect(-8, -35, 5, 5);
      if (opts.jetOn) {
        const f = 6 + Math.random() * 8;
        ctx.fillStyle = colors.thruster;
        ctx.beginPath();
        ctx.moveTo(-8, -22);
        ctx.lineTo(-5.5, -22 + f);
        ctx.lineTo(-3, -22);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(-7.4, -22);
        ctx.lineTo(-5.5, -22 + f * 0.5);
        ctx.lineTo(-3.6, -22);
        ctx.fill();
      }
    }
    if (skin === "robot") {
      ctx.fillStyle = colors.body;
      ctx.strokeStyle = colors.outline;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-6.5, -51, 13, 11, 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = colors.outline;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -51);
      ctx.lineTo(0, -56);
      ctx.stroke();
      ctx.fillStyle = colors.head;
      ctx.beginPath();
      ctx.arc(0, -57, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.head;
      ctx.fillRect(-4.5, -47, 9, 3.5);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, -46.5, 4, 2);
    } else if (skin === "commando") {
      ctx.fillStyle = colors.head;
      ctx.beginPath();
      ctx.arc(0, -45, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.body;
      ctx.beginPath();
      ctx.arc(0, -46.5, 8.2, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-8.2, -47.5, 16.4, 3);
      ctx.fillStyle = colors.accent;
      ctx.fillRect(-3, -45, 6, 2.5);
    } else if (skin === "voidMage") {
      ctx.fillStyle = colors.body;
      ctx.beginPath();
      ctx.moveTo(0, -53);
      ctx.lineTo(-8, -43);
      ctx.lineTo(8, -43);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -45, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.outline;
      ctx.beginPath();
      ctx.arc(0, -44.5, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.head;
      ctx.fillRect(-2, -45, 1.8, 1.8);
      ctx.fillRect(1, -45, 1.8, 1.8);
    } else {
      ctx.fillStyle = colors.head;
      ctx.beginPath();
      ctx.arc(0, -45, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.translate(0, -34);
    const aimLocal = opts.facing === 1 ? opts.aim : Math.PI - opts.aim;
    ctx.rotate(aimLocal);
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(10, 2);
    ctx.stroke();
    if (opts.weapon && opts.weaponAnchor) {
      const wa = opts.weaponAnchor;
      ctx.save();
      ctx.rotate(Math.PI);
      ctx.drawImage(opts.weapon, -wa.dx, -wa.dy);
      ctx.restore();
    }
    ctx.strokeStyle = colors.body;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(11, 1);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // src/lib/game/weapons.ts
  var WEAPONS = [
    { id: "pistol", nameAr: "\u0645\u0633\u062F\u0633", nameEn: "Pistol", kind: "bullet", cooldown: 0.16, auto: false, pellets: 1, spread: 0.012, speed: 2300, pierce: 6, damage: 16, push: 0, kick: 4, shake: 0.12, iconScale: 2 },
    { id: "smg", nameAr: "\u0631\u0634\u0627\u0634", nameEn: "SMG", kind: "bullet", cooldown: 0.068, auto: true, pellets: 1, spread: 0.07, speed: 2e3, pierce: 4, damage: 8, push: 14, kick: 2.6, shake: 0.07, iconScale: 2 },
    { id: "shotgun", nameAr: "\u0628\u0646\u062F\u0642\u064A\u0629 \u062E\u0631\u0637\u0648\u0634", nameEn: "Shotgun", kind: "bullet", cooldown: 0.62, auto: false, pellets: 10, spread: 0.17, speed: 1750, pierce: 3, damage: 12, push: 230, kick: 7, shake: 0.42, iconScale: 2 },
    { id: "launcher", nameAr: "\u0642\u0627\u0630\u0641\u0629 \u0635\u0648\u0627\u0631\u064A\u062E", nameEn: "Rocket", kind: "rocket", cooldown: 0.85, auto: false, pellets: 1, spread: 0, speed: 900, pierce: 0, damage: 0, push: 120, kick: 6, shake: 0.3, iconScale: 2 },
    { id: "railgun", nameAr: "\u0645\u062F\u0641\u0639 \u0631\u064A\u0644", nameEn: "Railgun", kind: "rail", cooldown: 1.1, auto: false, pellets: 1, spread: 0, speed: 0, pierce: 999, damage: 130, push: 260, kick: 9, shake: 0.55, iconScale: 2 },
    { id: "flamer", nameAr: "\u0642\u0627\u0630\u0641 \u0646\u0627\u0631", nameEn: "Flamethrower", kind: "flame", cooldown: 0.017, auto: true, pellets: 5, spread: 0.1, speed: 620, pierce: 0, damage: 0, push: 0, kick: 0.5, shake: 0.012, iconScale: 2 },
    { id: "overkill", nameAr: "\u0643\u062B\u064A\u0631 \u062C\u062F\u0627\u064B", nameEn: "Too Much", kind: "mirv", cooldown: 1.9, auto: false, pellets: 1, spread: 0, speed: 1500, pierce: 0, damage: 0, push: 300, kick: 11, shake: 0.55, iconScale: 2 },
    { id: "drone", nameAr: "\u062F\u0631\u0648\u0646", nameEn: "Drone", kind: "drone", cooldown: 0.4, auto: true, pellets: 1, spread: 0.05, speed: 2700, pierce: 5, damage: 16, push: 0, kick: 1.5, shake: 0.02, iconScale: 2 },
    { id: "neutron", nameAr: "PSR B0531+21", nameEn: "PSR B0531+21", kind: "star", cooldown: 1.6, auto: false, pellets: 1, spread: 0, speed: 1100, pierce: 0, damage: 0, push: 140, kick: 9, shake: 0.3, iconScale: 2 },
    { id: "wand", nameAr: "\u0627\u0644\u0639\u0635\u0627 \u0627\u0644\u0633\u062D\u0631\u064A\u0629", nameEn: "The Magic Wand", kind: "wand", cooldown: 2.2, auto: false, pellets: 1, spread: 0, speed: 1e3, pierce: 0, damage: 0, push: 0, kick: 2, shake: 0.08, iconScale: 2 }
  ];
  var GRENADE = { cooldown: 0.55, fuse: 1.55, radius: 50, speed: 620 };
  var ROCKET_BLAST = 46;
  var BOMBLET_BLAST = 30;
  function newWeaponEntities() {
    return { bullets: [], rockets: [], grenades: [], drone: null, droneCd: 0, star: null, wand: null, mirvFlash: 0, flames: [] };
  }
  var bulletSeq = 0;
  var spawnBullet = (es, x, y, vx, vy, dmg, pierce, color = "#ffd23d", trail = true, life = 1.2) => {
    if (es.bullets.length > 400) es.bullets.shift();
    es.bullets.push({ x, y, vx, vy, life, pierce, dmg, color, trail });
    void bulletSeq;
  };
  function fireWeapon(world, es, w, x, y, aim, pan, onShake, onKick, onShot) {
    onShot();
    const cos = Math.cos(aim);
    const sin = Math.sin(aim);
    const mzX = x + cos * 30;
    const mzY = y + sin * 30;
    const cfg = ConfigManager.get().getConfig();
    const wTune = cfg.weapons[w.id] || { damageMul: 1, speedMul: 1, cooldownMul: 1, blastMul: 1, shakeMul: 1 };
    const effSpeed = w.speed * (wTune.speedMul ?? 1);
    const effDmg = Math.max(1, Math.round(w.damage * (wTune.damageMul ?? 1)));
    const effShake = w.shake * (wTune.shakeMul ?? 1) * (cfg.visual.shakeMultiplier ?? 1);
    switch (w.kind) {
      case "bullet": {
        for (let i = 0; i < w.pellets; i++) {
          const a = aim + (Math.random() - 0.5) * w.spread * 2;
          const jitter = w.pellets > 1 ? (Math.random() - 0.5) * 120 : 0;
          spawnBullet(
            es,
            x + cos * 26,
            y + sin * 26,
            Math.cos(a) * (effSpeed + jitter),
            Math.sin(a) * (effSpeed + jitter),
            effDmg,
            w.pierce,
            w.id === "drone" ? "#7ff3ff" : "#ffd23d"
          );
        }
        sound.shot(w.id === "pistol" ? "pistol" : w.id === "smg" ? "smg" : "shotgun", 1, pan);
        for (let i = 0; i < 4; i++) {
          world.spawnParticle({ x: mzX, y: mzY, vx: cos * 300 + (Math.random() - 0.5) * 200, vy: sin * 300 + (Math.random() - 0.5) * 200, life: 0.1, max: 0.1, kind: "spark", color: "#fff3a6", size: 3 });
        }
        world.spawnParticle({ x: x + cos * 10, y: y + sin * 10, vx: -cos * 100 + (Math.random() - 0.5) * 60, vy: -260 - Math.random() * 120, life: 1, max: 1, kind: "shell", color: "#e9b54a", size: 2.5, grav: 1900, rot: Math.random() * 6, vrot: 12 });
        onShake(effShake);
        if (w.push > 0) onKick(-cos * w.push, -sin * w.push * 0.4);
        if (w.kick > 0) onKick(0, 0);
        break;
      }
      case "rocket": {
        es.rockets.push({ x: mzX, y: mzY, vx: cos * effSpeed, vy: sin * effSpeed, life: 3, state: 0, bomblets: 0, chute: false, fuse: 3, smokeT: 0 });
        sound.whoosh(pan);
        onShake(effShake);
        onKick(-cos * w.push * 0.5, -sin * w.push * 0.2);
        break;
      }
      case "rail": {
        const maxD = 3e3;
        const step = CELL * 0.8;
        let cx = x;
        let cy = y;
        const hitPts = [];
        const carveR = (4.5 + Math.random() * 3) * (wTune.blastMul ?? 1);
        for (let d = 0; d < maxD; d += step) {
          cx += cos * step;
          cy += sin * step;
          if (cx < 0 || cx > world.W || cy > world.H) break;
          if (world.solidAtWorld(cx, cy)) {
            hitPts.push({ x: cx, y: cy });
            world.hitBodyAt(cx, cy, effDmg, cos * 340, sin * 340);
            if (hitPts.length % 2 === 1) {
              world.damageCircle(cx, cy, carveR, { debris: true, countAsDestroy: true, impulse: 450 });
              if (Math.random() < 0.12) sound.hit("block", 0.5, pan);
            }
          }
        }
        for (let d = 0; d < Math.hypot(cx - x, cy - y); d += 14) {
          world.spawnParticle({ x: x + cos * d, y: y + sin * d, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, life: 0.35, max: 0.35, kind: "spark", color: d % 28 < 14 ? "#7ff3ff" : "#ffffff", size: 4 });
        }
        sound.railCharge(pan);
        setTimeout(() => sound.rail(pan), 90);
        onShake(effShake);
        onKick(-cos * w.push, -160);
        break;
      }
      case "flame": {
        for (let i = 0; i < 3; i++) {
          const a = aim + (Math.random() - 0.5) * w.spread * 2.4;
          const sp = effSpeed * (0.65 + Math.random() * 0.7);
          if (es.flames.length < 500) {
            es.flames.push({ x: mzX, y: mzY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5 + Math.random() * 0.3, max: 0.8 });
          }
        }
        if (Math.random() < 0.24) sound.flameBurst(0.8, pan);
        onShake(effShake);
        break;
      }
      case "mirv": {
        es.rockets.push({ x: mzX, y: mzY, vx: cos * effSpeed * 0.55, vy: sin * effSpeed * 0.55 - 500, life: 4, state: 0, bomblets: 8, chute: false, fuse: 4, smokeT: 0 });
        sound.whoosh(pan);
        onShake(effShake);
        onKick(-cos * w.push * 0.4, -120);
        break;
      }
      case "star": {
        es.star = {
          x: mzX,
          y: mzY,
          vx: cos * effSpeed,
          vy: sin * effSpeed,
          t: 0,
          dur: 2.9,
          r: 20 * (wTune.blastMul ?? 1),
          maxR: 150 * (wTune.blastMul ?? 1),
          rot: 0
        };
        sound.starHum(pan);
        onShake(effShake);
        onKick(-cos * w.push * 0.3, -80);
        break;
      }
      case "wand": {
        es.wand = { x, y, aim, t: 0, charge: 0.55, fired: false, swept: 0 };
        sound.wandCast(pan);
        break;
      }
      case "drone": {
        break;
      }
    }
  }
  function throwGrenade(world, es, x, y, aim, power) {
    es.grenades.push({ x, y, vx: Math.cos(aim) * power, vy: Math.sin(aim) * power - 160, fuse: GRENADE.fuse, rot: 0, vrot: (Math.random() - 0.5) * 14 });
    sound.click();
    void world;
  }
  function explodeAt(world, es, x, y, r, opts = {}) {
    world.damageCircle(x, y, r, { debris: true, scorch: opts.scorch ?? true, impulse: 460 + r * 6 });
    world.blastImpulse(x, y, r * 1.9, 520 + r * 8);
    world.explosions++;
    const N = Math.min(90, Math.floor(r * 1.6));
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.25 + Math.random() * 0.75) * r * 9;
      world.spawnParticle({
        x: x + Math.cos(a) * r * 0.3,
        y: y + Math.sin(a) * r * 0.3,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        life: 0.3 + Math.random() * 0.5,
        max: 0.8,
        kind: "spark",
        color: ["#ffffff", "#fff3a6", "#ffd23d", "#ff8a2a", "#f2561d"][Math.random() * 5 | 0],
        size: 3 + Math.random() * 4,
        grav: 300
      });
    }
    for (let i = 0; i < 14; i++) {
      world.spawnParticle({
        x: x + (Math.random() - 0.5) * r,
        y: y + (Math.random() - 0.5) * r,
        vx: (Math.random() - 0.5) * 120,
        vy: -60 - Math.random() * 140,
        life: 0.8 + Math.random() * 0.9,
        max: 1.7,
        kind: "smoke",
        color: ["#5b5566", "#3f3a4a", "#2a2633"][Math.random() * 3 | 0],
        size: 5 + Math.random() * 6
      });
    }
    world.spawnParticle({ x, y, vx: 0, vy: 0, life: 0.28, max: 0.28, kind: "glow", color: "#ffffff", size: r * 0.7 });
    if (opts.fire) world.igniteWorld(x, y, r * 0.85);
    const pan = Math.max(-1, Math.min(1, x / world.W * 2 - 1));
    sound.boom(Math.min(1.15, 0.55 + r / 90), pan);
  }
  function stepEntities(world, es, dt, playerX, playerY, aimTo) {
    for (let i = es.bullets.length - 1; i >= 0; i--) {
      const b = es.bullets[i];
      b.life -= dt;
      if (b.life <= 0) {
        es.bullets.splice(i, 1);
        continue;
      }
      const steps = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / (CELL * 1.2)));
      let dead = false;
      for (let s = 0; s < steps && !dead; s++) {
        b.x += b.vx * dt / steps;
        b.y += b.vy * dt / steps;
        if (b.x < -20 || b.x > world.W + 20 || b.y > world.H + 20) {
          dead = true;
          break;
        }
        if (b.y < 0) continue;
        if (b.x >= 0 && b.y >= 0 && b.x < world.W && b.y < world.H && world.solidAtWorld(b.x, b.y)) {
          world.hitBodyAt(b.x, b.y, b.dmg, b.vx * 0.04, b.vy * 0.04);
          if (Math.random() < 0.8) {
            world.damageCircle(b.x + (Math.random() - 0.5) * 3, b.y + (Math.random() - 0.5) * 3, 2.2 + b.dmg * 0.12, { debris: true, countAsDestroy: true });
          }
          const pan = Math.max(-1, Math.min(1, b.x / world.W * 2 - 1));
          sound.hit(Math.random() < 0.5 ? "paper" : "block", 0.8, pan);
          for (let k = 0; k < 3; k++) {
            world.spawnParticle({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300, life: 0.2, max: 0.2, kind: "spark", color: "#ffd23d", size: 2 });
          }
          b.pierce--;
          if (b.pierce <= 0) dead = true;
          else {
            b.vx *= 0.82;
            b.vy *= 0.82;
          }
        }
      }
      if (dead) es.bullets.splice(i, 1);
      else if (Math.random() < 0.35) {
        world.spawnParticle({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.1, max: 0.1, kind: "spark", color: b.color, size: 2 });
      }
    }
    for (let i = es.rockets.length - 1; i >= 0; i--) {
      const r = es.rockets[i];
      r.life -= dt;
      r.smokeT -= dt;
      if (r.state === 0) {
        r.vy += 320 * dt;
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        if (r.smokeT <= 0) {
          r.smokeT = 0.03;
          world.spawnParticle({ x: r.x, y: r.y + 4, vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 60, life: 0.5, max: 0.5, kind: "smoke", color: "#5b5566", size: 3 + Math.random() * 3 });
          world.spawnParticle({ x: r.x, y: r.y + 4, vx: 0, vy: 40, life: 0.12, max: 0.12, kind: "spark", color: "#ffd23d", size: 3 });
        }
        const hitWorld = r.x < 0 || r.x > world.W || r.y >= 0 && r.y < world.H && world.mat[world.idx(Math.floor(r.x / CELL), Math.floor(r.y / CELL))] !== 0;
        if (hitWorld || r.y > world.H) {
          if (r.bomblets > 0) {
            r.state = 1;
            r.fuse = 0.1;
            sound.split(0);
            for (let k = 0; k < r.bomblets; k++) {
              es.rockets.push({
                x: r.x + (Math.random() - 0.5) * 30,
                y: r.y - Math.random() * 16,
                vx: (Math.random() - 0.5) * 240,
                vy: -60 - Math.random() * 80,
                life: 14,
                state: 1,
                bomblets: 0,
                chute: true,
                fuse: 12,
                smokeT: 0
              });
            }
            sound.chutePop(0);
            es.rockets.splice(i, 1);
            continue;
          }
          explodeAt(world, es, r.x, r.y, ROCKET_BLAST, { scorch: true });
          es.rockets.splice(i, 1);
          continue;
        }
        if (r.life <= 0) {
          explodeAt(world, es, r.x, r.y, ROCKET_BLAST);
          es.rockets.splice(i, 1);
        }
      } else {
        r.vy += (240 - r.vy) * 2.4 * dt;
        r.vx *= 1 - 0.9 * dt;
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        r.fuse -= dt;
        if (Math.random() < 0.1) {
          world.spawnParticle({ x: r.x, y: r.y - 10, vx: 0, vy: 0, life: 0.2, max: 0.2, kind: "spark", color: "#ffffff", size: 2 });
        }
        const hitWorld = r.x < 0 || r.x > world.W || r.y >= 0 && r.y < world.H && world.mat[world.idx(Math.floor(r.x / CELL), Math.floor(r.y / CELL))] !== 0;
        if (hitWorld && r.vy > 0 || r.y > world.H || r.fuse <= 0) {
          explodeAt(world, es, r.x, r.y, BOMBLET_BLAST, { scorch: true });
          es.rockets.splice(i, 1);
        }
      }
    }
    for (let i = es.grenades.length - 1; i >= 0; i--) {
      const g = es.grenades[i];
      g.fuse -= dt;
      g.vy += 2e3 * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.rot += g.vrot * dt;
      if (world.solidAtWorld(g.x, g.y + 6)) {
        g.y -= 2;
        g.vy = -Math.abs(g.vy) * 0.45;
        g.vx *= 0.75;
        g.vrot *= 0.7;
        if (Math.abs(g.vy) > 90) sound.hit("block", 0.5, 0);
      }
      if (world.solidAtWorld(g.x + Math.sign(g.vx) * 6, g.y)) {
        g.vx *= -0.5;
      }
      if (g.fuse <= 0) {
        explodeAt(world, es, g.x, g.y, GRENADE.radius, { scorch: true });
        es.grenades.splice(i, 1);
      }
    }
    for (let i = es.flames.length - 1; i >= 0; i--) {
      const f = es.flames[i];
      f.life -= dt;
      if (f.life <= 0) {
        es.flames.splice(i, 1);
        continue;
      }
      f.vx *= 1 - 2.6 * dt;
      f.vy = f.vy * (1 - 2.6 * dt) - 150 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.x < 0 || f.x > world.W || f.y > world.H) {
        es.flames.splice(i, 1);
        continue;
      }
      if (f.y >= 0) {
        const gi = world.idx(Math.floor(f.x / CELL), Math.floor(f.y / CELL));
        if (world.mat[gi] !== 0) {
          world.igniteWorld(f.x, f.y, 9);
          for (let k = 0; k < 2; k++) {
            world.spawnParticle({ x: f.x, y: f.y, vx: (Math.random() - 0.5) * 90, vy: -60 - Math.random() * 90, life: 0.3, max: 0.3, kind: "ember", color: ["#ffd23d", "#ff8a2a"][Math.random() * 2 | 0], size: 2.5 });
          }
          es.flames.splice(i, 1);
        }
      }
    }
    if (es.droneCd > 0) es.droneCd -= dt;
    const d = es.drone;
    if (d && d.state !== 2) {
      if (d.state === 0) {
        const tx = aimTo ? aimTo.x : playerX + 120;
        const ty = aimTo ? aimTo.y : playerY - 140;
        const dx = tx - d.x;
        const dy = ty - d.y;
        const dist = Math.hypot(dx, dy);
        const accel = 2600;
        if (dist > 6) {
          d.vx += dx / dist * accel * dt;
          d.vy += dy / dist * accel * dt;
        }
        const drag = dist < 40 ? 3.4 : 1.6;
        d.vx -= d.vx * Math.min(1, drag * dt);
        d.vy -= d.vy * Math.min(1, drag * dt);
        const sp = Math.hypot(d.vx, d.vy);
        const maxSp = 480;
        if (sp > maxSp) {
          d.vx *= maxSp / sp;
          d.vy *= maxSp / sp;
        }
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.x = Math.max(20, Math.min(world.W - 20, d.x));
        d.y = Math.max(10, Math.min(world.H - 20, d.y));
        d.battery -= dt;
        d.lowBeepT -= dt;
        if (d.battery < d.maxBattery * 0.25 && d.lowBeepT <= 0) {
          d.lowBeepT = 0.5;
          sound.droneBeep(0);
        }
        if (d.battery <= 0) {
          d.state = 2;
          es.droneCd = 5;
          world.puffAt(d.x, d.y, 20);
        }
      } else if (d.state === 1) {
        d.vy += 4e3 * dt;
        d.y += d.vy * dt;
        d.x += d.vx * dt;
        const hitWorld = d.y >= world.H || d.y >= 0 && world.mat[world.idx(Math.max(0, Math.min(world.GW - 1, Math.floor(d.x / CELL))), Math.max(0, Math.min(world.GH - 1, Math.floor(d.y / CELL))))] !== 0;
        if (hitWorld) {
          explodeAt(world, es, d.x, d.y, 26, { scorch: true });
          d.state = 2;
          es.droneCd = 5;
        }
        if (d.y > world.H + 40) {
          d.state = 2;
          es.droneCd = 5;
        }
      }
    }
    const st = es.star;
    if (st) {
      st.t += dt;
      st.rot += dt * 3;
      if (st.t < 0.5) {
        st.x += st.vx * dt;
        st.y += st.vy * dt;
        if (st.y < 0) st.y = 0;
      }
      st.r = Math.min(st.maxR, 30 + st.t * 110);
      const cx = Math.floor(st.x / CELL);
      const cy = Math.floor(st.y / CELL);
      const rc = Math.ceil(st.r / CELL);
      const suckRate = 1;
      for (let k = 0; k < 160 * suckRate; k++) {
        const a = Math.random() * Math.PI * 2;
        const rr2 = st.r * (0.15 + Math.random() * 0.85);
        const xx = cx + Math.cos(a) * (rr2 / CELL);
        const yy = cy + Math.sin(a) * (rr2 / CELL);
        if (xx < 0 || yy < 0 || xx >= world.GW || yy >= world.GH) continue;
        const gi = world.idx(xx | 0, yy | 0);
        if (world.mat[gi] === 1) {
          world.mat[gi] = 0;
          world.pixBuf[gi] = 0;
          world.destroyedCells++;
          world.dirty = true;
          const own = world.owner[gi];
          if (own >= 0) {
            const el = world.elements.get(own);
            if (el && el.alive) {
              el.lost++;
              if (el.kind === "glyph" && el.lost / Math.max(1, el.cells.length) > 0.25) world.popElement(el, st.x, st.y, 300);
              else if (el.kind !== "glyph" && el.lost / Math.max(1, el.cells.length) > 0.55) world.popElement(el, st.x, st.y, 300);
            }
          }
          world.owner[gi] = -1;
          const wx = (xx | 0) * CELL;
          const wy = (yy | 0) * CELL;
          if (Math.random() < 0.3) {
            const dx = st.x - wx;
            const dy = st.y - wy;
            const dd = Math.hypot(dx, dy) || 1;
            world.spawnParticle({
              x: wx,
              y: wy,
              vx: dx / dd * 300 + -dy / dd * 220,
              vy: dy / dd * 300 + dx / dd * 220,
              life: 0.5,
              max: 0.5,
              kind: "spark",
              color: ["#ffffff", "#7ff3ff", "#c05ae0", "#ffd23d"][Math.random() * 4 | 0],
              size: 2.5
            });
          }
        }
      }
      if (Math.random() < 0.85) {
        for (const ja of [st.rot, st.rot + Math.PI]) {
          const jx = st.x + Math.cos(ja) * st.r * 2.4;
          const jy = st.y + Math.sin(ja) * st.r * 2.4;
          world.spawnParticle({ x: st.x + Math.cos(ja) * st.r * 0.4, y: st.y + Math.sin(ja) * st.r * 0.4, vx: (jx - st.x) * 2.4, vy: (jy - st.y) * 2.4, life: 0.18, max: 0.18, kind: "spark", color: Math.random() < 0.5 ? "#7ff3ff" : "#ffffff", size: 3 });
        }
      }
      if (st.t >= st.dur) {
        explodeAt(world, es, st.x, st.y, 34, { scorch: true });
        es.star = null;
      }
    }
    const wd = es.wand;
    if (wd) {
      wd.t += dt;
      if (!wd.fired) {
        if (Math.random() < 0.7) {
          const a = Math.random() * Math.PI * 2;
          const rr2 = 60 * (1 - wd.t / (wd.charge + 0.2));
          world.spawnParticle({
            x: wd.x + Math.cos(a) * rr2,
            y: wd.y + Math.sin(a) * rr2,
            vx: -Math.cos(a) * 160,
            vy: -Math.sin(a) * 160,
            life: 0.4,
            max: 0.4,
            kind: "spark",
            color: ["#ffd23d", "#ff3d8b", "#7ff3ff", "#c05ae0"][Math.random() * 4 | 0],
            size: 3
          });
        }
        if (wd.t >= wd.charge) {
          wd.fired = true;
          world.explosions++;
          sound.wandBlast(1);
        }
      } else {
        const sweepDur = 1.1;
        const k = Math.min(1, wd.swept / sweepDur);
        wd.swept += dt;
        const beamLen = 1500;
        const half = 0.5;
        const centerA = wd.aim - half * 0.4 + half * 0.8 * k;
        for (let li = 0; li < 4; li++) {
          const a = centerA + (Math.random() - 0.5) * half * 1.6;
          const dist = Math.random() * beamLen;
          const px = wd.x + Math.cos(a) * dist;
          const py = wd.y + Math.sin(a) * dist;
          world.damageCircle(px, py, 30 + Math.random() * 26, { debris: true, countAsDestroy: true, full: true });
          if (Math.random() < 0.35) world.igniteWorld(px, py, 30);
        }
        for (let li = 0; li < 26; li++) {
          const a = centerA + (Math.random() - 0.5) * half * 1.4;
          const dist = 60 + Math.random() * 1200;
          world.spawnParticle({
            x: wd.x + Math.cos(a) * dist,
            y: wd.y + Math.sin(a) * dist,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            life: 0.3 + Math.random() * 0.3,
            max: 0.6,
            kind: "star",
            color: ["#ffffff", "#ffd23d", "#7ff3ff", "#ff3d8b", "#c05ae0"][Math.random() * 5 | 0],
            size: 4 + Math.random() * 5
          });
        }
        if (Math.random() < 0.5) {
          world.spawnParticle({ x: wd.x + (Math.random() - 0.5) * 60, y: wd.y + (Math.random() - 0.5) * 60, vx: 0, vy: -40, life: 0.5, max: 0.5, kind: "star", color: "#ffffff", size: 3 });
        }
        if (wd.swept >= sweepDur) {
          es.wand = null;
        }
      }
    }
  }
  var iconCache = null;
  function getWeaponIcon(id) {
    if (!iconCache) iconCache = /* @__PURE__ */ new Map();
    let c = iconCache.get(id);
    if (!c) {
      const spr = WEAPON_ICONS[id];
      if (!spr) return null;
      c = buildSpriteCanvas(spr, 2);
      iconCache.set(id, c);
    }
    return c;
  }
  function drawEntities(ctx, world, es, camX, camY) {
    const t = performance.now() / 1e3;
    ctx.save();
    for (const b of es.bullets) {
      const px = b.x - camX;
      const py = b.y - camY;
      ctx.fillStyle = b.color;
      ctx.fillRect(px - 2, py - 1.5, 5, 3);
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(px - 4 - b.vx * 2e-3, py - 0.5, 4, 1);
      ctx.globalAlpha = 1;
    }
    for (const r of es.rockets) {
      const px = r.x - camX;
      const py = r.y - camY;
      ctx.save();
      ctx.translate(px, py);
      if (r.state === 0) {
        ctx.rotate(Math.atan2(r.vy, r.vx) + Math.PI);
        ctx.fillStyle = "#c9281f";
        ctx.fillRect(-8, -3, 16, 6);
        ctx.fillStyle = "#ffd23d";
        ctx.fillRect(-12, -2, 4, 4);
        ctx.fillStyle = "#ededed";
        ctx.fillRect(4, -2, 4, 4);
      } else {
        if (r.chute) {
          ctx.fillStyle = "#c9281f";
          ctx.beginPath();
          ctx.arc(0, -14, 9, Math.PI, 0);
          ctx.fill();
          ctx.strokeStyle = "#ededed";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-8, -14);
          ctx.lineTo(0, -4);
          ctx.lineTo(8, -14);
          ctx.stroke();
        }
        ctx.fillStyle = "#1ab8e6";
        ctx.fillRect(-3, -4, 6, 8);
        ctx.fillStyle = "#ededed";
        ctx.fillRect(-2, -3, 4, 2);
      }
      ctx.restore();
    }
    for (const g of es.grenades) {
      const px = g.x - camX;
      const py = g.y - camY;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(g.rot);
      ctx.fillStyle = "#5b5566";
      ctx.fillRect(-3.5, -4, 7, 8);
      ctx.fillStyle = "#7cff6b";
      ctx.fillRect(-2, -2, 2, 2);
      if (g.fuse < 0.6 && Math.floor(t * 12) % 2 === 0) {
        ctx.fillStyle = "#ff3d8b";
        ctx.fillRect(-1, -6, 2, 2);
      }
      ctx.restore();
    }
    const d = es.drone;
    if (d && d.state !== 2) {
      const px = d.x - camX;
      const py = d.y - camY;
      ctx.save();
      ctx.translate(px, py);
      const tilt = Math.max(-0.35, Math.min(0.35, d.vx / 1400));
      ctx.rotate(tilt);
      ctx.fillStyle = "#2c3352";
      ctx.fillRect(-9, -3, 18, 6);
      ctx.fillStyle = "#46538c";
      ctx.fillRect(-11, -5, 22, 3);
      ctx.fillStyle = "#7ff3ff";
      ctx.fillRect(-3, -2, 6, 3);
      const rot = Math.sin(t * 40) * 6;
      ctx.strokeStyle = "#9fb0e8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-11 - rot * 0.4, -6);
      ctx.lineTo(-11 + rot * 0.4, -6);
      ctx.moveTo(11 - rot * 0.4, -6);
      ctx.lineTo(11 + rot * 0.4, -6);
      ctx.stroke();
      ctx.restore();
      if (d.state === 0) {
        const bw = 26;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(px - bw / 2, py + 12, bw, 4);
        ctx.fillStyle = d.battery < d.maxBattery * 0.25 ? "#ff4d4d" : "#7cff6b";
        ctx.fillRect(px - bw / 2 + 0.5, py + 12.5, (bw - 1) * (d.battery / d.maxBattery), 3);
      }
    }
    for (const f of es.flames) {
      const px = f.x - camX;
      const py = f.y - camY;
      const ft = f.life / f.max;
      const r = 3 + (1 - ft) * 6;
      ctx.globalAlpha = Math.min(1, ft * 1.6);
      ctx.fillStyle = ft > 0.66 ? "#fff3a6" : ft > 0.4 ? "#ffd23d" : "#ff8a2a";
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      if (ft > 0.5) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(px, py, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    const st = es.star;
    if (st) {
      const px = st.x - camX;
      const py = st.y - camY;
      const pulse = 1 + Math.sin(t * 14) * 0.06;
      const grd = ctx.createRadialGradient(px, py, 2, px, py, st.r * pulse);
      grd.addColorStop(0, "rgba(255,255,255,0.9)");
      grd.addColorStop(0.25, "rgba(127,243,255,0.45)");
      grd.addColorStop(0.6, "rgba(122,43,208,0.25)");
      grd.addColorStop(1, "rgba(122,43,208,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(px, py, st.r * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(px, py, 6 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(127,243,255,0.75)";
      ctx.lineWidth = 2.5;
      for (const ja of [st.rot * 2, st.rot * 2 + Math.PI]) {
        ctx.beginPath();
        ctx.moveTo(px + Math.cos(ja) * 8, py + Math.sin(ja) * 8);
        ctx.lineTo(px + Math.cos(ja) * (st.r * 2.6), py + Math.sin(ja) * (st.r * 2.6));
        ctx.stroke();
      }
    }
    const wd = es.wand;
    if (wd) {
      const px = wd.x - camX;
      const py = wd.y - camY;
      if (!wd.fired) {
        const k = Math.min(1, wd.t / wd.charge);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(t * 1.6);
        const R = 34 * (1.2 - k * 0.4);
        ctx.strokeStyle = "rgba(255,210,61,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,61,139,0.8)";
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#7ff3ff";
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * Math.PI * 2;
          const rx = Math.cos(a) * R;
          const ry = Math.sin(a) * R;
          ctx.fillRect(rx - 2, ry - 2, 4, 4);
        }
        ctx.strokeStyle = "rgba(192,90,224,0.9)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = i / 5 * Math.PI * 2 - Math.PI / 2;
          const a2 = a + Math.PI * 2 / 5 * 2;
          ctx.moveTo(Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.55);
          ctx.lineTo(Math.cos(a2) * R * 0.55, Math.sin(a2) * R * 0.55);
        }
        ctx.stroke();
        ctx.restore();
      } else {
        const k = Math.min(1, wd.swept / 1.1);
        const centerA = wd.aim - 0.2 + 0.4 * k;
        ctx.save();
        ctx.translate(px, py);
        const colors = ["#ffffff", "#ffd23d", "#ff8a2a", "#ff3d8b", "#c05ae0", "#7ff3ff"];
        for (let i = 0; i < colors.length; i++) {
          const a = centerA + (i / colors.length - 0.5) * 0.55;
          const grd = ctx.createLinearGradient(0, 0, Math.cos(a) * 1200, Math.sin(a) * 1200);
          grd.addColorStop(0, colors[i]);
          grd.addColorStop(1, "rgba(0,0,0,0)");
          ctx.strokeStyle = grd;
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 14 + Math.sin(t * 30 + i) * 4;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * 1200, Math.sin(a) * 1200);
          ctx.stroke();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
        const grd2 = ctx.createRadialGradient(px, py, 2, px, py, 90);
        grd2.addColorStop(0, "rgba(255,255,255,0.9)");
        grd2.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grd2;
        ctx.beginPath();
        ctx.arc(px, py, 90, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    void world;
    void packColor;
  }

  // src/lib/game/engine.ts
  var LAYOUT_W = 1080;
  var DestroyEngine = class {
    constructor(cb) {
      this.canvas = null;
      this.ctx = null;
      this.raf = 0;
      this.last = 0;
      this.acc = 0;
      this.running = false;
      this.paused = false;
      this.world = new World();
      this.player = null;
      this.es = newWeaponEntities();
      this.bg = null;
      this.camX = 0;
      this.camY = 0;
      this.shake = 0;
      this.shakeX = 0;
      this.shakeY = 0;
      this.viewW = 800;
      this.viewH = 600;
      this.dpr = 1;
      this.input = {
        left: false,
        right: false,
        jump: false,
        jumpPressed: false,
        down: false,
        fire: false,
        alt: false,
        altPressed: false,
        aimX: 0,
        aimY: 0,
        wheel: 0
      };
      this.keysDown = /* @__PURE__ */ new Set();
      this.statsT = 0;
      this.pctMax = 0;
      this.startTime = 0;
      this.done = false;
      this.fps = 60;
      this.fpsAcc = 0;
      this.fpsN = 0;
      this.site = "";
      this.weaponNameT = 0;
      this.mouseInside = true;
      this.backdropCanvas = null;
      this.opts = null;
      this.fireHeld = false;
      this.milestonesPassed = /* @__PURE__ */ new Set();
      this.cb = cb;
      this.loop = this.loop.bind(this);
    }
    setCanvas(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.resize();
    }
    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      this.viewW = Math.max(320, Math.floor(rect.width));
      this.viewH = Math.max(240, Math.floor(rect.height));
      this.canvas.width = Math.floor(this.viewW * this.dpr);
      this.canvas.height = Math.floor(this.viewH * this.dpr);
    }
    async start(opts) {
      this.opts = opts;
      this.site = opts.url === "demo" ? "\u063A\u064A\u0631 \u0642\u0627\u0628\u0644 \u0644\u0644\u062A\u062F\u0645\u064A\u0631" : opts.url.replace(/^https?:\/\//, "");
      this.cb.onProgress("\u062C\u0644\u0628 \u0627\u0644\u0635\u0641\u062D\u0629\u2026", 0.06);
      const resp = await fetch(`/api/page?url=${encodeURIComponent(opts.url)}`);
      if (!resp.ok) {
        let msg = "\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0648\u0642\u0639.";
        try {
          const j = await resp.json();
          if (j.error) msg = j.error;
        } catch {
        }
        throw new Error(msg);
      }
      const html = await resp.text();
      const level = await buildLevel(html, opts.url === "demo" ? "https://demo.local/" : `https://${opts.url.replace(/^https?:\/\//, "")}`, LAYOUT_W, (m, p) => {
        this.cb.onProgress(m, p);
      });
      await this.startWithLevel(level, this.site, opts.bgTheme);
    }
    async startWithLevel(level, siteTitle = "\u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u062D\u0627\u0644\u064A", bgTheme = "grid") {
      this.done = false;
      this.paused = false;
      this.pctMax = 0;
      this.milestonesPassed.clear();
      this.es = newWeaponEntities();
      this.site = siteTitle;
      sound.ensure();
      this.backdropCanvas = level.backdropCanvas || null;
      const pageGW = Math.ceil(level.W / CELL);
      const pageGH = Math.ceil(level.H / CELL);
      const skyPx = SKY_ROWS * CELL;
      const bottomPx = 130;
      this.world.onElementGone = void 0;
      this.world.init(level.W, level.H + skyPx + bottomPx);
      if (level.bodies && level.bodies.length > 0) {
        this.world.loadBodies(level.bodies, level.W, level.H, skyPx);
      } else {
        this.world.loadFromLoader(level.colors, level.owners, level.elements, pageGW, pageGH);
      }
      this.bg = buildBackgrounds(Math.max(900, this.viewW), Math.max(700, this.viewH), bgTheme);
      let spawnX = level.W / 2;
      let spawnY = skyPx + 20;
      outer: for (let cy = 2; cy < this.world.GH - 4; cy++) {
        for (let cx = Math.floor(this.world.GW / 4); cx < this.world.GW - 4; cx += 2) {
          if (this.world.mat[this.world.idx(cx, cy)] !== MAT_EMPTY && this.world.mat[this.world.idx(cx, cy - 1)] === MAT_EMPTY) {
            let ok = true;
            for (let hy = Math.max(1, cy - 24); hy < cy; hy++) {
              for (let hx = -6; hx <= 6; hx += 3) {
                const xx = cx + hx;
                if (xx < 0 || xx >= this.world.GW) continue;
                if (this.world.mat[this.world.idx(xx, hy)] !== MAT_EMPTY) {
                  ok = false;
                  break;
                }
              }
              if (!ok) break;
            }
            if (!ok) continue;
            spawnX = cx * CELL;
            spawnY = cy * CELL - 1;
            break outer;
          }
        }
      }
      let clear = true;
      for (let dy = 1; dy <= 24; dy += 4) {
        for (let dx = -12; dx <= 12; dx += 4) {
          if (this.world.solidAtWorld(spawnX + dx, spawnY - dy)) {
            clear = false;
            break;
          }
        }
        if (!clear) break;
      }
      if (!clear) this.world.damageCircle(spawnX, spawnY - 22, 26, { debris: false });
      this.player = new Player(spawnX, spawnY);
      this.player.weaponIdx = 0;
      this.camX = Math.max(0, Math.min(level.W - this.viewW, spawnX - this.viewW / 2));
      this.camY = Math.max(0, spawnY - this.viewH / 2);
      this.startTime = performance.now();
      this.done = false;
      this.cb.onProgress("\u0627\u0643\u062A\u0645\u0644!", 1);
      window.__daw = this;
      sound.start();
      this.running = true;
      this.last = performance.now();
      if (!this.raf) this.raf = requestAnimationFrame(this.loop);
    }
    stop() {
      this.running = false;
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
      this.player = null;
    }
    setPaused(p) {
      this.paused = p;
      if (!p) this.last = performance.now();
    }
    setBgTheme(theme) {
      this.bg = buildBackgrounds(Math.max(900, this.viewW), Math.max(700, this.viewH), theme);
    }
    // ---- input plumbing (called by React component) ----
    onKey(e, down) {
      const k = e.key.toLowerCase();
      if (down) {
        if (this.keysDown.has(k)) return;
        this.keysDown.add(k);
      } else this.keysDown.delete(k);
      switch (k) {
        case "a":
        case "arrowleft":
          this.input.left = down;
          break;
        case "d":
        case "arrowright":
          this.input.right = down;
          break;
        case " ":
        case "w":
        case "arrowup":
          if (down && !this.input.jump) this.input.jumpPressed = true;
          this.input.jump = down;
          e.preventDefault();
          break;
        case "s":
        case "arrowdown":
          this.input.down = down;
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
        case "0": {
          if (down) {
            const n = k === "0" ? 9 : parseInt(k) - 1;
            this.selectWeapon(n);
          }
          break;
        }
        case "q":
          if (down) this.selectWeapon((this.player?.weaponIdx ?? 0 + 1) % WEAPONS.length);
          break;
        case "escape":
        case "p":
          if (down) this.cb.onPauseRequest();
          break;
      }
    }
    selectWeapon(n) {
      if (!this.player || n === this.player.weaponIdx || n < 0 || n >= WEAPONS.length) return;
      this.player.weaponIdx = n;
      this.player.switchT = 0;
      this.player.cooldown = 0.12;
      sound.switch(0);
      this.weaponNameT = 1.4;
    }
    onMouseMove(x, y) {
      this.input.aimX = x + this.camX;
      this.input.aimY = y + this.camY;
      this.mouseInside = true;
    }
    onMouseDown(btn) {
      if (btn === 0) {
        this.input.fire = true;
      } else if (btn === 2) {
        this.input.altPressed = true;
        this.input.alt = true;
      }
    }
    onMouseUp(btn) {
      if (btn === 0) this.input.fire = false;
      else if (btn === 2) this.input.alt = false;
    }
    onWheel(dy) {
      if (!this.player) return;
      const dir = dy > 0 ? 1 : -1;
      this.selectWeapon((this.player.weaponIdx + dir + WEAPONS.length) % WEAPONS.length);
    }
    onTouchAim(x, y, down) {
      this.input.aimX = x + this.camX;
      this.input.aimY = y + this.camY;
      this.input.fire = down;
    }
    // ---- main loop ----
    loop(now) {
      this.raf = 0;
      if (!this.running) return;
      this.raf = requestAnimationFrame(this.loop);
      let dt = (now - this.last) / 1e3;
      this.last = now;
      if (this.paused) return;
      if (dt > 0.1) dt = 0.1;
      this.fpsAcc += dt;
      this.fpsN++;
      if (this.fpsAcc >= 0.5) {
        this.fps = Math.round(this.fpsN / this.fpsAcc);
        this.fpsAcc = 0;
        this.fpsN = 0;
      }
      this.acc += dt;
      const STEP = 1 / 120;
      let steps = 0;
      while (this.acc >= STEP && steps < 8) {
        this.stepGame(STEP);
        this.acc -= STEP;
        steps++;
      }
      this.render();
      this.acc = Math.min(this.acc, 0.1);
      this.statsT += dt;
      if (this.statsT > 0.1) {
        this.statsT = 0;
        this.emitStats();
      }
    }
    stepGame(dt) {
      const world = this.world;
      const p = this.player;
      if (!p) return;
      const inp = { ...this.input, jumpPressed: this.input.jumpPressed, altPressed: this.input.altPressed };
      this.input.jumpPressed = false;
      this.input.altPressed = false;
      if (this.input.wheel !== 0) {
        this.onWheel(this.input.wheel);
        this.input.wheel = 0;
      }
      p.step(world, inp, dt);
      const w = WEAPONS[p.weaponIdx];
      const cfg = ConfigManager.get().getConfig();
      const wTune = cfg.weapons[w.id] || { cooldownMul: 1 };
      if (inp.fire && p.cooldown <= 0 && !this.done) {
        if (w.kind === "drone") {
          if ((!this.es.drone || this.es.drone.state === 2) && this.es.droneCd <= 0) {
            this.es.drone = { x: p.x + p.facing * 24, y: p.y - 64, vx: 0, vy: 0, battery: 12, maxBattery: 12, state: 0, fireT: 0, rampK: 0, lowBeepT: 0 };
            sound.droneBeep(0);
            this.weaponNameT = 1.2;
          }
          p.cooldown = 0.35 * (wTune.cooldownMul ?? 1);
        } else if (w.auto || !this.fireHeld) {
          const pan = 0;
          fireWeapon(world, this.es, w, p.x, p.y - 34, p.aim, pan, (s) => this.shake = Math.max(this.shake, s), (vx, vy) => p.impulse(vx, vy), () => {
            p.shots++;
            p.flashT = 0.06;
            p.kickRotV -= w.kick * 0.35;
          });
          p.cooldown = w.cooldown * (wTune.cooldownMul ?? 1);
          this.fireHeld = true;
        }
      }
      if (!inp.fire) this.fireHeld = false;
      if (p.chargeT <= 0 && p.weaponIdx === 4 && this.fireHeld && p.cooldown > 0.8) {
      }
      if (inp.altPressed && p.grenadeCd <= 0 && !this.done) {
        const d2 = this.es.drone;
        if (d2 && d2.state === 0 && Math.hypot(d2.x - p.x, d2.y - p.y) < 900) {
          d2.state = 1;
          d2.vx = p.vx;
          d2.vy = 100;
          sound.droneBeep(0);
        } else {
          throwGrenade(world, this.es, p.x + Math.cos(p.aim) * 20, p.y - 34 + Math.sin(p.aim) * 20, p.aim, GRENADE.speed);
          p.grenadeCd = GRENADE.cooldown;
        }
        this.input.alt = false;
      }
      stepEntities(world, this.es, dt, p.x, p.y, { x: this.input.aimX, y: this.input.aimY });
      const d = this.es.drone;
      if (d && d.state === 0 && this.input.fire && d.battery > 0) {
        d.fireT = (d.fireT ?? 0) - dt;
        if (d.fireT <= 0) {
          d.fireT = 0.09;
          const dx = this.input.aimX - d.x;
          const dy = this.input.aimY - d.y;
          const dd = Math.hypot(dx, dy) || 1;
          void dd;
          const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.1;
          const sp = 2700;
          spawnBullet(this.es, d.x, d.y, Math.cos(a) * sp, Math.sin(a) * sp, 16, 5, "#7ff3ff");
          sound.shot("drone", 0.5, 0);
          d.battery -= 0.12;
          p.shots++;
        }
      }
      world.step(dt);
      const targetX = p.x - this.viewW / 2 + Math.cos(p.aim) * 40;
      const targetY = p.y - this.viewH / 2 - 40 + Math.sin(p.aim) * 24;
      const k = 1 - Math.exp(-dt / 0.09);
      this.camX += (targetX - this.camX) * k;
      this.camY += (targetY - this.camY) * k;
      this.camX = Math.max(0, Math.min(Math.max(0, world.W - this.viewW), this.camX));
      this.camY = Math.max(0, Math.min(Math.max(0, world.H - this.viewH), this.camY));
      if (this.shake > 0) {
        this.shake = Math.max(0, this.shake - dt * 2.2);
        this.shakeX = (Math.random() - 0.5) * this.shake * 34;
        this.shakeY = (Math.random() - 0.5) * this.shake * 34;
      } else {
        this.shakeX = 0;
        this.shakeY = 0;
      }
      if (this.weaponNameT > 0) this.weaponNameT -= dt;
      const pct = world.destroyedPct();
      if (pct > this.pctMax) this.pctMax = pct;
      const milestones = [
        { pct: 0.25, titleAr: "\u0628\u062F\u0627\u064A\u0629 \u0627\u0644\u0633\u062D\u0642! 25%", titleEn: "25% DEMOLISHED!" },
        { pct: 0.5, titleAr: "\u0633\u0642\u0648\u0637 \u0646\u0635\u0641 \u0627\u0644\u0645\u0648\u0642\u0639! 50%", titleEn: "50% CRUSHED!" },
        { pct: 0.75, titleAr: "\u062A\u062F\u0645\u064A\u0631 \u0634\u0627\u0645\u0644 \u0647\u0627\u0626\u0644! 75%", titleEn: "75% HEAVY DAMAGE!" },
        { pct: 0.9, titleAr: "\u0627\u0644\u0625\u0628\u0627\u062F\u0629 \u0648\u0634\u064A\u0643\u0629! 90%", titleEn: "90% CRITICAL STATUS!" },
        { pct: 0.99, titleAr: "\u0645\u062D\u0648 \u062A\u0627\u0645 \u0644\u0644\u0645\u0648\u0642\u0639! 100%", titleEn: "100% TOTAL ANNIHILATION!" }
      ];
      for (const m of milestones) {
        if (pct >= m.pct && !this.milestonesPassed.has(m.pct)) {
          this.milestonesPassed.add(m.pct);
          sound.milestone();
          this.cb.onMilestone?.(m);
        }
      }
      if (!this.done && pct >= 0.99) {
        this.done = true;
        const time = Math.round((performance.now() - this.startTime) / 1e3);
        sound.complete();
        setTimeout(() => {
          this.cb.onComplete({
            letters: world.lettersPopped,
            blocks: world.blocksBroken,
            explosions: world.explosions,
            shots: p.shots,
            time
          });
        }, 900);
      }
    }
    emitStats() {
      const world = this.world;
      const p = this.player;
      if (!p) return;
      const w = WEAPONS[p.weaponIdx];
      const charCfg = ConfigManager.get().getConfig().character;
      this.cb.onStats({
        pct: world.destroyedPct(),
        pctMax: this.pctMax,
        letters: world.lettersPopped,
        blocks: world.blocksBroken,
        explosions: world.explosions,
        shots: p.shots,
        time: (performance.now() - this.startTime) / 1e3,
        done: this.done,
        weapon: p.weaponIdx,
        weaponName: w.nameAr,
        weaponNameEn: w.nameEn,
        fps: this.fps,
        site: this.site,
        droneBattery: this.es.drone?.battery ?? 0,
        droneCd: this.es.droneCd,
        hasDrone: !!this.es.drone && this.es.drone.state !== 2,
        characterName: charCfg.name
      });
    }
    // ---- render ----
    render() {
      const ctx = this.ctx;
      if (!ctx || !this.player) return;
      const world = this.world;
      ctx.save();
      ctx.scale(this.dpr, this.dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const camX = this.camX + this.shakeX;
      const camY = this.camY + this.shakeY;
      if (this.bg) this.bg.draw(ctx, camX, camY, this.viewW, this.viewH, world.H);
      else {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, this.viewW, this.viewH);
      }
      if (this.backdropCanvas) {
        const pageX = 0 - camX;
        const pageY = SKY_ROWS * CELL - camY;
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
        ctx.shadowBlur = 28;
        ctx.shadowOffsetY = 12;
        ctx.drawImage(this.backdropCanvas, pageX, pageY);
        ctx.restore();
      }
      world.draw(ctx, camX, camY, this.viewW, this.viewH);
      drawEntities(ctx, world, this.es, camX, camY);
      const p = this.player;
      const icon = getWeaponIcon(WEAPONS[p.weaponIdx].id);
      const kx = p.x - camX;
      const ky = p.y - camY;
      const charCfg = ConfigManager.get().getConfig().character;
      drawCharacter(ctx, kx, ky, {
        facing: p.facing,
        runPhase: p.runPhase,
        grounded: p.grounded,
        jetOn: p.jetOn && p.jetK > 0.4,
        flipT: p.flipT,
        tumble: p.tumble,
        vy: p.vy,
        aim: p.aim,
        weapon: icon,
        weaponAnchor: icon ? { dx: 4, dy: icon.height / 2 } : null,
        jetK: p.jetK,
        skin: charCfg.skin,
        colors: {
          head: charCfg.headColor,
          body: charCfg.bodyColor,
          accent: charCfg.accentColor,
          outline: charCfg.outlineColor,
          thruster: charCfg.thrusterColor
        }
      });
      world.drawParticles(ctx, camX, camY);
      const mx = this.input.aimX - camX;
      const my = this.input.aimY - camY;
      ctx.lineCap = "butt";
      for (const pass of [0, 1]) {
        ctx.strokeStyle = pass === 0 ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.95)";
        ctx.lineWidth = pass === 0 ? 4 : 1.6;
        ctx.beginPath();
        ctx.moveTo(mx - 10, my);
        ctx.lineTo(mx - 3, my);
        ctx.moveTo(mx + 3, my);
        ctx.lineTo(mx + 10, my);
        ctx.moveTo(mx, my - 10);
        ctx.lineTo(mx, my - 3);
        ctx.moveTo(mx, my + 3);
        ctx.lineTo(mx, my + 10);
        ctx.stroke();
      }
      if (p.flashT > 0 && WEAPONS[p.weaponIdx].kind !== "wand") {
        const fa = p.aim;
        const fx = p.x + Math.cos(fa) * 32 - camX;
        const fy = p.y - 34 + Math.sin(fa) * 32 - camY;
        ctx.fillStyle = "#fff3a6";
        ctx.beginPath();
        ctx.arc(fx, fy, 7 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };
  var weaponList = WEAPONS;
  var weaponIcons = WEAPON_ICONS;
  var buildIcon = buildSpriteCanvas;

  // src/lib/game/liveExtractor.ts
  var MAX_GLYPHS2 = 5e3;
  var MAX_BOXES2 = 3e3;
  var MAX_H2 = 4800;
  var SKIP_TAGS2 = /* @__PURE__ */ new Set([
    "script",
    "style",
    "noscript",
    "template",
    "head",
    "meta",
    "link",
    "title",
    "iframe",
    "br",
    "source",
    "track",
    "param",
    "object",
    "embed",
    "sup",
    "sub"
  ]);
  var SKIP_CLASSES2 = [
    "mw-jump-link",
    "mw-editsection",
    "noprint",
    "navbox",
    "vector-menu",
    "visually-hidden",
    "sr-only",
    "reference",
    "citation",
    "reflist",
    "mw-indicator",
    "hatnote",
    "infobox-navbar"
  ];
  function parseColor2(s) {
    if (!s) return null;
    const t = s.trim();
    if (t === "transparent" || t === "none" || t === "") return null;
    const m = t.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.%]+))?\s*\)$/i);
    if (m) {
      const a = m[4] ? m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]) : 1;
      if (a <= 0.03) return null;
      const r = Math.round(+m[1]);
      const g = Math.round(+m[2]);
      const b = Math.round(+m[3]);
      return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    }
    if (/^#[0-9a-f]{3,8}$/i.test(t)) {
      if (t.length === 4 || t.length === 5) {
        const r = t[1];
        const g = t[2];
        const b = t[3];
        return `#${r}${r}${g}${g}${b}${b}`;
      }
      if (t.length === 9) {
        const a = parseInt(t.slice(7, 9), 16) / 255;
        if (a <= 0.03) return null;
        return t.slice(0, 7);
      }
      return t.slice(0, 7);
    }
    return null;
  }
  function parseGradient2(bg) {
    const m = bg.match(/linear-gradient\(([^)]*)\)/i);
    if (!m) return null;
    const inner = m[1];
    let angle = 180;
    const parts = [];
    let depth = 0;
    let cur = "";
    for (const ch of inner) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) {
        parts.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());
    let i = 0;
    const first = parts[0];
    const am = first.match(/^([\d.]+)(deg|turn)/i);
    const am2 = first.match(/to\s+(top|bottom|left|right)/i);
    if (am) {
      angle = parseFloat(am[1]);
      if (am[2] === "turn") angle = parseFloat(am[1]) * 360;
      i = 1;
    } else if (am2) {
      const dirs = { top: 0, right: 90, bottom: 180, left: 270 };
      angle = dirs[am2[1]];
      i = 1;
    }
    const stops = [];
    for (; i < parts.length; i++) {
      const pm = parts[i].match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|[a-z]+)\s*([\d.]+%)?/i);
      if (!pm) continue;
      const c = parseColor2(pm[1]) ?? "#888888";
      const p = pm[2] ? parseFloat(pm[2]) / 100 : -1;
      stops.push({ c, p });
    }
    if (stops.length < 2) return null;
    for (let k = 0; k < stops.length; k++) {
      if (stops[k].p < 0) stops[k].p = k / (stops.length - 1);
    }
    return { type: "linear", angle, stops };
  }
  function radiusOf2(s) {
    const raw = (v) => {
      const f = parseFloat(v) || 0;
      return Math.max(0, Math.min(f, 999));
    };
    return [raw(s.borderTopLeftRadius), raw(s.borderTopRightRadius), raw(s.borderBottomRightRadius), raw(s.borderBottomLeftRadius)];
  }
  function parseBoxShadow2(s) {
    if (!s || s === "none" || s.trim() === "") return null;
    const m1 = s.match(/(rgba?\([^)]+\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/);
    if (m1) {
      const blur = parseFloat(m1[4]) || 0;
      if (blur > 0.5) {
        return {
          color: m1[1],
          x: parseFloat(m1[2]) || 0,
          y: parseFloat(m1[3]) || 0,
          blur: Math.min(24, blur)
        };
      }
    }
    return null;
  }
  var rr = (c, x, y, w, h, r) => {
    const maxr = Math.min(w / 2, h / 2);
    const [tl, tr, br, bl] = r.map((v) => Math.min(v, maxr));
    c.beginPath();
    c.moveTo(x + tl, y);
    c.lineTo(x + w - tr, y);
    c.arcTo(x + w, y, x + w, y + tr, tr);
    c.lineTo(x + w, y + h - br);
    c.arcTo(x + w, y + h, x + w - br, y + h, br);
    c.lineTo(x + bl, y + h);
    c.arcTo(x, y + h, x, y + h - bl, bl);
    c.lineTo(x, y + tl);
    c.arcTo(x, y, x + tl, y, tl);
    c.closePath();
  };
  async function extractLiveDocumentLevel(doc, win, onProgress) {
    onProgress?.("\u0642\u0631\u0627\u0621\u0629 \u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u062D\u064A\u2026", 0.15);
    const body = doc.body;
    if (!body) throw new Error("\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u062D\u062A\u0648\u0649 \u0641\u064A \u0627\u0644\u0635\u0641\u062D\u0629");
    const scrollX = win.scrollX || doc.documentElement.scrollLeft || 0;
    const scrollY = win.scrollY || doc.documentElement.scrollTop || 0;
    const W2 = Math.max(1040, win.innerWidth);
    const H = Math.min(MAX_H2, Math.max(win.innerHeight, doc.documentElement.scrollHeight, body.scrollHeight));
    const backdropCv = document.createElement("canvas");
    backdropCv.width = W2;
    backdropCv.height = H;
    const bctx = backdropCv.getContext("2d");
    const csHtml = win.getComputedStyle(doc.documentElement);
    const csBody = win.getComputedStyle(body);
    const pageBg = parseColor2(csBody.backgroundColor) ?? parseColor2(csHtml.backgroundColor) ?? "#ffffff";
    bctx.fillStyle = pageBg;
    bctx.fillRect(0, 0, W2, H);
    const boxes = [];
    const glyphs = [];
    let glyphCount = 0;
    let boxCount = 0;
    let blockIdCounter = 0;
    const walk = (node, curBlockId = 0) => {
      if (boxes.length + glyphs.length > MAX_BOXES2 + MAX_GLYPHS2) return;
      const tag = node.tagName.toLowerCase();
      if (SKIP_TAGS2.has(tag)) return;
      if (node.id === "jahdar-root") return;
      if (node.className && typeof node.className === "string") {
        const cls = node.className.toLowerCase();
        if (SKIP_CLASSES2.some((sc) => cls.includes(sc))) return;
      }
      const cs = win.getComputedStyle(node);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") return;
      const op = parseFloat(cs.opacity || "1");
      if (op < 0.02) return;
      let blockId = curBlockId;
      const isButton = tag === "button" || node.getAttribute("role") === "button";
      const isHeading = /^h[1-6]$/.test(tag);
      const isBlockTag = /^(p|h[1-6]|li|blockquote|pre|td|th|dt|dd|article|section|header|footer|aside)$/i.test(tag) || isButton || isHeading;
      if (isBlockTag) blockId = ++blockIdCounter;
      const rect = node.getBoundingClientRect();
      const x = rect.left + scrollX;
      const y = rect.top + scrollY;
      const w = rect.width;
      const h = rect.height;
      const isImg = tag === "img";
      const inlineSvg = tag === "svg";
      const anchor = node.closest("a");
      const href = anchor ? anchor.getAttribute("href") : null;
      const shadow = parseBoxShadow2(cs.boxShadow);
      const bwid = parseFloat(cs.borderLeftWidth) || 0;
      const hasBorder = bwid > 0 && parseColor2(cs.borderLeftColor) !== null;
      const hasVisibleBackground = parseColor2(cs.backgroundColor) !== null || /gradient\(/i.test(cs.backgroundImage || "");
      const visibleBox = (hasVisibleBackground || hasBorder || isImg || inlineSvg) && w >= 4 && h >= 4 && boxCount < MAX_BOXES2;
      if (visibleBox) {
        let bg = parseColor2(cs.backgroundColor);
        let grad = /gradient\(/i.test(cs.backgroundImage || "") ? parseGradient2(cs.backgroundImage) : null;
        let image = null;
        let imgFit = cs.objectFit || "cover";
        if (isImg) {
          image = node;
        } else if (inlineSvg && w >= 6 && h >= 6) {
          try {
            const clone = node.cloneNode(true);
            if (!clone.getAttribute("xmlns")) {
              clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            }
            clone.setAttribute("width", `${Math.round(w)}`);
            clone.setAttribute("height", `${Math.round(h)}`);
            const xml = new XMLSerializer().serializeToString(clone);
            const svgImg = new Image();
            svgImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
            image = svgImg;
          } catch {
          }
        }
        const isScenery = w >= W2 - 12 && h >= H - 12 || w >= W2 * 0.85 && h >= 220;
        let border = null;
        if (hasBorder) {
          const bc = parseColor2(cs.borderLeftColor);
          if (bc) border = { w: Math.min(10, bwid), c: bc };
        }
        boxes.push({
          x,
          y,
          w,
          h,
          radius: radiusOf2(cs),
          bg,
          grad,
          border,
          shadow,
          image,
          imgFit,
          opacity: op,
          tag,
          semanticRole: anchor && href ? "portal" : isButton ? "trigger" : isHeading ? "structure" : "platform",
          href: anchor && href ? href : void 0,
          isScenery
        });
        boxCount++;
      }
      if (glyphCount < MAX_GLYPHS2) {
        const childNodes = Array.from(node.childNodes);
        for (let cIdx = 0; cIdx < childNodes.length && glyphCount < MAX_GLYPHS2; cIdx++) {
          const childNode = childNodes[cIdx];
          if (childNode.nodeType !== Node.TEXT_NODE) continue;
          const tn = childNode;
          const txt = tn.data;
          if (txt.trim().length === 0) continue;
          const pcs = win.getComputedStyle(node);
          const fs = parseFloat(pcs.fontSize) || 16;
          if (fs < 7) continue;
          const fill = parseColor2(pcs.webkitTextFillColor) ?? parseColor2(pcs.color) ?? "#111111";
          const fam = pcs.fontFamily || "sans-serif";
          const weight = pcs.fontWeight || "400";
          const style = pcs.fontStyle === "italic" ? "italic " : "";
          const font = `${style}${weight} ${fs}px ${fam}`;
          const range = doc.createRange();
          const len = txt.length;
          let i = 0;
          while (i < len && glyphCount < MAX_GLYPHS2) {
            while (i < len && !txt[i].trim()) i++;
            if (i >= len) break;
            let j = i;
            while (j < len && txt[j].trim()) j++;
            if (j > i) {
              try {
                range.setStart(tn, i);
                range.setEnd(tn, j);
                const r = range.getBoundingClientRect();
                if (r.width > 0 && r.height > 0) {
                  const wx = r.left + scrollX;
                  const wy = r.top + scrollY;
                  if (wx > -50 && wx < W2 + 50 && wy > -20 && wy < H + 50) {
                    const wordText = txt.slice(i, j);
                    glyphs.push({
                      ch: wordText,
                      x: wx,
                      y: wy,
                      w: r.width,
                      h: r.height,
                      base: wy + r.height - (r.height - fs * 0.78) * 0.32,
                      font,
                      color: fill,
                      underline: (pcs.textDecorationLine || "").includes("underline"),
                      fs,
                      blockId,
                      tag,
                      semanticRole: anchor && href ? "portal" : isHeading ? "structure" : isButton ? "trigger" : "platform",
                      href: anchor && href ? href : void 0
                    });
                    glyphCount++;
                  }
                }
              } catch {
              }
            }
            i = j;
          }
        }
      }
      for (const child of Array.from(node.children)) {
        walk(child, blockId);
      }
    };
    for (const child of Array.from(body.children)) walk(child, 0);
    onProgress?.("\u0628\u0646\u0627\u0621 \u0643\u0627\u0626\u0646\u0627\u062A \u062C\u062D\u062F\u0631 \u0627\u0644\u0635\u0644\u0628\u0629\u2026", 0.85);
    for (const b of boxes) {
      if (b.isScenery && b.bg) {
        bctx.save();
        bctx.globalAlpha = b.opacity;
        rr(bctx, b.x, b.y, b.w, b.h, b.radius);
        bctx.fillStyle = b.bg;
        bctx.fill();
        bctx.restore();
      }
    }
    const bodies = [];
    const elements = /* @__PURE__ */ new Map();
    let bodyId = 0;
    for (const bx of boxes) {
      if (bx.isScenery) continue;
      const isImg = bx.image !== null;
      const mass = Math.max(25, Math.round(bx.w * bx.h * 0.03));
      const hp = Math.max(30, Math.round(30 + Math.sqrt(bx.w * bx.h) * 1.2));
      const b = {
        id: bodyId++,
        kind: isImg ? "image" : "box",
        x: bx.x,
        y: bx.y,
        w: bx.w,
        h: bx.h,
        vx: 0,
        vy: 0,
        rot: 0,
        vrot: 0,
        mass,
        hp,
        maxHp: hp,
        anchored: true,
        settled: false,
        settleT: 0,
        destroyed: false,
        burning: 0,
        bg: bx.bg,
        grad: bx.grad,
        radius: bx.radius,
        border: bx.border,
        shadow: bx.shadow,
        image: bx.image,
        imgFit: bx.imgFit,
        tag: bx.tag,
        semanticRole: bx.semanticRole,
        href: bx.href,
        damageDecals: []
      };
      bodies.push(b);
    }
    for (const g of glyphs) {
      const mass = Math.max(8, Math.round(g.w * g.h * 0.07));
      const hp = Math.max(15, Math.round(15 + g.w * 0.35));
      const b = {
        id: bodyId++,
        kind: "word",
        x: g.x,
        y: g.y,
        w: g.w,
        h: g.h,
        baseY: g.base,
        vx: 0,
        vy: 0,
        rot: 0,
        vrot: 0,
        mass,
        hp,
        maxHp: hp,
        anchored: true,
        settled: false,
        settleT: 0,
        destroyed: false,
        burning: 0,
        text: g.ch,
        font: g.font,
        color: g.color,
        underline: g.underline,
        tag: g.tag,
        semanticRole: g.semanticRole,
        href: g.href,
        damageDecals: []
      };
      bodies.push(b);
    }
    return {
      W: W2,
      H,
      bodies,
      colors: new Uint32Array(0),
      owners: new Int32Array(0),
      elements,
      title: doc.title || win.location.hostname,
      backdropCanvas: backdropCv
    };
  }

  // extension/src/content.ts
  var activeEngine = null;
  var jahdarHostEl = null;
  var origHtmlOverflow = "";
  var origBodyOverflow = "";
  var isPhotoMode = false;
  var windowListeners = [];
  function isJahdarActive() {
    return jahdarHostEl !== null && document.getElementById("jahdar-root") !== null;
  }
  function teardownJahdar() {
    if (activeEngine) {
      try {
        activeEngine.stop();
      } catch (e) {
        console.warn("Error stopping engine:", e);
      }
      activeEngine = null;
    }
    document.documentElement.style.overflow = origHtmlOverflow;
    if (document.body) {
      document.body.style.overflow = origBodyOverflow;
    }
    for (const { type, handler, opts } of windowListeners) {
      window.removeEventListener(type, handler, opts);
    }
    windowListeners = [];
    if (jahdarHostEl) {
      jahdarHostEl.remove();
      jahdarHostEl = null;
    }
    const existing = document.getElementById("jahdar-root");
    if (existing) existing.remove();
    isPhotoMode = false;
  }
  async function launchJahdar() {
    if (isJahdarActive()) {
      teardownJahdar();
      return;
    }
    origHtmlOverflow = document.documentElement.style.overflow;
    origBodyOverflow = document.body ? document.body.style.overflow : "";
    document.documentElement.style.overflow = "hidden";
    if (document.body) {
      document.body.style.overflow = "hidden";
    }
    const host = document.createElement("div");
    host.id = "jahdar-root";
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.width = "100vw";
    host.style.height = "100vh";
    host.style.zIndex = "2147483647";
    host.style.pointerEvents = "auto";
    host.style.userSelect = "none";
    const shadow = host.attachShadow({ mode: "open" });
    document.documentElement.appendChild(host);
    jahdarHostEl = host;
    const styleEl = document.createElement("style");
    styleEl.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", "Tahoma", sans-serif;
      user-select: none;
      -webkit-user-select: none;
    }

    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #090d16;
      color: #f3f4f6;
    }

    #jahdar-viewport {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      cursor: crosshair;
      z-index: 1;
    }

    /* HUD Container */
    #hud-layer {
      position: absolute;
      inset: 0;
      z-index: 10;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 16px 20px;
      transition: opacity 0.25s ease;
    }

    #hud-layer.photo-hidden {
      opacity: 0;
      pointer-events: none;
    }

    /* Top Bar */
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: rgba(9, 13, 22, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 16px;
      padding: 10px 18px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      pointer-events: auto;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
      direction: rtl;
    }

    .brand-title {
      font-size: 16px;
      font-weight: 800;
      color: #fef08a;
      letter-spacing: -0.3px;
      text-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
    }

    .site-pill {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 3px 10px;
      font-size: 11px;
      color: #38bdf8;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      direction: ltr;
      font-family: monospace;
    }

    .meter-section {
      flex: 1;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meter-labels {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11.5px;
      direction: rtl;
    }

    .pct-val {
      font-weight: 800;
      color: #f59e0b;
      font-size: 14px;
      text-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
    }

    .meter-counts {
      color: #94a3b8;
      font-size: 11px;
    }

    .progress-track {
      height: 8px;
      background: #1e293b;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
    }

    .progress-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b);
      background-size: 200% 100%;
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.8);
      border-radius: 6px;
      transition: width 0.15s ease-out;
    }

    .actions-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .hud-btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: #e2e8f0;
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      direction: rtl;
    }

    .hud-btn:hover {
      background: #334155;
      border-color: #f59e0b;
      color: #fef08a;
      transform: translateY(-1px);
    }

    .hud-btn-danger {
      background: rgba(185, 28, 28, 0.3);
      border-color: #ef4444;
      color: #fca5a5;
    }

    .hud-btn-danger:hover {
      background: #dc2626;
      color: #fff;
      border-color: #f87171;
    }

    .fps-badge {
      font-size: 11px;
      font-family: monospace;
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 8px;
      border-radius: 8px;
    }

    /* Bottom Weapon Bar */
    .weapon-bar-wrap {
      display: flex;
      justify-content: center;
      pointer-events: auto;
    }

    .weapon-bar {
      display: flex;
      gap: 6px;
      background: rgba(9, 13, 22, 0.92);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 18px;
      padding: 8px 12px;
      box-shadow: 0 8px 36px rgba(0, 0, 0, 0.7);
      max-width: 95vw;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .weapon-bar::-webkit-scrollbar {
      display: none;
    }

    .weapon-card {
      position: relative;
      background: #111827;
      border: 1px solid #1f293d;
      border-radius: 12px;
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      min-width: 68px;
      transition: all 0.18s ease;
    }

    .weapon-card:hover {
      background: #1e293b;
      border-color: #64748b;
      transform: translateY(-2px);
    }

    .weapon-card.active {
      background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
      border-color: #f59e0b;
      box-shadow: 0 0 16px rgba(245, 158, 11, 0.5), inset 0 0 8px rgba(245, 158, 11, 0.2);
      transform: translateY(-4px);
    }

    .weapon-hotkey {
      position: absolute;
      top: 3px;
      left: 5px;
      font-size: 9.5px;
      font-family: monospace;
      font-weight: 700;
      color: #94a3b8;
    }

    .weapon-card.active .weapon-hotkey {
      color: #fef08a;
    }

    .weapon-canvas {
      width: 32px;
      height: 32px;
      image-rendering: pixelated;
      margin-top: 4px;
    }

    .weapon-name {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 600;
      white-space: nowrap;
    }

    .weapon-card.active .weapon-name {
      color: #fef08a;
      font-weight: 800;
    }

    /* Milestone Banner */
    #milestone-banner {
      position: absolute;
      top: 86px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95));
      color: #0b0f19;
      padding: 12px 28px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(245, 158, 11, 0.6);
      font-size: 17px;
      font-weight: 900;
      text-align: center;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 20;
      direction: rtl;
    }

    #milestone-banner.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    /* Photo Mode Watermark */
    #photo-watermark {
      position: absolute;
      bottom: 20px;
      right: 24px;
      z-index: 15;
      background: rgba(9, 13, 22, 0.75);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(245, 158, 11, 0.4);
      padding: 8px 16px;
      border-radius: 12px;
      color: #fef08a;
      font-size: 12px;
      font-weight: 700;
      direction: rtl;
      display: none;
      pointer-events: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    /* Splash / Loading Screen */
    #loading-splash {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, #111827 0%, #090d16 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      z-index: 50;
      transition: opacity 0.3s ease;
      direction: rtl;
    }

    .splash-card {
      background: rgba(17, 24, 39, 0.85);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 32px 40px;
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8);
      max-width: 440px;
      text-align: center;
    }

    .splash-title {
      font-size: 24px;
      font-weight: 900;
      color: #fef08a;
      text-shadow: 0 0 16px rgba(245, 158, 11, 0.5);
    }

    .splash-desc {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
    }

    .splash-progress-track {
      width: 100%;
      height: 10px;
      background: #1e293b;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .splash-progress-fill {
      height: 100%;
      width: 10%;
      background: linear-gradient(90deg, #f59e0b, #38bdf8);
      border-radius: 8px;
      transition: width 0.15s ease-out;
    }

    .splash-status-text {
      font-size: 12px;
      color: #38bdf8;
      font-family: monospace;
    }
  `;
    shadow.appendChild(styleEl);
    const rootWrap = document.createElement("div");
    rootWrap.style.width = "100%";
    rootWrap.style.height = "100%";
    rootWrap.style.position = "relative";
    rootWrap.innerHTML = `
    <!-- Canvas for Engine -->
    <canvas id="jahdar-viewport"></canvas>

    <!-- Milestone Banner -->
    <div id="milestone-banner"></div>

    <!-- Photo Mode Watermark -->
    <div id="photo-watermark">
      <span>\u2694\uFE0F \u062C\u064E\u062D\u0652\u062F\u064E\u0631 \u2014 \u0642\u0627\u0647\u0631 \u0639\u0645\u0627\u0644\u0642\u0629 \u0627\u0644\u0648\u064A\u0628</span>
      <span style="color: #94a3b8; margin: 0 4px;">|</span>
      <span id="photo-site-name"></span>
    </div>

    <!-- HUD Layer -->
    <div id="hud-layer">
      <!-- Top Bar -->
      <div class="top-bar">
        <div class="brand-section">
          <span class="brand-title">\u062C\u064E\u062D\u0652\u062F\u064E\u0631</span>
          <div class="site-pill" id="site-pill">\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...</div>
        </div>

        <div class="meter-section">
          <div class="meter-labels">
            <span class="pct-val" id="pct-val">0% \u062F\u0645\u0627\u0631</span>
            <span class="meter-counts" id="meter-counts">0 \u062C\u0633\u0645 \u0635\u0644\u0628 | 0 \u062D\u0631\u0641</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
        </div>

        <div class="actions-section">
          <div class="fps-badge" id="fps-badge">60 FPS</div>
          <button class="hud-btn" id="mute-btn" title="\u0643\u062A\u0645 / \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0635\u0648\u062A [M]">\u{1F50A} \u0635\u0648\u062A</button>
          <button class="hud-btn" id="photo-btn" title="\u0648\u0636\u0639 \u0627\u0644\u062A\u0635\u0648\u064A\u0631 \u0627\u0644\u062A\u0630\u0643\u0627\u0631\u064A [H]">\u{1F4F7} \u0644\u0642\u0637\u0629</button>
          <button class="hud-btn hud-btn-danger" id="exit-btn" title="\u062E\u0631\u0648\u062C \u0641\u0648\u0631\u064A [Esc]">\u274C \u062E\u0631\u0648\u062C</button>
        </div>
      </div>

      <!-- Bottom Weapon Bar -->
      <div class="weapon-bar-wrap">
        <div class="weapon-bar" id="weapon-bar"></div>
      </div>
    </div>

    <!-- Loading Splash -->
    <div id="loading-splash">
      <div class="splash-card">
        <div style="font-size: 40px;">\u2694\uFE0F</div>
        <h2 class="splash-title">\u062C\u064E\u062D\u0652\u062F\u064E\u0631 \u2014 \u0642\u0627\u0647\u0631 \u0639\u0645\u0627\u0644\u0642\u0629 \u0627\u0644\u0648\u064A\u0628</h2>
        <p class="splash-desc">\u062C\u0627\u0631\u064A \u062A\u0641\u0643\u064A\u0643 \u0634\u0641\u0631\u0629 \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u062D\u064A\u0629 \u0648\u062A\u062D\u0648\u064A\u0644 \u0639\u0646\u0627\u0635\u0631\u0647\u0627 \u0625\u0644\u0649 \u0623\u062C\u0633\u0627\u0645 \u0635\u0644\u0628\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062A\u062F\u0645\u064A\u0631 \u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0626\u064A...</p>
        <div class="splash-progress-track">
          <div class="splash-progress-fill" id="splash-fill"></div>
        </div>
        <span class="splash-status-text" id="splash-status">\u0642\u0631\u0627\u0621\u0629 DOM \u0627\u0644\u062D\u064A...</span>
      </div>
    </div>
  `;
    shadow.appendChild(rootWrap);
    const canvas = shadow.getElementById("jahdar-viewport");
    const hudLayer = shadow.getElementById("hud-layer");
    const sitePill = shadow.getElementById("site-pill");
    const pctVal = shadow.getElementById("pct-val");
    const meterCounts = shadow.getElementById("meter-counts");
    const progressFill = shadow.getElementById("progress-fill");
    const fpsBadge = shadow.getElementById("fps-badge");
    const muteBtn = shadow.getElementById("mute-btn");
    const photoBtn = shadow.getElementById("photo-btn");
    const exitBtn = shadow.getElementById("exit-btn");
    const weaponBar = shadow.getElementById("weapon-bar");
    const milestoneBanner = shadow.getElementById("milestone-banner");
    const photoWatermark = shadow.getElementById("photo-watermark");
    const photoSiteName = shadow.getElementById("photo-site-name");
    const loadingSplash = shadow.getElementById("loading-splash");
    const splashFill = shadow.getElementById("splash-fill");
    const splashStatus = shadow.getElementById("splash-status");
    const siteTitle = document.title || window.location.hostname;
    sitePill.textContent = window.location.hostname || siteTitle;
    photoSiteName.textContent = window.location.hostname || siteTitle;
    const weaponCards = [];
    weaponList.forEach((w, idx) => {
      const card = document.createElement("div");
      card.className = `weapon-card ${idx === 0 ? "active" : ""}`;
      card.dataset.idx = idx.toString();
      const hotkey = document.createElement("span");
      hotkey.className = "weapon-hotkey";
      hotkey.textContent = idx === 9 ? "0" : (idx + 1).toString();
      card.appendChild(hotkey);
      const iconSpr = weaponIcons[w.id];
      if (iconSpr) {
        const cv2 = buildIcon(iconSpr, 2);
        cv2.className = "weapon-canvas";
        card.appendChild(cv2);
      }
      const nameSpan = document.createElement("span");
      nameSpan.className = "weapon-name";
      nameSpan.textContent = w.nameAr;
      card.appendChild(nameSpan);
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        if (activeEngine) {
          activeEngine.selectWeapon(idx);
          updateActiveWeapon(idx);
        }
      });
      weaponBar.appendChild(card);
      weaponCards.push(card);
    });
    function updateActiveWeapon(idx) {
      weaponCards.forEach((c, i) => {
        if (i === idx) c.classList.add("active");
        else c.classList.remove("active");
      });
    }
    let milestoneTimer = null;
    function showMilestone(info) {
      milestoneBanner.textContent = `\u{1F4A5} [${info.pct}% \u062F\u0645\u0627\u0631] ${info.titleAr}`;
      milestoneBanner.classList.add("show");
      if (milestoneTimer) clearTimeout(milestoneTimer);
      milestoneTimer = setTimeout(() => {
        milestoneBanner.classList.remove("show");
      }, 4500);
    }
    function togglePhotoMode() {
      isPhotoMode = !isPhotoMode;
      if (isPhotoMode) {
        hudLayer.classList.add("photo-hidden");
        photoWatermark.style.display = "block";
      } else {
        hudLayer.classList.remove("photo-hidden");
        photoWatermark.style.display = "none";
      }
    }
    let isMuted = false;
    function toggleMute() {
      isMuted = !isMuted;
      sound.setMuted(isMuted);
      muteBtn.textContent = isMuted ? "\u{1F507} \u0643\u062A\u0645" : "\u{1F50A} \u0635\u0648\u062A";
    }
    muteBtn.addEventListener("click", toggleMute);
    photoBtn.addEventListener("click", togglePhotoMode);
    exitBtn.addEventListener("click", teardownJahdar);
    const onProgress = (msg, pct) => {
      splashStatus.textContent = msg;
      splashFill.style.width = `${Math.round(pct * 100)}%`;
    };
    try {
      onProgress("\u0642\u0631\u0627\u0621\u0629 \u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u062D\u064A\u2026", 0.1);
      const level = await extractLiveDocumentLevel(document, window, onProgress);
      sitePill.textContent = `${window.location.hostname} \u2022 ${level.bodies.length} \u0639\u0646\u0635\u0631 \u0635\u0644\u0628`;
      const engine = new DestroyEngine({
        onProgress,
        onStats: (stats) => {
          pctVal.textContent = `${Math.round(stats.pct)}% \u062F\u0645\u0627\u0631`;
          progressFill.style.width = `${Math.min(100, Math.round(stats.pct))}%`;
          meterCounts.textContent = `\u{1F4A5} ${stats.blocks} \u0635\u0644\u0628 \u0645\u062F\u0645\u0651\u0631 | \u{1F524} ${stats.letters} \u062D\u0631\u0641 \u0645\u0633\u062D\u0648\u0642 | \u{1F4A3} ${stats.explosions} \u062A\u0641\u062C\u064A\u0631`;
          fpsBadge.textContent = `${Math.round(stats.fps)} FPS`;
          updateActiveWeapon(stats.weapon);
        },
        onComplete: (s) => {
          showMilestone({ pct: 100, titleAr: "\u0646\u0635\u0631 \u0643\u0627\u0633\u062D! \u062A\u0645 \u0645\u062D\u0648 \u0627\u0644\u0645\u0648\u0642\u0639 \u0628\u0627\u0644\u0643\u0627\u0645\u0644!", titleEn: "Total Obliteration!" });
        },
        onPauseRequest: () => {
        },
        onMilestone: (m) => {
          showMilestone(m);
        }
      });
      activeEngine = engine;
      engine.setCanvas(canvas);
      await engine.startWithLevel(level, siteTitle, "grid");
      loadingSplash.style.opacity = "0";
      setTimeout(() => {
        loadingSplash.remove();
      }, 350);
      const onResize = () => {
        engine.resize();
      };
      window.addEventListener("resize", onResize);
      windowListeners.push({ type: "resize", handler: onResize });
      const onKeyDown = (e) => {
        if (e.key === "Escape") {
          teardownJahdar();
          return;
        }
        if (e.key === "h" || e.key === "H") {
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            togglePhotoMode();
            return;
          }
        }
        if (e.key === "m" || e.key === "M") {
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            toggleMute();
            return;
          }
        }
        engine.onKey(e, true);
      };
      const onKeyUp = (e) => {
        engine.onKey(e, false);
      };
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      windowListeners.push({ type: "keydown", handler: onKeyDown });
      windowListeners.push({ type: "keyup", handler: onKeyUp });
      canvas.addEventListener("mousemove", (e) => {
        engine.onMouseMove(e.clientX, e.clientY);
      });
      canvas.addEventListener("mousedown", (e) => {
        engine.onMouseDown(e.button);
      });
      canvas.addEventListener("mouseup", (e) => {
        engine.onMouseUp(e.button);
      });
      canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });
      canvas.addEventListener("wheel", (e) => {
        engine.onWheel(e.deltaY);
      }, { passive: true });
    } catch (err) {
      console.error("Failed to launch Jahdar on live page:", err);
      splashStatus.textContent = "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0648\u0642\u0639: " + String(err);
      setTimeout(() => {
        teardownJahdar();
      }, 3e3);
    }
  }
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "TOGGLE_JAHDAR") {
        if (isJahdarActive()) {
          teardownJahdar();
          sendResponse({ status: "closed" });
        } else {
          launchJahdar().then(() => {
            sendResponse({ status: "launched" });
          });
        }
        return true;
      }
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.altKey && e.shiftKey && (e.key === "J" || e.key === "j")) {
      e.preventDefault();
      if (isJahdarActive()) teardownJahdar();
      else launchJahdar();
    }
  });
})();
//# sourceMappingURL=content.js.map
