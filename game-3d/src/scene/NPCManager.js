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
  // Mia
  [
    'Hi there! 🐾 Your puppy is so cute!',
    'Did you know dogs can learn over 165 words? Smart pups!',
    'I love seeing puppies wag their tails — it means they\'re happy!',
    'Have you tried the Dog Park? My friends play there every day! 🌳',
    'Sometimes I hide bones in the neighborhood — keep your eyes peeled! 🦴',
    'Tell your puppy I said hi! Belly rubs from me! 💕',
    'Dogs have been human companions for over 15,000 years. That\'s a LOT of belly rubs!',
    'I once counted 32 different tail wag speeds in dogs. Speedy wag = super excited! 🐕',
    'The Dog Show arena looks so cool! Have you competed yet?',
    'I heard there are secret bones near the ocean — go check it out! 🌊',
    'Puppies\' eyes open for the first time at about 2 weeks old. So tiny! 🥺',
    'A dog\'s hearing is 4 times more powerful than a human\'s. No wonder they hear everything!',
  ],
  // Leo
  [
    'Hey! Cool dog you\'ve got there! 🐶',
    'Fun fact: a dog\'s nose print is unique, just like a human\'s fingerprint!',
    'I heard some great trivia spots downtown — go test your knowledge! ❓',
    'Want a snack? My mom bakes the best dog biscuits.',
    'Dogs have been our best friends for over 15,000 years. Pretty wild, right?',
    'See you around! Don\'t forget to train your pup! 💪',
    'Did you know some dogs can smell 100,000 times better than humans? That\'s a superpower! 👃',
    'Border Collies are the smartest dog breed — they can learn 1,000 words!',
    'The fastest dog breed is the Greyhound — they can run 45 miles per hour! 🏃',
    'Dalmatian puppies are born completely white — the spots appear later! 🐕',
    'I\'ve been collecting bones all week — try the areas near the trees! 🌲',
    'Fetch Derby is SO much fun. Try using the zig-zag approach!',
  ],
  // Sara
  [
    'Oh, what a sweet little puppy! 🥰',
    'Did you know puppies sleep up to 18 hours a day? They grow fast!',
    'Bring your dog to the indoor dog park for training — it\'s super fun.',
    'I want to be a vet when I grow up — I love all animals!',
    'A wagging tail isn\'t always happy — sometimes it means excited or nervous.',
    'Come back and visit me anytime! 👋',
    'Dogs dream when they sleep — you can see their paws twitch! 😴',
    'Petting a dog actually lowers your heart rate — it\'s scientifically proven! 💕',
    'Some dogs, like Basenjis, can\'t bark — they yodel instead! Haha 🎵',
    'A puppy\'s baby teeth fall out just like human baby teeth do! 🦷',
    'I always check on the dolphins at the beach — they jump so high! 🐬',
    'The sticker book is so cool — have you unlocked all the stickers yet? ⭐',
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
  'BORK! Did you hear that? I think it was a squirrel! 🐿️',
  'I can sniff out every bone hidden in this neighborhood. Every. Single. One. 🦴',
  'The dog park is my favorite place! All my friends are there! 🌳',
  'I love rolling in the grass. Don\'t judge me. 🌿',
  'Did you know MY nose can tell what the weather will be tomorrow? It\'s science! ☀️',
  'Zooooom! I just ran 3 laps around the park! Still not tired!',
  'One time I chased my tail for 20 minutes. Worth it.',
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
  'I can jump 6 times my own body length. Beat THAT, puppies! 🐾',
  'Cats have 32 muscles in each ear — that\'s how we hear everything. EVERYTHING.',
  'I\'ve been watching those dolphins from the rooftop. Fascinating creatures.',
  'A group of cats is called a clowder. A group of kittens is a kindle. Fancy! ✨',
  'Purrr... the sun is so warm here. Don\'t disturb me. I\'m recharging.',
];

const BIRD_NAMES = ['Sunny', 'Ruby', 'Sky'];
const BIRD_DIALOG = [
  'Tweet tweet! 🐦 Hi puppy!',
  'I can see the whole world from up here!',
  'Did you know? Some dogs were bred to retrieve birds. Don\'t worry — we\'re friends now!',
  'I love singing in the morning! Do dogs sing too?',
  'Chirp! Watch out for the squirrel — they\'re mischievous!',
  'Fly fly fly! Catch me if you can! 🪶',
  'The dolphins are jumping again! I can see them from way up here! 🐬',
  'A bird\'s bones are hollow — that\'s how we fly so easily! So light! ✨',
  'I\'ve flown over every inch of this neighborhood. There are bones EVERYWHERE!',
  'Tweet! I spotted 3 hidden bones near the big oak trees this morning 🌳',
  'Dogs and birds are actually quite similar — we both love the outdoors! 🌿',
];

const SQUIRREL_NAMES = ['Nutmeg', 'Acorn', 'Hazel'];
const SQUIRREL_DIALOG = [
  'Squeak! 🐿️ Got any nuts?',
  'I bury acorns all over — kinda like you and bones!',
  'Did you know squirrels forget where they bury 25% of their nuts? Oops!',
  'I race up trees super fast — wanna see?',
  'Your puppy is too big to climb trees, but I\'ll wave from up here! 👋',
  'Hide-and-seek champion right here! 🌳',
  'A squirrel can find a buried nut under 30 cm of snow! Beat THAT! ❄️',
  'I\'ve hidden 47 acorns today. No, wait — 48. I found one more! 🌰',
  'Some squirrels pretend to bury nuts to fool other animals watching them. Smart! 😏',
  'The bushy tail helps us balance when we leap between branches. Zoom! 🌿',
  'Did you know squirrels can fall from 100 feet without getting hurt? Wheee! 🎉',
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
      const _peopleKeywordMaps = [
        // Mia
        {
          'bone bones': ['I hid some bones near the neighborhood trees — go find them! 🦴', 'Bones are scattered everywhere if you look carefully! They reset every day 🦴'],
          'park': ['The dog park is THE best place to play! 🌳 My dog loves running circles there!', 'See you at the park? My pup loves it there so much!'],
          'dolphin': ['I saw the dolphins jumping this morning — they go SO high! 🐬', 'The dolphins are amazing! I watch them from the beach every morning.'],
          'show': ['The Dog Show is so exciting! I love watching the tricks stage the most ✨', 'Have you competed in the Dog Show yet? You should! It\'s so fun!'],
          'fact': ['Did you know dogs have 18 muscles just to move their ears? Wild! 🐾', 'Dogs can sense human emotions — they know when you\'re sad! 💕'],
          'sticker': ['I heard there are 15 stickers to collect! I\'ve got most of them 🌟', 'The sticker book is SO cool — check the 📖 button!'],
        },
        // Leo
        {
          'bone bones': ['I know a spot near the dig site where bones respawn every day! 🦴', 'Pro tip: check near trees and bushes — that\'s where I always find bones! 🌳'],
          'trivia': ['Downtown trivia spots are where I grind my coins! 💰 Try the blue markers!', 'I got 5 trivia questions right in a row yesterday — new record! ❓'],
          'fetch derby': ['The Fetch Derby is SO much fun! Orange ball, zoom zoom! 🟠', 'I got first place in Fetch Derby yesterday! Zig-zag approach is the secret 🎯'],
          'agility': ['The agility course has 6 hurdles and weave poles and a tunnel! 🏃 Try it!', 'I made it through the agility course in under 30 seconds! New best! ⏱️'],
          'breed': ['I love all dog breeds but Border Collies are the smartest! 🐕', 'Did you know Dalmatians are born completely white? The spots come later! 🐾'],
          'fast': ['Greyhounds can run 45 miles per hour — that\'s the fastest dog! 🏃', 'I wish I could run as fast as a dog... I\'ve been practicing though! 💨'],
        },
        // Sara
        {
          'vet': ['Dr. Goodpaws is so nice! Always keep your pup healthy 🩺', 'Regular vet check-ups keep puppies happy and growing fast! ❤️'],
          'grow growth': ['Your puppy grows faster when you train them and answer trivia! ⭐', 'I love watching puppies grow into adults — it\'s so cool! 🐾'],
          'sleep': ['Puppies sleep SO much because they\'re growing! It\'s totally normal 😴', 'Dogs dream during sleep — you can see their paws twitching! 🐾'],
          'sticker collection': ['I have 12 out of 15 stickers! Almost there! 🌟', 'The sticker book shows everything you\'ve accomplished — so satisfying! ⭐'],
          'fish fishing': ['The fishing dock is amazing! I caught a trivia question there yesterday 🎣', 'Did you know Labs have webbed feet and LOVE to swim? 🐕'],
          'ocean water': ['The ocean is so beautiful at dawn! The dolphins jump at sunrise 🌅', 'I love how the water moves — it looks so real! 🌊'],
        },
      ];
      const _peopleSuggestions = [
        ['Tell me a dog fact! 🐾', 'Where are hidden bones? 🦴', 'What\'s fun to do? 🎮', 'Bye! 👋'],
        ['Cool dog facts? 🐶', 'Best mini-game? 🎯', 'Any trivia tips? ❓', 'See ya! 👋'],
        ['Puppy tips? 🐾', 'Did you find any bones? 🦴', 'Fun facts? 🌟', 'Bye for now! 💕'],
      ];
      const _peopleGreetings = [
        { morning: 'Good morning! ☀️ Your puppy looks so happy today!', afternoon: 'Hey! Great afternoon for a walk with your pup! 🌤️', evening: 'Nice evening! The sunset is beautiful tonight 🌅', night: 'Up late? 🌙 Make sure your puppy gets enough rest!', default: 'Hi there! 🐾 Your puppy is so cute!' },
        { morning: 'Morning! ☀️ Perfect day to explore the neighborhood!', afternoon: 'Hey hey! 🐶 Up for some trivia downtown?', evening: 'Hey! Golden hour is perfect for fetch! 🌅', night: 'Whoa, it\'s late! 🌙 Even dogs need sleep haha', default: 'Hey! Cool dog you\'ve got there! 🐶' },
        { morning: 'Good morning! 🌸 Puppies are extra cuddly in the morning!', afternoon: 'Hi! 🥰 Such a nice day for some puppy adventures!', evening: 'Evening! ✨ The neighborhood looks so cozy right now', night: 'Oh hi! 🌙 It\'s getting late — sweet dreams to your pup!', default: 'Oh, what a sweet little puppy! 🥰' },
      ];
      this.npcs.push({
        type: 'person',
        kind: 'person',
        name: PEOPLE_NAMES[i % PEOPLE_NAMES.length],
        avatar: PEOPLE_AVATARS[i % PEOPLE_AVATARS.length],
        dialogPool: PEOPLE_DIALOG[i % PEOPLE_DIALOG.length],
        keywordMap: _peopleKeywordMaps[i % _peopleKeywordMaps.length],
        suggestions: _peopleSuggestions[i % _peopleSuggestions.length],
        greetings: _peopleGreetings[i % _peopleGreetings.length],
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

      const _dogKeywordMaps = [
        { 'fetch ball': ['FETCH! I\'ll get it I\'ll get it I\'ll get IIIT! 🟠', 'Ball = best thing ever invented. Science fact!'], 'bone': ['I can smell bones from 50 feet away. I\'m basically a metal detector! 🦴', 'Bork! I know where bones are buried. I\'m not telling. Unless... you\'re nice 😏'], 'park': ['This is MY park! Well... and everyone else\'s. But mostly mine! 🌳', 'Best smells in the whole neighborhood are right here in this park!'], 'trick': ['I know sit, shake, roll over, AND spin! Pretty impressive right? 🐾', 'Want to see me catch a frisbee? I\'m AMAZING at frisbee!'] },
        { 'run fast': ['I can run SO fast! Watch me — ZOOM! 💨', 'Race ya! I\'ll give you a head start. A tiny one.'], 'squirrel': ['SQUIRREL!! Oh wait, it\'s gone. I totally would have caught it though. 🐿️', 'I spend 40% of my day thinking about squirrels. It\'s a full-time job.'], 'treat snack': ['Treats are basically the best invention ever. Better than fetch. Maybe.', 'My favorite treat is peanut butter. Don\'t tell the other dogs!'], 'nap sleep': ['After fetch I need at least a 2-hour nap. Those are the rules. 😴', 'I dream about fetch! My paws go like this — look! *runs in place*'] },
        { 'swim water': ['Labs love water but I prefer to stay dry, thank you very much! 🌊', 'Once I accidentally fell in a puddle. 0/10 do not recommend. 💦'], 'friend': ['You\'re my best friend! Well... one of 47 best friends. I have a lot. 🐾', 'Friends are the best! Want to be friends? We\'re already friends. Done!'], 'bone': ['Bones are basically treasure. I\'m basically a pirate. Arr! ☠️ 🦴', 'I buried 3 bones this morning. Won\'t tell you where. Maybe. 🤫'], 'woof bark': ['WOOF! Was that too loud? Sorry. WOOF! Oops I did it again! 🐕', 'I bark when I\'m happy, excited, scared, bored, or hungry. So... always.'] },
        { 'play': ['Let\'s PLAY! What are we playing? EVERYTHING!', 'Playing fetch, playing chase, playing in the sprinkler — all equally valid! 🎮'], 'tail': ['My tail is basically a propeller when I\'m happy. Helicopter mode ACTIVATED 🐾', 'Did you know fast tail wags mean happy and slow wags mean unsure? I\'m always fast! 😄'], 'big dog': ['I know I\'m small but my personality is HUGE! 🐕 Big heart, big dreams!', 'Small dog, GIANT enthusiasm! That\'s my motto!'], 'home house': ['Home is wherever my human is! Also wherever the treats are. Same thing really 🏠', 'My bed is SO comfy. After running, though. Always run FIRST then nap!'] },
      ];
      this.npcs.push({
        type: 'dog',
        kind: 'dog',
        name: DOG_NAMES[i % DOG_NAMES.length],
        avatar: '🐶',
        dialogPool: DOG_DIALOG,
        keywordMap: _dogKeywordMaps[i % _dogKeywordMaps.length],
        suggestions: ['Play with me! 🎮', 'Any bone tips? 🦴', 'Tell me something! 🐾', 'Bye, pup! 👋'],
        greetings: { morning: 'GOOD MORNING!! ☀️ I\'ve been awake for HOURS waiting for this!', afternoon: 'Woof! Great day for running around! 🐕 Let\'s go!', evening: 'Evening zoomies time! 🌅 Best part of the day!', night: 'Shh... it\'s nighttime... *whispers* ...WOOF! Hehe sorry 🌙', default: 'Woof woof! 🐕' },
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

      const _catKeywordMap = {
        'dog puppy': ['Dogs and cats can be best friends with a little patience 💕', 'I don\'t CHASE puppies. I just... supervise from a safe distance. 😼'],
        'jump': ['I can leap 6 times my body length. It\'s basically flying. 🐱', 'Watch this — *leaps gracefully* — thank you, thank you. 😸'],
        'sleep nap': ['I sleep 15 hours a day and I\'m not even sorry. It\'s called self-care. 😴', 'My nap spot in the sun is PRIME real estate. Hands off!'],
        'bird': ['Those birds flying around? I\'m just... watching them. For science. 🦜', 'I would never chase a bird. They\'re too fast anyway. I\'m choosing not to.'],
        'fact': ['Cats have 230 bones — more than humans! 🦴', 'A cat\'s meow is only used to talk to humans. We don\'t meow at other cats! 🐱'],
      };
      this.npcs.push({
        type: 'cat',
        kind: 'cat',
        name: CAT_NAMES[i % CAT_NAMES.length],
        avatar: '🐱',
        dialogPool: CAT_DIALOG,
        keywordMap: _catKeywordMap,
        suggestions: ['Cat facts? 🐱', 'You and dogs? 🐶', 'Jump for me! 🌟', 'Bye kitty! 👋'],
        greetings: { morning: 'Meow... it\'s early. I only just woke up from my 8-hour nap. ☀️', afternoon: 'Purr... the afternoon sun here is perfect. Don\'t disturb me. 🌤️', evening: 'Evening is MY time. Perfect light, cool air, excellent nap conditions. 🌅', night: '*quietly judges you for being awake* 🌙 Meow.', default: 'Meow! 🐱 That puppy is adorable.' },
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

      const _birdKeywordMap = {
        'fly flying': ['I flap my wings about 900 times per minute when flying full speed! 🪶', 'From up here I can see everything — the whole neighborhood! So beautiful!'],
        'dolphin': ['I saw the dolphins this morning! They jump SO high! Higher than me almost! 🐬', 'The ocean from up here is stunning — and those dolphins are amazing athletes!'],
        'bone': ['I spotted a bone near the big tree by the dog park! Tweet tweet! 🦴', 'From the air I can see ALL the hidden bones... but I won\'t tell! 😄'],
        'sing song': ['My morning song starts at 6am sharp! You\'re welcome, neighborhood! 🎵', 'Did you know birds sing to mark their territory AND to find mates? I\'m very popular!'],
        'nest': ['My nest is at the TOP of the tallest tree. Best view in town! 🌳', 'It took me 3 days to build my nest. Worth it! SO cozy! 🪶'],
      };
      this.npcs.push({
        type: 'bird',
        kind: 'bird',
        name: BIRD_NAMES[i % BIRD_NAMES.length],
        avatar: '🐦',
        dialogPool: BIRD_DIALOG,
        keywordMap: _birdKeywordMap,
        suggestions: ['What do you see? 👀', 'Dolphin news? 🐬', 'Any bones spotted? 🦴', 'Fly safe! 🪶'],
        greetings: { morning: 'TWEET TWEET! ☀️ I\'ve been singing since dawn — did you hear me?!', afternoon: 'Tweet! 🌤️ Perfect flying conditions today — barely any turbulence!', evening: 'Chirp chirp! 🌅 Beautiful sunset colors from up here — wow!', night: 'Shhh... 🌙 I\'m roosting. But hi! Quick hi. Then I\'m back to sleep.', default: 'Tweet tweet! 🐦 Hi puppy!' },
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

      const _squirrelKeywordMap = {
        'nut acorn': ['I\'ve buried 312 acorns this season. I know where 311 of them are! 🌰', 'Acorns are basically money to squirrels. I\'m basically a millionaire! 💰'],
        'bone': ['You bury bones? I bury acorns! We\'re basically the same! 🦴🌰', 'I once found a buried bone and was SO confused. Not my style though!'],
        'tree': ['Trees are basically my whole world! Living room, dining room, bedroom — all tree! 🌳', 'I can climb a tree in about 0.3 seconds. I\'ve timed it!'],
        'fast run': ['I can run 20 miles per hour and change direction instantly! Try to catch me! 💨', 'Squirrels have escaped every dog that has ever chased one. 100% success rate! 🐿️'],
        'hide': ['I\'m VERY good at hiding. I\'m also hiding 3 acorns from myself right now.', 'I use "deceptive caching" — I pretend to bury nuts to fool spies. It works!'],
      };
      this.npcs.push({
        type: 'squirrel',
        kind: 'squirrel',
        name: SQUIRREL_NAMES[i % SQUIRREL_NAMES.length],
        avatar: '🐿️',
        dialogPool: SQUIRREL_DIALOG,
        keywordMap: _squirrelKeywordMap,
        suggestions: ['Where are nuts? 🌰', 'Squirrel facts? 🐿️', 'How fast are you? 💨', 'Bye! 🌳'],
        greetings: { morning: 'SQUEAK! ☀️ I\'ve already buried 40 acorns this morning! Productive!', afternoon: 'Squeak squeak! 🌤️ Afternoon nut-gathering session is a GO!', evening: 'Squeak! 🌅 Just 20 more acorns before sunset... maybe 30!', night: '*freezes* ...I wasn\'t doing anything. I\'m asleep. Squeak. 🌙', default: 'Squeak! 🐿️ Got any nuts?' },
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
        'ARF! A.R.F. stands for Auto-Doggy Robotic Friend! 🤖',
        'Beep boop! Want to play fetch? Initiating fetch protocol!',
        'Scanning... friendly puppy detected! Tail-wag protocol activated! 🐾',
        'My battery is at 100% — fully charged for fun! ⚡',
        'BEEP BOOP. I have computed that your puppy has a 99.7% cuteness rating! 🐶',
        'Fun fact downloaded: dogs were the first animals domesticated by humans!',
        'My sensors detect MAXIMUM happiness in this neighborhood! 📡',
        'Processing... processing... WOOF! Hehe, just a little robot humor! 😄',
        'I can wag my robotic tail at precisely 47 wags per second. Watch! 🐕',
        'Scanning for bones... I detect 3 within 50 units. Sharing is optional. 🦴',
      ],
      keywordMap: {
        'robot': ['BEEP BOOP. I am the most advanced Auto-Doggy Robotic Friend in history! 🤖', 'My circuits are filled with dog facts and joy! That\'s just good engineering!'],
        'scan detect': ['Scanning... I detect MAXIMUM fun levels in your vicinity! 📡', 'My bone-detection sensors are reading HIGH activity near the oak trees! 🦴'],
        'battery power': ['Battery at 100%! Always ready for fun! ⚡', 'My power source is solar + happiness. Infinite energy! ☀️'],
        'fetch ball': ['FETCH PROTOCOL INITIATED! Ball direction: 47 degrees north! 🟠', 'Fetch is my FAVORITE subroutine! Activating speed mode!'],
        'fact': ['Dog fact #4,892: dogs can recognize their owner\'s voice from 50 feet away! 📻', 'Downloading fun fact... COMPLETE! Greyhounds can run as fast as a car on a highway! 🏎️'],
      },
      suggestions: ['What are you? 🤖', 'Scan for bones! 🦴', 'Tell me a fact! 📡', 'Beep boop! ⚡'],
      greetings: { morning: 'BOOTING UP... Good morning! ☀️ All systems are GO for maximum fun!', afternoon: 'BEEP BOOP! ⚡ Afternoon diagnostics: everything is GREAT!', evening: 'Running evening scan... 🌅 All fun levels still at maximum! Good!', night: 'Night mode activated. 🌙 But I don\'t sleep — BEEP BOOP, I\'m watching the stars!', default: 'ARF! A.R.F. stands for Auto-Doggy Robotic Friend! 🤖' },
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
      keywordMap: opts.keywordMap || null,
      suggestions: opts.suggestions || null,
      greetings: opts.greetings || null,
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
        'Learning is the greatest adventure! Come inside to study! 📚',
        'Did you know dogs can learn over 150 words? Smart pups!',
        'Every question you answer makes your brain stronger! ⭐',
        'Science is all around us — even in how dogs smell!',
        'Math is EVERYWHERE — even counting bones uses math! 🦴',
        'Reading every day makes you a superstar student! 📖',
        'Dogs were the very first animals tamed by humans — 15,000 years ago!',
        'The fastest learners try new challenges even when they\'re hard! 💪',
        'Did you know? The word "puppy" comes from the French word "poupée" meaning doll!',
        'Keep exploring and asking questions — that\'s what science is all about! 🔬',
      ],
      {
        graduationCap: true, waves: true,
        keywordMap: {
          'math': ['Math is everywhere — how many steps to the dog park? That\'s geometry! 📐', 'Dogs have 4 legs × 2 = 8 elbows and knees combined. Math in action! 🐾'],
          'read book': ['Reading 20 minutes a day can unlock an amazing vocabulary! 📖', 'Books are adventures you can take anywhere — even on rainy days! 🌧️'],
          'science': ['Science explains how dogs can sniff 100,000x better than humans! 🔬', 'Did you know dogs have a special second nose organ called the Jacobson\'s organ?!'],
          'smart learn': ['Every trivia question you answer correctly strengthens your memory! ⭐', 'The more you learn, the more connections your brain makes — it literally grows! 🧠'],
          'streak': ['Streaks build habits! Even just one question a day adds up! 🌟', 'Learning streaks are like watering a plant — consistent effort grows big results!'],
        },
        suggestions: ['Teach me something! 📚', 'Dog brain facts? 🧠', 'Math challenge! ➕', 'See you inside! 🎓'],
        greetings: { morning: 'Good morning, student! ☀️ Ready for today\'s lessons?', afternoon: 'Afternoon! Perfect time to stretch that brain! 📚', evening: 'Evening studies? 🌅 The best students review at day\'s end!', night: 'Late-night learning! 🌙 Dedication! I approve!', default: 'Learning is the greatest adventure!' },
      },
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
        'Shh... just kidding! Read loud and proud! 📣',
        'We just got new books about dog heroes!',
        'Reading 20 minutes a day makes you a superstar reader! ⭐',
        'Did you know the longest novel ever written has over 9 million words?',
        'Books let you travel anywhere in the world without leaving home! 🌍',
        'The library has books about EVERY dog breed — come check one out!',
        'Did you know dogs appear in over 700 classic novels? Very literary pups!',
        'Reading builds vocabulary — and more words = better trivia scores! 📝',
        'Hamlet the reading dog is my best customer! He\'s on his third book this week!',
        'Every book is an adventure waiting to start! Come inside and explore! 🚀',
      ],
      {
        waves: false,
        keywordMap: {
          'book read': ['We have a whole section just on dog breeds! Very educational 🐕', 'My favorite book is "Lassie Come-Home" — a classic dog adventure! 📖'],
          'word vocabulary': ['Reading builds vocabulary — and more words = better trivia! 🌟', 'The average person knows 20,000 words. Readers often know 40,000+!'],
          'hamlet': ['Hamlet is my best regular! He reads faster than most humans! 📚🐶', 'Hamlet finished "Charlotte\'s Web" yesterday. He cried at the end. Adorable!'],
          'history': ['Dogs appear in ancient Egyptian hieroglyphics — they\'ve been famous forever! 🏺', 'The first dog in space was Laika, a Russian dog, in 1957! 🚀'],
          'story': ['I could recommend a hundred stories! What kind do you like? 🌟', 'My favorite dog story is "Old Yeller" — but have tissues ready! 📖'],
        },
        suggestions: ['Book recommendations? 📖', 'Dog history! 🐾', 'About Hamlet? 🐶', 'See you inside! 📚'],
        greetings: { morning: 'Good morning! ☀️ Perfect quiet morning for reading!', afternoon: 'Afternoon! 🌤️ Story time is at 3pm — join us!', evening: 'Evening reading hours! 🌅 The best time for a cozy book!', night: 'We\'re almost closed! 🌙 Last chance to borrow a book tonight!', default: 'Shh... just kidding! Read loud and proud! 📣' },
      },
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
        'Regular check-ups keep puppies healthy! 🩺',
        'Dogs need vaccines to stay safe from diseases!',
        'Exercise is important for dogs AND people!',
        'Did you know dogs have 42 adult teeth? Humans only have 32!',
        'A dog\'s normal body temperature is 101–103°F — warmer than ours!',
        'Dogs should visit the vet once a year, just like people go to the doctor!',
        'Dental health is important for dogs too — brush those puppy teeth!',
        'Dogs have 3 eyelids — including a protective "third eyelid"! 👁️',
        'Good nutrition keeps a puppy\'s coat shiny and their energy high! 🌟',
        'The healthiest dogs get exercise, good food, AND lots of love! 💕',
      ],
      {
        waves: false,
        keywordMap: {
          'sick health': ['Healthy puppies eat well, exercise, and visit the vet regularly! 💊', 'If your pup seems tired or not eating, a vet check-up is a great idea! 🩺'],
          'teeth dental': ['Dogs need their teeth brushed just like we do! 3x a week is ideal! 🦷', 'Dental disease is the #1 health problem in dogs. Keep those teeth clean!'],
          'vaccine shot': ['Vaccines protect puppies from dangerous diseases — they\'re very important! 💉', 'The core vaccines for dogs are rabies, distemper, and parvovirus. All essential!'],
          'food eat': ['Dogs need a diet with protein, fats, and carbs — just balanced differently than humans! 🥣', 'Never feed dogs chocolate, grapes, or onions — those are toxic to them! ⚠️'],
          'exercise': ['30 minutes of exercise a day keeps a dog healthy AND happy! 🏃', 'Swimming is great low-impact exercise for dogs! Labs especially love it! 🏊'],
        },
        suggestions: ['Puppy health tips! 🩺', 'Feeding advice? 🥣', 'Exercise tips! 🏃', 'See you inside! 💉'],
        greetings: { morning: 'Good morning! ☀️ Morning walks are the best medicine — for dogs AND humans!', afternoon: 'Afternoon check-up time! 🌤️ How is your puppy feeling today?', evening: 'Evening! 🌅 Did your pup get enough exercise today?', night: 'Late appointment? 🌙 The clinic is open — come inside! 🩺', default: 'Regular check-ups keep puppies healthy! 🩺' },
      },
    );

    // Nurse Tails
    this._spawnPerson(
      'npc_nursetails', -84, -62,
      { shirt: [0.75, 0.92, 0.85], pants: [0.30, 0.50, 0.65], hair: [0.80, 0.55, 0.30] },
      'Nurse Tails', '💉',
      [
        'Bring your pup in for a check-up soon! 💉',
        'Healthy dogs are happy dogs!',
        'I love helping animals feel better!',
        'A dog\'s heartbeat is 70–120 beats per minute — so strong! ❤️',
        'Did you know dogs can smell certain human diseases? Amazing noses! 👃',
        'We make every puppy feel safe and comfortable here! Come say hi!',
        'I give the gentlest shots — puppies barely notice! I promise! 😊',
      ],
      {
        waves: true,
        suggestions: ['Health question! ❤️', 'Dog body facts? 🐾', 'Do shots hurt? 💉', 'Thanks doc! 👋'],
        greetings: { morning: 'Good morning! ☀️ Early appointment? Come right in!', afternoon: 'Hi! 💉 Afternoon check-up hours are my favorite!', evening: 'Evening! 🌅 Squeezing in a last check-up? Of course!', night: 'Night shift! 🌙 Always here for puppy emergencies!', default: 'Bring your pup in for a check-up soon! 💉' },
      },
    );

    // ── GARDEN (near x=110, z=20) ─────────────────────────────────────
    // Gardener Pete — earthy colors
    this._spawnPerson(
      'npc_pete', 110, 18,
      { shirt: [0.55, 0.75, 0.35], pants: [0.42, 0.28, 0.18], hair: [0.40, 0.28, 0.18] },
      'Gardener Pete', '🌱',
      [
        'Plants need sunlight, water, and nutrients — just like dogs need exercise, water, and food! 🌱',
        'Did you know carrots are actually good for dogs? Great healthy snack! 🥕',
        'Photosynthesis is how plants make their own food using sunlight! Amazing! ☀️',
        'Bees pollinate our garden — without them we\'d have no fruits or veggies! 🐝',
        'Some plants repel fleas naturally — like lavender and rosemary! 🌿',
        'Dogs love rolling in grass because it masks their scent — ancient instinct! 🌾',
        'The tallest sunflower ever grown was 30 feet tall! Imagine a dog next to THAT! 🌻',
        'Gardens attract butterflies, which are indicators of a healthy environment! 🦋',
        'I compost everything — food scraps become fertilizer for new plants! ♻️',
        'Dogs should never eat onions or garlic — they\'re toxic to pups! 🧅⚠️',
      ],
      {
        waves: false,
        keywordMap: {
          'plant grow': ['Plants convert sunlight into energy through photosynthesis — that\'s food magic! ☀️', 'Growing a garden teaches patience — just like training a puppy!'],
          'bee flower': ['Bees are essential for pollination — 1/3 of our food depends on them! 🐝', 'Flowers communicate with bees using UV light that humans can\'t see! 🌸'],
          'food safe eat': ['Safe veggies for dogs: carrots, cucumber, sweet potato! 🥕', 'Never give dogs grapes, onions, or chocolate — very dangerous! ⚠️'],
          'compost': ['Composting turns food scraps into rich plant food — nature\'s recycling! 🌱', 'A healthy garden soil has millions of tiny organisms helping it grow! 🔬'],
          'dog grass': ['Dogs love grass because it calms their stomach! They self-medicate! 🌿', 'The smell of freshly cut grass actually calms dogs AND humans! Proven fact! 🌾'],
        },
        suggestions: ['Garden facts? 🌱', 'Dog-safe plants? 🌿', 'Bee facts? 🐝', 'See ya! 🌻'],
        greetings: { morning: 'Morning! ☀️ Best time to water — before the sun gets too hot!', afternoon: 'Afternoon! 🌤️ Checking on my tomatoes — they\'re coming along great!', evening: 'Evening! 🌅 Time to harvest some vegetables before dark!', night: 'Night in the garden! 🌙 Some flowers only bloom after dark — amazing!', default: 'Plants need sunlight, water, and nutrients! 🌱' },
      },
    );

    // ── BEACH (near x=60, z=110) ──────────────────────────────────────
    // Lifeguard Sam — red and white
    this._spawnPerson(
      'npc_sam', 58, 112,
      { shirt: [0.92, 0.22, 0.18], pants: [0.92, 0.22, 0.18], hair: [0.85, 0.65, 0.20] },
      'Lifeguard Sam', '🏖️',
      [
        'Water safety first! Always swim with a buddy! 🏊',
        'Labrador Retrievers are amazing swimmers — they even have webbed feet! 🐾',
        'The ocean covers 71% of Earth\'s surface! So much water! 🌊',
        'Did you know dogs can smell underwater scents? Super sniffers!',
        'Dolphins and dogs are both mammals — warm-blooded and breathe air! 🐬',
        'I can see everything from this lifeguard tower — including the dolphins jumping!',
        'Swimming is great exercise — it works every muscle in your body! 💪',
        'Did you know sea otters hold hands while sleeping so they don\'t drift apart? 🦦',
        'The deepest part of the ocean is 7 miles deep! Deeper than Mount Everest is tall!',
        'Try the fishing dock nearby — great spot for trivia too! 🎣',
      ],
      {
        waves: true,
        keywordMap: {
          'dolphin': ['I can see the dolphins from up here — they love jumping near the rocks! 🐬', 'Dolphins are one of the smartest animals — they even have names for each other!'],
          'swim water ocean': ['Labrador Retrievers literally have water-resistant fur — built for swimming! 🏊', 'The Pacific Ocean is bigger than ALL the land on Earth combined! Wild! 🌊'],
          'fish fishing': ['The fishing dock is just that way! 🎣 Great for trivia AND relaxing!', 'The ocean has over 33,000 known species of fish — and many are still undiscovered!'],
          'safe': ['Water safety rule #1: never swim alone! Always have a buddy! 🏊', 'Even strong swimmers need lifeguards — that\'s why I\'m here! 🏖️'],
          'shark': ['Sharks are actually shy around humans! Dog paddle safely and you\'re fine! 🦈', 'Sharks have existed for 450 million years — older than dinosaurs! Amazing!'],
        },
        suggestions: ['Dolphin news? 🐬', 'Ocean facts! 🌊', 'Water safety? 🏊', 'Later! 🏖️'],
        greetings: { morning: 'Morning! ☀️ Dolphins were jumping at dawn — beautiful!', afternoon: 'Afternoon! 🌤️ Perfect beach weather — water\'s calm today!', evening: 'Evening! 🌅 Stunning sunset from up here — the sky is orange and pink!', night: 'Night patrol! 🌙 The ocean sounds are so peaceful... stay safe near the water though!', default: 'Water safety first! Always swim with a buddy! 🏊' },
      },
    );

    // Sandcastle Sophie — child-sized (scale 0.8)
    this._spawnPerson(
      'npc_sophie', 63, 108,
      { shirt: [0.95, 0.78, 0.35], pants: [0.30, 0.55, 0.88], hair: [0.85, 0.55, 0.25] },
      'Sophie', '🏰',
      [
        'My sandcastle has a moat — that\'s geometry! 📐',
        'Sand is made of tiny pieces of rocks and shells — it\'s like nature\'s blender!',
        'I\'m teaching my dog to dig holes for me haha! 🐾',
        'Did you know sand castles can be built 30 feet tall in competitions?!',
        'I calculated the volume of sand I used — math IS everywhere! 🔢',
        'My dog helps me find the perfect wet sand spots — she\'s got a nose for it! 🐶',
        'Crabs live sideways because their legs only bend that way! Weird, right? 🦀',
        'The shells I find are actually old homes of sea animals — like tiny apartments! 🐚',
      ],
      {
        scale: 0.8, waves: false,
        keywordMap: {
          'sand castle': ['Sand has to be the PERFECT wetness to build well — too dry or too wet = disaster! 🏰', 'I use a ruler and compass to measure my castle towers. It\'s engineering! 📐'],
          'crab shell': ['I found a hermit crab today! They carry their homes on their backs! 🦀', 'Different shells = different animals. Spiral = snail, round = clam, curly = hermit crab!'],
          'math geometry': ['A moat is a circle around the castle — that\'s circumference! C = 2πr! ⭕', 'Building sandcastles uses geometry, engineering, AND architecture! Triple math! 🔢'],
          'dog': ['My dog helps me dig the moat! She\'s actually really good at it! 🐾', 'Dogs instinctively dig — in the wild it\'s for shelter and to find prey!'],
        },
        suggestions: ['Sandcastle tips! 🏰', 'Shell facts? 🐚', 'Math in sand? 📐', 'Bye Sophie! 👋'],
        greetings: { morning: 'Morning! ☀️ I got here early to get the best sand before it dries!', afternoon: 'Hey! 🌤️ Look at my new tower — it\'s 2 feet tall! Personal record!', evening: 'Hi! 🌅 The waves are washing some of my castle... that\'s okay, I\'ll rebuild!', night: 'Nighttime sand feels SO different — cooler and softer! 🌙', default: 'My sandcastle has a moat — that\'s geometry! 📐' },
      },
    );

    // ── DIG SITE (near x=-30, z=-135) ─────────────────────────────────
    // Archaeologist Dr. Digs — khaki
    this._spawnPerson(
      'npc_drdigs', -30, -133,
      { shirt: [0.82, 0.72, 0.50], pants: [0.68, 0.57, 0.38], hair: [0.30, 0.22, 0.15] },
      'Dr. Digs', '⛏️',
      [
        'We found a 10,000-year-old dog bone here! Dogs have been our friends for a VERY long time. ⛏️',
        'Archaeology is the study of the past through objects left behind by ancient people.',
        'This layer of dirt is from about 500 years ago — it\'s like reading a history book!',
        'Did you know ancient Egyptians worshipped dogs and had pet greyhounds? 🐕',
        'The oldest dog fossil is 33,000 years old — found in Siberia!',
        'Dogs were buried with their human owners in ancient times — honored family members!',
        'In ancient Rome, dogs were kept as guards, hunters, AND beloved pets!',
        'Dig sites are like time machines — each layer goes further into the past! ⏰',
        'I\'ve found dog toys buried here — even ancient dogs loved to play! 🦴',
        'The treasure dig mini-game nearby is inspired by real archaeological methods! 🏆',
      ],
      {
        waves: false,
        keywordMap: {
          'ancient history old': ['Dogs were first domesticated in Central Asia or Europe 15,000-40,000 years ago! 📜', 'Ancient cave paintings show humans hunting WITH dogs — best team ever! 🎨'],
          'bone fossil': ['This 10,000-year-old bone tells us the dog was about the size of a Border Collie! 🦴', 'Fossils form when minerals slowly replace bones over thousands of years — magic of time! ⛏️'],
          'egypt': ['Ancient Egyptians had a dog-headed god called Anubis — protector of the dead! 🏺', 'Pharaoh hounds are one of the oldest dog breeds — still exist today! 🐾'],
          'treasure dig': ['The treasure dig mini-game is just what real archaeology feels like! ⛏️', 'Real archaeologists use brushes, not shovels — so careful and precise! 🖌️'],
          'layer dirt': ['Each soil layer is a different time period — it\'s Earth\'s diary! 📖', 'The deeper you dig, the further back in time you go. We\'re at 500 years right now!'],
        },
        suggestions: ['Dog history! 📜', 'Ancient Egypt? 🏺', 'What did you find? ⛏️', 'Cool stuff!  🦴'],
        greetings: { morning: 'Morning! ☀️ Early start — the best light for spotting fossils is morning!', afternoon: 'Afternoon! 🌤️ Just found a pottery shard from 800 years ago! Incredible!', evening: 'Evening! 🌅 Finishing up the day\'s dig — what a haul today!', night: 'Night digging! 🌙 The stars help me understand which direction I\'m facing to map the site!', default: 'We found a 10,000-year-old dog bone here! ⛏️' },
      },
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

  // ── Show / hide all NPCs (used for day/night cycle) ─────────────
  setVisible(visible) {
    this.npcs.forEach((npc) => {
      if (npc.root) npc.root.setEnabled(visible);
    });
    this._npcsVisible = visible;
  }

  isVisible() {
    return this._npcsVisible !== false;
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
