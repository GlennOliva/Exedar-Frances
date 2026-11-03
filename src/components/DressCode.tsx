import { WaxSeal } from './EditorialOrnaments'

export function DressCode() {
  const colors = [['Burgundy', '#650D14'], ['Black', '#111111'], ['Champagne', '#D6C4AC'], ['Soft Blush', '#BFA3A0']]
  return (
    <section className="details panel-section panel-section--wine section-anchor" id="details" aria-labelledby="dress-heading">
      <WaxSeal letters="E&F" />
      <div className="section-inner">
        <div data-reveal="heading"><p className="eyebrow">Attire &amp; Motif</p><h2 id="dress-heading" className="script">Dress Code</h2></div>
        <div className="attire-layout"><div className="attire-frame" data-reveal><img className="attire-image" src="/dresscode.png" width="1536" height="1024" loading="lazy" decoding="async" alt="Four guests illustrating the formal wedding attire, with suits and ties for gentlemen and long gowns for ladies" /></div><div className="dress-copy" data-reveal data-reveal-delay="1"><h3>Formal</h3><p><strong>Gentlemen</strong><br />Suit and Tie</p><p><strong>Ladies</strong><br />Long Gown or Formal Dress</p></div></div>
        <div className="motif"><h3 className="script" data-reveal="heading">Our Motif</h3><div className="swatches">{colors.map(([name, color], index) => <div key={name} data-reveal data-reveal-delay={String(index + 1)}><span className={name === 'Burgundy' ? 'swatch swatch--wine' : 'swatch'} style={{ backgroundColor: color }} /><p>{name}</p></div>)}</div></div>
      </div>
    </section>
  )
}
