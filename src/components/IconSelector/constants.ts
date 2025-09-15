export interface IconOption {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const defaultIcons: IconOption[] = [
  { id: 'star', name: 'Star', icon: '☆', description: 'Hollow star (default)' },
  { id: 'star-filled', name: 'Filled Star', icon: '★', description: 'Filled star' },
  { id: 'heart', name: 'Heart', icon: '♡', description: 'Hollow heart' },
  { id: 'heart-filled', name: 'Filled Heart', icon: '♥', description: 'Filled heart' },
  { id: 'diamond', name: 'Diamond', icon: '♢', description: 'Hollow diamond' },
  { id: 'diamond-filled', name: 'Filled Diamond', icon: '♦', description: 'Filled diamond' },
  { id: 'circle', name: 'Circle', icon: '○', description: 'Hollow circle' },
  { id: 'circle-filled', name: 'Filled Circle', icon: '●', description: 'Filled circle' },
  { id: 'crown', name: 'Crown', icon: '♔', description: 'Crown symbol' },
  { id: 'spade', name: 'Spade', icon: '♠', description: 'Spade symbol' },
  { id: 'club', name: 'Club', icon: '♣', description: 'Club symbol' },
  { id: 'fire', name: 'Fire', icon: '🔥', description: 'Fire emoji' },
  { id: 'lightning', name: 'Lightning', icon: '⚡', description: 'Lightning bolt' },
  { id: 'snowflake', name: 'Snowflake', icon: '❄️', description: 'Snowflake' },
  { id: 'sword', name: 'Sword', icon: '⚔️', description: 'Crossed swords' },
  { id: 'shield', name: 'Shield', icon: '🛡️', description: 'Shield' }
];