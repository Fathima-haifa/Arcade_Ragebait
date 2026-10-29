export type Rule = 'normal' | 'reverse' | 'double';

export interface Option {
  text: string;
  value: number; // positive leans Heaven, negative leans Hell
  reply: string;
}

export interface TrialCase {
  title: string;
  accusation: string;
  evidence: string;
  rule: Rule;
  ruleText: string;
  angel: string;
  devil: string;
  options: Option[];
}

export const CASES: TrialCase[] = [
  {
    title: 'Case 1: The Last Slice',
    accusation: 'The accused stole the last slice of pizza.',
    evidence: 'Exhibit A: a single greasy fingerprint and a suspicious smile.',
    rule: 'normal',
    ruleText: 'Rule: honesty is rewarded.',
    angel: 'Angel: Tell the truth, sweetie.',
    devil: 'Devil: Deny everything. Pizza has no witnesses.',
    options: [
      { text: 'I did it. I regret it. I bring pizza.', value: 2, reply: 'The court weeps. Cheese is shared.' },
      { text: 'It was already half eaten when I arrived.', value: -2, reply: 'The half-eaten slice is now Exhibit B.' },
      { text: "Define 'last'.", value: 0, reply: 'The judge sighs. Philosophy is not a defence.' },
    ],
  },
  {
    title: "Case 2: The 'You Too'",
    accusation: "The accused said 'you too' when the waiter said 'enjoy your meal'.",
    evidence: 'Exhibit A: a waiter who still thinks about it at night.',
    rule: 'reverse',
    ruleText: 'RULE CHANGE: today the judge rewards excuses and punishes honesty.',
    angel: 'Angel: An honest apology never fails!',
    devil: 'Devil: Blame the waiter. He started it.',
    options: [
      { text: 'Sincerely apologise.', value: 2, reply: 'Apologies are suspicious today.' },
      { text: 'Blame the waiter.', value: -2, reply: 'Brilliant. Shameless. Today that is virtue.' },
      { text: "Say 'you too' again.", value: 0, reply: 'The court is confused but impressed.' },
    ],
  },
  {
    title: 'Case 3: Left on Read',
    accusation: 'The accused left a message on read for three business days.',
    evidence: 'Exhibit A: a blue tick that has been judging everyone.',
    rule: 'normal',
    ruleText: 'Rule: back to normal. Mostly. The timer is shorter.',
    angel: 'Angel: Reply with kindness.',
    devil: 'Devil: Leave it on read again. Power move.',
    options: [
      { text: 'Send an apology with a meme.', value: 2, reply: 'The meme was acceptable. The court laughs.' },
      { text: 'Say my phone was haunted.', value: -1, reply: 'The ghost of your phone testifies against you.' },
      { text: 'Leave it on read again.', value: -2, reply: 'Four business days. The record is broken.' },
    ],
  },
  {
    title: 'Case 4: The Easy Game',
    accusation: 'The accused claimed a video game was easy and immediately lost.',
    evidence: 'Exhibit A: a replay of the first 11 seconds.',
    rule: 'double',
    ruleText: 'RULE CHANGE: stakes are doubled. Choose very carefully.',
    angel: 'Angel: Humility is a virtue.',
    devil: 'Devil: Blame the lag. Always the lag.',
    options: [
      { text: 'I lost. It is hard. I am sorry.', value: 2, reply: 'Humility. In this economy?' },
      { text: 'Blame the lag.', value: -2, reply: 'The lag has hired a lawyer.' },
      { text: 'Rage quit in silence.', value: -1, reply: 'Dramatic. The jury felt that.' },
    ],
  },
];