import React, { useState, useEffect, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import nb from 'date-fns/locale/nb';
import { format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import './App.css';
import { db } from './firebase';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

import { defaultContent } from './defaultContent';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

registerLocale('nb', nb);

// --- ANIMATION KOMPONENT ---
const RevealOnScroll = ({ children, id, className = "", style = {} }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // VIKTIGT: Triggas bara EN gång (observer.disconnect())
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 } // Lite lägre tröskel så det säkert händer
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

const Home = ({ content: propContent }) => {
    // ... (rest of imports/state) ...

    // Merge propContent with defaultContent to ensure new keys exist
    // This is a simple deep merge for specific sections we know changed
    const content = {
        ...propContent,
        intro: {
            ...defaultContent.intro,
            ...propContent.intro
        }
    };

    // ... (rest of component)
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
        phone: '',
        guests: 4,
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
        '/tufte18.png', '/tufte19.png', '/tufte20.png', '/tufte6.png', '/tufte1.png', '/tufte8.png',
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

    // --- POPUP STATE ---
    const [showConfirmation, setShowConfirmation] = useState(false);

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

            // --- SEND EMAIL MED EMAILJS ---
            const dishesList = Object.entries(formData.dishes)
                .filter(([_, count]) => count > 0)
                .map(([dish, count]) => `${dish}: ${count} st`)
                .join('\n');

            const emailParams = {
                to_email: 'forstafordelsedagen@gmail.com',
                from_name: formData.name,
                from_phone: formData.phone,
                guests: formData.guests,
                date: dateString,
                time: formData.time,
                message: formData.notes,
                dishes: dishesList || "Inga specifika rätter valda"
            };

            emailjs.send(
                'service_tz8pcfs',
                'template_hsco7dh',
                emailParams,
                'vehh17hnHhpaEkp8M'
            ).then((response) => {
                console.log('SUCCESS!', response.status, response.text);
            }, (err) => {
                console.log('FAILED...', err);
            });
            // -----------------------------

            // VISA BEKRÄFTELSE POPUP
            setShowConfirmation(true);

            // Uppdatera kapacitet direkt ifall man vill boka igen
            fetchBookingsAndCheckCapacity();
        } catch (error) {
            console.error(error);
            alert("Noe gikk galt.");
        } finally {
            setSubmitting(false);
        }
    };

    const closeConfirmation = () => {
        setShowConfirmation(false);
        setBookingDate(null);
        setFormData({ name: '', phone: '', guests: 4, time: '', notes: '', dishes: {} });
    };

    return (
        <div className="App">
            <div className="hero-bg-fixed" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('/tufte2.png')" }}></div>

            <header className={`header ${scrolled ? 'scrolled' : ''}`}>
                <div className="header-container">
                    <h1 className="logo" onClick={() => scrollToSection('hjem')}>Tufte Gård</h1>
                    <button className={`menu-toggle ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
                        <span className="bar"></span><span className="bar"></span><span className="bar"></span>
                    </button>
                    <nav className={`nav-menu ${menuOpen ? 'open' : ''}`}>
                        <button onClick={() => scrollToSection('arrangemant')}>Arrangemant</button>
                        <button onClick={() => scrollToSection('galleri')}>Galleri</button>
                        <button onClick={() => scrollToSection('meny')}>Mat & Drikke</button>
                        <button onClick={() => scrollToSection('kontakt')} className="btn-book">Bestill Bålpanne</button>
                    </nav>
                </div>
            </header>

            <section id="hjem" className="hero">
                <div className="hero-content">
                    <span className="subtitle">{content.hero.subtitle}</span>
                    <h2>{content.hero.title}</h2>
                    <p>{content.hero.description}</p>
                    <button className="btn-primary" onClick={() => scrollToSection('arrangemant')}>{content.hero.buttonText}</button>
                </div>
            </section>



            {/* --- SEKTION 1: INTRO / FILOSOFI (Only Label + Symbol) --- */}
            <section className="text-center" style={{ padding: '80px 20px 40px', backgroundColor: '#fff', position: 'relative', zIndex: 1 }}>
                <span className="label" style={{ marginBottom: '5px' }}>{content.intro.label}</span>
                <div className="divider" style={{ marginTop: '10px' }}>❦</div>
            </section>

            {/* --- SEKTION 2: GARDEN (Bild Vänster / Text Höger) --- */}
            <div className="split-section">
                <RevealOnScroll className="split-image slide-left" style={{ backgroundImage: "url('/tufte8.png')" }}>
                    {/* Bild Container */}
                </RevealOnScroll>
                <RevealOnScroll className="split-content slide-right">
                    <span className="label">Omgivnadene</span>
                    <h4>{content.intro.gardenTitle}</h4>
                    <p>{content.intro.gardenText}</p>
                </RevealOnScroll>
            </div>

            {/* --- SEKTION 3: MATEN (Bild Höger / Text Vänster) --- */}
            <div className="split-section reverse">
                <RevealOnScroll className="split-image slide-right" style={{ backgroundImage: "url('/tufte11.png')" }}>
                    {/* Bild Container */}
                </RevealOnScroll>
                <RevealOnScroll className="split-content slide-left">
                    <span className="label">Det Kulinariske</span>
                    <h4>{content.intro.foodTitle}</h4>
                    <p>{content.intro.foodText}</p>
                </RevealOnScroll>
            </div>

            {/* --- SEKTION 4: VINTER/STÄMNING (Bild Vänster / Text Höger) --- */}
            <div id="arrangemant" className="split-section">
                <RevealOnScroll className="split-image slide-left" style={{ backgroundImage: "url('/tufte3.png')" }}>
                    {/* Bild Container */}
                </RevealOnScroll>
                <RevealOnScroll className="split-content slide-right">
                    <span className="label">{content.winter.label}</span>
                    <h3>{content.winter.title}</h3>
                    <p><strong>{content.winter.textPart1.split('.')[0] + '.'}</strong> {content.winter.textPart1.split('.').slice(1).join('.')}</p>
                    <p>{content.winter.textPart2}</p>
                </RevealOnScroll>

            </div>

            {/* --- KOMMENDE ARRANGEMANG --- */}
            <section className="events-section">
                <div className="section-header">
                    <span className="label">Det skjer på garden</span>
                    <h3>Kommende Arrangemang</h3>
                    <p>Sett av datoen for våre spesielle kvelder.</p>
                </div>

                <div className="events-grid">
                    {/* Event 1: Valentinsmiddag (14 Feb) */}
                    <RevealOnScroll className="event-card">
                        <div className="event-date-large">
                            <span className="day">14</span>
                            <span className="month">Feb</span>
                        </div>
                        <h4>Valentinsmiddag</h4>
                        <p>Ta med din kjære på en romantisk 5-retters meny under stjernene. Levende lys og god stemning.</p>
                        <span onClick={() => {
                            // Sätt datum till 14 Feb och scrolla
                            setBookingDate(new Date('2026-02-14T12:00:00'));
                            scrollToSection('kontakt');
                        }} className="btn-event">Bestill Bord</span>
                    </RevealOnScroll>

                    {/* Event 2: Fastilavnboller (17 Feb) */}
                    <RevealOnScroll className="event-card" style={{ transitionDelay: '0.2s' }}>
                        <div className="event-date-large">
                            <span className="day">17</span>
                            <span className="month">Feb</span>
                        </div>
                        <h4>Fastilavnboller & Semlor</h4>
                        <p>Hembakade boller med mandelmassa och grädde. Serveras 12-15.</p>
                        <span onClick={() => {
                            // Använd T12:00 för att undvika midnatts-tidszonsproblem
                            setBookingDate(new Date('2026-02-17T12:00:00'));
                            scrollToSection('kontakt');
                        }} className="btn-event">Bestill Bord</span>
                    </RevealOnScroll>

                    {/* Event 3: Vinskule (20 Mar) */}
                    <RevealOnScroll className="event-card" style={{ transitionDelay: '0.4s' }}>
                        <div className="event-date-large">
                            <span className="day">20</span>
                            <span className="month">Mar</span>
                        </div>
                        <h4>Vinskule & Smaking</h4>
                        <p>Lær om italienske viner med vår sommelier. Smaking av 6 ulike viner med tilhørende småretter.</p>
                        <span onClick={() => scrollToSection('kontakt')} className="btn-event">Meld deg på</span>
                    </RevealOnScroll>
                </div>
            </section>

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

            <section id="meny" className="menu-section" style={{ backgroundImage: "url('/tufte3.png')" }}>
                <div className="menu-overlay"></div>
                <div className="menu-content-wrapper">
                    <span className="label" style={{ color: 'var(--gold)' }}>{content.menu.label}</span>
                    <h3 className="yellowh3">{content.menu.title}</h3>
                    <p className="menu-intro">{content.menu.intro}</p>
                    <div className="menu-columns" style={{ justifyContent: 'center' }}>
                        <div className="menu-col" style={{ flex: '0 0 100%', maxWidth: '800px' }}>
                            <h4>Hovudrettar</h4>
                            <ul>
                                {(() => {
                                    // 1. Filtrera fram relevanta rätter för valt datum (eller alla om inget datum valt)
                                    let relevantDishes = mainCourses.filter(item => {
                                        if (item.specificDate) {
                                            if (!bookingDate) return false; // Dölj specifika om inget datum valt
                                            const y = bookingDate.getFullYear();
                                            const m = String(bookingDate.getMonth() + 1).padStart(2, '0');
                                            const d = String(bookingDate.getDate()).padStart(2, '0');
                                            const selectedDateStr = `${y}-${m}-${d}`;
                                            return selectedDateStr === item.specificDate;
                                        }
                                        return true; // Visa standardrätter preliminärt
                                    });

                                    // 2. Kolla om någon av de relevanta rätterna är "Exklusiv"
                                    const exclusiveDish = relevantDishes.find(d => d.isExclusive);

                                    // 3. Om exklusiv finns, visa BARA den/dem. Annars visa alla relevanta.
                                    const displayedDishes = exclusiveDish
                                        ? relevantDishes.filter(d => d.isExclusive)
                                        : relevantDishes;

                                    if (displayedDishes.length === 0) return <p>Inga rätter tillgängliga.</p>;

                                    return displayedDishes.map((item, index) => (
                                        <li key={index}>
                                            <strong>{item.title} {item.price && <span>{item.price}</span>}</strong>
                                            <span>{item.description}</span>
                                        </li>
                                    ));
                                })()}
                            </ul>
                        </div>
                    </div>

                </div>
            </section>

            <section id="kontakt" className="booking-section">
                <div className="booking-container">
                    <h3>{content.booking.title}</h3>
                    <p>{content.booking.subtitle}</p>

                    <form className="booking-form" onSubmit={handleSubmitBooking}>
                        <div className="input-grid-row">
                            <input type="text" placeholder="Ditt namn" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <div className="phone-input-wrapper">
                                <PhoneInput
                                    country={'no'}
                                    preferredCountries={['no', 'se']}
                                    value={formData.phone}
                                    onChange={phone => setFormData({ ...formData, phone })}
                                    inputProps={{
                                        name: 'phone',
                                        required: true,
                                        placeholder: 'Mobilnummer'
                                    }}
                                    containerClass="custom-phone-container"
                                    inputClass="custom-phone-input"
                                    buttonClass="custom-phone-button"
                                />
                            </div>
                        </div>

                        <div className="input-grid-row" style={{ gridTemplateColumns: '1fr' }}>
                            <DatePicker
                                className="custom-datepicker-input"
                                selected={bookingDate}
                                onChange={(date) => setBookingDate(date)}
                                includeDates={openDates}
                                locale="nb"
                                // EXCLUDE FULLA DATUM
                                excludeDates={fullyBookedDates.map(d => new Date(d))}
                                placeholderText="Velg tilgjengelig dato"
                                dateFormat="yyyy-MM-dd"
                                required
                                wrapperClassName="react-datepicker-wrapper-custom"
                                renderCustomHeader={({
                                    date,
                                    decreaseMonth,
                                    increaseMonth,
                                    prevMonthButtonDisabled,
                                    nextMonthButtonDisabled,
                                }) => (
                                    <div style={{
                                        margin: "5px 10px", // Mindre marginal
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        background: 'transparent'
                                    }}>
                                        <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} type="button"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#c5a059', padding: '0 10px' }}>
                                            {"‹"}
                                        </button>

                                        <div style={{ fontWeight: 'bold', color: '#c5a059', textTransform: 'capitalize', whiteSpace: 'nowrap', fontSize: '1rem' }}>
                                            {format(date, "MMMM yyyy", { locale: nb })}
                                        </div>

                                        <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} type="button"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#c5a059', padding: '0 10px' }}>
                                            {"›"}
                                        </button>
                                    </div>
                                )}
                            />
                        </div>

                        <div className="input-grid-row">
                            <select required value={formData.guests} onChange={e => setFormData({ ...formData, guests: e.target.value })}>
                                {Array.from({ length: 17 }, (_, i) => i + 4).map(num => (
                                    <option key={num} value={num}>{num} personer</option>
                                ))}
                            </select>
                            <select required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} disabled={!bookingDate}>
                                <option value="" disabled>Velg tid...</option>
                                {availableTimeSlots.map((slot, index) => (
                                    <option key={index} value={slot}>{slot}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ margin: '30px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '20px 0', textAlign: 'left' }}>
                            <h4 style={{ marginBottom: '15px', color: '#c5a059', textAlign: 'center' }}>Velg Menyer</h4>
                            <p style={{ fontSize: '0.9rem', color: '#777', marginBottom: '20px', textAlign: 'center' }}>Vennligst oppgi antall på hver rett som ønskes servert til selskapet.</p>
                            {(() => {
                                // 1. Filtrera fram relevanta rätter
                                let relevantDishes = mainCourses.filter(item => {
                                    if (item.specificDate) {
                                        if (!bookingDate) return false;
                                        const y = bookingDate.getFullYear();
                                        const m = String(bookingDate.getMonth() + 1).padStart(2, '0');
                                        const d = String(bookingDate.getDate()).padStart(2, '0');
                                        const selectedDateStr = `${y}-${m}-${d}`;
                                        return selectedDateStr === item.specificDate;
                                    }
                                    return true;
                                });

                                // 2. Kolla efter exklusive
                                const exclusiveDish = relevantDishes.find(d => d.isExclusive);

                                // 3. Välj rätter att visa
                                const displayedDishes = exclusiveDish
                                    ? relevantDishes.filter(d => d.isExclusive)
                                    : relevantDishes;

                                return displayedDishes.map((dish, index) => (
                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <label style={{ flex: 1, marginRight: '10px', fontSize: '0.95rem' }}>
                                            {dish.title}
                                            {dish.price && <span style={{ display: 'block', fontSize: '0.8em', color: '#999', fontWeight: 'normal' }}>{dish.price}</span>}
                                        </label>
                                        <input type="number" min="0" placeholder="0" style={{ width: '80px', height: '40px', padding: '5px', textAlign: 'center' }} onChange={(e) => handleDishCountChange(dish.title, e.target.value)} />
                                    </div>
                                ));
                            })()}
                        </div>

                        <textarea placeholder="Har de spesielle ønskjer, allergiar eller vil du reservere For de minste-alternativet?" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>

                        <button type="submit" disabled={submitting}>{submitting ? "Sender..." : "Send Førespurnad"}</button>
                    </form>
                    <p className="booking-info">{content.booking.contactInfo}</p>
                </div>
            </section>
            <section id="hitta-hit" className="map-section">
                <div className="section-header">
                    <h3>Finn frem</h3>
                </div>
                <div className="map-container" style={{ height: '500px' }}>
                    <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight="0"
                        marginWidth="0"
                        src="https://maps.google.com/maps?width=100%25&height=500&hl=en&q=Tufte%20G%C3%A5rd,%20Ulefoss&t=&z=14&ie=UTF8&iwloc=B&output=embed"
                        title="Tufte Gård Map"
                    ></iframe>
                </div>
            </section>
            <footer className="footer">
                <div className="footer-content">
                    <div className="social-links">
                        <a href="https://www.facebook.com/p/Tufte-G%C3%A5rd-61555921893252/" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Facebook">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        </a>
                        <a href="https://www.instagram.com/tufte.gard/" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Instagram">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
                        </a>
                    </div>
                    <p>{content.footer.text}</p>
                </div>
            </footer>
            {
                showConfirmation && (
                    <div className="popup-overlay">
                        <div className="popup-content">
                            <h3>{content.confirmationPopup?.title || "Takk for di bestilling!"}</h3>
                            <p>{content.confirmationPopup?.message1 || "Me har mottatt di førespurnad og vil sjå over den."}</p>
                            <p>{content.confirmationPopup?.message2 || "Du vil høyre frå oss på SMS så snart me har bekrefta bordet."}</p>
                            <button className="btn-primary" onClick={closeConfirmation}>Lukk</button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Home;
