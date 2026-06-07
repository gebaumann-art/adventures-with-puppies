// Accessory catalog — purchased with bones
export const ACCESSORIES = [
  { id: 'bow_red', name: 'Red Bow', icon: '🎀', boneCost: 3, type: 'head' },
  { id: 'bow_blue', name: 'Blue Bow', icon: '💙', boneCost: 3, type: 'head' },
  { id: 'hat_party', name: 'Party Hat', icon: '🎉', boneCost: 4, type: 'head' },
  { id: 'hat_cowboy', name: 'Cowboy Hat', icon: '🤠', boneCost: 5, type: 'head' },
  { id: 'hat_crown', name: 'Crown', icon: '👑', boneCost: 8, type: 'head' },
  { id: 'collar_red', name: 'Red Collar', icon: '❤️', boneCost: 2, type: 'collar' },
  { id: 'collar_star', name: 'Star Collar', icon: '⭐', boneCost: 4, type: 'collar' },
  { id: 'collar_rainbow', name: 'Rainbow Collar', icon: '🌈', boneCost: 6, type: 'collar' },
  { id: 'bandana_blue', name: 'Blue Bandana', icon: '💙', boneCost: 3, type: 'neck' },
  { id: 'bandana_stars', name: 'Star Bandana', icon: '🌟', boneCost: 4, type: 'neck' },
  { id: 'glasses_heart', name: 'Heart Glasses', icon: '🥰', boneCost: 5, type: 'face' },
  { id: 'glasses_star', name: 'Star Glasses', icon: '🌟', boneCost: 6, type: 'face' },
  { id: 'backpack_mini', name: 'Mini Backpack', icon: '🎒', boneCost: 7, type: 'body' },
  { id: 'vest_explorer', name: 'Explorer Vest', icon: '🦺', boneCost: 8, type: 'body' },
  { id: 'cape_hero', name: 'Hero Cape', icon: '🦸', boneCost: 10, type: 'body' },
  { id: 'ball_tennis', name: 'Tennis Ball', icon: '🎾', boneCost: 2, type: 'toy' },
  { id: 'frisbee', name: 'Frisbee', icon: '🥏', boneCost: 3, type: 'toy' },
  { id: 'bone_gold', name: 'Gold Bone', icon: '🦴', boneCost: 5, type: 'toy' },
  { id: 'plush_duck', name: 'Rubber Duck', icon: '🦆', boneCost: 4, type: 'toy' },
  { id: 'trophy', name: 'Champion Trophy', icon: '🏆', boneCost: 12, type: 'special' },
];

export function getAccessoryById(id) {
  return ACCESSORIES.find(a => a.id === id);
}
