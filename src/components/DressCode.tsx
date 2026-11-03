import { dressCodeGuidance } from '../../shared/wedding'
import { WaxSeal } from './EditorialOrnaments'

export function DressCode() {
  const colors = [
    { name: 'Deep Burgundy', className: 'swatch--deep-burgundy', detail: '#59000A' },
    { name: 'Champagne', className: 'swatch--champagne' },
    { name: 'Soft Blush', className: 'swatch--blush' },
  ]
  return (
    <section className="details panel-section panel-section--wine section-anchor" id="details" aria-labelledby="dress-heading">
      <WaxSeal letters="E&F" />
      <div className="section-inner">
        <div data-reveal="heading"><p className="eyebrow">Attire &amp; Motif</p><h2 id="dress-heading" className="script">Dress Code</h2></div>
        <div className="attire-layout">
          <div className="attire-frame" data-reveal>
            <img
              className="attire-image"
              src="/dresscode-1280.webp"
              srcSet="/dresscode-768.webp 768w, /dresscode-1280.webp 1280w"
              sizes="(max-width: 900px) min(640px, calc(100vw - 40px)), min(640px, 56vw)"
              width="1280"
              height="854"
              loading="lazy"
              decoding="async"
              alt="Four illustrated guests in formal attire: three women in soft blush, champagne, and burgundy gowns, and one man in a black suit"
            />
          </div>
          <div className="dress-copy" data-reveal data-reveal-delay="1">
            <h3>{dressCodeGuidance.title}</h3>
            <p><strong>Gentlemen</strong><br />{dressCodeGuidance.gentlemen}</p>
            <p><strong>Ladies</strong><br />{dressCodeGuidance.ladies}</p>
          </div>
        </div>
        <div className="motif">
          <h3 className="script" data-reveal="heading">Our Motif</h3>
          <div className="swatches">
            {colors.map(({ name, className, detail }, index) => (
              <div key={name} data-reveal data-reveal-delay={String(index + 1)}>
                <span className={`swatch ${className}`} aria-hidden="true" />
                <p>{name}{detail && <small>&mdash; {detail}</small>}</p>
              </div>
            ))}
          </div>
          <div className="gentlemen-color" data-reveal data-reveal-delay="4">
            <span className="swatch swatch--black" aria-hidden="true" />
            <p><strong>Black</strong><small>{dressCodeGuidance.blackLabel}</small></p>
          </div>
        </div>
      </div>
    </section>
  )
}
