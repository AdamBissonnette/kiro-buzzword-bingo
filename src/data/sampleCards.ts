import type { CardData } from '../types';

// Game of Thrones bingo terms from sample.txt
const gameOfThronesTerms = [
  'Someone says "My Lady"',
  'Someone says "My Lord"',
  'Dragon breathes fire',
  'Undead dragon breathes... fire?',
  'Gendry blacksmiths things',
  'Cersei drinks',
  'Tyrion drinks',
  'Ravens caw',
  'Sex scene',
  'Male nudity',
  'Female nudity',
  'Sansa broods',
  'Someone says "Your grace"',
  'Jon Snow broods',
  'Valyrian steel / dragon glass mentioned',
  '"What is dead can never die"',
  'Azor Ahai',
  '"The North Remembers"',
  'A character dies',
  'A character comes back to life',
  'Sword practice in the courtyard',
  'The Lord of Light',
  'Maester\'s chain rattles as he walks',
  'Torture scene',
  'The mountain says nothing when spoken to',
  'The hound says nothing when spoken to',
  'A sword lights on fire',
  'A wight is killed',
  'A wight kills someone',
  'Direwolf attacks',
  'And now his watch has ended',
  'Someone takes the black',
  'The wall is shown',
  'Bran uses his greenseeing and it\'s bad',
  'Bran uses his greenseeing and it\'s good',
  'Crypts below winterfell',
  'A faceless man cliche',
  'Onion knight',
  'Winter is coming',
  'Fire reference',
  'Ice reference'
];

/**
 * Creates a Game of Thrones bingo card with 24 random terms
 * (25 squares total with 1 free space in the center)
 */
export function createGameOfThronesCard(): CardData {
  // Shuffle the terms and take the first 24
  const shuffledTerms = [...gameOfThronesTerms].sort(() => Math.random() - 0.5);
  const selectedTerms = shuffledTerms.slice(0, 24);
  
  const now = new Date();
  
  return {
    id: `sample_got_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: 'Game of Thrones Bingo',
    terms: selectedTerms,
    freeSpaceImage: undefined, // Use icon instead
    freeSpaceIcon: 'star', // Default hollow star icon
    arrangement: undefined, // Use default sequential arrangement
    createdAt: now,
    updatedAt: now
  };
}

/**
 * All available Game of Thrones terms for reference
 */
export { gameOfThronesTerms };