import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// --- ANIMATION KOMPONENT ---
const RevealOnScroll = ({ children, id, className = "", style = {} }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} id={id} className={`reveal-section ${isVisible ? 'is-visible' : ''} ${className}`} style={style}>
      {children}
    </div>
  );
};

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
        // Lägger till ett litet offset för att headern inte ska täcka innehållet
        const offset = document.querySelector('.header').offsetHeight + 10;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
  };

  // GALLERI - Uppdaterad bildlista (tufte1 till tufte19 i angiven ordning)
  const galleryImages = [
    '/tufte18.png', 
    '/tufte19.png', 
    '/tufte6.png', 
    '/tufte7.png', 
    '/tufte8.png', 
    '/tufte9.png', 
    '/tufte10.png', 
    '/tufte11.png', 
    '/tufte12.png',
    '/tufte14.png', 
    '/tufte15.png', 
    '/tufte16.png',
    '/tufte17.png', 
    '/tufte13.png'
  ];

  return (
    <div className="App">
      {/* --- HEADER --- */}
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          <h1 className="logo" onClick={() => scrollToSection('hjem')}>Tufte Gård</h1>
          <button className={`menu-toggle ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
            <span className="bar"></span><span className="bar"></span><span className="bar"></span>
          </button>
          <nav className={`nav-menu ${menuOpen ? 'open' : ''}`}>
            <button onClick={() => scrollToSection('stemning')}>Stemning</button>
            <button onClick={() => scrollToSection('galleri')}>Galleri</button>
            <button onClick={() => scrollToSection('meny')}>Mat & Drikke</button>
            <button onClick={() => scrollToSection('kontakt')} className="btn-book">Bestill Bord</button>
          </nav>
        </div>
      </header>

      {/* --- HERO (Tufte1) --- */}
      <section 
        id="hjem" 
        className="hero" 
        style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('/tufte1.png')" }}
      >
        <div className="hero-content">
          <span className="subtitle">Ein smak av det gode liv</span>
          <h2>Bordsetning mellom<br/>morelltrea</h2>
          <p>Der samtalen flyt like lett som vinen, enten under sommarsola eller rundt bålpanna.</p>
          <button className="btn-primary" onClick={() => scrollToSection('stemning')}>Opplev Atmosfæren</button>
        </div>
      </section>

      {/* --- INTRO: KONCEPTET --- */}
      <RevealOnScroll className="section-container text-center intro-text">
        <span className="label">Vår Filosofi</span>
        <h3>Ikkje berre ein gard, men ein tilstand</h3>
        <div className="divider">❦</div>
        <p className="lead">
          Me har henta inspirasjon frå dei italienske vinlundane, der måltidet nytast midt i råvarene. 
          Hos oss spring du ikkje rundt – du landar. Du finn roen.
        </p>
        <p>
          Her sit du midt i morellhagen. Om sommaren under ein klar, blå himmel med eit glas kjølig drikke i handa. 
          Om vinteren pakkar me oss inn i ullpledd rundt store bålpanner, medan dufta av varm mat stig mot stjernene.
        </p>
      </RevealOnScroll>

      {/* --- SESONG: VINTER (Tufte3) - HAR FÅTT ID=STEMNING --- */}
      <RevealOnScroll id="stemning" className="split-section reverse">
        <div className="split-image" style={{backgroundImage: "url('/tufte3.png')"}}></div>
        <div className="split-content">
          <span className="label">Vinter: Nytt Konsept</span>
          <h3>Varme rundt bålpanna</h3>
          <p>
            **Velkommen til Tufte Gård rundt bålpanna!** Me gleder oss stort til å introdusere vårt nye vinterkonsept.
            Frå romjulen kan du og gjengen booke deires egen bålpanne (min. 4 personer) og nyte ein koselig stund under 
            åpen himmel – med god mat, lune tepper og ekte vinterstemning.
          </p>
          <p>
            Me starter opp i romjulen, og planlegger å holde åpent kvar helg framover. 
            Sikre deg plass ved bålpanna ved å ta kontakt!
          </p>
        </div>
      </RevealOnScroll>

      {/* --- STORT BILDGALLERI (Uppdaterat) --- */}
      <section id="galleri" className="gallery-section">
        <div className="section-header">
          <h3>Augneblink frå garden</h3>
          <p>Mat, menneske og natur i samspel.</p>
        </div>
        <div className="masonry-grid">
          {galleryImages.map((img, index) => (
            <div key={index} className="masonry-item">
              <img src={img} alt={`Stemningsbilde ${index+1}`} />
            </div>
          ))}
        </div>
      </section>

      {/* --- MENY (VINTERFOKUS) --- */}
      <RevealOnScroll 
        id="meny" 
        className="menu-section"
        style={{ backgroundImage: "url('/tufte3.png')" }}
      >
        <div className="menu-overlay"></div>
        <div className="menu-content-wrapper">
          <span className="label" style={{color: 'var(--gold)'}}>Sesongens Oppleving</span>
          <h3>Vintermeny: Rundt Bålet</h3>
          
          <p className="menu-intro">
            Mat bestilles på forhånd og dessert er inkludert i prisen, her er det berre å glede seg!
            I baren finn du varme drikker, deilige varme drinker og mykje anna godt å kose seg med mellom glørne.
          </p>
          
          <div className="menu-columns">
            {/* VÄNSTER SPALT: MATEN (Grillplanke & Chili) */}
            <div className="menu-col">
              <h4>Hovudrettar</h4>
              <ul>
                <li>
                  <strong>Grillplanke (Pris pr. pers: 399 kr inkl. dessert)</strong>
                  <span>
                    Me serverer kjøtt som ølmarinert svinekjake, lokale pølser m.m., grønnsakspyd, grilla flatbrød, fries 
                    og tilbehør som verkeleg løfter smaksopplevelsen. Me er behjelpelege med grillinga.
                  </span>
                </li>
                <li>
                  <strong>Tuftes Chili con Carne (Pris pr. pers: 329 kr inkl. dessert)</strong>
                  <span>
                    Serverast i baren med ris, brød, nachoschips og anna deilig tilbehør.
                  </span>
                </li>
              </ul>
            </div>

            {/* HÖGER SPALT: DRYCK & SMÅTT */}
            <div className="menu-col">
              <h4>I Koppen & For de minste</h4>
              <ul>
                <li>
                  <strong>For de minste (Pris pr. pers: 119 kr inkl. dessert)</strong>
                  <span>
                    Velg mellom enkle grillspyd og fries, eller pølse og brød.
                  </span>
                </li>
                <li>
                  <strong>Varm Eple- & Morellgløgg</strong>
                  <span>
                    Garden sin eigen eplemost krydra med stjerneanis, kanel og ein dæsj morellsirup. 
                    Varmar heilt ned i tærne.
                  </span>
                </li>
                <li>
                  <strong>Klar deg godt</strong>
                  <span>
                    Vår uniform blir varmeklede, og for frysepinnane har me tepper og pledd for alle som trengjer det ekstra lunt.
                  </span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Liten notis om pris på förfrågan (FIXAT: **...** är ersatt med <strong>...</strong>) */}
          <p className="price-note">
            <em><strong>Romjulstider:</strong> Me held ope 26., 27. og 28. desember. <strong>Følg oss for annonsering av helgeopningar framover!</strong></em>
          </p>
          <div className="menu-times">
            <p>26.desember - første sitting: 14 til 17 | Andre sitting: 18 til 22</p>
            <p>27.desember - første sitting: 14 til 17 | Andre sitting: 18 til 22</p>
            <p>28.desember - 15 til 18</p>
          </div>
        </div>
      </RevealOnScroll>

      {/* --- BESTILLING --- */}
      <RevealOnScroll id="kontakt" className="booking-section">
        <div className="booking-container">
          <h3>Reserver di oppleving</h3>
          <p>Sidan me lagar maten basert på antal gjester, set me pris på bestilling i forkant.</p>
          
          <form className="booking-form" onSubmit={(e) => { e.preventDefault(); alert("Takk! Me tek kontakt snart."); }}>
            <div className="input-group">
              <input type="text" placeholder="Ditt namn" required />
              <input type="email" placeholder="E-post" required />
            </div>
            <div className="input-group">
              <select defaultValue="Middag">
                <option>Grillplanke (399 kr)</option>
                <option>Chili con Carne (329 kr)</option>
                <option>Smaking / Event</option>
              </select>
              <input type="number" placeholder="Antall pers (Min. 4 for bålpanne)" min="1" required />
            </div>
            <div className="input-group">
              <input type="date" min={today} required />
              <input type="time" required />
            </div>
            <textarea placeholder="Har de spesielle ønskjer, allergiar eller vil du reservere For de minste-alternativet?"></textarea>
            <button type="submit">Send Førespurnad</button>
          </form>
          <p className="booking-info">
            Du kan også ta kontakt på Tufte Gård Messenger eller tlf: <strong>46824498</strong> for booking og spørsmål.
          </p>
        </div>
      </RevealOnScroll>

      <footer className="footer">
        <p>Tufte Gård &copy; 2025 | <em>Der matkultur møter natur</em></p>
      </footer>
    </div>
  );
}

export default App;