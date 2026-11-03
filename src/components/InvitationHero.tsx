export function InvitationHero() {
  return (
    <section className="cover panel-section panel-section--wine section-anchor" id="invitation" aria-labelledby="cover-heading">
      <div className="section-inner cover-grid">
        <div className="cover-heading">
          <p className="cover-kicker hero-enter hero-enter--support">Together with our families</p>
          <h1 id="cover-heading" className="cover-names hero-enter hero-enter--names"><span>Exedar</span><small>and</small><span>Frances</span></h1>
        </div>
        <div className="cover-art hero-enter hero-enter--gallery">
          <div className="hero-gallery">
            <figure>
              <img src="/image1.jpg" alt="Exedar and Frances sharing a moment together" width="1024" height="1027" decoding="async" />
            </figure>
            <figure>
              <img src="/image2.jpg" alt="Exedar and Frances in a second engagement portrait" width="1024" height="1027" decoding="async" />
            </figure>
          </div>
        </div>
        <div className="cover-detail hero-enter hero-enter--date">
          <p className="cover-marrying">Are getting married</p>
          <p className="cover-date">January 23, 2027</p>
          <div className="cover-actions hero-enter hero-enter--actions"><a href="#celebration">View Celebration</a><a href="#rsvp">RSVP</a></div>
        </div>
      </div>
      <a className="scroll-cue hero-enter hero-enter--actions" href="#save-the-date"><span>Scroll</span><i aria-hidden="true" /></a>
    </section>
  )
}
