import { dressCodeGuidance } from '../../shared/wedding.js'

export type AssistantIntent = 'dating' | 'meeting' | 'firstMove' | 'wedding' | 'dressCode' | 'rsvp' | 'unknown'

export interface AssistantAnswer {
  text: string
  action?: { label: string; target: '#celebration' | '#details' | '#rsvp' }
}

export const suggestedQuestions = [
  'When did they start dating?',
  'How did they meet?',
  'Who made the first move?',
  'When and where is the wedding?',
  'What should I wear?',
  'How do I RSVP?',
] as const

// These relationship answers are awaiting final wording from the couple.
export const assistantAnswers: Record<AssistantIntent, AssistantAnswer> = {
  dating: { text: 'The couple’s dating story will be shared here soon.' },
  meeting: { text: 'Exedar and Frances are preparing this part of their story. Please check back soon.' },
  firstMove: { text: 'That little detail is still a secret! The couple will share their answer here soon.' },
  wedding: {
    text: 'Exedar and Frances are getting married on Saturday, January 23, 2027, at 2:00 PM Philippine time, at St. Jude Thaddeus Parish, General Malvar Street, Davao City. The reception follows at Casa Mayor, Casa Vieja, 111 Francisco Street, Juna Subdivision, Matina, Davao City.',
    action: { label: 'View Celebration', target: '#celebration' },
  },
  dressCode: {
    text: `${dressCodeGuidance.title}. Gentlemen: ${dressCodeGuidance.gentlemen} Ladies: ${dressCodeGuidance.ladies}`,
    action: { label: 'View Dress Code', target: '#details' },
  },
  rsvp: {
    text: 'Please complete the RSVP form with your first name, last name, email address, and attendance. You can also choose to receive wedding email reminders.',
    action: { label: 'Go to RSVP', target: '#rsvp' },
  },
  unknown: { text: 'I can help with the couple’s story, wedding details, dress code, and RSVP. Try one of the suggested questions.' },
}

export function matchAssistantIntent(input: string): AssistantIntent {
  const text = input.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  if (/dating|start(ed)? dating|got together|get together|been together/.test(text)) return 'dating'
  if (/how.*meet|how.*met|first meet|meeting story/.test(text)) return 'meeting'
  if (/first move|made.*move|asked.*out|who.*pursued/.test(text)) return 'firstMove'
  if (/dress|attire|wear|motif|color|gown|suit/.test(text)) return 'dressCode'
  if (/rsvp|reply|respond|attendance|attend|reserve/.test(text)) return 'rsvp'
  if (/wedding|ceremony|reception|venue|church|when|where|date|time|location/.test(text)) return 'wedding'
  return 'unknown'
}
