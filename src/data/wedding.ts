export const wedding = {
  couple: 'Exedar & Frances',
  dateTime: '2027-01-23T14:00:00+08:00',
  date: 'Saturday, January 23, 2027',
  time: '2:00 PM',
  ceremony: {
    name: 'St. Jude Thaddeus Parish',
    address: 'General Malvar Street, Davao City',
    map: 'https://www.google.com/maps/search/?api=1&query=St.%20Jude%20Thaddeus%20Parish%2C%20General%20Malvar%20Street%2C%20Davao%20City',
  },
  reception: {
    name: 'Casa Mayor',
    address: 'Casa Vieja, 111 Francisco Street, Juna Subdivision, Matina, Davao City',
    map: 'https://www.google.com/maps/search/?api=1&query=Casa%20Mayor%2C%20Casa%20Vieja%2C%20111%20Francisco%20Street%2C%20Juna%20Subdivision%2C%20Matina%2C%20Davao%20City',
  },
} as const

export function downloadCalendar() {
  const content = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Exedar and Frances//Wedding//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', 'UID:exedar-frances-20270123@wedding', 'DTSTAMP:20261103T000000Z',
    'DTSTART;TZID=Asia/Manila:20270123T140000',
    'SUMMARY:Wedding of Exedar and Frances',
    'LOCATION:St. Jude Thaddeus Parish\\, General Malvar Street\\, Davao City',
    'DESCRIPTION:Wedding ceremony of Exedar and Frances. Reception to follow at Casa Mayor.',
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'exedar-frances-wedding.ics'
  link.click()
  URL.revokeObjectURL(url)
}
