import { weddingConfig as wedding } from '../config/wedding.js'

export interface GuestEmail { id: string; first_name: string; last_name: string; email: string; attendance: 'attending' | 'declining'; reminder_consent: boolean; token_version: string }
const esc = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!)
const shell = (content: string) => `<!doctype html><html><body style="margin:0;background:#fcfaf7;color:#2c2023;font-family:Georgia,serif"><div style="max-width:620px;margin:auto;padding:48px 28px"><div style="border-top:1px solid #6b2135;border-bottom:1px solid #6b2135;padding:42px 24px"><p style="color:#6b2135;letter-spacing:3px;text-align:center;font-size:12px">EXEDAR &amp; FRANCES</p>${content}</div></div></body></html>`
const button = (href: string, label: string) => `<p style="margin-top:28px"><a href="${href}" style="background:#6b2135;color:#fff;padding:13px 20px;text-decoration:none">${label}</a></p>`

export function confirmationEmail(guest: GuestEmail, manageUrl: string) {
  const name = `${esc(guest.first_name)} ${esc(guest.last_name)}`
  if (guest.attendance === 'declining') return {
    subject: 'Thank you for your reply | Exedar & Frances',
    html: shell(`<h1 style="color:#6b2135;font-weight:normal">Thank you, ${name}</h1><p>We received your RSVP. Exedar and Frances warmly appreciate your reply and will miss celebrating with you.</p>${button(manageUrl, 'Manage your RSVP')}`),
    text: `Thank you, ${guest.first_name} ${guest.last_name}. We received your RSVP. Exedar and Frances warmly appreciate your reply and will miss celebrating with you.\n\nManage your RSVP: ${manageUrl}`,
  }
  const reminder = guest.reminder_consent ? 'Wedding reminders are enabled.' : 'Wedding reminders are not enabled.'
  return {
    subject: 'Your RSVP is confirmed | Exedar & Frances',
    html: shell(`<h1 style="color:#6b2135;font-weight:normal">Your reply is received</h1><p>Dear ${name},</p><p>We are delighted to confirm your RSVP for the wedding of <strong>Exedar and Frances</strong>.</p><p><strong>${wedding.dateLabel}</strong><br>Ceremony: ${wedding.timeLabel}<br>${wedding.ceremony}</p><p>Reception to follow at ${wedding.reception}.</p><p><strong>Dress code:</strong> ${wedding.dressCode}</p><p><strong>Gentlemen:</strong> ${wedding.dressCodeGuidance.gentlemen}</p><p><strong>Ladies:</strong> ${wedding.dressCodeGuidance.ladies}</p><p><strong>Motif:</strong> ${wedding.motif}<br><strong>Black:</strong> ${wedding.dressCodeGuidance.blackLabel}</p><p>${reminder}</p>${button(manageUrl, 'Manage your RSVP')}`),
    text: `Dear ${guest.first_name} ${guest.last_name},\n\nWe received your RSVP for Exedar and Frances.\n${wedding.dateLabel}\nCeremony: ${wedding.timeLabel}\n${wedding.ceremony}\nReception to follow at ${wedding.reception}.\nDress code: ${wedding.dressCode}\nGentlemen: ${wedding.dressCodeGuidance.gentlemen}\nLadies: ${wedding.dressCodeGuidance.ladies}\nMotif: ${wedding.motif}\nBlack: ${wedding.dressCodeGuidance.blackLabel}\n${reminder}\n\nManage your RSVP: ${manageUrl}`,
  }
}

export function managementEmail(guest: GuestEmail, manageUrl: string) {
  return { subject: 'Your secure RSVP link | Exedar & Frances', html: shell(`<h1 style="color:#6b2135;font-weight:normal">Your secure RSVP link</h1><p>Dear ${esc(guest.first_name)},</p><p>Use the button below to review your RSVP and reminder preferences. This link expires in 30 days.</p>${button(manageUrl, 'Manage your RSVP')}<p>If you did not request this email, no action is needed.</p>`), text: `Dear ${guest.first_name},\n\nReview your RSVP and reminder preferences using this secure link (valid for 30 days):\n${manageUrl}\n\nIf you did not request this email, no action is needed.` }
}

export function reminderEmail(guest: GuestEmail, manageUrl: string, unsubscribeUrl: string) {
  return {
    subject: `Wedding reminder | ${wedding.dateLabel}`,
    html: shell(`<h1 style="color:#6b2135;font-weight:normal">A wedding reminder</h1><p>Dear ${esc(guest.first_name)},</p><p>We look forward to celebrating the wedding of Exedar and Frances with you.</p><p><strong>${wedding.dateLabel}</strong><br>Ceremony: ${wedding.timeLabel}<br>${wedding.ceremony}</p><p>Reception to follow at ${wedding.reception}.</p><p><strong>Dress code:</strong> ${wedding.dressCode}</p><p><strong>Gentlemen:</strong> ${wedding.dressCodeGuidance.gentlemen}</p><p><strong>Ladies:</strong> ${wedding.dressCodeGuidance.ladies}</p><p><strong>Motif:</strong> ${wedding.motif}<br><strong>Black:</strong> ${wedding.dressCodeGuidance.blackLabel}</p>${button(manageUrl, 'Manage your RSVP')}<p style="font-size:13px"><a href="${unsubscribeUrl}">Unsubscribe from wedding reminders</a></p>`),
    text: `Dear ${guest.first_name},\n\nA reminder for the wedding of Exedar and Frances.\n${wedding.dateLabel}\nCeremony: ${wedding.timeLabel}\n${wedding.ceremony}\nReception to follow at ${wedding.reception}.\nDress code: ${wedding.dressCode}\nGentlemen: ${wedding.dressCodeGuidance.gentlemen}\nLadies: ${wedding.dressCodeGuidance.ladies}\nMotif: ${wedding.motif}\nBlack: ${wedding.dressCodeGuidance.blackLabel}\n\nManage RSVP: ${manageUrl}\nUnsubscribe: ${unsubscribeUrl}`,
  }
}
