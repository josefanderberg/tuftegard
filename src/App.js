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
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  // GALLERI - Här används tufte5 till tufte10
  const galleryImages = [
   '/tufte18.png', '/tufte19.png', '/tufte6.png', '/tufte7.png', 
    '/tufte8.png', '/tufte9.png', '/tufte10.png', '/tufte11.png', '/tufte12.png',
    , 'tufte14.png', 'tufte15.png', 'tufte16.png','/tufte17.png' , 'tufte13.png'
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

      {/* --- SESONG: SOMMER (Tufte2) --- */}
      <RevealOnScroll id="stemning" className="split-section">
        <div className="split-image" style={{backgroundImage: "url('/tufte2.png')"}}></div>
        <div className="split-content">
          <span className="label">Sommar</span>
          <h3>Under open himmel</h3>
          <p>
            Når sola står høgt, dekkjer me opp langbord mellom rekkjene av morelltre. 
            Det er her, i skuggen av greinene, at den italienske kjensla treffer Telemark.
          </p>
          <p>
            Nyt ein kald eplemost frå garden eller eit glas kvitvin, medan du kjenner dufta av solvarme bær og gras. 
            Det perfekte bakteppet for dei gode samtalene som varar heilt til sola går ned.
          </p>
        </div>
      </RevealOnScroll>

      {/* --- SESONG: VINTER (Tufte3) --- */}
      <RevealOnScroll className="split-section reverse">
        <div className="split-image" style={{backgroundImage: "url('/tufte3.png')"}}></div>
        <div className="split-content">
          <span className="label">Vinter & Haust</span>
          <h3>Varme rundt bålpanna</h3>
          <p>
            Når lufta blir skarp og mørket fell på, tenner me opp i store bålpanner. 
            Stemninga endrar seg frå lett og luftig til lun og intim.
          </p>
          <p>
            Her får du varme skinnfellar og levande eld. Me serverer rykande varm suppe, 
            lokalt kjøt på grillen og krydra varm drikke som varmar heilt inn i sjela. 
            Ein magisk stad å vera når stjernene kjem fram.
          </p>
        </div>
      </RevealOnScroll>

      {/* --- STORT BILDGALLERI (Tufte5-10) --- */}
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

      {/* --- MENY (Tufte4) --- */}
      <RevealOnScroll 
        id="meny" 
        className="menu-section"
        style={{ backgroundImage: "url('/tufte4.png')" }}
      >
        <div className="menu-overlay"></div>
        <div className="menu-content-wrapper">
          <h3>Smaken av sesong</h3>
          <p className="menu-intro">Menyen vår følgjer naturen. Enkel, ærleg og laga med kjærleik.</p>
          
          <div className="menu-columns">
            <div className="menu-col">
              <h4>Mat</h4>
              <ul>
                <li>
                  <strong>Italiensk Morell-pizza</strong>
                  <span>Bakt i steinomn ute, med spekeskinke og ruccola.</span>
                </li>
                <li>
                  <strong>Bålpanne-gryte</strong>
                  <span>Langtidskokt på lokalt vilt, servert rykande varm.</span>
                </li>
                <li>
                  <strong>Sommarfjøl</strong>
                  <span>Utvalde ostar, spekemat, flatbrød og morellkompott.</span>
                </li>
              </ul>
            </div>
            <div className="menu-col">
              <h4>Drikke</h4>
              <ul>
                <li>
                  <strong>Tufte Eplemost</strong>
                  <span>Pressa på garden. Ufiltrert og frisk.</span>
                </li>
                <li>
                  <strong>Lokal Øl & Vin</strong>
                  <span>Nøye utvalde sortar som passar til maten.</span>
                </li>
                <li>
                  <strong>Varm Eplegløgg</strong>
                  <span>Med kanel og stjerneanis (Vinter).</span>
                </li>
              </ul>
            </div>
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
                <option>Lunsj under trea</option>
                <option>Middag ved bålpanna</option>
                <option>Smaking / Event</option>
              </select>
              <input type="number" placeholder="Antall pers" min="1" required />
            </div>
            <div className="input-group">
              <input type="date" min={today} required />
              <input type="time" required />
            </div>
            <textarea placeholder="Har de spesielle ønskjer eller allergiar?"></textarea>
            <button type="submit">Send Førespurnad</button>
          </form>
        </div>
      </RevealOnScroll>

      <footer className="footer">
        <p>Tufte Gård &copy; 2025 | <em>Der matkultur møter natur</em></p>
      </footer>
    </div>
  );
}

export default App;