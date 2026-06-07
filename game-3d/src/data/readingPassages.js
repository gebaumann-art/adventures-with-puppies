// Reading Passages for Adventures With Puppies
// Targeted at gifted rising 3rd graders — Grade 4 vocabulary, complex sentences, inference required

export const READING_SKILLS = [
  { id: 'main_idea',       label: 'Main Idea',           icon: '💡' },
  { id: 'inference',       label: 'Inference',           icon: '🔍' },
  { id: 'vocabulary',      label: 'Vocabulary',          icon: '📖' },
  { id: 'sequence',        label: 'Sequence',            icon: '🔢' },
  { id: 'authors_purpose', label: "Author's Purpose",    icon: '✍️' },
  { id: 'compare',         label: 'Compare & Contrast',  icon: '⚖️' },
];

export const READING_PASSAGES = [
  // ─── FICTION (5) ───────────────────────────────────────────────────────────

  {
    id: 'rp_001',
    title: 'The Cartographer\'s Companion',
    genre: 'fiction',
    lexileLevel: 720,
    passage: `Maya had explored every corner of her neighborhood, but the forest at the edge of town remained a mystery—until the afternoon a mud-caked beagle with a torn collar appeared on her porch.

She named him Atlas, after the ancient Greek figure who held up the entire world, because the dog seemed to carry a quiet confidence that made Maya feel brave just standing next to him. Together they pushed through the blackberry thickets at the forest's edge, Atlas leading with his nose low and his tail sweeping steadily like a metronome.

When Maya stumbled upon the ruins of an old stone foundation hidden beneath decades of moss and fallen leaves, Atlas sat beside her as she sketched the outline in her notebook. She measured each wall using a length of twine she kept coiled in her jacket pocket, just as her grandmother—a real cartographer—had taught her.

By the time the orange light of late afternoon stretched long shadows across the ground, Maya had filled three pages with notes and diagrams. She still had no idea who had built the structure or why it had been abandoned. But she understood something important: not knowing the answer to a question is simply the beginning of an adventure, not a reason to stay home.

Atlas thumped his tail against her boot as if he agreed completely.`,
    questions: [
      {
        q: 'What is the MAIN idea of this passage?',
        options: [
          'A dog can be trained to find hidden objects in a forest.',
          'Curiosity and courage can turn an unknown mystery into an exciting discovery.',
          'Maya\'s grandmother taught her everything she knew about mapmaking.',
          'Beagles are the best breed for exploring the outdoors.',
        ],
        answer: 1,
        skill: 'main_idea',
        explanation: 'The passage focuses on how Maya, inspired by Atlas, explores the unknown and finds that unanswered questions are invitations to adventure rather than reasons to give up.',
      },
      {
        q: 'Why did Maya name the dog "Atlas"?',
        options: [
          'It was printed on his collar.',
          'Her grandmother\'s favorite dog had the same name.',
          'The dog\'s confidence made her feel capable, reminding her of a figure known for great strength.',
          'She was studying Greek mythology in school that week.',
        ],
        answer: 2,
        skill: 'inference',
        explanation: 'The passage says Atlas "carried a quiet confidence that made Maya feel brave." She chose the name because the dog\'s presence gave her strength, not for any factual reason stated in the text.',
      },
      {
        q: 'In this passage, the word "cartographer" most likely means someone who—',
        options: [
          'writes adventure stories for children.',
          'studies ancient ruins and artifacts.',
          'creates detailed maps of places.',
          'trains animals to locate hidden objects.',
        ],
        answer: 2,
        skill: 'vocabulary',
        explanation: 'Maya\'s grandmother is called "a real cartographer" and taught Maya to sketch outlines and measure distances—skills used in mapmaking.',
      },
      {
        q: 'Which event happens LAST in the passage?',
        options: [
          'Maya discovers the stone foundation.',
          'A mud-caked beagle appears on Maya\'s porch.',
          'Maya fills three pages with notes and diagrams.',
          'Atlas leads Maya through the blackberry thickets.',
        ],
        answer: 2,
        skill: 'sequence',
        explanation: 'The sequence is: beagle appears → they enter the forest → they find the foundation → Maya fills three pages with notes.',
      },
    ],
    vocabWords: [
      { word: 'cartographer', definition: 'a person who makes maps' },
      { word: 'metronome', definition: 'a device that marks a steady beat; something that moves with perfect regularity' },
      { word: 'ruins', definition: 'the remains of a building or structure that has collapsed or been destroyed' },
      { word: 'foundation', definition: 'the solid base on which a building is constructed' },
    ],
    coins: 8,
  },

  {
    id: 'rp_002',
    title: 'The Dog Who Listened to the Storm',
    genre: 'fiction',
    lexileLevel: 740,
    passage: `Everyone in the valley knew that old Juniper, the silver-muzzled border collie, could predict thunderstorms. An hour before the sky turned green and the wind began to howl, Juniper would pace in tight circles near the barn door, whining softly until someone let her inside.

Most of the farmers dismissed this as coincidence—until the summer the crops nearly failed.

It had been the driest July in forty years. The fields cracked like shattered pottery, and the irrigation canal had slowed to little more than a trickle. Rancher Hester was considering selling half her herd when Juniper began her circling on a Tuesday afternoon under a cloudless, blazing sky.

"There's nothing out there," Hester muttered. But she had seen Juniper right too many times to ignore her completely.

The next morning, the sky had changed. By noon, a slow soaking rain—the kind that seeps deep into the earth rather than running off the surface—had begun to fall. It rained for two full days.

The crops recovered. The herd stayed.

Hester never again used the word "coincidence" when someone brought up Juniper's name. She had learned, somewhat reluctantly, that paying attention to the world around you—even when that world is speaking through the behavior of an old dog—is sometimes the most practical form of wisdom.`,
    questions: [
      {
        q: 'What can the reader INFER about Rancher Hester at the beginning of the story?',
        options: [
          'She did not believe Juniper\'s behavior had any meaning, but she watched the dog anyway.',
          'She was certain that Juniper could predict the weather accurately.',
          'She was planning to give Juniper away because the dog was disruptive.',
          'She had never seen Juniper pace near the barn before.',
        ],
        answer: 0,
        skill: 'inference',
        explanation: 'The passage says Hester dismissed the behavior as coincidence but had "seen Juniper right too many times to ignore her completely"—showing she doubted but still paid attention.',
      },
      {
        q: 'What is the MAIN idea of the last paragraph?',
        options: [
          'Border collies are more intelligent than other dog breeds.',
          'Rain is essential for the survival of farm crops and livestock.',
          'Observing animal behavior carefully can be a source of genuine wisdom.',
          'Ranchers should never ignore the weather forecast.',
        ],
        answer: 2,
        skill: 'main_idea',
        explanation: 'The last paragraph directly states that paying attention to the world around you—even through an animal\'s behavior—"is sometimes the most practical form of wisdom."',
      },
      {
        q: 'The passage compares the cracked fields to "shattered pottery." This comparison helps the reader understand that the ground was—',
        options: [
          'covered in broken ceramic pieces from an old farmhouse.',
          'extremely dry and fragile, broken apart in irregular pieces.',
          'smooth and hard, perfect for walking on.',
          'dark and rich, ready for planting seeds.',
        ],
        answer: 1,
        skill: 'vocabulary',
        explanation: 'Pottery shatters into dry, irregular fragments. The comparison conveys how severely dry and broken-apart the earth had become during the drought.',
      },
      {
        q: 'Why does the author most likely include the detail that the rain was "the kind that seeps deep into the earth rather than running off the surface"?',
        options: [
          'To show that the rain was dangerously heavy and caused flooding.',
          'To explain why the rain was especially helpful for saving the drought-stricken crops.',
          'To suggest that Juniper caused the rain by pacing near the barn.',
          'To describe what makes border collies different from other farm dogs.',
        ],
        answer: 1,
        skill: 'authors_purpose',
        explanation: 'By emphasizing that the rain soaked deep rather than running off, the author explains why this particular rain was effective at ending the drought and saving the farm.',
      },
    ],
    vocabWords: [
      { word: 'coincidence', definition: 'two events happening at the same time by chance, without one causing the other' },
      { word: 'reluctantly', definition: 'doing something unwillingly, with hesitation' },
      { word: 'irrigation', definition: 'a system of canals or pipes used to bring water to crops' },
      { word: 'practical', definition: 'useful and effective in real situations' },
    ],
    coins: 8,
  },

  {
    id: 'rp_003',
    title: 'Two Puppies, One Mountain Trail',
    genre: 'fiction',
    lexileLevel: 680,
    passage: `Frost was a husky with gray-blue eyes and an enormous appetite for speed. Cinnamon was a golden retriever who preferred to stop every few feet, press her nose into the earth, and inhale the entire history of whoever had passed by before her.

When their owner, twelve-year-old Theo, took both dogs on the mountain trail for the first time, the difference between them became immediately clear. Frost lunged ahead, pulling the leash taut and glancing back only when Theo called her name. Cinnamon moved more slowly, her investigation of each rock and root so thorough that Theo sometimes wondered if she was cataloguing specimens for a scientific study.

By the halfway point, Frost had burned through her burst of energy and settled into a steady trot beside Theo. Cinnamon, however, seemed to be running on an entirely different kind of fuel—the slow, renewable energy of curiosity. She showed no sign of tiring.

Near the summit, a narrow ledge required careful footwork. Frost, whose enthusiasm occasionally outran her judgment, slipped briefly before catching herself. Cinnamon placed each paw deliberately and crossed without incident, her nose still twitching.

That evening, both dogs lay curled together on the same blanket. Despite their opposite personalities, they had completed the same trail, breathed the same mountain air, and ended the day in exactly the same place.

Theo wrote in his journal: "Different routes to the same destination. I wonder if that's true for people, too."`,
    questions: [
      {
        q: 'How are Frost and Cinnamon DIFFERENT in their approach to the trail?',
        options: [
          'Frost is fearful of heights, while Cinnamon is completely fearless.',
          'Frost moves fast with bursts of energy, while Cinnamon moves slowly, driven by curiosity.',
          'Frost stops to smell everything, while Cinnamon runs ahead without looking back.',
          'Frost is trained to hike, while Cinnamon has never been on a trail before.',
        ],
        answer: 1,
        skill: 'compare',
        explanation: 'The passage contrasts Frost\'s speed and bursts of energy with Cinnamon\'s slow, nose-driven exploration powered by curiosity.',
      },
      {
        q: 'What does Theo\'s journal entry suggest about the theme of the passage?',
        options: [
          'Dogs should always be kept on leashes on mountain trails.',
          'People with different personalities or approaches can still reach the same goals.',
          'Golden retrievers are more reliable hikers than huskies.',
          'Keeping a journal is an important habit for young hikers.',
        ],
        answer: 1,
        skill: 'inference',
        explanation: 'Theo\'s observation—"Different routes to the same destination"—reflects on how the two dogs, despite opposite personalities, both completed the trail. He wonders if this applies to people too, signaling the passage\'s deeper theme.',
      },
      {
        q: 'What does the word "cataloguing" mean as used in this passage?',
        options: [
          'destroying or disrupting something carefully placed',
          'recording and organizing items in a detailed, systematic way',
          'running quickly from one location to another',
          'hiding small objects beneath rocks and roots',
        ],
        answer: 1,
        skill: 'vocabulary',
        explanation: 'Theo imagines Cinnamon is "cataloguing specimens for a scientific study"—organizing and recording information the way a scientist would, which fits Cinnamon\'s thorough, methodical sniffing.',
      },
      {
        q: 'In what ORDER do these events happen in the story?',
        options: [
          'Frost slips on the ledge → Cinnamon crosses carefully → both dogs sleep → Theo writes in his journal',
          'Theo writes in his journal → both dogs sleep → Frost slips on the ledge → Cinnamon crosses',
          'Both dogs sleep → Frost slips → Theo writes → Cinnamon crosses the ledge',
          'Cinnamon crosses the ledge → Frost slips → Theo writes → both dogs sleep',
        ],
        answer: 0,
        skill: 'sequence',
        explanation: 'The passage presents events in this order: ledge crossing (Frost slips, Cinnamon crosses carefully) → that evening both dogs sleep → Theo writes in his journal.',
      },
    ],
    vocabWords: [
      { word: 'taut', definition: 'pulled tight, with no slack' },
      { word: 'deliberately', definition: 'done slowly and carefully, with full intention' },
      { word: 'renewable', definition: 'able to be restored or replenished; not used up' },
      { word: 'summit', definition: 'the highest point of a mountain or hill' },
    ],
    coins: 8,
  },

  {
    id: 'rp_004',
    title: 'The Library Dog',
    genre: 'fiction',
    lexileLevel: 700,
    passage: `The Meadowbrook Public Library had a secret policy that no sign announced and no librarian would confirm or deny: on Tuesday afternoons, a large, gentle Newfoundland named Douglas was allowed to sleep in the children's reading corner.

Nobody knew exactly when the tradition had started. Some regulars said Douglas had been coming since before the current head librarian, Ms. Adair, was hired. Others insisted she had brought him herself. Ms. Adair, when asked, would simply smile and return to reshelving books.

What everyone agreed on was the effect Douglas had on the children who read aloud to him.

Nervous readers—children who stumbled over unfamiliar words and flushed red with embarrassment—would settle cross-legged beside Douglas, open their books, and begin to read to his enormous, velvety ears. Douglas never corrected them. He never sighed impatiently. He pressed his warm, heavy head into their laps and blinked his amber eyes as if every word were the most interesting thing he had ever heard.

By the end of a single Tuesday, most children were reading with a steadiness and confidence they had never felt before.

Researchers who study reading development call this the "relaxed performance" effect—the idea that an audience who cannot judge you frees the part of your brain that is responsible for fluency. Douglas, who understood none of this research, simply enjoyed the company and the occasional biscuit Ms. Adair kept in her cardigan pocket.`,
    questions: [
      {
        q: 'What is the MAIN idea of this passage?',
        options: [
          'Libraries should update their policies to allow pets inside.',
          'Reading aloud to a non-judgmental dog helps children develop confidence and fluency.',
          'Newfoundlands are the most popular breed used in library programs worldwide.',
          'Ms. Adair started the Tuesday dog policy when she was hired.',
        ],
        answer: 1,
        skill: 'main_idea',
        explanation: 'The passage focuses on how Douglas, by being a patient and non-judgmental listener, helps nervous readers gain confidence and fluency.',
      },
      {
        q: 'Why does the author most likely include the final paragraph about researchers?',
        options: [
          'To prove that Ms. Adair designed the program based on scientific studies.',
          'To show that Douglas is smarter than other dogs because he understands research.',
          'To connect the emotional story of Douglas to a real concept in learning science.',
          'To argue that all schools should replace teachers with animals.',
        ],
        answer: 2,
        skill: 'authors_purpose',
        explanation: 'The author bridges the heartwarming story to a real research concept—"relaxed performance"—giving the reader a scientific explanation for what they just witnessed emotionally in the story.',
      },
      {
        q: 'Based on the passage, what can you INFER about the children who read to Douglas?',
        options: [
          'They were all advanced readers who wanted an audience for their skills.',
          'They had been forced by their parents to attend the library on Tuesdays.',
          'Many of them felt anxious about reading aloud in front of people who might judge them.',
          'They preferred reading to dogs over reading to other children.',
        ],
        answer: 2,
        skill: 'inference',
        explanation: 'The passage describes children who "stumbled over unfamiliar words and flushed red with embarrassment"—signs of reading anxiety. Douglas helped because he could not judge them.',
      },
      {
        q: 'What does the word "fluency" most likely mean as used in this passage?',
        options: [
          'the ability to speak a foreign language without an accent',
          'the ability to read smoothly, accurately, and with expression',
          'the habit of visiting the library every week without fail',
          'the skill of memorizing long passages of text',
        ],
        answer: 1,
        skill: 'vocabulary',
        explanation: 'The passage uses "fluency" in the context of reading development, describing it as what is freed when the brain is relaxed—the ability to read smoothly and accurately.',
      },
    ],
    vocabWords: [
      { word: 'fluency', definition: 'the ability to read, speak, or play an instrument smoothly and with ease' },
      { word: 'velvety', definition: 'soft and smooth like velvet fabric' },
      { word: 'amber', definition: 'a warm golden-yellow or orange-brown color' },
      { word: 'confirm', definition: 'to say that something is definitely true' },
    ],
    coins: 8,
  },

  {
    id: 'rp_005',
    title: 'Rescue at First Light',
    genre: 'fiction',
    lexileLevel: 760,
    passage: `The blizzard had swept in without warning, burying the hiking trail under three feet of powder and erasing every landmark Priya had memorized on the way up. She had been hiking with her family's search-and-rescue dog, a Belgian Malinois named Koda, for six years—but she had never been the one who needed rescuing.

She checked her compass. The needle trembled but held steady, pointing north. That was something.

Koda pressed himself against her leg, his warmth cutting through the wind. He was not an anxious dog. Priya had watched him locate three lost hikers, a missing child, and one very confused elk in his career, and he had done all of it with the same focused calm he wore now. His eyes tracked the snow-blurred tree line as if he were reading text she couldn't see.

"Find the trail," she told him, using the command she had heard her father repeat hundreds of times during training. She unclipped his leash.

Koda paused for three full seconds—longer than usual—then moved forward at an angle through the drifts, his nose making rapid, delicate passes over the surface. Priya followed, placing her boots in each print he left.

Twenty minutes later, they emerged onto the plowed road where her father's truck was already idling, hazard lights blinking orange in the grey morning. He stepped out into the cold, his expression unreadable until she was close enough for him to wrap his arms around her.

Koda sat down calmly beside them and waited to go home.`,
    questions: [
      {
        q: 'What can you INFER about the three-second pause Koda takes before moving?',
        options: [
          'Koda was frightened by the blizzard and almost refused to work.',
          'Koda was carefully processing the scents and information needed to choose the right direction.',
          'Koda had not been trained for snowy conditions and did not know what to do.',
          'Koda was waiting for Priya to give him a second command.',
        ],
        answer: 1,
        skill: 'inference',
        explanation: 'The passage notes this was "longer than usual," suggesting the conditions required extra processing. Given that Koda is described as an experienced, focused dog, the pause reflects careful work rather than fear or confusion.',
      },
      {
        q: 'Which sentence BEST states the main idea of this passage?',
        options: [
          'Blizzards can be extremely dangerous for even experienced hikers.',
          'Priya and Koda, through trust and training, navigate a blizzard together to safety.',
          'Belgian Malinois are the breed most commonly used in search-and-rescue operations.',
          'Compass navigation is an essential skill for anyone who hikes in winter.',
        ],
        answer: 1,
        skill: 'main_idea',
        explanation: 'The story centers on the partnership between Priya and Koda—her trust in his training and his focused skill—leading both of them to safety.',
      },
      {
        q: 'What does the phrase "his eyes tracked the snow-blurred tree line as if he were reading text she couldn\'t see" suggest about Koda?',
        options: [
          'Koda was confused by the blizzard and staring into the distance randomly.',
          'Koda was perceiving information in the environment that Priya\'s human senses couldn\'t access.',
          'Koda had learned to read printed signs along the trail.',
          'Koda was watching for other animals that might be dangerous.',
        ],
        answer: 1,
        skill: 'vocabulary',
        explanation: 'The comparison to "reading text she couldn\'t see" is a metaphor suggesting Koda was gathering detailed sensory information—especially through smell—that was invisible to Priya.',
      },
      {
        q: 'What is the significance of Priya\'s father\'s "unreadable expression"?',
        options: [
          'He was angry at Priya for getting lost in the storm.',
          'He was pretending not to be worried so that Priya would stay calm.',
          'He was hiding deep relief and fear until he was certain she was safe.',
          'He did not recognize Priya because she was covered in snow.',
        ],
        answer: 2,
        skill: 'inference',
        explanation: 'His expression became readable—by wrapping his arms around her—only once she was close enough. This implies he had been suppressing an intense emotional reaction until he knew she was truly safe.',
      },
    ],
    vocabWords: [
      { word: 'landmark', definition: 'a recognizable feature of the landscape used for navigation' },
      { word: 'emerged', definition: 'came out from an enclosed or difficult place into the open' },
      { word: 'delicate', definition: 'very fine or careful; requiring great precision' },
      { word: 'hazard', definition: 'a danger or risk; hazard lights are blinking warning lights on a vehicle' },
    ],
    coins: 8,
  },

  // ─── NONFICTION (4) ────────────────────────────────────────────────────────

  {
    id: 'rp_006',
    title: 'The Nose Knows: How Dogs Smell the World',
    genre: 'nonfiction',
    lexileLevel: 780,
    passage: `When you walk past a bakery, you smell bread. A dog walking beside you smells the wheat from a specific farm, the yeast that was activated at a precise temperature, the hands of the baker who shaped the dough, and the exhaust from the delivery truck that brought the flour. This is not an exaggeration—it is a consequence of biology.

A human nose contains approximately five million scent receptors. A dog's nose contains between 125 and 300 million, depending on the breed. Dogs also possess a secondary olfactory organ called the Jacobson's organ, located in the roof of the mouth, which detects chemical signals that human noses cannot process at all.

But the hardware is only part of the explanation. In a human brain, roughly five percent of the brain's total area is devoted to processing smells. In a dog's brain, that proportion rises to nearly forty percent. This means a dog does not simply detect more odors than we do—a dog constructs a richer, more detailed, and more layered picture of the world through scent than we can experience through all five of our senses combined.

This extraordinary ability has practical consequences. Dogs have been trained to detect certain cancers from breath samples, locate people buried under avalanche snow, and identify specific individual human beings from a single drop of sweat left days earlier. Scientists studying this ability say we are only beginning to understand its full range.

Perhaps the next time your dog stops to investigate a seemingly ordinary patch of sidewalk, you might consider that it is reading a story far longer and more complex than any book.`,
    questions: [
      {
        q: 'What is the MAIN idea of this passage?',
        options: [
          'Dogs are superior to humans in every way because of their physical abilities.',
          'A dog\'s sense of smell is far more powerful and complex than a human\'s, giving dogs a richer picture of the world.',
          'Scientists have not yet fully studied how dogs use their sense of smell.',
          'Dogs should be used in hospitals to replace medical equipment.',
        ],
        answer: 1,
        skill: 'main_idea',
        explanation: 'Every paragraph supports the idea that dogs experience the world through smell in a way that is dramatically more detailed and complex than human perception.',
      },
      {
        q: 'The author opens with a comparison between what a human smells and what a dog smells near a bakery. What is the author\'s PURPOSE in using this comparison?',
        options: [
          'To argue that humans should train themselves to smell better.',
          'To make an abstract scientific fact concrete and immediately understandable for the reader.',
          'To suggest that bakers should hire dogs to check the quality of their bread.',
          'To prove that dogs are better at finding food than humans are.',
        ],
        answer: 1,
        skill: 'authors_purpose',
        explanation: 'The bakery comparison translates a dry statistic (scent receptor counts) into a vivid, relatable experience, making the scientific concept accessible and memorable.',
      },
      {
        q: 'According to the passage, how does the dog brain DIFFER from the human brain in the way it handles smell?',
        options: [
          'Dogs have larger brains overall, which gives them more room for all senses.',
          'About 40% of a dog\'s brain processes smell, compared to about 5% of a human brain.',
          'Dogs use a different part of the brain for smell than humans do.',
          'Human brains process smell faster than dog brains, but with less detail.',
        ],
        answer: 1,
        skill: 'compare',
        explanation: 'The passage explicitly states that 5% of the human brain is devoted to smell, while nearly 40% of a dog\'s brain handles smell.',
      },
      {
        q: 'What does the word "olfactory" most likely mean in this passage?',
        options: [
          'related to hearing',
          'related to the sense of smell',
          'related to the structure of the brain',
          'related to chemical signals in food',
        ],
        answer: 1,
        skill: 'vocabulary',
        explanation: 'The passage refers to a "secondary olfactory organ" that "detects chemical signals"—placed in the context of describing how dogs smell. Olfactory means "relating to the sense of smell."',
      },
    ],
    vocabWords: [
      { word: 'olfactory', definition: 'relating to the sense of smell' },
      { word: 'receptor', definition: 'a specialized cell or structure that detects a particular type of stimulus' },
      { word: 'proportion', definition: 'a part or share of a whole, often expressed as a fraction or percentage' },
      { word: 'avalanche', definition: 'a mass of snow, ice, and rock that slides rapidly down a mountain' },
    ],
    coins: 8,
  },

  {
    id: 'rp_007',
    title: 'Monarch Butterflies: The Impossible Migration',
    genre: 'nonfiction',
    lexileLevel: 800,
    passage: `Every autumn, hundreds of millions of monarch butterflies depart their summer breeding grounds in Canada and the northern United States and travel up to 3,000 miles to reach a cluster of mountain forests in the state of Michoacán, Mexico. What makes this journey extraordinary is not merely the distance—it is the fact that no individual butterfly has ever made this trip before.

The monarchs that arrive in Mexico each November are the great-great-grandchildren of the butterflies that left the previous spring. Three or four generations live and die during the northward journey. Only the final autumn generation—sometimes called the "Methuselah generation" because it lives far longer than its ancestors—makes the return trip south. These butterflies must navigate to a destination they have never visited, using inherited knowledge encoded in their DNA.

Scientists have determined that monarchs use a combination of the sun's position and an internal biological clock to maintain direction. On overcast days, they can detect polarized light invisible to human eyes. Some researchers believe they may also sense the Earth's magnetic field, using it as a compass.

The oyamel fir forests of Michoacán, where the butterflies overwinter, are under threat from logging and climate change. Warmer winters push the forests higher up the mountains, shrinking the habitat the monarchs require. In some recent years, the overwintering population has declined by more than ninety percent from its historical peak.

Scientists, conservationists, and ordinary people across three countries are now working to protect and restore the milkweed plants the butterflies need along their migration corridor—and to preserve the ancient forests at journey's end.`,
    questions: [
      {
        q: 'Why is the monarch butterfly migration described as "extraordinary"?',
        options: [
          'Because monarchs travel faster than any other insect.',
          'Because the butterflies complete the journey despite never having made it before, guided only by inherited knowledge.',
          'Because the journey takes an entire year for a single butterfly to complete.',
          'Because monarchs are the only animals that migrate from Canada to Mexico.',
        ],
        answer: 1,
        skill: 'main_idea',
        explanation: 'The passage emphasizes that no individual butterfly has made the trip before—the navigation ability is inherited, not learned, which makes it remarkable.',
      },
      {
        q: 'Based on the passage, what can you INFER will happen if the oyamel fir forests disappear?',
        options: [
          'Monarchs will adapt and find new overwintering sites in other countries.',
          'The monarch migration would likely collapse because the butterflies have no place to survive the winter.',
          'Monarchs would stop migrating and remain in the United States year-round.',
          'Other butterfly species would take over the migration route.',
        ],
        answer: 1,
        skill: 'inference',
        explanation: 'The passage states the forests are where monarchs "overwinter" and the habitat they "require." A decline of 90% already correlates with forest loss, implying that forest disappearance would be catastrophic for the species.',
      },
      {
        q: 'What does the word "inherited" mean as used in the phrase "inherited knowledge encoded in their DNA"?',
        options: [
          'learned through watching and copying the behavior of other butterflies',
          'passed down biologically from parents to offspring without being taught',
          'acquired through long practice over many migration journeys',
          'stored in the brain during the first year of a butterfly\'s life',
        ],
        answer: 1,
        skill: 'vocabulary',
        explanation: 'The passage establishes that the navigating butterflies have never made the trip before—so the knowledge cannot be learned. "Inherited" here means genetically passed from ancestors.',
      },
      {
        q: 'What is the SEQUENCE of events across generations during the monarch migration?',
        options: [
          'The autumn generation leaves Mexico → three generations travel north → one generation winters in Canada',
          'Butterflies leave Mexico in spring → three to four generations travel north through the summer → the final autumn generation travels south to Mexico',
          'Butterflies leave Canada in autumn → spend winter in Mexico → return north as a single generation',
          'One generation makes the entire round trip from Mexico to Canada and back',
        ],
        answer: 1,
        skill: 'sequence',
        explanation: 'The passage describes a northward journey across three to four generations, after which the long-lived autumn "Methuselah generation" makes the return trip south to Mexico.',
      },
    ],
    vocabWords: [
      { word: 'migration', definition: 'the seasonal movement of animals from one region to another' },
      { word: 'overwinter', definition: 'to spend the winter in a particular place' },
      { word: 'polarized', definition: 'light that vibrates in one direction only, often filtered or scattered by the atmosphere' },
      { word: 'corridor', definition: 'a narrow passage or strip of land connecting two areas' },
    ],
    coins: 8,
  },

  {
    id: 'rp_008',
    title: 'Tide Pools: A City Beneath the Waves',
    genre: 'nonfiction',
    lexileLevel: 770,
    passage: `Twice each day, the ocean recedes along rocky coastlines, leaving behind shallow pools of seawater trapped in hollows and crevices of stone. These tide pools are among the most biologically diverse ecosystems on the planet—and among the most extreme.

The conditions inside a tide pool change dramatically within a single day. When the tide is in, cool saltwater floods the pool and brings oxygen and nutrients. When the tide retreats, the pool is exposed to direct sunlight. The water temperature can rise by fifteen degrees in a single afternoon. The salt concentration increases as water evaporates, sometimes becoming nearly twice as salty as the open ocean. A rainstorm can do the opposite, diluting the pool to nearly fresh water in minutes.

Despite these volatile conditions, tide pools support an astonishing variety of life. Sea stars cling to vertical rock faces using hundreds of tube-like feet that work as tiny suction cups. Hermit crabs carry borrowed shells, upgrading to larger ones as they grow. Purple sea urchins grind grooves into solid rock using five teeth arranged around their mouths. Anemones fold their brilliant tentacles inward to protect against desiccation when the tide is out, and unfurl them the moment seawater returns.

The creatures of the tide pool have not simply survived these challenges—they have evolved specialized adaptations over millions of years that allow them to thrive where few organisms could survive.

Biologists consider tide pools natural laboratories: places where the compressed drama of evolution and ecology can be observed at close range, at low tide, without any equipment except curiosity.`,
    questions: [
      {
        q: 'What is the MAIN idea of this passage?',
        options: [
          'Tide pools are too dangerous for most animals to survive in.',
          'Tide pools are extreme environments that support remarkable diversity through specialized adaptation.',
          'Sea stars are the most important organism in a tide pool ecosystem.',
          'Scientists should build artificial tide pools to study ocean life.',
        ],
        answer: 1,
        skill: 'main_idea',
        explanation: 'The passage describes the extreme conditions of tide pools and the remarkable adaptations that allow diverse life to thrive there—this tension between extremity and diversity is the central idea.',
      },
      {
        q: 'The author describes tide pools as "natural laboratories." What does this comparison suggest?',
        options: [
          'Scientists have installed equipment in tide pools to run experiments.',
          'Tide pools are artificial environments built to study marine life.',
          'Tide pools offer a contained, observable setting where ecological processes can be directly studied.',
          'Biologists believe tide pools are more important than ocean research vessels.',
        ],
        answer: 2,
        skill: 'authors_purpose',
        explanation: 'A laboratory is a controlled, contained space for observation and study. The comparison suggests tide pools offer similarly clear, close-up views of ecological processes without the vastness of the open ocean.',
      },
      {
        q: 'What does "desiccation" most likely mean based on how it is used in the passage?',
        options: [
          'being covered by too much water',
          'severe drying out',
          'a sudden change in temperature',
          'predation by a larger animal',
        ],
        answer: 1,
        skill: 'vocabulary',
        explanation: 'The anemones fold their tentacles "to protect against desiccation when the tide is out." When the tide is out, the pool is exposed to sun and heat—the threat is drying out.',
      },
      {
        q: 'How do conditions in a tide pool when the tide is IN compare to conditions when the tide is OUT?',
        options: [
          'Both conditions are equally calm and stable for the organisms that live there.',
          'When the tide is in it is warmer and saltier; when out it is cooler with fresh nutrients.',
          'When the tide is in, cool saltwater brings oxygen and nutrients; when out, heat and evaporation create extreme salt concentration.',
          'When the tide is out, sea stars and anemones are more active; when in, they are dormant.',
        ],
        answer: 2,
        skill: 'compare',
        explanation: 'The passage explicitly contrasts the two conditions: tide in = cool saltwater, oxygen, nutrients; tide out = direct sun, rising temperature, increasing salt concentration.',
      },
    ],
    vocabWords: [
      { word: 'ecosystem', definition: 'a community of living organisms interacting with each other and their environment' },
      { word: 'volatile', definition: 'liable to change rapidly and unpredictably; unstable' },
      { word: 'desiccation', definition: 'the process of drying out completely' },
      { word: 'adaptation', definition: 'a feature of an organism that has developed over generations to help it survive in its environment' },
    ],
    coins: 8,
  },

  {
    id: 'rp_009',
    title: 'The Secret Life of Soil',
    genre: 'nonfiction',
    lexileLevel: 750,
    passage: `Beneath a single footstep in a healthy garden, there are more living organisms than there are human beings on Earth. A teaspoon of rich topsoil contains up to a billion bacteria, several yards of fungal threads, thousands of protozoa, and hundreds of nematodes—microscopic roundworms that patrol the soil like tiny, wriggling shepherds.

This underground community is not passive. It is constantly working.

Fungi form vast networks of threads called mycelium that connect plant roots across large areas. Through these networks, trees in a forest can share sugars and nutrients with neighboring trees, especially seedlings that haven't yet grown tall enough to reach sunlight. Scientists have nicknamed these connections "the wood wide web."

Bacteria break down dead organic matter—fallen leaves, decaying wood, the remnants of last season's garden—releasing the nutrients locked inside them back into the soil where living plants can absorb them. Without this decomposition, nutrients would remain trapped in dead material indefinitely, and new growth would eventually become impossible.

Earthworms, often called "nature's plows," tunnel through soil, loosening it so that air and water can penetrate more easily. As they move, they also digest organic matter and excrete a rich material called "worm castings" that significantly improves soil fertility.

When soil is damaged—by excessive tilling, chemical overuse, or drought—this community collapses, and the land loses its ability to support life. Protecting the living soil beneath our feet is not simply a matter of gardening; it is a matter of preserving the foundation of nearly every terrestrial food chain on Earth.`,
    questions: [
      {
        q: 'What is the MAIN purpose of this passage?',
        options: [
          'To convince gardeners to use more chemical fertilizers to help soil bacteria.',
          'To explain that soil is a complex, living system essential to life on Earth.',
          'To describe the specific differences between bacteria and fungi.',
          'To argue that earthworms are the most important organism in a garden.',
        ],
        answer: 1,
        skill: 'authors_purpose',
        explanation: 'The author describes multiple soil organisms and their functions, building toward the conclusion that soil is a living, essential system whose protection matters globally.',
      },
      {
        q: 'What can you INFER would happen if all the bacteria in soil disappeared?',
        options: [
          'Fungi would take over the bacteria\'s role and the soil would remain healthy.',
          'Nutrients would stop being released from dead matter, and new plant growth would eventually fail.',
          'Earthworms would become more numerous to compensate for the loss.',
          'Plants would adapt to absorb nutrients directly from rocks instead.',
        ],
        answer: 1,
        skill: 'inference',
        explanation: 'The passage states that bacteria break down organic matter and release nutrients for plants. Without this decomposition, the passage says "nutrients would remain trapped in dead material indefinitely."',
      },
      {
        q: 'Scientists nicknamed fungal underground connections "the wood wide web." Why did the author include this detail?',
        options: [
          'To show that scientists use humor to make their discoveries more famous.',
          'To compare the fungal network to the internet in a way that helps readers understand how information and resources are shared across a large, connected system.',
          'To argue that the internet was originally invented by studying fungi.',
          'To explain that fungal networks are only found in forests, not in gardens.',
        ],
        answer: 1,
        skill: 'vocabulary',
        explanation: 'The "wood wide web" nickname draws a comparison to the World Wide Web—a network that connects many points and allows the sharing of resources. This helps readers visualize how fungal threads connect and enable sharing across a forest.',
      },
      {
        q: 'How are earthworms DIFFERENT from bacteria in the way they help soil?',
        options: [
          'Earthworms break down dead material; bacteria only loosen soil.',
          'Bacteria improve soil by connecting plant roots; earthworms improve soil by releasing nutrients from dead matter.',
          'Bacteria decompose organic matter and release nutrients; earthworms tunnel through soil to improve its structure and drainage.',
          'Earthworms are passive; bacteria are the only organisms that actively improve soil.',
        ],
        answer: 2,
        skill: 'compare',
        explanation: 'The passage describes distinct roles: bacteria decompose matter and release nutrients, while earthworms physically loosen soil, improving air and water flow, and produce fertile worm castings.',
      },
    ],
    vocabWords: [
      { word: 'mycelium', definition: 'the network of fine threads that make up the body of a fungus' },
      { word: 'decomposition', definition: 'the process by which organic matter breaks down into simpler substances' },
      { word: 'fertility', definition: 'the ability of land to produce abundant crops and support plant growth' },
      { word: 'terrestrial', definition: 'relating to the land or Earth\'s surface, as opposed to water or air' },
    ],
    coins: 8,
  },

  // ─── FABLES (3) ────────────────────────────────────────────────────────────

  {
    id: 'rp_010',
    title: 'The Greyhound and the Tortoise',
    genre: 'fable',
    lexileLevel: 660,
    passage: `In a valley where the meadows stretched golden beneath an autumn sky, there lived a greyhound named Meridian who was, without question, the fastest creature for twenty miles in any direction. She knew this, and she made certain that everyone else knew it too.

One morning, a tortoise named Oleander announced that he wished to challenge Meridian to a race across the valley. The assembled animals—a donkey, several rabbits, and a very opinionated crow—burst into laughter. Meridian allowed herself a polite smile.

"I accept," she said, "out of courtesy."

The race began at the ancient oak and ended at the river. Meridian was at the river before Oleander had crossed the shadow of the oak tree. She turned, looked back, and—because the day was warm and victory was certain—lay down in the sun for a nap.

She did not wake until the cool shadow of late afternoon fell across her nose.

She lifted her head. Oleander was three steps from the finish.

Meridian ran. She was faster than the wind, faster than thought, faster than any creature in the valley—but the river was one step away from Oleander when she arrived, and it was two steps away when his shell touched the water's edge.

The crow, who had been watching from a fence post the entire time, called out: "Speed is an excellent gift—but only if you remember to use it."

Meridian had no reply. She sat down beside the river and thought about that for a very long time.`,
    questions: [
      {
        q: 'What is the MORAL of this fable?',
        options: [
          'Tortoises are secretly faster than greyhounds.',
          'You should never agree to a race you are not fully prepared for.',
          'Natural talent means nothing if you are too overconfident to apply it.',
          'The fastest animal will always win, given enough practice.',
        ],
        answer: 2,
        skill: 'main_idea',
        explanation: 'Meridian lost not because she lacked speed, but because her overconfidence led her to stop using her advantage. The crow\'s moral confirms this: "Speed is an excellent gift—but only if you remember to use it."',
      },
      {
        q: 'Why does the author say Meridian accepted the race "out of courtesy"?',
        options: [
          'Meridian was genuinely excited about the challenge.',
          'She felt sorry for Oleander and wanted to give him hope.',
          'She believed winning was so guaranteed that her participation was essentially a favor to Oleander.',
          'She was afraid of looking rude in front of the other animals.',
        ],
        answer: 2,
        skill: 'inference',
        explanation: '"Courtesy" means politeness or generosity. Meridian\'s acceptance is framed as gracious condescension—she didn\'t see it as a real challenge, just a kind gesture toward an obviously inferior opponent.',
      },
      {
        q: 'In what order do the key events of the fable occur?',
        options: [
          'Oleander announces the race → Meridian naps → Meridian loses → the crow gives the moral',
          'Meridian naps → the race begins → Oleander wins → the crow gives the moral',
          'The crow gives the moral → the race begins → Meridian naps → Oleander wins',
          'Meridian loses → Oleander announces the race → Meridian naps → the crow speaks',
        ],
        answer: 0,
        skill: 'sequence',
        explanation: 'The events occur in this order: Oleander challenges Meridian → race begins and Meridian leads → Meridian naps → Meridian wakes too late → Oleander wins → the crow states the moral.',
      },
      {
        q: 'What does the word "condescension" best describe about Meridian\'s attitude in the fable, even though the word is not used?',
        options: [
          'Her belief that she was doing Oleander a favor by racing him because she saw herself as far superior',
          'Her nervousness about racing an opponent whose abilities she did not understand',
          'Her desire to be kind to all animals regardless of their speed',
          'Her determination to practice harder before the race began',
        ],
        answer: 0,
        skill: 'vocabulary',
        explanation: 'Condescension means treating someone as inferior while appearing gracious. Meridian\'s "polite smile" and acceptance "out of courtesy" are classic examples of condescension toward Oleander.',
      },
    ],
    vocabWords: [
      { word: 'courtesy', definition: 'polite behavior; doing something as a kind gesture' },
      { word: 'opinionated', definition: 'having and expressing strong opinions about everything' },
      { word: 'condescension', definition: 'a manner that shows you consider yourself superior to others' },
      { word: 'assembled', definition: 'gathered together in one place' },
    ],
    coins: 8,
  },

  {
    id: 'rp_011',
    title: 'The Fox and the Frozen River',
    genre: 'fable',
    lexileLevel: 690,
    passage: `A clever fox named Vesper prided herself on knowing every path through the northern forest. When the long winter hardened the river into a mirror of ice, Vesper noticed that the wolves—who were larger and heavier—walked miles out of their way to cross at the shallows downstream. The ice would never hold a wolf, they said. Everyone knew that.

Vesper also noticed something the wolves had not: a family of otters who crossed the ice directly every single morning, sliding and tumbling on the surface with apparent carelessness. But they always made it across, and they always came back.

One morning, Vesper approached the eldest otter. "How do you know the ice is safe?" she asked.

"We don't know," said the otter. "We test. Each morning, the first of us crosses alone. If it holds, the family follows. If it cracks, we wait another day." She paused. "We have been crossing this river for eleven winters."

Vesper tried to think of a reason why this method was unwise. She could not.

That afternoon, she tested the ice herself—one careful step, then another—and crossed before the wolves had even reached the downstream shallows.

She returned to the east bank by sunset, quick and satisfied.

The wolves, watching from the far shore, conferred in low voices.

"She was lucky," said the largest.

"Perhaps," said Vesper pleasantly, from somewhere behind them. "Or perhaps I learned from someone wiser than luck."`,
    questions: [
      {
        q: 'What lesson does this fable teach?',
        options: [
          'Foxes are always smarter than wolves in survival situations.',
          'Observation and testing a small risk carefully is wiser than relying on assumptions.',
          'The safest path is always the one that others before you have already taken.',
          'Winter rivers are always safer than they appear to be.',
        ],
        answer: 1,
        skill: 'main_idea',
        explanation: 'Vesper succeeds not through luck or cleverness alone, but by observing the otters\' method of testing and learning from it, contrasting with the wolves who rely on untested assumptions.',
      },
      {
        q: 'What does Vesper mean when she says she learned "from someone wiser than luck"?',
        options: [
          'She means she found an ancient map of the river.',
          'She is crediting the otter\'s systematic method of testing over blind luck or assumption.',
          'She is saying that wolves are not as wise as they believe they are.',
          'She means she studied the physics of ice formation in books.',
        ],
        answer: 1,
        skill: 'inference',
        explanation: 'The wolves attributed her success to "luck." Vesper corrects this—she used the otter\'s careful testing method, which is the opposite of luck: it is methodical and repeatable.',
      },
      {
        q: 'How does the otter\'s approach to crossing the ice COMPARE to the wolves\' approach?',
        options: [
          'The otters cross recklessly every day; the wolves cross carefully with a rope.',
          'The wolves avoid the ice using untested assumptions; the otters test the ice every morning before crossing.',
          'Both the otters and wolves refuse to cross the ice in winter.',
          'The wolves cross the ice faster than the otters because they are larger.',
        ],
        answer: 1,
        skill: 'compare',
        explanation: 'The wolves go miles around based on a blanket assumption that "ice would never hold a wolf." The otters test carefully each morning, making informed decisions rather than assumptions.',
      },
      {
        q: 'What does "conferred" mean as used in the sentence "The wolves, watching from the far shore, conferred in low voices"?',
        options: [
          'celebrated loudly together',
          'argued angrily with one another',
          'exchanged information or discussed quietly',
          'walked slowly toward the river\'s edge',
        ],
        answer: 2,
        skill: 'vocabulary',
        explanation: '"Conferred in low voices" describes the wolves quietly discussing what they had just witnessed—consulting each other in hushed tones.',
      },
    ],
    vocabWords: [
      { word: 'conferred', definition: 'discussed or exchanged views with others' },
      { word: 'systematic', definition: 'done according to a fixed plan or method; organized and methodical' },
      { word: 'assumption', definition: 'something accepted as true without proof or testing' },
      { word: 'apparent', definition: 'seeming to be true, but not necessarily confirmed' },
    ],
    coins: 8,
  },

  {
    id: 'rp_012',
    title: 'The Two Dogs and the Bone',
    genre: 'fable',
    lexileLevel: 670,
    passage: `Two dogs named Bram and Sable were the closest of friends until the afternoon they both spotted a large bone resting at the center of the crossroads.

They arrived at exactly the same moment.

"I saw it first," said Bram.

"My shadow reached it before yours," said Sable.

They argued throughout the afternoon. Bram's argument was logical. Sable's argument was equally logical. Neither would yield, and neither would share.

At sunset, a passing raven landed on the fence post above them and listened politely to both sides of the dispute.

"I can resolve this," the raven offered. "Allow me to divide the bone equally."

Bram and Sable agreed immediately. The raven broke the bone into two pieces—but the break was uneven, and one piece was clearly larger. "To make them equal," said the raven, "I must take a bite from the larger piece." She ate a mouthful. Now the other piece was larger. "Now I must balance the other side." She ate again.

Back and forth she went, taking "equalizing" bites, until nothing remained.

"That was our bone," said Bram, bewildered.

"Yes," said the raven pleasantly, spreading her wings. "And had you shared it at the start, you would each have had half. When you invited me into your dispute, you gave away everything."

The raven flew off, well fed.

Bram and Sable sat at the crossroads and said nothing, which was perhaps the wisest thing either of them had done all day.`,
    questions: [
      {
        q: 'What is the MORAL of this fable?',
        options: [
          'Ravens are untrustworthy and should never be asked for advice.',
          'Refusing to share and inviting a third party into a dispute can result in losing everything.',
          'Disputes should always be settled by dividing property in half.',
          'Friends who argue will never be close again.',
        ],
        answer: 1,
        skill: 'main_idea',
        explanation: 'The raven states the moral directly: had the dogs shared from the start, each would have half. By refusing to share and inviting a third party, they lost everything.',
      },
      {
        q: 'What does the raven\'s method of "equalizing" actually accomplish?',
        options: [
          'It ensures both dogs receive a perfectly equal portion.',
          'It allows the raven to consume the entire bone by pretending to solve the problem.',
          'It teaches the dogs an important lesson about mathematics.',
          'It proves that neither dog was correct about who saw the bone first.',
        ],
        answer: 1,
        skill: 'inference',
        explanation: 'Each "equalizing" bite shifts the imbalance to the other side, requiring another bite, until nothing is left. The raven cleverly uses the dogs\' trust in her fairness to consume the entire bone.',
      },
      {
        q: 'In what order do the key events happen in this fable?',
        options: [
          'The raven arrives → the dogs argue → the raven eats everything → the dogs find the bone',
          'The dogs find the bone → they argue → the raven offers to divide it → the raven eats everything',
          'The raven eats the bone → the dogs argue → the raven arrives and offers help',
          'The dogs share the bone equally → the raven arrives → the dogs argue with the raven',
        ],
        answer: 1,
        skill: 'sequence',
        explanation: 'The sequence is: both dogs spot the bone simultaneously → they argue all afternoon → the raven offers to divide it equally → the raven takes "equalizing" bites until nothing is left.',
      },
      {
        q: 'What does the word "yield" mean as used in "Neither would yield, and neither would share"?',
        options: [
          'to produce or grow something',
          'to give way or surrender one\'s position',
          'to call out loudly for help',
          'to examine something carefully',
        ],
        answer: 1,
        skill: 'vocabulary',
        explanation: 'In the context of an argument, "yield" means to back down or concede to the other side. Neither dog would give up their claim.',
      },
    ],
    vocabWords: [
      { word: 'yield', definition: 'to give way; to surrender a position or claim' },
      { word: 'dispute', definition: 'a disagreement or argument between people' },
      { word: 'bewildered', definition: 'completely confused and unable to understand what is happening' },
      { word: 'resolve', definition: 'to find a solution to a problem or disagreement' },
    ],
    coins: 8,
  },

  // ─── INFORMATIONAL (2) ─────────────────────────────────────────────────────

  {
    id: 'rp_013',
    title: 'How Dogs Were Domesticated',
    genre: 'nonfiction',
    lexileLevel: 810,
    passage: `Dogs are the oldest domesticated animal on Earth. Genetic evidence suggests that dogs diverged from a population of ancient wolves between 15,000 and 40,000 years ago—long before humans had developed agriculture, writing, or permanent cities. In other words, humans had dogs before they had farms.

Scientists disagree about exactly how this happened. One leading hypothesis suggests that wolves began scavenging the campsites of early human hunter-gatherers, attracted by scraps of food. The bolder wolves that approached humans without fleeing gained access to reliable food. Over many generations, less fearful wolves reproduced more, and their offspring became gradually less wary of human presence—a process called self-domestication. Humans may have accelerated this process by selectively feeding the tamest animals.

A competing hypothesis proposes that humans actively captured wolf pups and raised them, selecting for calm, cooperative behavior from the start.

What is not disputed is what happened as a result. As wolves and humans spent more time together, wolves underwent physical and behavioral changes that made them better partners. Their skulls became shorter and their snouts more compact. Their eyes developed the ability to follow human gaze—a skill wolves do not possess—allowing them to communicate with people in ways even chimpanzees cannot. Their brains became more sensitive to human emotional signals.

Today's domestic dogs are not simply tame wolves. They are a genuinely distinct species shaped by tens of thousands of years of partnership with humans—animals whose evolution has been guided, in part, by their relationship with us.

And ours, some researchers now argue, may have been shaped by our relationship with them.`,
    questions: [
      {
        q: 'What is the MAIN idea of this passage?',
        options: [
          'Dogs were created through genetic engineering by early human scientists.',
          'Dogs and humans have co-evolved over tens of thousands of years, with each shaping the other.',
          'The exact moment when wolves became dogs has been discovered through DNA analysis.',
          'Domestic dogs are essentially the same as wolves with some minor behavioral training.',
        ],
        answer: 1,
        skill: 'main_idea',
        explanation: 'The passage traces the long mutual relationship between humans and dogs, concluding with the suggestion that each species may have influenced the evolution of the other.',
      },
      {
        q: 'How do the two hypotheses about dog domestication COMPARE?',
        options: [
          'Both hypotheses agree that humans captured wolf pups and trained them deliberately.',
          'The self-domestication hypothesis proposes wolves approached humans on their own; the competing hypothesis suggests humans actively raised and selected wolves.',
          'One hypothesis is supported by fossil evidence; the other has no scientific support at all.',
          'Both hypotheses place dog domestication after the invention of agriculture.',
        ],
        answer: 1,
        skill: 'compare',
        explanation: 'The passage contrasts the two views: self-domestication (wolves initiated contact for food) vs. active capture and raising of wolf pups by humans.',
      },
      {
        q: 'The passage states that dogs can follow human gaze but wolves cannot. What does this SUGGEST about dogs?',
        options: [
          'Dogs have better eyesight than wolves due to changes in brain size.',
          'Dogs have developed a specialized ability that helps them communicate and cooperate with humans, something even closely related species lack.',
          'Dogs are genetically closer to chimpanzees than to wolves.',
          'This ability was present in ancient wolves before domestication began.',
        ],
        answer: 1,
        skill: 'inference',
        explanation: 'The passage specifically contrasts dogs with both wolves and chimpanzees—noting that gaze-following is a human-communication skill that emerged through the dog-human partnership, not something inherited from wolf ancestors.',
      },
      {
        q: 'What does the word "domesticated" mean as used in this passage?',
        options: [
          'trained to perform specific tasks on command',
          'bred and adapted over generations to live with humans',
          'captured from the wild and kept in cages for observation',
          'fed by humans but otherwise unchanged in behavior',
        ],
        answer: 1,
        skill: 'vocabulary',
        explanation: 'The passage describes a process of gradual biological and behavioral change over many generations resulting from the wolf-human relationship. Domestication is the process of breeding wild animals to live with and work alongside humans.',
      },
    ],
    vocabWords: [
      { word: 'domesticated', definition: 'tamed and adapted over generations to live with humans' },
      { word: 'hypothesis', definition: 'a proposed explanation based on evidence, used as a starting point for further investigation' },
      { word: 'scavenging', definition: 'searching for and eating discarded food or waste' },
      { word: 'diverged', definition: 'separated from a common ancestor or point and developed in different directions' },
    ],
    coins: 8,
  },

  {
    id: 'rp_014',
    title: 'Guide Dogs and Their Important Jobs',
    genre: 'nonfiction',
    lexileLevel: 790,
    passage: `A guide dog is not simply a pet that helps someone cross the street. A guide dog is a highly trained working partner whose responsibilities require months of specialized preparation and a degree of judgment that most people would not expect from an animal.

Guide dogs are most commonly Labrador retrievers, golden retrievers, or German shepherds—breeds selected for their trainability, stable temperament, and ability to remain focused in crowded, unpredictable environments. Training begins in puppyhood, when the dog is placed with a volunteer family called a "puppy raiser" who exposes the animal to buses, escalators, restaurants, hospitals, and a wide variety of environments it will later encounter on the job.

Formal training, conducted by professional guide dog instructors, typically lasts four to six months. During this period, dogs learn to stop at curbs, navigate obstacles, find specific locations such as elevator buttons and building entrances, and guide their handlers safely around unexpected hazards like construction scaffolding or a bicycle parked on the sidewalk.

One of the most critical skills a guide dog must learn is called "intelligent disobedience." If a handler commands the dog to move forward and the dog perceives that it is unsafe to do so—a car running a red light, for example—the dog must refuse the command. This requires the dog to weigh its training against current sensory information and make an independent decision that overrides a direct human instruction.

When a guide dog is in its harness, it is working, and members of the public are asked not to pet or distract it. A moment of distraction could mean a moment of danger.

The partnership between a guide dog and its handler typically lasts eight to ten years—a decade of trust built step by careful step.`,
    questions: [
      {
        q: 'What is the MAIN purpose of this passage?',
        options: [
          'To persuade readers to adopt Labrador retrievers as pets.',
          'To inform readers about the extensive training and critical role of guide dogs.',
          'To explain the history of how guide dogs were first developed.',
          'To compare guide dogs to other types of service animals.',
        ],
        answer: 1,
        skill: 'authors_purpose',
        explanation: 'The passage systematically explains how guide dogs are selected, trained, and what they do—with the goal of informing readers about a topic they may not fully understand.',
      },
      {
        q: 'Why is "intelligent disobedience" considered the MOST critical skill a guide dog must learn?',
        options: [
          'Because it allows the dog to choose its own route, which is usually faster.',
          'Because a dog that can refuse an unsafe command can protect its handler in situations where following instructions could cause serious harm.',
          'Because it allows the dog to work without any commands from the handler.',
          'Because intelligent disobedience training is the most difficult part of guide dog school.',
        ],
        answer: 1,
        skill: 'inference',
        explanation: 'The passage describes intelligent disobedience as the ability to override a direct command when a safety threat exists. This protects the handler\'s life in dangerous, unpredictable situations no training scenario could fully anticipate.',
      },
      {
        q: 'What is the sequence of a guide dog\'s training from beginning to end?',
        options: [
          'Formal instructor training → placed with puppy raiser → tested in the field',
          'Born → placed with puppy raiser for exposure to environments → formal training by instructors → paired with handler',
          'Placed with handler → formal training → puppy raiser phase',
          'Tested for intelligence → formal training → placed with puppy raiser for exposure',
        ],
        answer: 1,
        skill: 'sequence',
        explanation: 'The passage describes training in this order: puppyhood with a puppy raiser (exposure to real environments) → four to six months of formal training with instructors → partnership with a handler.',
      },
      {
        q: 'What does "temperament" most likely mean as used in the phrase "stable temperament"?',
        options: [
          'physical strength and endurance for long walks',
          'a dog\'s natural personality and emotional tendencies',
          'the ability to remain still for long periods of time',
          'a dog\'s sensitivity to smells and sounds',
        ],
        answer: 1,
        skill: 'vocabulary',
        explanation: 'In the context of selecting breeds for reliability, "stable temperament" refers to a predictable, calm, and consistent personality—not a physical trait.',
      },
    ],
    vocabWords: [
      { word: 'temperament', definition: 'a person\'s or animal\'s natural personality and emotional tendencies' },
      { word: 'disobedience', definition: 'the act of refusing to follow an instruction or command' },
      { word: 'hazard', definition: 'a source of danger or risk' },
      { word: 'scaffolding', definition: 'a temporary structure of metal poles and boards used during construction or repair work' },
    ],
    coins: 8,
  },
];

export default READING_PASSAGES;
