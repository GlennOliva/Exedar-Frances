import { wedding } from '../data/wedding'
import { EditorialHeading, EventIcon, WaxSeal } from './EditorialOrnaments'

function Architecture() {
  return <svg className="architecture" viewBox="0 0 700 190" aria-hidden="true"><path d="M30 168h640M75 168V90l70-43 70 43v78M115 168v-50h60v50M145 47V20M132 29h26M238 168V74h92v94M255 74l29-38 29 38M284 36V16M273 22h22M360 168V98h116v70M386 168v-42h64v42M496 168V82l58-36 71 44v78M537 168v-54h49v54M554 46V22M544 29h20" /><path d="M75 101h140M238 93h92M360 112h116M496 100h129" /></svg>
}

export function Celebration() {
  return <>
    <section className="wedding-details panel-section panel-section--wine section-anchor" id="celebration" aria-labelledby="details-title">
      <WaxSeal />
      <div className="section-inner">
        <EditorialHeading overline="The twenty-third of January" light><span id="details-title" className="script">Wedding Details</span></EditorialHeading>
        <div data-reveal><Architecture /></div>
        <div className="venue-grid">
          <article data-reveal data-reveal-delay="1"><p className="eyebrow">Ceremony</p><h3>{wedding.ceremony.name}</h3><address>{wedding.ceremony.address}</address><p>Saturday, January 23, 2027<br />2:00 PM · Philippine time</p><a href={wedding.ceremony.map} target="_blank" rel="noreferrer">View Map <span aria-hidden="true">↗</span></a></article>
          <article data-reveal data-reveal-delay="2"><p className="eyebrow">Reception</p><h3>{wedding.reception.name}</h3><address>Casa Vieja, 111 Francisco Street<br />Juna Subdivision, Matina, Davao City</address><p>Reception to follow the ceremony.</p><a href={wedding.reception.map} target="_blank" rel="noreferrer">View Map <span aria-hidden="true">↗</span></a></article>
        </div>
      </div>
    </section>
    <section className="our-day panel-section panel-section--ivory" aria-labelledby="our-day-title">
      <div className="section-inner">
        <EditorialHeading overline="The Celebration"><span id="our-day-title">Our Day</span></EditorialHeading>
        <div className="event-sequence">
          <article data-reveal data-reveal-delay="1"><EventIcon type="ceremony" /><h3>Ceremony</h3><p>2:00 PM</p></article>
          <span className="event-rule" aria-hidden="true" />
          <article data-reveal data-reveal-delay="2"><EventIcon type="reception" /><h3>Reception</h3><p>Following the ceremony</p></article>
        </div>
      </div>
    </section>
  </>
}
