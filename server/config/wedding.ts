export const weddingConfig = {
  timeZone: 'Asia/Manila',
  startsAt: new Date('2027-01-23T14:00:00+08:00'),
  dateLabel: 'Saturday, January 23, 2027',
  timeLabel: '2:00 PM Philippine time',
  ceremony: 'St. Jude Thaddeus Parish, General Malvar Street, Davao City',
  reception: 'Casa Mayor, Casa Vieja, 111 Francisco Street, Juna Subdivision, Matina, Davao City',
  dressCode: 'Formal: Suit and Tie for gentlemen; Long Gown or Formal Dress for ladies',
  motif: 'Burgundy, Black, Champagne, and Soft Blush',
  reminders: [
    { key: 'one-week', sendAt: new Date('2027-01-16T09:00:00+08:00') },
    { key: 'one-day', sendAt: new Date('2027-01-22T09:00:00+08:00') },
  ],
} as const
