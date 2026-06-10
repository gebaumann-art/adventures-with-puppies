// NPCManager — spawns and animates friendly background NPCs around the
// world: people, other dogs, cats, birds, and squirrels. All primitives.
// NPCs are atmosphere only: no collision, no interactions, no triggers.
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
  DynamicTexture,
} from '@babylonjs/core';

const DOG_BARKS = ['Woof!', 'Yip!', 'Arf!', 'Bork!'];
const BARK_PROXIMITY = 6;
const BARK_COOLDOWN = 4;     // seconds before this dog can bark again
const BUBBLE_LIFETIME = 1.5; // seconds the bubble stays up
const IDLE_BARK_INTERVAL = [6, 10]; // random ambient bark every 6-10s (any dog)

// ─── Colour palettes ─────────────────────────────────────────────
const SKIN = [0.99, 0.82, 0.65];
const HAIR = [0.30, 0.20, 0.12];

// Puppy Dog Pals pug styles — fur, darker muzzle mask, ear colour,
// lighter chest patch, and a colourful collar per dog.
const PUG_STYLES = [
  { fur: [0.55, 0.58, 0.68], mask: [0.26, 0.27, 0.34], ear: [0.30, 0.31, 0.38], chest: [0.86, 0.87, 0.92], collar: [0.85, 0.15, 0.12] },             // blue-gray pug (like Bingo)
  { fur: [0.80, 0.61, 0.41], mask: [0.34, 0.24, 0.15], ear: [0.40, 0.28, 0.18], chest: [0.93, 0.84, 0.68], collar: [0.15, 0.40, 0.90] },             // tan/brown pug (like Rolly)
  { fur: [0.92, 0.72, 0.35], mask: [0.46, 0.33, 0.15], ear: [0.55, 0.41, 0.20], chest: [0.98, 0.90, 0.70], collar: [0.15, 0.70, 0.30] },             // golden pug
  { fur: [0.95, 0.94, 0.90], mask: [0.42, 0.38, 0.34], ear: [0.45, 0.40, 0.36], chest: [1.0, 1.0, 0.98], collar: [0.95, 0.55, 0.10], spots: true },  // white spotted pug
];

const COLLAR_COLORS = [
  [0.85, 0.15, 0.12], // red
  [0.15, 0.40, 0.90], // blue
  [0.15, 0.70, 0.30], // green
];

const PEOPLE_OUTFITS = [
  { shirt: [1.00, 0.45, 0.60], pants: [0.25, 0.45, 0.95], hair: HAIR },
  { shirt: [0.25, 0.75, 1.00], pants: [0.95, 0.75, 0.20], hair: [0.95, 0.72, 0.30] },
  { shirt: [0.55, 0.90, 0.40], pants: [0.95, 0.45, 0.20], hair: [0.20, 0.13, 0.10] },
];

const PEOPLE_POSITIONS = [
  { x: 30,  z: 50  },
  { x: -30, z: 40  },
  { x: 50,  z: -55 },
];

// Names + dialog pools for each NPC. Order matches the build order so
// person 0 = Mia, dog 0 = Buddy, etc. Dog-themed canned messages.
const PEOPLE_NAMES = ['Mia', 'Leo', 'Sara'];
const PEOPLE_AVATARS = ['👧', '👦', '👩'];
const PEOPLE_DIALOG = [
  [
    'Hi there! 🐾 Your puppy is so cute!',
    'Did you know dogs can learn over 165 words? Smart pups!',
    'I love seeing puppies wag their tails — it means they\'re happy!',
    'Have you tried the Dog Park? My friends play there every day! 🌳',
    'Sometimes I hide bones in the neighborhood — keep your eyes peeled! 🦴',
    'Tell your puppy I said hi! Belly rubs from me! 💕',
  ],
  [
    'Hey! Cool dog you\'ve got there! 🐶',
    'Fun fact: a dog\'s nose print is unique, just like a human\'s fingerprint!',
    'I heard some great trivia spots downtown — go test your knowledge! ❓',
    'Want a snack? My mom bakes the best dog biscuits.',
    'Dogs have been our best friends for over 15,000 years. Pretty wild, right?',
    'See you around! Don\'t forget to train your pup! 💪',
  ],
  [
    'Oh, what a sweet little puppy! 🥰',
    'Did you know puppies sleep up to 18 hours a day? They grow fast!',
    'Bring your dog to the indoor dog park for training — it\'s super fun.',
    'I work at the vet shop downtown. Keep your puppy healthy!',
    'A wagging tail isn\'t always happy — sometimes it means excited or nervous.',
    'Come back and visit me anytime! 👋',
  ],
];

const DOG_NAMES = ['Buddy', 'Coco', 'Max', 'Bella'];
const DOG_DIALOG = [
  'Woof woof! 🐕',
  'Wanna play fetch?! I love balls!',
  'Bark! I just buried a bone over there. Shhh, don\'t tell anyone!',
  'Sniff sniff — you smell like adventure!',
  'My human says I\'m a good boy. I think so too! 🐾',
  'Tail wags = happy! That\'s dog math.',
  'Race you to the tree! Last one there is a slow puppy!',
];

const CAT_COLORS = [
  [0.62, 0.48, 0.72],  // lavender purple — styled like Hissy
  [0.22, 0.20, 0.24],  // charcoal cat
];

const CAT_NAMES = ['Whiskers', 'Shadow'];
const CAT_DIALOG = [
  'Meow! 🐱 That puppy is adorable.',
  'Did you know cats and dogs CAN be best friends? It just takes patience.',
  'Cats sleep up to 15 hours a day — even more than dogs!',
  'Purr... I like watching the birds from the rooftop. 🦜',
  'I won\'t chase your puppy, I promise. Probably. 😼',
  'Meeooow — share your snack?',
];

const BIRD_NAMES = ['Sunny', 'Ruby', 'Sky'];
const BIRD_DIALOG = [
  'Tweet tweet! 🐦 Hi puppy!',
  'I can see the whole world from up here!',
  'Did you know? Some dogs were bred to retrieve birds. Don\'t worry — we\'re friends now!',
  'I love singing in the morning! Do dogs sing too?',
  'Chirp! Watch out for the squirrel — they\'re mischievous!',
  'Fly fly fly! Catch me if you can! 🪶',
];

const SQUIRREL_NAMES = ['Nutmeg', 'Acorn', 'Hazel'];
const SQUIRREL_DIALOG = [
  'Squeak! 🐿️ Got any nuts?',
  'I bury acorns all over — kinda like you and bones!',
  'Did you know squirrels forget where they bury 25% of their nuts? Oops!',
  'I race up trees super fast — wanna see?',
  'Your puppy is too big to climb trees, but I\'ll wave from up here! 👋',
  'Hide-and-seek champion right here! 🌳',
];

// Cats: one perched on a neighbor-house front porch (next to a chimney),
// the other lounging on the grass.
const CAT_POSITIONS = [
  { x: -50, z: 56, onRoof: true,  roofY: 4.0 },  // on porch roof of neighbor 0 (top at ~3.78)
  { x: 25,  z: 60, onRoof: false, roofY: 0   },
];

const BIRD_COLORS = [
  [1.00, 0.85, 0.10],  // sunny yellow
  [0.95, 0.15, 0.12],  // cardinal red
  [0.20, 0.50, 0.95],  // bluebird blue
];

const BIRD_ORBITS = [
  { cx: 0,   cz: 50,  r: 22, y: 11, speed: 0.5,  phase: 0 },
  { cx: -70, cz: 20,  r: 18, y: 9,  speed: 0.7,  phase: 1.5 },
  { cx: 30,  cz: -60, r: 25, y: 12, speed: 0.45, phase: 3 },
];

// Spawn near specific trees (taken from WorldBuilder TREES list).
const SQUIRREL_TREES = [
  [-90, 30],
  [60, 70],
  [110, -40],
];

export class NPCManager {
  constructor(scene) {
    this.scene = scene;
    this.npcs = [];          // {type, root, update(dt)}
    this.t = 0;
  }

  build() {
    this._buildPeople();
    this._buildOtherDogs();
    this._buildCats();
    this._buildBirds();
    this._buildSquirrels();
    this._buildRobotDog();
    this._buildZoneNPCs();
  }

  _mat(name, [r, g, b]) {
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = new Color3(r, g, b);
    m.specularColor = new Color3(0.05, 0.05, 0.05);
    return m;
  }

  // ── People ──────────────────────────────────────────────────────
  _buildPeople() {
    PEOPLE_POSITIONS.forEach((p, i) => {
      const outfit = PEOPLE_OUTFITS[i % PEOPLE_OUTFITS.length];
      const root = new TransformNode(`person_${i}_root`, this.scene);
      root.position = new Vector3(p.x, 0, p.z);

      // Round cartoon-kid body
      const body = MeshBuilder.CreateSphere(`person_${i}_body`, {
        diameter: 1.05, segments: 10,
      }, this.scene);
      body.scaling = new Vector3(0.95, 1.05, 0.85);
      body.position = new Vector3(0, 1.35, 0);
      body.material = this._mat(`person_${i}_bodyMat`, outfit.shirt);
      body.parent = root;

      // Stubby legs (a single cylinder pair stub)
      const legs = MeshBuilder.CreateCylinder(`person_${i}_legs`, {
        height: 0.95, diameter: 0.52,
      }, this.scene);
      legs.position = new Vector3(0, 0.48, 0);
      legs.material = this._mat(`person_${i}_legsMat`, outfit.pants);
      legs.parent = root;

      // Big round head (cartoon proportions)
      const head = MeshBuilder.CreateSphere(`person_${i}_head`, {
        diameter: 0.95, segments: 12,
      }, this.scene);
      head.position = new Vector3(0, 2.25, 0);
      head.material = this._mat(`person_${i}_headMat`, SKIN);
      head.parent = root;

      // Hair (slightly bigger half-sphere on top)
      const hair = MeshBuilder.CreateSphere(`person_${i}_hair`, {
        diameter: 1.02, segments: 10,
      }, this.scene);
      hair.scaling = new Vector3(1, 0.6, 1);
      hair.position = new Vector3(0, 2.50, 0);
      hair.material = this._mat(`person_${i}_hairMat`, outfit.hair);
      hair.parent = root;

      // Big cartoon eyes — whites with dark pupils
      const eyeL = MeshBuilder.CreateSphere(`person_${i}_eyeL`, {
        diameter: 0.18, segments: 8,
      }, this.scene);
      eyeL.position = new Vector3(-0.16, 2.30, 0.40);
      eyeL.material = this._mat(`person_${i}_eyeMat`, [0.97, 0.97, 0.97]);
      eyeL.parent = root;
      const pupilL = MeshBuilder.CreateSphere(`person_${i}_pupilL`, {
        diameter: 0.10, segments: 6,
      }, this.scene);
      pupilL.position = new Vector3(0, 0, 0.06);
      pupilL.material = this._mat(`person_${i}_pupilMat`, [0.10, 0.07, 0.05]);
      pupilL.parent = eyeL;
      const eyeR = eyeL.clone(`person_${i}_eyeR`);
      eyeR.position.x = 0.16;

      // Arms (cylinders) — one is animated to wave for person 0.
      const armPivotL = new TransformNode(`person_${i}_armPivotL`, this.scene);
      armPivotL.parent = root;
      armPivotL.position = new Vector3(-0.52, 1.62, 0);
      const armL = MeshBuilder.CreateCylinder(`person_${i}_armL`, {
        height: 0.85, diameter: 0.20,
      }, this.scene);
      armL.position = new Vector3(0, -0.42, 0);
      armL.material = this._mat(`person_${i}_armMat`, outfit.shirt);
      armL.parent = armPivotL;

      const armPivotR = new TransformNode(`person_${i}_armPivotR`, this.scene);
      armPivotR.parent = root;
      armPivotR.position = new Vector3(0.52, 1.62, 0);
      const armR = MeshBuilder.CreateCylinder(`person_${i}_armR`, {
        height: 0.85, diameter: 0.20,
      }, this.scene);
      armR.position = new Vector3(0, -0.42, 0);
      armR.material = this._mat(`person_${i}_armMatR`, outfit.shirt);
      armR.parent = armPivotR;

      // Random initial facing.
      root.rotation.y = Math.random() * Math.PI * 2;
      root.getChildMeshes().forEach((m) => { m.isPickable = false; });

      const waves = (i === 0); // first person periodically waves
      this.npcs.push({
        type: 'person',
        kind: 'person',
        name: PEOPLE_NAMES[i % PEOPLE_NAMES.length],
        avatar: PEOPLE_AVATARS[i % PEOPLE_AVATARS.length],
        dialogPool: PEOPLE_DIALOG[i % PEOPLE_DIALOG.length],
        root,
        update: (dt) => {
          // Gentle idle sway
          root.rotation.y += Math.sin(this.t * 0.4 + i) * 0.001;
          // Wave animation — every ~5s for ~2s
          if (waves) {
            const cycle = this.t % 5;
            if (cycle < 2) {
              armPivotR.rotation.z = -1.6 + Math.sin(cycle * 8) * 0.4;
            } else {
              armPivotR.rotation.z *= 0.9; // settle
            }
          }
        },
      });
    });
  }

  // ── Pug visual helper ───────────────────────────────────────────
  // Builds a Puppy-Dog-Pals-style mini pug under `root`: a big round head
  // (nearly as big as the body), flat darker muzzle mask, large white eyes
  // with big pupils and shine dots, small floppy forward-folding ears, a
  // curled spiral tail, stubby legs, a lighter chest patch and a colorful
  // collar. Returns { body, head, tailPivot, legPivots } for animation.
  _buildPugVisual(id, root, style, opts = {}) {
    const sitting = !!opts.sitting;
    const fur = this._mat(`${id}_fur`, style.fur);
    const maskMat = this._mat(`${id}_maskMat`, style.mask);
    const earMat = this._mat(`${id}_earMat`, style.ear);
    const chestMat = this._mat(`${id}_chestMat`, style.chest);
    const collarMat = this._mat(`${id}_collarMat`, style.collar);
    const whiteMat = this._mat(`${id}_eyeWhiteMat`, [0.98, 0.98, 0.98]);
    const pupilMat = this._mat(`${id}_pupilMat`, [0.08, 0.07, 0.09]);
    const shineMat = this._mat(`${id}_shineMat`, [1, 1, 1]);
    shineMat.emissiveColor = new Color3(0.7, 0.7, 0.7);
    const tongueMat = this._mat(`${id}_tongueMat`, [0.93, 0.35, 0.40]);

    const bodyY = sitting ? 0.72 : 0.95;
    const headY = sitting ? 1.55 : 1.60;
    const headZ = sitting ? 0.35 : 0.55;

    // Body — small next to the oversized head
    const body = MeshBuilder.CreateSphere(`${id}_body`, {
      diameter: 1.1, segments: 10,
    }, this.scene);
    body.scaling = sitting ? new Vector3(1, 1.0, 0.95) : new Vector3(1, 0.85, 1.25);
    body.position = new Vector3(0, bodyY, 0);
    body.material = fur;
    body.parent = root;

    // Lighter chest patch
    const chest = MeshBuilder.CreateSphere(`${id}_chest`, {
      diameter: 0.62, segments: 8,
    }, this.scene);
    chest.scaling = new Vector3(0.85, 0.9, 0.55);
    chest.position = new Vector3(0, bodyY - 0.06, sitting ? 0.38 : 0.52);
    chest.material = chestMat;
    chest.parent = root;

    // Optional darker spots on the back
    if (style.spots) {
      const spotY = bodyY + (sitting ? 0.42 : 0.32);
      [[-0.22, -0.15], [0.25, 0.12]].forEach(([sx, sz], j) => {
        const spot = MeshBuilder.CreateSphere(`${id}_spot_${j}`, {
          diameter: 0.42, segments: 6,
        }, this.scene);
        spot.scaling = new Vector3(1, 0.35, 1);
        spot.position = new Vector3(sx, spotY, sz);
        spot.material = maskMat;
        spot.parent = root;
      });
    }

    // Big round head
    const head = MeshBuilder.CreateSphere(`${id}_head`, {
      diameter: 1.05, segments: 12,
    }, this.scene);
    head.position = new Vector3(0, headY, headZ);
    head.material = fur;
    head.parent = root;

    // Flat darker muzzle mask
    const mask = MeshBuilder.CreateSphere(`${id}_mask`, {
      diameter: 0.6, segments: 8,
    }, this.scene);
    mask.scaling = new Vector3(1.15, 0.8, 0.6);
    mask.position = new Vector3(0, headY - 0.14, headZ + 0.44);
    mask.material = maskMat;
    mask.parent = root;

    // Nose
    const nose = MeshBuilder.CreateSphere(`${id}_nose`, {
      diameter: 0.14, segments: 6,
    }, this.scene);
    nose.position = new Vector3(0, headY - 0.06, headZ + 0.60);
    nose.material = pupilMat;
    nose.parent = root;

    // Little pink tongue
    const tongue = MeshBuilder.CreateSphere(`${id}_tongue`, {
      diameter: 0.13, segments: 6,
    }, this.scene);
    tongue.scaling = new Vector3(1, 0.5, 0.8);
    tongue.position = new Vector3(0, headY - 0.30, headZ + 0.50);
    tongue.material = tongueMat;
    tongue.parent = root;

    // Large white eyes with big dark pupils + shine dots
    const eyeL = MeshBuilder.CreateSphere(`${id}_eyeL`, {
      diameter: 0.30, segments: 8,
    }, this.scene);
    eyeL.position = new Vector3(-0.21, headY + 0.12, headZ + 0.40);
    eyeL.material = whiteMat;
    eyeL.parent = root;
    const pupilL = MeshBuilder.CreateSphere(`${id}_pupilL`, {
      diameter: 0.17, segments: 6,
    }, this.scene);
    pupilL.position = new Vector3(0, 0, 0.10);
    pupilL.material = pupilMat;
    pupilL.parent = eyeL;
    const shineL = MeshBuilder.CreateSphere(`${id}_shineL`, {
      diameter: 0.06, segments: 4,
    }, this.scene);
    shineL.position = new Vector3(0.04, 0.05, 0.15);
    shineL.material = shineMat;
    shineL.parent = eyeL;
    const eyeR = eyeL.clone(`${id}_eyeR`);
    eyeR.position.x = 0.21;

    // Small floppy forward-folding ears (darker)
    const earL = MeshBuilder.CreateSphere(`${id}_earL`, {
      diameter: 0.34, segments: 6,
    }, this.scene);
    earL.scaling = new Vector3(0.6, 0.95, 0.45);
    earL.position = new Vector3(-0.42, headY + 0.36, headZ + 0.05);
    earL.rotation.z = 0.5;
    earL.rotation.x = 0.4;
    earL.material = earMat;
    earL.parent = root;
    const earR = earL.clone(`${id}_earR`);
    earR.position.x = 0.42;
    earR.rotation.z = -0.5;

    // Collar
    const collar = MeshBuilder.CreateCylinder(`${id}_collar`, {
      height: 0.13, diameter: 0.8, tessellation: 14,
    }, this.scene);
    collar.position = new Vector3(0, headY - 0.40, headZ - 0.10);
    collar.rotation.x = -0.3;
    collar.material = collarMat;
    collar.parent = root;

    // Curled tail — a little spiral of shrinking spheres
    const tailPivot = new TransformNode(`${id}_tailPivot`, this.scene);
    tailPivot.parent = root;
    tailPivot.position = sitting
      ? new Vector3(0, 0.55, -0.45)
      : new Vector3(0, 1.18, -0.62);
    const tailSegs = [
      { d: 0.20, p: [0, 0.00, -0.04] },
      { d: 0.18, p: [0, 0.13, -0.10] },
      { d: 0.16, p: [0, 0.24, -0.02] },
      { d: 0.13, p: [0, 0.19, 0.08] },
    ];
    tailSegs.forEach((seg, j) => {
      const ball = MeshBuilder.CreateSphere(`${id}_tail_${j}`, {
        diameter: seg.d, segments: 6,
      }, this.scene);
      ball.position = new Vector3(seg.p[0], seg.p[1], seg.p[2]);
      ball.material = fur;
      ball.parent = tailPivot;
    });

    // Legs
    const legPivots = [];
    if (sitting) {
      // Haunches + front paws for the sitting pose
      const haunchL = MeshBuilder.CreateSphere(`${id}_haunchL`, {
        diameter: 0.55, segments: 8,
      }, this.scene);
      haunchL.scaling = new Vector3(0.6, 0.9, 1.0);
      haunchL.position = new Vector3(-0.40, 0.35, -0.05);
      haunchL.material = fur;
      haunchL.parent = root;
      const haunchR = haunchL.clone(`${id}_haunchR`);
      haunchR.position.x = 0.40;

      const pawL = MeshBuilder.CreateSphere(`${id}_pawL`, {
        diameter: 0.28, segments: 6,
      }, this.scene);
      pawL.position = new Vector3(-0.28, 0.14, 0.45);
      pawL.material = fur;
      pawL.parent = root;
      const pawR = pawL.clone(`${id}_pawR`);
      pawR.position.x = 0.28;
    } else {
      // Stubby legs (4 small cylinders with pivots so they can swing)
      const legPositions = [
        { x: -0.30, z: 0.42 },
        { x: 0.30,  z: 0.42 },
        { x: -0.30, z: -0.42 },
        { x: 0.30,  z: -0.42 },
      ];
      legPositions.forEach((cfg, j) => {
        const pivot = new TransformNode(`${id}_legPivot_${j}`, this.scene);
        pivot.parent = root;
        pivot.position = new Vector3(cfg.x, 0.52, cfg.z);
        const leg = MeshBuilder.CreateCylinder(`${id}_leg_${j}`, {
          height: 0.55, diameter: 0.24,
        }, this.scene);
        leg.position = new Vector3(0, -0.26, 0);
        leg.material = fur;
        leg.parent = pivot;
        legPivots.push({ pivot, offset: (j === 0 || j === 3) ? 0 : Math.PI });
      });
    }

    root.getChildMeshes().forEach((m) => { m.isPickable = false; });
    return { body, head, tailPivot, legPivots };
  }

  // Derive a pug style from a plain fur colour (used by sitting dogs that
  // are spawned with an explicit colour). Collar colour rotates per seed.
  _pugStyleFrom(color, collarSeed = 0) {
    return {
      fur: color,
      mask: color.map((c) => c * 0.42),
      ear: color.map((c) => c * 0.5),
      chest: color.map((c) => Math.min(1, c * 0.5 + 0.5)),
      collar: COLLAR_COLORS[collarSeed % COLLAR_COLORS.length],
    };
  }

  // ── Other dogs (in the Dog Park) ────────────────────────────────
  _buildOtherDogs() {
    const dogParkCenter = { x: -70, z: 20 };
    const radius = 18;

    for (let i = 0; i < 4; i++) {
      const style = PUG_STYLES[i % PUG_STYLES.length];
      const root = new TransformNode(`npcDog_${i}_root`, this.scene);
      const angle = (i / 4) * Math.PI * 2;
      root.position = new Vector3(
        dogParkCenter.x + Math.cos(angle) * 8,
        0,
        dogParkCenter.z + Math.sin(angle) * 8,
      );
      // Smaller scale than the player dog
      root.scaling = new Vector3(0.7, 0.7, 0.7);

      // Puppy-Dog-Pals-style mini pug (like Bingo & Rolly)
      const { body, tailPivot, legPivots } =
        this._buildPugVisual(`npcDog_${i}`, root, style);

      // Movement state — wander inside the park.
      const state = {
        moving: false,
        targetX: root.position.x,
        targetZ: root.position.z,
        timer: 1.0 + Math.random() * 2.0,
        walkPhase: 0,
        idlePhase: Math.random() * 10,
      };

      // Pre-build the woof bubble (hidden until triggered).
      const bark = this._buildBarkBubble(`npcDog_${i}_bubble`, root, DOG_BARKS[i % DOG_BARKS.length]);

      this.npcs.push({
        type: 'dog',
        kind: 'dog',
        name: DOG_NAMES[i % DOG_NAMES.length],
        avatar: '🐶',
        dialogPool: DOG_DIALOG,
        root,
        // Fields used by the bark system in update():
        barkPhrase: DOG_BARKS[i % DOG_BARKS.length],
        barkCooldown: Math.random() * 2, // small stagger so they don't all bark at once
        barkVisibleFor: 0,
        bark,
        update: (dt) => {
          state.idlePhase += dt;
          state.timer -= dt;

          // Tail wag (always)
          tailPivot.rotation.y = Math.sin(state.idlePhase * 9) * 0.55;

          if (state.timer <= 0) {
            // Pick a new target inside the park (or stop).
            if (state.moving) {
              state.moving = false;
              state.timer = 2 + Math.random() * 3;
            } else {
              state.moving = true;
              const a = Math.random() * Math.PI * 2;
              const r = 4 + Math.random() * (radius - 4);
              state.targetX = dogParkCenter.x + Math.cos(a) * r;
              state.targetZ = dogParkCenter.z + Math.sin(a) * r;
              state.timer = 2 + Math.random() * 2;
            }
          }

          if (state.moving) {
            const dx = state.targetX - root.position.x;
            const dz = state.targetZ - root.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > 0.3) {
              const speed = 3.5;
              const nx = dx / dist;
              const nz = dz / dist;
              root.position.x += nx * speed * dt;
              root.position.z += nz * speed * dt;
              root.rotation.y = Math.atan2(nx, nz);
              state.walkPhase += dt * 9;
              // Legs trot
              legPivots.forEach((leg) => {
                leg.pivot.rotation.x = Math.sin(state.walkPhase + leg.offset) * 0.6;
              });
              // Slight body bounce
              body.position.y = 0.95 + Math.sin(state.walkPhase * 2) * 0.05;
            }
          } else {
            // Settle legs
            legPivots.forEach((leg) => { leg.pivot.rotation.x *= 0.85; });
            body.position.y = 0.95 + Math.sin(state.idlePhase * 2) * 0.02;
          }
        },
      });
    }
  }

  // ── Cats ────────────────────────────────────────────────────────
  _buildCats() {
    CAT_POSITIONS.forEach((p, i) => {
      const color = CAT_COLORS[i % CAT_COLORS.length];
      const root = new TransformNode(`cat_${i}_root`, this.scene);
      root.position = new Vector3(p.x, p.onRoof ? p.roofY : 0, p.z);

      const fur = this._mat(`cat_${i}_fur`, color);
      // Hissy-style darker purple stripes on the purple cat; subtle on the other.
      const stripeMat = this._mat(`cat_${i}_stripeMat`,
        i === 0 ? [0.42, 0.30, 0.55] : [0.11, 0.10, 0.13]);
      const pink = this._mat(`cat_${i}_pink`, [1, 0.55, 0.65]);

      // Body (sitting — egg-shaped)
      const body = MeshBuilder.CreateSphere(`cat_${i}_body`, {
        diameter: 0.9, segments: 10,
      }, this.scene);
      body.scaling = new Vector3(1, 1.1, 1);
      body.position = new Vector3(0, 0.55, 0);
      body.material = fur;
      body.parent = root;

      // Stripes across the back (thin boxes hugging the curve)
      [[-0.20, 0.90], [0.0, 0.98], [0.20, 0.90]].forEach(([sz, sy], j) => {
        const stripe = MeshBuilder.CreateBox(`cat_${i}_stripe_${j}`, {
          width: 0.5, height: 0.06, depth: 0.12,
        }, this.scene);
        stripe.position = new Vector3(0, sy, sz);
        stripe.rotation.x = -sz * 1.2;
        stripe.material = stripeMat;
        stripe.parent = root;
      });

      // Head — big and round
      const head = MeshBuilder.CreateSphere(`cat_${i}_head`, {
        diameter: 0.6, segments: 12,
      }, this.scene);
      head.position = new Vector3(0, 1.10, 0.15);
      head.material = fur;
      head.parent = root;

      // Ears — pointy triangles (small flat cylinders with tessellation 3)
      const earL = MeshBuilder.CreateCylinder(`cat_${i}_earL`, {
        diameterTop: 0, diameterBottom: 0.25, height: 0.3, tessellation: 3,
      }, this.scene);
      earL.position = new Vector3(-0.17, 1.42, 0.12);
      earL.material = fur;
      earL.parent = root;
      const earR = earL.clone(`cat_${i}_earR`);
      earR.position.x = 0.17;

      // Inner ear (pink)
      const innerL = MeshBuilder.CreateCylinder(`cat_${i}_innerL`, {
        diameterTop: 0, diameterBottom: 0.15, height: 0.18, tessellation: 3,
      }, this.scene);
      innerL.position = new Vector3(-0.17, 1.38, 0.14);
      innerL.material = pink;
      innerL.parent = root;
      const innerR = innerL.clone(`cat_${i}_innerR`);
      innerR.position.x = 0.17;

      // Big yellow-green eyes with vertical slit pupils
      const eyeMat = this._mat(`cat_${i}_eyeMat`, [0.84, 0.90, 0.32]);
      const pupilMat = this._mat(`cat_${i}_pupilMat`, [0.07, 0.07, 0.08]);
      const eyeL = MeshBuilder.CreateSphere(`cat_${i}_eyeL`, {
        diameter: 0.16, segments: 8,
      }, this.scene);
      eyeL.position = new Vector3(-0.12, 1.16, 0.38);
      eyeL.material = eyeMat;
      eyeL.parent = root;
      const pupilL = MeshBuilder.CreateSphere(`cat_${i}_pupilL`, {
        diameter: 0.10, segments: 6,
      }, this.scene);
      pupilL.scaling = new Vector3(0.35, 1, 0.5); // vertical slit
      pupilL.position = new Vector3(0, 0, 0.05);
      pupilL.material = pupilMat;
      pupilL.parent = eyeL;
      const eyeR = eyeL.clone(`cat_${i}_eyeR`);
      eyeR.position.x = 0.12;

      // Pink nose
      const nose = MeshBuilder.CreateSphere(`cat_${i}_nose`, {
        diameter: 0.08, segments: 6,
      }, this.scene);
      nose.position = new Vector3(0, 1.04, 0.44);
      nose.material = pink;
      nose.parent = root;

      // Long curvy tail — chained spheres on a pivot (still flicks)
      const tailPivot = new TransformNode(`cat_${i}_tailPivot`, this.scene);
      tailPivot.parent = root;
      tailPivot.position = new Vector3(0, 0.45, -0.40);
      const tailSegs = [
        [0.16, 0.08, -0.12],
        [0.15, 0.28, -0.20],
        [0.14, 0.50, -0.22],
        [0.13, 0.70, -0.14],
        [0.12, 0.84, 0.00],
      ];
      tailSegs.forEach(([d, ty, tz], j) => {
        const seg = MeshBuilder.CreateSphere(`cat_${i}_tail_${j}`, {
          diameter: d, segments: 6,
        }, this.scene);
        seg.position = new Vector3(0, ty, tz);
        seg.material = (j === tailSegs.length - 1) ? stripeMat : fur;
        seg.parent = tailPivot;
      });

      root.getChildMeshes().forEach((m) => { m.isPickable = false; });

      const state = { phase: Math.random() * 6 };

      this.npcs.push({
        type: 'cat',
        kind: 'cat',
        name: CAT_NAMES[i % CAT_NAMES.length],
        avatar: '🐱',
        dialogPool: CAT_DIALOG,
        root,
        update: (dt) => {
          state.phase += dt;
          // Tail flick
          tailPivot.rotation.z = Math.sin(state.phase * 2.5) * 0.4;
          // Occasional head turn (every ~4s)
          head.rotation.y = Math.sin(state.phase * 0.5) * 0.6;
        },
      });
    });
  }

  // ── Birds (flying in circular orbits) ───────────────────────────
  _buildBirds() {
    BIRD_ORBITS.forEach((orbit, i) => {
      const color = BIRD_COLORS[i % BIRD_COLORS.length];
      const root = new TransformNode(`bird_${i}_root`, this.scene);
      root.position = new Vector3(orbit.cx + orbit.r, orbit.y, orbit.cz);

      // Round, plump cartoon body
      const body = MeshBuilder.CreateSphere(`bird_${i}_body`, {
        diameter: 0.55, segments: 10,
      }, this.scene);
      body.scaling = new Vector3(1, 0.95, 1.15);
      body.material = this._mat(`bird_${i}_bodyMat`, color);
      body.parent = root;

      // Lighter belly patch
      const belly = MeshBuilder.CreateSphere(`bird_${i}_belly`, {
        diameter: 0.42, segments: 8,
      }, this.scene);
      belly.scaling = new Vector3(0.9, 0.8, 0.9);
      belly.position = new Vector3(0, -0.10, 0.10);
      belly.material = this._mat(`bird_${i}_bellyMat`,
        color.map((c) => Math.min(1, c * 0.45 + 0.55)));
      belly.parent = root;

      // Beak
      const beak = MeshBuilder.CreateCylinder(`bird_${i}_beak`, {
        diameterTop: 0, diameterBottom: 0.11, height: 0.20, tessellation: 6,
      }, this.scene);
      beak.rotation.x = Math.PI / 2;
      beak.position = new Vector3(0, 0, 0.36);
      beak.material = this._mat(`bird_${i}_beakMat`, [1, 0.65, 0.1]);
      beak.parent = root;

      // Big cartoon eyes (white + pupil, both sides)
      const eyeL = MeshBuilder.CreateSphere(`bird_${i}_eyeL`, {
        diameter: 0.11, segments: 6,
      }, this.scene);
      eyeL.position = new Vector3(-0.15, 0.08, 0.18);
      eyeL.material = this._mat(`bird_${i}_eyeMat`, [0.97, 0.97, 0.97]);
      eyeL.parent = root;
      const pupilL = MeshBuilder.CreateSphere(`bird_${i}_pupilL`, {
        diameter: 0.06, segments: 4,
      }, this.scene);
      pupilL.position = new Vector3(0, 0, 0.045);
      pupilL.material = this._mat(`bird_${i}_pupilMat`, [0.05, 0.05, 0.05]);
      pupilL.parent = eyeL;
      const eyeR = eyeL.clone(`bird_${i}_eyeR`);
      eyeR.position.x = 0.15;

      // Wings (flapping) — slightly darker for contrast
      const wingL = MeshBuilder.CreateBox(`bird_${i}_wingL`, {
        width: 0.55, height: 0.06, depth: 0.34,
      }, this.scene);
      wingL.position = new Vector3(-0.30, 0.05, 0);
      wingL.material = this._mat(`bird_${i}_wingMat`, color.map((c) => c * 0.8));
      wingL.parent = root;
      const wingR = wingL.clone(`bird_${i}_wingR`);
      wingR.position.x = 0.30;

      // Tail feathers
      const tailF = MeshBuilder.CreateBox(`bird_${i}_tailF`, {
        width: 0.18, height: 0.05, depth: 0.30,
      }, this.scene);
      tailF.position = new Vector3(0, 0.05, -0.38);
      tailF.rotation.x = -0.3;
      tailF.material = wingL.material;
      tailF.parent = root;

      root.getChildMeshes().forEach((m) => { m.isPickable = false; });

      const state = { angle: orbit.phase };

      this.npcs.push({
        type: 'bird',
        kind: 'bird',
        name: BIRD_NAMES[i % BIRD_NAMES.length],
        avatar: '🐦',
        dialogPool: BIRD_DIALOG,
        root,
        update: (dt) => {
          state.angle += dt * orbit.speed;
          const x = orbit.cx + Math.cos(state.angle) * orbit.r;
          const z = orbit.cz + Math.sin(state.angle) * orbit.r;
          root.position.x = x;
          root.position.z = z;
          root.position.y = orbit.y + Math.sin(state.angle * 2) * 0.3;
          // Face direction of travel (tangent)
          root.rotation.y = Math.atan2(-Math.sin(state.angle), Math.cos(state.angle));
          // Wings flap rapidly
          const flap = Math.sin(this.t * 18) * 0.6;
          wingL.rotation.z = flap;
          wingR.rotation.z = -flap;
        },
      });
    });
  }

  // ── Squirrels (hopping near trees) ──────────────────────────────
  _buildSquirrels() {
    SQUIRREL_TREES.forEach(([tx, tz], i) => {
      const root = new TransformNode(`squirrel_${i}_root`, this.scene);
      root.position = new Vector3(tx + 1.5, 0, tz + 1.5);

      // Warm orange-brown cartoon squirrel
      const brown = this._mat(`squirrel_${i}_brown`, [0.80, 0.45, 0.18]);
      const dark = this._mat(`squirrel_${i}_dark`, [0.45, 0.22, 0.08]);
      const cream = this._mat(`squirrel_${i}_cream`, [0.97, 0.85, 0.62]);

      // Body
      const body = MeshBuilder.CreateSphere(`squirrel_${i}_body`, {
        diameter: 0.5, segments: 8,
      }, this.scene);
      body.scaling = new Vector3(1, 0.9, 1.3);
      body.position = new Vector3(0, 0.35, 0);
      body.material = brown;
      body.parent = root;

      // Cream belly patch
      const belly = MeshBuilder.CreateSphere(`squirrel_${i}_belly`, {
        diameter: 0.30, segments: 6,
      }, this.scene);
      belly.scaling = new Vector3(0.9, 1, 0.7);
      belly.position = new Vector3(0, 0.32, 0.18);
      belly.material = cream;
      belly.parent = root;

      // Head
      const head = MeshBuilder.CreateSphere(`squirrel_${i}_head`, {
        diameter: 0.35, segments: 8,
      }, this.scene);
      head.position = new Vector3(0, 0.55, 0.25);
      head.material = brown;
      head.parent = root;

      // Eyes
      const eyeMat = this._mat(`squirrel_${i}_eyeMat`, [0.04, 0.03, 0.02]);
      const eyeL = MeshBuilder.CreateSphere(`squirrel_${i}_eyeL`, {
        diameter: 0.07, segments: 6,
      }, this.scene);
      eyeL.position = new Vector3(-0.08, 0.6, 0.4);
      eyeL.material = eyeMat;
      eyeL.parent = root;
      const eyeR = eyeL.clone(`squirrel_${i}_eyeR`);
      eyeR.position.x = 0.08;

      // Tiny nose
      const nose = MeshBuilder.CreateSphere(`squirrel_${i}_nose`, {
        diameter: 0.05, segments: 4,
      }, this.scene);
      nose.position = new Vector3(0, 0.55, 0.43);
      nose.material = dark;
      nose.parent = root;

      // Big fluffy tail — two stacked spheres (tip is cream)
      const tail = MeshBuilder.CreateSphere(`squirrel_${i}_tail`, {
        diameter: 0.60, segments: 10,
      }, this.scene);
      tail.scaling = new Vector3(1, 1.15, 0.85);
      tail.position = new Vector3(0, 0.55, -0.40);
      tail.material = brown;
      tail.parent = root;
      const tailTip = MeshBuilder.CreateSphere(`squirrel_${i}_tailTip`, {
        diameter: 0.42, segments: 8,
      }, this.scene);
      tailTip.position = new Vector3(0, 0.42, 0.10);
      tailTip.material = cream;
      tailTip.parent = tail;

      // Ears (tiny, fur-coloured)
      const earL = MeshBuilder.CreateSphere(`squirrel_${i}_earL`, {
        diameter: 0.10, segments: 6,
      }, this.scene);
      earL.position = new Vector3(-0.09, 0.74, 0.20);
      earL.material = brown;
      earL.parent = root;
      const earR = earL.clone(`squirrel_${i}_earR`);
      earR.position.x = 0.09;

      root.getChildMeshes().forEach((m) => { m.isPickable = false; });

      const state = {
        timer: Math.random() * 2,
        hopping: false,
        hopPhase: 0,
        dir: Math.random() * Math.PI * 2,
        baseX: tx + 1.5,
        baseZ: tz + 1.5,
      };

      this.npcs.push({
        type: 'squirrel',
        kind: 'squirrel',
        name: SQUIRREL_NAMES[i % SQUIRREL_NAMES.length],
        avatar: '🐿️',
        dialogPool: SQUIRREL_DIALOG,
        root,
        update: (dt) => {
          state.timer -= dt;
          if (state.timer <= 0) {
            state.hopping = !state.hopping;
            state.timer = state.hopping ? 1.0 : 2.0;
            if (state.hopping) {
              state.dir = Math.random() * Math.PI * 2;
              state.hopPhase = 0;
            }
          }

          if (state.hopping) {
            state.hopPhase += dt;
            const speed = 2.5;
            const nx = Math.sin(state.dir);
            const nz = Math.cos(state.dir);
            let nextX = root.position.x + nx * speed * dt;
            let nextZ = root.position.z + nz * speed * dt;
            // Keep within 5 units of base
            const ddx = nextX - state.baseX;
            const ddz = nextZ - state.baseZ;
            if (Math.sqrt(ddx * ddx + ddz * ddz) < 5) {
              root.position.x = nextX;
              root.position.z = nextZ;
            }
            // Hop arc (sin curve over the hop)
            root.position.y = Math.abs(Math.sin(state.hopPhase * 8)) * 0.3;
            root.rotation.y = state.dir;
          } else {
            // Idle little tail twitch
            tail.rotation.z = Math.sin(this.t * 4) * 0.15;
            root.position.y = 0;
          }
        },
      });
    });
  }

  // ── A.R.F. — Auto-Doggy Robotic Friend (robot dog near the houses) ─
  _buildRobotDog() {
    const root = new TransformNode('npc_arf_root', this.scene);
    root.position = new Vector3(10, 0, 42);
    root.rotation.y = Math.PI; // face toward the street

    const bodyMat = this._mat('npc_arf_bodyMat', [0.88, 0.89, 0.92]);
    const grayMat = this._mat('npc_arf_grayMat', [0.62, 0.64, 0.70]);
    const visorMat = this._mat('npc_arf_visorMat', [0.06, 0.09, 0.14]);
    visorMat.emissiveColor = new Color3(0.05, 0.28, 0.38);
    const redMat = this._mat('npc_arf_redMat', [0.95, 0.12, 0.10]);
    redMat.emissiveColor = new Color3(0.5, 0.05, 0.04);

    // Boxy light body
    const body = MeshBuilder.CreateBox('npc_arf_body', {
      width: 1.1, height: 0.85, depth: 1.6,
    }, this.scene);
    body.position = new Vector3(0, 0.95, 0);
    body.material = bodyMat;
    body.parent = root;

    // Panel details — small coloured buttons along the side
    [[0.95, 0.75, 0.10], [0.20, 0.70, 0.35], [0.20, 0.45, 0.95]].forEach((c, j) => {
      const btn = MeshBuilder.CreateBox(`npc_arf_btn_${j}`, {
        width: 0.06, height: 0.14, depth: 0.18,
      }, this.scene);
      btn.position = new Vector3(0.56, 1.05, -0.35 + j * 0.30);
      btn.material = this._mat(`npc_arf_btnMat_${j}`, c);
      btn.parent = root;
    });

    // Chest hatch panel
    const hatch = MeshBuilder.CreateBox('npc_arf_hatch', {
      width: 0.5, height: 0.4, depth: 0.06,
    }, this.scene);
    hatch.position = new Vector3(0, 0.92, 0.80);
    hatch.material = grayMat;
    hatch.parent = root;

    // Stubby cylinder legs
    [[-0.38, 0.55], [0.38, 0.55], [-0.38, -0.55], [0.38, -0.55]].forEach(([lx, lz], j) => {
      const leg = MeshBuilder.CreateCylinder(`npc_arf_leg_${j}`, {
        height: 0.55, diameter: 0.26,
      }, this.scene);
      leg.position = new Vector3(lx, 0.28, lz);
      leg.material = grayMat;
      leg.parent = root;
    });

    // Cylindrical head on a node so it can scan side to side
    const headNode = new TransformNode('npc_arf_headNode', this.scene);
    headNode.parent = root;
    headNode.position = new Vector3(0, 1.75, 0.55);

    const head = MeshBuilder.CreateCylinder('npc_arf_head', {
      height: 0.7, diameter: 0.85, tessellation: 16,
    }, this.scene);
    head.material = bodyMat;
    head.parent = headNode;

    // Visor — dark glowing eye band
    const visor = MeshBuilder.CreateBox('npc_arf_visor', {
      width: 0.62, height: 0.20, depth: 0.10,
    }, this.scene);
    visor.position = new Vector3(0, 0.07, 0.40);
    visor.material = visorMat;
    visor.parent = headNode;

    // Robo-ears — angled little slabs
    const earL = MeshBuilder.CreateBox('npc_arf_earL', {
      width: 0.10, height: 0.30, depth: 0.22,
    }, this.scene);
    earL.position = new Vector3(-0.45, 0.32, -0.05);
    earL.rotation.z = 0.5;
    earL.material = grayMat;
    earL.parent = headNode;
    const earR = earL.clone('npc_arf_earR');
    earR.position.x = 0.45;
    earR.rotation.z = -0.5;

    // Antenna with a little red light on top
    const antenna = MeshBuilder.CreateCylinder('npc_arf_antenna', {
      height: 0.40, diameter: 0.05,
    }, this.scene);
    antenna.position = new Vector3(0, 0.55, 0);
    antenna.material = grayMat;
    antenna.parent = headNode;
    const light = MeshBuilder.CreateSphere('npc_arf_light', {
      diameter: 0.15, segments: 8,
    }, this.scene);
    light.position = new Vector3(0, 0.80, 0);
    light.material = redMat;
    light.parent = headNode;

    // Wagging robo-tail
    const tailPivot = new TransformNode('npc_arf_tailPivot', this.scene);
    tailPivot.parent = root;
    tailPivot.position = new Vector3(0, 1.25, -0.80);
    const tail = MeshBuilder.CreateCylinder('npc_arf_tail', {
      height: 0.45, diameter: 0.08,
    }, this.scene);
    tail.position = new Vector3(0, 0.18, -0.08);
    tail.rotation.x = -0.6;
    tail.material = grayMat;
    tail.parent = tailPivot;
    const tailTip = MeshBuilder.CreateSphere('npc_arf_tailTip', {
      diameter: 0.14, segments: 6,
    }, this.scene);
    tailTip.position = new Vector3(0, 0.38, -0.20);
    tailTip.material = redMat;
    tailTip.parent = tailPivot;

    root.getChildMeshes().forEach((m) => { m.isPickable = false; });

    const bark = this._buildBarkBubble('npc_arf_bubble', root, 'Beep boop!');
    const idleOffset = Math.random() * 10;

    this.npcs.push({
      type: 'dog',
      kind: 'dog',
      name: 'A.R.F.',
      avatar: '🤖',
      dialogPool: [
        'ARF! A.R.F. stands for Auto-Doggy Robotic Friend!',
        'Beep boop! Want to play fetch?',
        'Scanning... friendly puppy detected! Tail-wag protocol activated!',
        'My battery is at 100% — fully charged for fun!',
      ],
      root,
      barkPhrase: 'Beep boop!',
      barkCooldown: Math.random() * 2,
      barkVisibleFor: 0,
      bark,
      update: (_dt) => {
        // Antenna light pulse, slow head scan, happy tail wag
        const s = 1 + Math.sin((this.t + idleOffset) * 4) * 0.15;
        light.scaling.set(s, s, s);
        headNode.rotation.y = Math.sin((this.t + idleOffset) * 0.8) * 0.5;
        tailPivot.rotation.y = Math.sin((this.t + idleOffset) * 8) * 0.5;
      },
    });
  }

  // ── Zone NPCs ────────────────────────────────────────────────────
  // Shared helper: build a single person NPC at (x, z) with a given outfit
  // and optional name suffix override.  Returns the pushed npcs entry.
  _spawnPerson(id, x, z, outfit, name, avatar, dialogPool, opts = {}) {
    const root = new TransformNode(`${id}_root`, this.scene);
    root.position = new Vector3(x, 0, z);
    if (opts.scale) root.scaling = new Vector3(opts.scale, opts.scale, opts.scale);

    // Round cartoon-kid body
    const body = MeshBuilder.CreateSphere(`${id}_body`, {
      diameter: 1.05, segments: 10,
    }, this.scene);
    body.scaling = new Vector3(0.95, 1.05, 0.85);
    body.position = new Vector3(0, 1.35, 0);
    body.material = this._mat(`${id}_bodyMat`, outfit.shirt);
    body.parent = root;

    // Stubby legs
    const legs = MeshBuilder.CreateCylinder(`${id}_legs`, {
      height: 0.95, diameter: 0.52,
    }, this.scene);
    legs.position = new Vector3(0, 0.48, 0);
    legs.material = this._mat(`${id}_legsMat`, outfit.pants);
    legs.parent = root;

    // Big round head (cartoon proportions)
    const head = MeshBuilder.CreateSphere(`${id}_head`, {
      diameter: 0.95, segments: 12,
    }, this.scene);
    head.position = new Vector3(0, 2.25, 0);
    head.material = this._mat(`${id}_headMat`, SKIN);
    head.parent = root;

    // Hair
    const hair = MeshBuilder.CreateSphere(`${id}_hair`, {
      diameter: 1.02, segments: 10,
    }, this.scene);
    hair.scaling = new Vector3(1, 0.6, 1);
    hair.position = new Vector3(0, 2.50, 0);
    hair.material = this._mat(`${id}_hairMat`, outfit.hair);
    hair.parent = root;

    // Hat (optional — graduation cap)
    if (opts.graduationCap) {
      // Brim — wide flat cylinder
      const brim = MeshBuilder.CreateCylinder(`${id}_capBrim`, {
        height: 0.05, diameter: 1.0, tessellation: 12,
      }, this.scene);
      brim.position = new Vector3(0, 2.78, 0);
      brim.material = this._mat(`${id}_capBrimMat`, [0.1, 0.1, 0.1]);
      brim.parent = root;
      // Top — shorter cylinder
      const top = MeshBuilder.CreateCylinder(`${id}_capTop`, {
        height: 0.22, diameter: 0.62, tessellation: 12,
      }, this.scene);
      top.position = new Vector3(0, 2.92, 0);
      top.material = this._mat(`${id}_capTopMat`, [0.1, 0.1, 0.1]);
      top.parent = root;
    }

    // Big cartoon eyes — whites with dark pupils
    const eyeL = MeshBuilder.CreateSphere(`${id}_eyeL`, {
      diameter: 0.18, segments: 8,
    }, this.scene);
    eyeL.position = new Vector3(-0.16, 2.30, 0.40);
    eyeL.material = this._mat(`${id}_eyeMat`, [0.97, 0.97, 0.97]);
    eyeL.parent = root;
    const pupilL = MeshBuilder.CreateSphere(`${id}_pupilL`, {
      diameter: 0.10, segments: 6,
    }, this.scene);
    pupilL.position = new Vector3(0, 0, 0.06);
    pupilL.material = this._mat(`${id}_pupilMat`, [0.10, 0.07, 0.05]);
    pupilL.parent = eyeL;
    const eyeR = eyeL.clone(`${id}_eyeR`);
    eyeR.position.x = 0.16;

    // Arms
    const armPivotL = new TransformNode(`${id}_armPivotL`, this.scene);
    armPivotL.parent = root;
    armPivotL.position = new Vector3(-0.52, 1.62, 0);
    const armL = MeshBuilder.CreateCylinder(`${id}_armL`, {
      height: 0.85, diameter: 0.20,
    }, this.scene);
    armL.position = new Vector3(0, -0.42, 0);
    armL.material = this._mat(`${id}_armMatL`, outfit.shirt);
    armL.parent = armPivotL;

    const armPivotR = new TransformNode(`${id}_armPivotR`, this.scene);
    armPivotR.parent = root;
    armPivotR.position = new Vector3(0.52, 1.62, 0);
    const armR = MeshBuilder.CreateCylinder(`${id}_armR`, {
      height: 0.85, diameter: 0.20,
    }, this.scene);
    armR.position = new Vector3(0, -0.42, 0);
    armR.material = this._mat(`${id}_armMatR`, outfit.shirt);
    armR.parent = armPivotR;

    root.rotation.y = opts.facingY !== undefined ? opts.facingY : Math.random() * Math.PI * 2;
    root.getChildMeshes().forEach((m) => { m.isPickable = false; });

    const idleOffset = Math.random() * 10;
    const waves = !!opts.waves;
    const npc = {
      type: 'person',
      kind: 'person',
      name,
      avatar: avatar || '🧑',
      dialogPool,
      root,
      update: (dt) => {
        root.rotation.y += Math.sin(this.t * 0.4 + idleOffset) * 0.001;
        if (waves) {
          const cycle = this.t % 5;
          if (cycle < 2) {
            armPivotR.rotation.z = -1.6 + Math.sin(cycle * 8) * 0.4;
          } else {
            armPivotR.rotation.z *= 0.9;
          }
        }
      },
    };
    this.npcs.push(npc);
    return npc;
  }

  // Shared helper: build a small sitting dog NPC (no wander — purely decorative).
  _spawnSittingDog(id, x, z, color, name, dialogPool) {
    const root = new TransformNode(`${id}_root`, this.scene);
    root.position = new Vector3(x, 0, z);
    root.scaling = new Vector3(0.55, 0.55, 0.55);

    // Puppy-Dog-Pals-style sitting mini pug
    const style = this._pugStyleFrom(color, id.length);
    const { head, tailPivot } = this._buildPugVisual(id, root, style, { sitting: true });

    root.rotation.y = Math.random() * Math.PI * 2;

    const bark = this._buildBarkBubble(`${id}_bubble`, root, DOG_BARKS[0]);
    const idleOffset = Math.random() * 10;

    const npc = {
      type: 'dog',
      kind: 'dog',
      name,
      avatar: '🐶',
      dialogPool,
      root,
      barkPhrase: DOG_BARKS[0],
      barkCooldown: Math.random() * 2,
      barkVisibleFor: 0,
      bark,
      update: (dt) => {
        // Tail wag + gentle head sway
        tailPivot.rotation.y = Math.sin((this.t + idleOffset) * 9) * 0.55;
        head.rotation.y = Math.sin((this.t + idleOffset) * 0.6) * 0.2;
      },
    };
    this.npcs.push(npc);
    return npc;
  }

  _buildZoneNPCs() {
    // ── ACADEMY (near x=-40, z=-40) ──────────────────────────────────
    // Professor Pawsworth — teacher with graduation cap
    this._spawnPerson(
      'npc_pawsworth', -42, -38,
      { shirt: [0.25, 0.40, 0.65], pants: [0.15, 0.15, 0.25], hair: [0.55, 0.45, 0.35] },
      'Prof. Pawsworth', '🎓',
      [
        'Learning is the greatest adventure!',
        'Did you know dogs can learn over 150 words?',
        'Every question you answer makes your brain stronger!',
        'Science is all around us — even in how dogs smell!',
      ],
      { graduationCap: true, waves: true },
    );

    // Billy — beagle-colored sitting student dog
    this._spawnSittingDog(
      'npc_billy', -38, -43,
      [0.85, 0.70, 0.50],  // beagle tan
      'Billy',
      [
        'I just learned multiplication today!',
        'Reading is my favorite subject!',
        'Did you finish today\'s challenge?',
      ],
    );

    // Sunny — golden-colored sitting student dog
    this._spawnSittingDog(
      'npc_sunny_dog', -44, -43,
      [0.92, 0.75, 0.30],  // golden
      'Sunny',
      [
        'I just learned multiplication today!',
        'Reading is my favorite subject!',
        'Did you finish today\'s challenge?',
      ],
    );

    // ── LIBRARY (near x=40, z=-90) ────────────────────────────────────
    // Librarian Rosa
    this._spawnPerson(
      'npc_rosa', 42, -88,
      { shirt: [0.70, 0.40, 0.70], pants: [0.30, 0.20, 0.40], hair: [0.20, 0.15, 0.12] },
      'Librarian Rosa', '📚',
      [
        'Shh... just kidding! Read loud and proud!',
        'We just got new books about dog heroes!',
        'Reading 20 minutes a day makes you a superstar reader!',
        'Did you know the longest novel ever written has over 9 million words?',
      ],
      { waves: false },
    );

    // Hamlet — reading dog sitting on a box
    {
      const id = 'npc_hamlet';
      // The box he sits on
      const boxSeat = MeshBuilder.CreateBox(`${id}_seat`, {
        width: 1.0, height: 0.6, depth: 0.8,
      }, this.scene);
      boxSeat.position = new Vector3(38, 0.3, -92);
      boxSeat.material = this._mat(`${id}_seatMat`, [0.55, 0.35, 0.20]);
      boxSeat.isPickable = false;

      // Tiny book lying open in front of him
      const book = MeshBuilder.CreateBox(`${id}_book`, {
        width: 0.45, height: 0.06, depth: 0.35,
      }, this.scene);
      book.position = new Vector3(38, 0.65, -91.4);
      book.material = this._mat(`${id}_bookMat`, [0.85, 0.92, 0.98]);
      book.isPickable = false;

      // The dog itself — sitting on the box (y offset by 0.6 for box height)
      const root = new TransformNode(`${id}_root`, this.scene);
      root.position = new Vector3(38, 0.6, -92);
      root.scaling = new Vector3(0.55, 0.55, 0.55);
      root.rotation.y = -0.4;  // facing slightly toward the book

      // Chocolate Puppy-Dog-Pals-style sitting pug with a green collar
      const style = this._pugStyleFrom([0.30, 0.22, 0.18], 2);
      const { head, tailPivot } = this._buildPugVisual(id, root, style, { sitting: true });
      // Tilt head down as if reading
      head.rotation.x = 0.35;

      const bark = this._buildBarkBubble(`${id}_bubble`, root, 'Woof!');

      this.npcs.push({
        type: 'dog',
        kind: 'dog',
        name: 'Hamlet',
        avatar: '🐶',
        dialogPool: [
          'Woof! (I\'m on Chapter 7!)',
          'Books smell almost as good as bones!',
          'Hamlet is a great name, right?',
        ],
        root,
        barkPhrase: 'Woof!',
        barkCooldown: Math.random() * 2,
        barkVisibleFor: 0,
        bark,
        update: (_dt) => {
          tailPivot.rotation.y = Math.sin(this.t * 9) * 0.55;
        },
      });
    }

    // ── VET CLINIC (near x=-80, z=-60) ────────────────────────────────
    // Dr. Goodpaws — white coat
    this._spawnPerson(
      'npc_goodpaws', -80, -58,
      { shirt: [0.95, 0.95, 0.97], pants: [0.80, 0.88, 0.95], hair: [0.25, 0.18, 0.14] },
      'Dr. Goodpaws', '🩺',
      [
        'Regular check-ups keep puppies healthy!',
        'Dogs need vaccines to stay safe from diseases!',
        'Exercise is important for dogs AND people!',
        'Did you know dogs have 42 adult teeth?',
      ],
      { waves: false },
    );

    // Nurse Tails
    this._spawnPerson(
      'npc_nursetails', -84, -62,
      { shirt: [0.75, 0.92, 0.85], pants: [0.30, 0.50, 0.65], hair: [0.80, 0.55, 0.30] },
      'Nurse Tails', '💉',
      [
        'Bring your pup in for a check-up soon!',
        'Healthy dogs are happy dogs!',
        'I love helping animals feel better!',
      ],
      { waves: true },
    );

    // ── GARDEN (near x=110, z=20) ─────────────────────────────────────
    // Gardener Pete — earthy colors
    this._spawnPerson(
      'npc_pete', 110, 18,
      { shirt: [0.55, 0.75, 0.35], pants: [0.42, 0.28, 0.18], hair: [0.40, 0.28, 0.18] },
      'Gardener Pete', '🌱',
      [
        'Plants need sunlight, water, and nutrients to grow — just like dogs need exercise, water, and food!',
        'Did you know carrots are good for dogs too?',
        'Photosynthesis is how plants make their own food from sunlight!',
        'Bees pollinate our garden — without them we\'d have no fruits or veggies!',
      ],
      { waves: false },
    );

    // ── BEACH (near x=60, z=110) ──────────────────────────────────────
    // Lifeguard Sam — red and white
    this._spawnPerson(
      'npc_sam', 58, 112,
      { shirt: [0.92, 0.22, 0.18], pants: [0.92, 0.22, 0.18], hair: [0.85, 0.65, 0.20] },
      'Lifeguard Sam', '🏖️',
      [
        'Water safety first! Always swim with a buddy!',
        'Labrador Retrievers are amazing swimmers — they even have webbed feet!',
        'The ocean covers 71% of Earth\'s surface!',
        'Did you know dogs can smell underwater scents?',
      ],
      { waves: true },
    );

    // Sandcastle Sophie — child-sized (scale 0.8)
    this._spawnPerson(
      'npc_sophie', 63, 108,
      { shirt: [0.95, 0.78, 0.35], pants: [0.30, 0.55, 0.88], hair: [0.85, 0.55, 0.25] },
      'Sophie', '🏰',
      [
        'My sandcastle has a moat — that\'s geometry!',
        'Sand is made of tiny pieces of rocks and shells!',
        'I\'m teaching my dog to dig holes for me haha!',
      ],
      { scale: 0.8, waves: false },
    );

    // ── DIG SITE (near x=-30, z=-135) ─────────────────────────────────
    // Archaeologist Dr. Digs — khaki
    this._spawnPerson(
      'npc_drdigs', -30, -133,
      { shirt: [0.82, 0.72, 0.50], pants: [0.68, 0.57, 0.38], hair: [0.30, 0.22, 0.15] },
      'Dr. Digs', '⛏️',
      [
        'We found a 10,000-year-old dog bone here! Dogs have been our friends for a VERY long time.',
        'Archaeology is the study of the past through objects and ruins.',
        'This layer of dirt is from about 500 years ago!',
        'Did you know ancient Egyptians worshipped dogs and had pet greyhounds?',
      ],
      { waves: false },
    );
  }

  // Build a speech-bubble plane parented above an NPC's head. Returns the
  // plane mesh and a setText(phrase) helper that re-paints the DynamicTexture.
  _buildBarkBubble(id, parentRoot, initialText) {
    const plane = MeshBuilder.CreatePlane(id, { width: 1.6, height: 1.0 }, this.scene);
    plane.parent = parentRoot;
    plane.position = new Vector3(0, 2.6, 0);
    plane.billboardMode = 7; // BILLBOARDMODE_ALL — always faces the camera
    plane.isPickable = false;

    const tex = new DynamicTexture(`${id}_tex`, { width: 256, height: 160 }, this.scene, false);
    const mat = new StandardMaterial(`${id}_mat`, this.scene);
    mat.diffuseTexture = tex;
    mat.emissiveColor = new Color3(0.9, 0.9, 0.9);
    mat.useAlphaFromDiffuseTexture = true;
    mat.backFaceCulling = false;
    tex.hasAlpha = true;
    plane.material = mat;
    plane.setEnabled(false);

    const paint = (phrase) => {
      const ctx = tex.getContext();
      ctx.clearRect(0, 0, 256, 160);
      // Rounded white bubble
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1565c0';
      ctx.lineWidth = 6;
      const r = 28;
      const x = 8, y = 8, w = 240, h = 110;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      // bubble tail
      ctx.lineTo(x + w / 2 + 14, y + h);
      ctx.lineTo(x + w / 2, y + h + 28);
      ctx.lineTo(x + w / 2 - 14, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Paw print mark
      ctx.fillStyle = '#90caf9';
      ctx.font = '28px Nunito, sans-serif';
      ctx.fillText('🐾', 20, 50);

      // Phrase text
      ctx.fillStyle = '#1565c0';
      ctx.font = 'bold 42px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(phrase, 128, 60);
      tex.update();
    };
    paint(initialText);

    return { plane, mat, setText: paint };
  }

  // Trigger an NPC dog to bark (shows bubble, sets cooldown).
  _triggerBark(npc) {
    if (!npc.bark) return;
    if (npc.barkCooldown > 0) return;
    npc.bark.setText(npc.barkPhrase);
    npc.bark.plane.setEnabled(true);
    npc.bark.mat.alpha = 1.0;
    npc.barkVisibleFor = BUBBLE_LIFETIME;
    npc.barkCooldown = BARK_COOLDOWN;
  }

  // ── Per-frame update ────────────────────────────────────────────
  update(dt, playerPos) {
    this.t += dt;
    this.npcs.forEach((npc) => npc.update(dt));

    // Dog-bark behaviors: proximity + cooldown + ambient idle bark.
    const dogs = this.npcs.filter((n) => n.kind === 'dog');

    dogs.forEach((npc) => {
      if (npc.barkCooldown > 0) npc.barkCooldown -= dt;
      if (npc.barkVisibleFor > 0) {
        npc.barkVisibleFor -= dt;
        // Fade out toward the end
        if (npc.bark) {
          const fadeStart = 0.4;
          npc.bark.mat.alpha = Math.max(0, Math.min(1, npc.barkVisibleFor / fadeStart));
          if (npc.barkVisibleFor <= 0) npc.bark.plane.setEnabled(false);
        }
      }
      // Proximity trigger
      if (playerPos) {
        const dx = npc.root.position.x - playerPos.x;
        const dz = npc.root.position.z - playerPos.z;
        if (dx * dx + dz * dz < BARK_PROXIMITY * BARK_PROXIMITY) {
          this._triggerBark(npc);
        }
      }
    });

    // Ambient idle bark — one random dog every 6-10s.
    if (this._nextIdleBark === undefined) {
      this._nextIdleBark = IDLE_BARK_INTERVAL[0] + Math.random() *
        (IDLE_BARK_INTERVAL[1] - IDLE_BARK_INTERVAL[0]);
    }
    this._nextIdleBark -= dt;
    if (this._nextIdleBark <= 0 && dogs.length > 0) {
      const pick = dogs[Math.floor(Math.random() * dogs.length)];
      this._triggerBark(pick);
      this._nextIdleBark = IDLE_BARK_INTERVAL[0] + Math.random() *
        (IDLE_BARK_INTERVAL[1] - IDLE_BARK_INTERVAL[0]);
    }
  }

  dispose() {
    this.npcs.forEach((npc) => npc.root.dispose());
    this.npcs = [];
  }
}
