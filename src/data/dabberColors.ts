export interface DabberColor {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export const dabberColors: DabberColor[] = [
  // Primary Colors
  {
    id: 'red',
    name: 'Red',
    color: '#dc3545',
    description: 'Classic red dabber'
  },
  {
    id: 'blue',
    name: 'Blue', 
    color: '#007bff',
    description: 'Traditional blue'
  },
  {
    id: 'green',
    name: 'Green',
    color: '#28a745',
    description: 'Fresh green'
  },
  {
    id: 'purple',
    name: 'Purple',
    color: '#6f42c1',
    description: 'Royal purple'
  },
  {
    id: 'orange',
    name: 'Orange',
    color: '#fd7e14',
    description: 'Vibrant orange'
  },
  
  // Pastels
  {
    id: 'pink',
    name: 'Pink',
    color: '#e83e8c',
    description: 'Soft pink'
  },
  {
    id: 'mint',
    name: 'Mint',
    color: '#20c997',
    description: 'Cool mint green'
  },
  {
    id: 'lavender',
    name: 'Lavender',
    color: '#6610f2',
    description: 'Gentle lavender'
  },
  {
    id: 'peach',
    name: 'Peach',
    color: '#fd7e14',
    description: 'Warm peach'
  },
  {
    id: 'sky',
    name: 'Sky Blue',
    color: '#17a2b8',
    description: 'Light sky blue'
  },
  
  // Additional Options
  {
    id: 'yellow',
    name: 'Yellow',
    color: '#ffc107',
    description: 'Bright yellow'
  },
  {
    id: 'teal',
    name: 'Teal',
    color: '#20c997',
    description: 'Ocean teal'
  }
];

export const defaultDabberColor: DabberColor = dabberColors[0]; // Red as default