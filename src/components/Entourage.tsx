import { entourage, type NamePair, type NamedRole } from '../data/entourage'
import { BotanicalOrnament } from './BotanicalOrnament'

function PairRows({ pairs, className = '' }: { pairs: readonly NamePair[]; className?: string }) {
  return <div className={`paired-rows ${className}`}>{pairs.map((pair, index) => <div className="paired-row" key={`${pair.left}-${index}`}><p>{pair.left}</p><i aria-hidden="true" /><p>{pair.right}</p></div>)}</div>
}

function RoleGrid({ roles, className = '' }: { roles: readonly NamedRole[]; className?: string }) {
  return <div className={`role-grid ${className}`}>{roles.map((item) => <article key={item.role}><h3 className="script">{item.role}</h3>{item.names.map((name) => <p key={name}>{name}</p>)}</article>)}</div>
}

export function Entourage() {
  return (
    <section className="entourage panel-section panel-section--ivory section-anchor" id="entourage" aria-labelledby="entourage-heading">
      <div className="section-inner entourage-inner">
        <div data-reveal="heading"><p className="eyebrow">Our Wedding Entourage</p>
        <h2 id="entourage-heading" className="script">Tapic – Argillo</h2></div>
        <BotanicalOrnament />

        <div className="entourage-group parents-group" data-reveal><h3 className="script">Parents</h3><div className="parents-columns"><div>{entourage.parents.map((row) => <p key={row[0]}>{row[0]}</p>)}</div><div>{entourage.parents.map((row) => <p key={row[1]}>{row[1]}</p>)}</div></div></div>

        <div className="entourage-group sponsors-group" data-reveal><h3 className="script">Principal Sponsors</h3><PairRows pairs={entourage.principalSponsors} /></div>

        <div data-reveal><RoleGrid roles={entourage.honor} className="honor-grid" /></div>

        <div className="entourage-group attendants-group" data-reveal><div className="paired-headings"><h3 className="script">Groomsmen</h3><h3 className="script">Bridesmaids</h3></div><PairRows pairs={entourage.attendants} /></div>

        <div data-reveal><RoleGrid roles={entourage.symbols} className="symbols-grid" /></div>
        <div data-reveal><RoleGrid roles={entourage.bearers} className="bearers-grid" /></div>

        <div className="entourage-group flower-group" data-reveal><h3 className="script">Flower Girls</h3><PairRows pairs={entourage.flowerGirls} /></div>
        <div className="entourage-group cousin-group" data-reveal><h3 className="script">Bride’s Dearest Cousin</h3><p>{entourage.cousin}</p></div>
      </div>
    </section>
  )
}
