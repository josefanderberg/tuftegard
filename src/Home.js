import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './App.css';
import { db } from './firebase';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';

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

const Home = ({ content }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [visibleImagesCount, setVisibleImagesCount] = useState(6);

    // --- BOKNING STATE ---
    const [bookingDate, setBookingDate] = useState(null);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

    // Lista på datum som är fulla (>= 5 bokningar)
    const [fullyBookedDates, setFullyBookedDates] = useState([]);

    // Formulär-data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        guests: 1,
        time: '',
        notes: '',
        dishes: {}
    });

    const [submitting, setSubmitting] = useState(false);

    // Konvertera sträng-datum från content till Date-objekt
    const openDates = (content.calendar?.openDates || []).map(d => new Date(d));

    // Menyalternativ för mat
    const mainCourses = content.menu.mainCourses || [];
    const drinksGroups = content.menu.drinksGroups || [];

    const MAX_BOOKINGS = 5;

    // --- EFFEKTER ---
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);

        // HÄMTA FULLBOKADE DATUM PÅ LOAD
        fetchBookingsAndCheckCapacity();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchBookingsAndCheckCapacity = async () => {
        if (!db) return;
        try {
            const q = query(collection(db, "bookings"));
            const snapshot = await getDocs(q);
            const counts = {};
            snapshot.forEach(doc => {
                const d = doc.data().date;
                if (d) counts[d] = (counts[d] || 0) + 1;
            });

            // Hitta datum som nått gränsen
            const fullDates = Object.keys(counts).filter(date => counts[date] >= MAX_BOOKINGS);
            setFullyBookedDates(fullDates);
        } catch (error) {
            console.error("Fel vid hämtning av kapacitet", error);
        }
    };

    // Uppdatera tillgängliga tider när datum ändras
    useEffect(() => {
        if (!bookingDate) {
            setAvailableTimeSlots([]);
            return;
        }

        const day = bookingDate.getDay(); // 0 = Söndag
        let slots = [];
        const standardTimes = content.booking?.standardTimes || ["18:00"];
        const sundayTimes = content.booking?.sundayTimes || ["15:00"];

        if (day === 0) {
            slots = sundayTimes;
        } else {
            slots = standardTimes;
        }
        setAvailableTimeSlots(slots);

        if (slots.length > 0) {
            setFormData(prev => ({ ...prev, time: slots[0] }));
        }
    }, [bookingDate, content.booking]);

    const scrollToSection = (id) => {
        setMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            const offset = document.querySelector('.header').offsetHeight + 10;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    };

    const galleryImages = [
        '/tufte18.png', '/tufte19.png', '/tufte6.png', '/tufte7.png', '/tufte8.png',
        '/tufte9.png', '/tufte10.png', '/tufte11.png', '/tufte12.png',
        '/tufte14.png', '/tufte15.png', '/tufte16.png', '/tufte17.png', '/tufte13.png'
    ];

    const showMoreImages = () => {
        setVisibleImagesCount(galleryImages.length);
    };

    const handleDishCountChange = (dishTitle, count) => {
        setFormData(prev => ({
            ...prev,
            dishes: {
                ...prev.dishes,
                [dishTitle]: parseInt(count)
            }
        }));
    };

    const handleSubmitBooking = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        if (!bookingDate) {
            alert("Vennligst velg en dato.");
            setSubmitting(false);
            return;
        }

        const offset = bookingDate.getTimezoneOffset();
        const localDate = new Date(bookingDate.getTime() - (offset * 60 * 1000));
        const dateString = localDate.toISOString().split('T')[0];

        // Dubbelkolla mot fullyBookedDates (klient-side check)
        if (fullyBookedDates.includes(dateString)) {
            alert("Tyvärr, detta datum har precis blivit fullbokat.");
            setSubmitting(false);
            return;
        }

        try {
            await addDoc(collection(db, "bookings"), {
                ...formData,
                date: dateString,
                createdAt: new Date().toISOString()
            });

            alert(`Takk! Di bordbestilling for ${formData.guests} personar den ${dateString} kl ${formData.time} er mottatt.`);

            setBookingDate(null);
            setFormData({ name: '', email: '', guests: 1, time: '', notes: '', dishes: {} });

            // Uppdatera kapacitet direkt ifall man vill boka igen
            fetchBookingsAndCheckCapacity();
        } catch (error) {
            console.error(error);
            alert("Noe gikk galt.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="App">
            <div className="hero-bg-fixed" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('/tufte1.png')" }}></div>

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

            <section id="hjem" className="hero">
                <div className="hero-content">
                    <span className="subtitle">{content.hero.subtitle}</span>
                    <h2>{content.hero.title}</h2>
                    <p>{content.hero.description}</p>
                    <button className="btn-primary" onClick={() => scrollToSection('stemning')}>{content.hero.buttonText}</button>
                </div>
            </section>

            <RevealOnScroll className="section-container text-center intro-text">
                <span className="label">{content.intro.label}</span>
                <h3>{content.intro.title}</h3>
                <div className="divider">❦</div>
                <p className="lead">{content.intro.lead}</p>
                <p>{content.intro.text}</p>
            </RevealOnScroll>

            <RevealOnScroll id="stemning" className="split-section reverse">
                <div className="split-image" style={{ backgroundImage: "url('/tufte3.png')" }}></div>
                <div className="split-content">
                    <span className="label">{content.winter.label}</span>
                    <h3>{content.winter.title}</h3>
                    <p><strong>{content.winter.textPart1.split('.')[0] + '.'}</strong> {content.winter.textPart1.split('.').slice(1).join('.')}</p>
                    <p>{content.winter.textPart2}</p>
                </div>
            </RevealOnScroll>

            <section id="galleri" className="gallery-section">
                <div className="section-header">
                    <h3>{content.gallery.title}</h3>
                    <p>{content.gallery.subtitle}</p>
                </div>
                <div className="masonry-grid">
                    {galleryImages.slice(0, visibleImagesCount).map((img, index) => (
                        <div key={index} className="masonry-item">
                            <img src={img} alt={`Stemningsbilde ${index + 1}`} />
                        </div>
                    ))}
                </div>
                {visibleImagesCount < galleryImages.length && (
                    <div className="gallery-button-container">
                        <button onClick={showMoreImages} className="btn-outline">
                            Se flere bilete ({galleryImages.length - visibleImagesCount} til)
                        </button>
                    </div>
                )}
            </section>

            <RevealOnScroll id="meny" className="menu-section" style={{ backgroundImage: "url('/tufte3.png')" }}>
                <div className="menu-overlay"></div>
                <div className="menu-content-wrapper">
                    <span className="label" style={{ color: 'var(--gold)' }}>{content.menu.label}</span>
                    <h3 className="yellowh3">{content.menu.title}</h3>
                    <p className="menu-intro">{content.menu.intro}</p>
                    <div className="menu-columns">
                        <div className="menu-col">
                            <h4>Hovudrettar</h4>
                            <ul>
                                {mainCourses.length > 0 ? (
                                    mainCourses.map((item, index) => (
                                        <li key={index}>
                                            <strong>{item.title}</strong>
                                            <span>{item.description}</span>
                                        </li>
                                    ))
                                ) : (
                                    <p>Inga rätter tillgängliga.</p>
                                )}
                            </ul>
                        </div>
                        <div className="menu-col">
                            <h4>I Koppen & For de minste</h4>
                            <ul>
                                {drinksGroups.length > 0 ? (
                                    drinksGroups.map((item, index) => (
                                        <li key={index}>
                                            <strong>{item.title}</strong>
                                            <span>{item.description}</span>
                                        </li>
                                    ))
                                ) : (
                                    <p>Inga alternativ tillgängliga.</p>
                                )}
                            </ul>
                        </div>
                    </div>
                    <p className="price-note">
                        <em><strong>{content.menu.priceNotePrefix}</strong> {content.menu.priceNote.replace(content.menu.priceNotePrefix, '')}</em>
                    </p>
                    <div className="menu-times">
                        {content.menu.openingTimes.map((time, idx) => (
                            <p key={idx}>{time}</p>
                        ))}
                    </div>
                </div>
            </RevealOnScroll>

            <RevealOnScroll id="kontakt" className="booking-section">
                <div className="booking-container">
                    <h3>{content.booking.title}</h3>
                    <p>{content.booking.subtitle}</p>

                    <form className="booking-form" onSubmit={handleSubmitBooking}>
                        <div className="input-grid-row">
                            <input type="text" placeholder="Ditt namn" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <input type="email" placeholder="E-post" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>

                        <div className="input-grid-row">
                            <input type="number" placeholder="Antall pers" min="1" required value={formData.guests} onChange={e => setFormData({ ...formData, guests: e.target.value })} />
                            <select required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} disabled={!bookingDate}>
                                <option value="" disabled>Velg tid...</option>
                                {availableTimeSlots.map((slot, index) => (
                                    <option key={index} value={slot}>{slot}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-grid-row" style={{ gridTemplateColumns: '1fr' }}>
                            <DatePicker
                                className="custom-datepicker-input"
                                selected={bookingDate}
                                onChange={(date) => setBookingDate(date)}
                                includeDates={openDates}
                                // EXCLUDE FULLA DATUM
                                excludeDates={fullyBookedDates.map(d => new Date(d))}
                                placeholderText="Velg tilgjengelig dato"
                                dateFormat="yyyy-MM-dd"
                                required
                                wrapperClassName="react-datepicker-wrapper-custom"
                            />
                        </div>

                        <div style={{ margin: '30px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '20px 0', textAlign: 'left' }}>
                            <h4 style={{ marginBottom: '15px', color: '#c5a059', textAlign: 'center' }}>Velg Menyer</h4>
                            <p style={{ fontSize: '0.9rem', color: '#777', marginBottom: '20px', textAlign: 'center' }}>Vennligst oppgi antall på hver rett som ønskes servert til selskapet.</p>
                            {mainCourses.map((dish, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <label style={{ flex: 1, marginRight: '10px', fontSize: '0.95rem' }}>{dish.title}</label>
                                    <input type="number" min="0" placeholder="0" style={{ width: '80px', height: '40px', padding: '5px', textAlign: 'center' }} onChange={(e) => handleDishCountChange(dish.title, e.target.value)} />
                                </div>
                            ))}
                        </div>

                        <textarea placeholder="Har de spesielle ønskjer, allergiar eller vil du reservere For de minste-alternativet?" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>

                        <button type="submit" disabled={submitting}>{submitting ? "Sender..." : "Send Førespurnad"}</button>
                    </form>
                    <p className="booking-info">{content.booking.contactInfo}</p>
                </div>
            </RevealOnScroll>
            <footer className="footer"><p>{content.footer.text}</p></footer>
        </div>
    );
};

export default Home;
