// Dog breed data — facts sourced from AKC and Wikipedia
export const BREEDS = [
  {
    id: 'pug',
    name: 'Pug',
    emoji: '🐶',
    color: 0xd4a96a,
    cost: 0,
    unlocked: true,
    stages: { puppy: '🐶', adolescent: '🐕', adult: '🦮' },
    fact: 'Pugs are one of the oldest dog breeds, originating in ancient China over 2,000 years ago! They were bred to be lap dogs for Chinese emperors. Their wrinkly faces and curly tails make them very unique.',
    stats: { playfulness: 5, friendliness: 5, energy: 3 },
  },
  {
    id: 'labrador',
    name: 'Labrador',
    emoji: '🐕',
    color: 0xf5c518,
    cost: 50,
    unlocked: false,
    stages: { puppy: '🐶', adolescent: '🐕', adult: '🦮' },
    fact: 'Labrador Retrievers are the most popular dog breed in the United States! They were originally bred in Newfoundland, Canada, to help fishermen retrieve fish. They are excellent swimmers and love the water.',
    stats: { playfulness: 5, friendliness: 5, energy: 5 },
  },
  {
    id: 'golden',
    name: 'Golden Retriever',
    emoji: '🐕‍🦺',
    color: 0xf0a500,
    cost: 60,
    unlocked: false,
    stages: { puppy: '🐶', adolescent: '🐕', adult: '🐕‍🦺' },
    fact: 'Golden Retrievers were first bred in Scotland in the 1800s. They are known for their beautiful golden coat and gentle, patient nature. They are often trained as guide dogs for people who are blind.',
    stats: { playfulness: 5, friendliness: 5, energy: 4 },
  },
  {
    id: 'dalmatian',
    name: 'Dalmatian',
    emoji: '🐕',
    color: 0xffffff,
    cost: 75,
    unlocked: false,
    stages: { puppy: '🐶', adolescent: '🐕', adult: '🐕' },
    fact: 'Dalmatians are born completely white! Their famous black or liver-colored spots appear as they grow. They were historically used as carriage dogs, running alongside horses, and later became famous as firehouse mascots.',
    stats: { playfulness: 4, friendliness: 4, energy: 5 },
  },
  {
    id: 'beagle',
    name: 'Beagle',
    emoji: '🐶',
    color: 0xc8860a,
    cost: 55,
    unlocked: false,
    stages: { puppy: '🐶', adolescent: '🐕', adult: '🐕' },
    fact: 'Beagles have an incredible sense of smell — about 220 million smell receptors compared to humans\' 5 million! They were originally bred to hunt rabbits and hares. The famous cartoon dog Snoopy is a Beagle.',
    stats: { playfulness: 4, friendliness: 5, energy: 4 },
  },
  {
    id: 'husky',
    name: 'Siberian Husky',
    emoji: '🐺',
    color: 0x8ecae6,
    cost: 80,
    unlocked: false,
    stages: { puppy: '🐶', adolescent: '🐕', adult: '🐺' },
    fact: 'Siberian Huskies were bred by the Chukchi people of Siberia to pull sleds over long distances in extremely cold weather. They have a double coat that keeps them warm in temperatures as low as -60°F! They can have blue, brown, or even mismatched eyes.',
    stats: { playfulness: 4, friendliness: 3, energy: 5 },
  },
];

export function getBreed(id) {
  return BREEDS.find(b => b.id === id) || BREEDS[0];
}

export function getStageEmoji(breed, stage) {
  return breed.stages[stage] || breed.emoji;
}
