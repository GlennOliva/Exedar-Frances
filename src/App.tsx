import { Header } from './components/Header'
import { InvitationHero } from './components/InvitationHero'
import { WeddingCountdown } from './components/WeddingCountdown'
import { Celebration } from './components/Celebration'
import { Entourage } from './components/Entourage'
import { DressCode } from './components/DressCode'
import { GiftNote } from './components/GiftNote'
import { RSVP } from './components/RSVP'
import { Footer } from './components/Footer'
import { ManageRSVP } from './pages/ManageRSVP'
import { Unsubscribe } from './pages/Unsubscribe'
import { RevealManager } from './components/animations/Reveal'
import { ScrollProgress } from './components/animations/ScrollProgress'
import { BackToTop } from './components/animations/BackToTop'
import { WeddingAssistant } from './components/assistant/WeddingAssistant'
import { AdminLogin } from './pages/AdminLogin'
import { AdminDashboard } from './pages/AdminDashboard'

export default function App() {
  if (location.pathname === '/manage') return <ManageRSVP />
  if (location.pathname === '/unsubscribe') return <Unsubscribe />
  if (location.pathname === '/admin/login') return <AdminLogin />
  if (location.pathname === '/admin') return <AdminDashboard />
  return <><RevealManager /><ScrollProgress /><div className="invitation-shell" id="top"><Header /><main className="site-main"><InvitationHero /><WeddingCountdown /><Celebration /><Entourage /><DressCode /><GiftNote /><RSVP /></main><Footer /></div><BackToTop /><WeddingAssistant /></>
}
