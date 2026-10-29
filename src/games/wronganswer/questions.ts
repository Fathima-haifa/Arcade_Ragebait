export interface Question {
  text: string;
  answers: string[];
  real: number;    // the truly correct answer
  absurd: number;  // the answer the host loves in reverse mode
  mode: 'reverse' | 'honest';
}

export const QUESTIONS: Question[] = [
  { text: 'What is 2 + 2?', answers: ['3', '4', '5', 'The concept of numbers'], real: 1, absurd: 3, mode: 'reverse' },
  { text: 'What is the capital of France?', answers: ['Paris', 'Lyon', 'France is a state of mind', 'Berlin'], real: 0, absurd: 2, mode: 'reverse' },
  { text: 'What colour is the sky on a clear day?', answers: ['Blue', 'Green', 'Red', 'Plaid'], real: 0, absurd: 3, mode: 'reverse' },
  { text: 'How many planets are in our solar system?', answers: ['8', '9', '12', 'Ask the planets'], real: 0, absurd: 3, mode: 'reverse' },
  { text: 'At sea level, water boils at...', answers: ['100°C', '50°C', 'When it feels ready', '0°C'], real: 0, absurd: 2, mode: 'reverse' },
  { text: 'RULE CHANGE! Which animal says meow?', answers: ['Cat', 'Dog', 'Toaster', 'The moon'], real: 0, absurd: 2, mode: 'honest' },
  { text: 'Final question. How many days are in a week?', answers: ['7', '5', '12', 'Tuesday'], real: 0, absurd: 3, mode: 'honest' },
];

export const PASS_SCORE = 5;