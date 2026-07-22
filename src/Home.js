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
import MorellGame from './MorellGame';

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

const getDynamicOpeningHoursTitle = (title) => {
    if (!title) return "";
    const monthsNO = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
    const monthsSV = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];
    
    const currentMonthIndex = new Date().getMonth();
    const currentMonthNO = monthsNO[currentMonthIndex];
    const currentMonthSV = monthsSV[currentMonthIndex];
    
    // Match any Norwegian/Swedish month name (case-insensitive)
    const monthRegex = /(januar[i]?|februar[i]?|mars|april|ma[ij]|juni|juli|august[i]?|september|oktober|november|de[cs]ember)/gi;
    
    return title.replace(monthRegex, (match) => {
        const isSwedish = match.toLowerCase().endsWith('i') || match.toLowerCase() === 'maj' || match.toLowerCase() === 'december';
        const isCapitalized = match[0] === match[0].toUpperCase();
        
        let replacement = isSwedish ? currentMonthSV : currentMonthNO;
        if (isCapitalized) {
            replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement;
    });
};

const Home = ({ content: propContent }) => {
    // ... (rest of imports/state) ...

    // Merge propContent with defaultContent to ensure new keys exist
    // This is a simple deep merge for specific sections we know changed
    const content = {
        ...defaultContent,
        ...propContent,
        hero: {
            ...defaultContent.hero,
            ...(propContent.hero || {})
        },
        intro: {
            ...defaultContent.intro,
            ...(propContent.intro || {})
        },
        winter: {
            ...defaultContent.winter,
            ...(propContent.winter || {})
        },
        summer: {
            ...defaultContent.summer,
            ...(propContent.summer || {})
        }
    };

    // ... (rest of component)
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [visibleImagesCount, setVisibleImagesCount] = useState(6);

    // --- BOKNING STATE ---
    const [bookingDate, setBookingDate] = useState(null);

    // Lista på datum som är fulla (>= 5 bokningar)
    const [fullyBookedDates, setFullyBookedDates] = useState([]);

    // Formulär-data
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        guests: '',
        time: '',
        notes: '',
        dishes: {}
    });

    const [submitting, setSubmitting] = useState(false);
    const [bookingStep, setBookingStep] = useState(1);

    // Konvertera sträng-datum från content till Date-objekt
    const openDates = (content.calendar?.openDates || []).map(d => new Date(d));

    // Menyalternativ för mat
    const mainCourses = content.menu.mainCourses || [];
    const drinksGroups = content.menu.drinksGroups || [];

    const MAX_BOOKINGS = 5;

    // --- EFFEKTER ---
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
            setMenuOpen(false); // Stäng menyn vid scroll
        };
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

    const scrollToSection = (id, extraOffset = 0) => {
        setMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            const offset = document.querySelector('.header').offsetHeight + 10;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset + extraOffset;

            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    };

    const [galleryFilter, setGalleryFilter] = useState('sommar');
    const [showAllergens, setShowAllergens] = useState(false);

    const allGalleryImages = content.gallery?.images || [];
    const displayedGalleryImages = allGalleryImages.filter(img => {
        // Om ingen kategori är satt, visa alltid (eller default sommar/vinter?)
        // Här antar vi att filtret matchar kategori-strängen.
        if (!img.category) return true;
        return img.category === galleryFilter;
    });

    const showMoreImages = () => {
        setVisibleImagesCount(displayedGalleryImages.length);
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

    // Gör telefonnummer i en text klickbara (tel:-länk)
    const renderWithPhoneLinks = (text) => {
        if (!text) return text;
        const parts = text.split(/(\d[\d\s]{4,}\d)/g);
        return parts.map((part, i) => {
            if (/^\d[\d\s]{4,}\d$/.test(part)) {
                const digits = part.replace(/\s/g, '');
                const tel = digits.startsWith('+') ? digits : `+47${digits}`;
                return (
                    <a key={i} href={`tel:${tel}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                        {part}
                    </a>
                );
            }
            return part;
        });
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
        setFormData({ name: '', phone: '', guests: '', time: '', notes: '', dishes: {} });
    };

    const ALLERGENS = {
        'GH':  { emoji: '🌾', label: 'Gluten' },
        'JP':  { emoji: '🥜', label: 'Peanøtter' },
        'SES': { emoji: '🌻', label: 'Sesamfrø' },
        'SO':  { emoji: '🫘', label: 'Soya' },
        'F':   { emoji: '🐟', label: 'Fisk' },
        'NØ':  { emoji: '🌰', label: 'Nøtter' },
        'E':   { emoji: '🥚', label: 'Egg' },
        'SK':  { emoji: '🦐', label: 'Skalldyr' },
        'SEN': { emoji: '🌿', label: 'Sennep' },
        'BL':  { emoji: '🦑', label: 'Bløtdyr' },
        'LUP': { emoji: '🌸', label: 'Lupin' },
        'M':   { emoji: '🥛', label: 'Melk' },
        'SEL': { emoji: '🥬', label: 'Selleri' },
        'SV':  { emoji: '🍷', label: 'Svoveldioksyd/Sulfitter' },
    };

    const extractAllergens = (item) => {
        return (item.allergens || []).filter(code => ALLERGENS[code]);
    };

    const parseLines = (text) => {
        if (!text) return [];
        return text.split('\n').flatMap(line => {
            if (!line.includes('•')) return [{ isBullet: false, text: line.replace(/\s*\([^)]+\)/g, '') }];
            const segments = line.split('•');
            const result = [];
            if (segments[0].trim()) result.push({ isBullet: false, text: segments[0].trim() });
            for (let j = 1; j < segments.length; j++) {
                if (segments[j].trim()) result.push({ isBullet: true, text: '• ' + segments[j].trim().replace(/\s*\([^)]+\)/g, '') });
            }
            return result;
        });
    };

    const renderMenuItemContent = (item) => {
        const lines = parseLines(item.description);
        const hasVariants = item.variantAllergens && item.variantAllergens.length > 0;
        let bulletIdx = 0;
        return (
            <>
                {lines.map((line, i) => {
                    if (line.isBullet && hasVariants && showAllergens) {
                        const codes = (item.variantAllergens[bulletIdx] || []).filter(c => ALLERGENS[c]);
                        bulletIdx++;
                        return (
                            <div key={i} style={{ marginTop: '6px' }}>
                                <span style={{ display: 'block', fontWeight: 'bold', color: '#fff' }}>{line.text}</span>
                                {codes.length > 0 && (
                                    <div style={{ display: 'flex', gap: '3px', marginTop: '3px', paddingLeft: '10px' }}>
                                        {codes.map(code => (
                                            <span key={code} title={ALLERGENS[code].label} style={{ fontSize: '0.9rem' }}>{ALLERGENS[code].emoji}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }
                    if (line.isBullet && hasVariants && !showAllergens) bulletIdx++;
                    return (
                        <span key={i} style={{ display: 'block', fontWeight: line.isBullet ? 'bold' : undefined, color: line.isBullet ? '#fff' : undefined, marginTop: line.isBullet && i > 0 ? '4px' : undefined }}>
                            {line.text}
                        </span>
                    );
                })}
                {showAllergens && !hasVariants && extractAllergens(item).length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {extractAllergens(item).map(code => (
                            <span key={code} title={ALLERGENS[code].label} style={{ fontSize: '1rem', cursor: 'default' }}>{ALLERGENS[code].emoji}</span>
                        ))}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="App">
            <div className="hero-bg-fixed" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('/tufte2.png')" }}></div>

            <header className={`header ${scrolled ? 'scrolled' : ''}`}>
                <div className="header-container">
                    <img src="/logo.png" alt="Tufte Gård" className="logo" onClick={() => scrollToSection('hjem')} />
                    <button className={`menu-toggle ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
                        <span className="bar"></span><span className="bar"></span><span className="bar"></span>
                    </button>
                    <nav className={`nav-menu ${menuOpen ? 'open' : ''}`}>
                        <a href="#arrangemant" onClick={(e) => { e.preventDefault(); scrollToSection('arrangemant'); }}>Arrangement</a>
                        <a href="#galleri" onClick={(e) => { e.preventDefault(); scrollToSection('galleri'); }}>Galleri</a>
                        <a href="#meny" onClick={(e) => { e.preventDefault(); scrollToSection('meny'); }}>Mat & Drikke</a>
                        <a href="#hitta-hit" onClick={(e) => { e.preventDefault(); scrollToSection('hitta-hit'); }}>Finn frem</a>
                        <a href="#kontakt" onClick={(e) => { e.preventDefault(); scrollToSection('kontakt'); }} className="btn-book">Send forespørsel</a>
                    </nav>
                </div>
            </header>

            <section id="hjem" className="hero">
                <div className="hero-content">
                    <span className="subtitle">{content.hero.subtitle}</span>
                    <h1>{content.hero.title}</h1>
                    <p>{content.hero.description}</p>
                    <button className="btn-primary" onClick={() => scrollToSection('meny', 70)}>{content.hero.buttonText || "Opplev Sesongens Tilbud"}</button>
                </div>

                <div className="hero-opening-hours">
                    <span className="opening-hours-title">{getDynamicOpeningHoursTitle(content.hero.openingHoursTitle)}</span>
                    <div className="opening-hours-list">
                        {(content.hero.openingHours || []).map((line, i) => (
                            <div key={i}>{line}</div>
                        ))}
                    </div>
                </div>
            </section>



            {/* --- SEKTION 1: INTRO / FILOSOFI (Only Label + Symbol) --- */}
            {/* --- SEKTION 1: INTRO / FILOSOFI (Only Label + Symbol) --- */}
            <section className="text-center" style={{ padding: '80px 20px 40px', backgroundColor: '#fff', position: 'relative', zIndex: 1, width: '100%' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 className="section-title" style={{ marginBottom: '20px' }}>{content.intro.mainTitle}</h2>
                    <p style={{ whiteSpace: 'pre-line' }}>{content.intro.mainDescription}</p>
                    <div className="divider" style={{ marginTop: '30px' }}>🍒</div>
                </div>
            </section>

            {/* --- SEKTION 2: GARDEN (Bild Vänster / Text Höger) --- */}
            <div className="split-section">
                <div className="split-section-inner">
                    <RevealOnScroll className="split-image slide-left" style={{ backgroundImage: "url('/tufte8.png')" }}>
                        {/* Bild Container */}
                    </RevealOnScroll>
                    <RevealOnScroll className="split-content slide-right">
                        <h2 className="section-title" style={{ marginBottom: '20px' }}>{content.intro.gardenTitle}</h2>
                        <p style={{ whiteSpace: 'pre-line' }}>{content.intro.gardenText}</p>
                    </RevealOnScroll>
                </div>
            </div>

            {/* --- SEKTION 3: MATEN (Bild Höger / Text Vänster) --- */}
            <div className="split-section">
                <div className="split-section-inner reverse">
                    <RevealOnScroll className="split-image slide-right" style={{ backgroundImage: "url('/tufte11.png')" }}>
                        {/* Bild Container */}
                    </RevealOnScroll>
                    <RevealOnScroll className="split-content slide-left">
                        <h2 className="section-title" style={{ marginBottom: '20px' }}>{content.intro.foodTitle}</h2>
                        <p style={{ whiteSpace: 'pre-line' }}>{content.intro.foodText}</p>
                    </RevealOnScroll>
                </div>
            </div>

            {/* --- KOMMENDE ARRANGEMANG --- */}
            <section id="arrangemant" className="events-section">
                <div className="section-header">
                    <span className="label">Dette skjer på gården</span>
                    <h2>Kommende Arrangement</h2>
                    <p>Sett av datoen for våre spesielle kvelder.</p>
                </div>

                {(() => {
                    const visibleEvents = (content.events || []).filter(e => !e.hidden);
                    const isCentered = visibleEvents.length <= 2;
                    return (
                        <div className={`events-grid ${isCentered ? 'centered' : ''}`}>
                            {visibleEvents.map((event, index) => {
                                const dateParts = event.date?.trim().split(/[\s.]+/) || [];
                                let day = '14';
                                let month = 'Feb';
                                if (dateParts.length >= 2) {
                                    day = dateParts[0];
                                    month = dateParts[1];
                                } else if (dateParts.length === 1 && dateParts[0]) {
                                    const val = dateParts[0];
                                    if (/^\d+/.test(val)) {
                                        day = val;
                                        month = 'Feb';
                                    } else {
                                        day = '--';
                                        month = val;
                                    }
                                }
                                return (
                                    <RevealOnScroll className="event-card" key={index} style={{ transitionDelay: `${index * 0.2}s` }}>
                                        <div className="event-date-large">
                                            <span className="day">{day}</span>
                                            <span className="month">{month}</span>
                                        </div>
                                        <h4>{event.title}</h4>
                                        <p>{event.description}</p>
                                        
                                        <h4>
                                            Bestill på: 46824498
                                        </h4>
                                    </RevealOnScroll>
                                );
                            })}
                            {visibleEvents.length === 0 && (
                                <RevealOnScroll className="event-card" style={{ flex: '0 1 500px', width: '100%', maxWidth: '500px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                                    <div className="event-date-large" style={{ opacity: 0.5 }}>
                                        <span className="day">--</span>
                                        <span className="month">--</span>
                                    </div>
                                    <h4>Ingen planlagte arrangement</h4>
                                    <p>Vi har ingen planlagte arrangement akkurat nå, men det kommer snart mer. Følg med her eller i sosiale medier for nye datoer.</p>
                                    <span onClick={() => scrollToSection('kontakt')} className="btn-event">Har du spørsmål? Ta gjerne kontakt!</span>
                                </RevealOnScroll>
                            )}
                        </div>
                    );
                })()}
            </section>

            {/* --- GALLERI MED DYNAMISK TEXT --- */}
            <section id="galleri" className="gallery-section">
                <div className="section-header">
                    <h2>{content.gallery.title}</h2>
                    <div className="gallery-filter-buttons" style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                        <button
                            onClick={() => { setGalleryFilter('sommar'); setVisibleImagesCount(6); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: galleryFilter === 'sommar' ? '2px solid #c5a059' : '2px solid transparent',
                                color: galleryFilter === 'sommar' ? '#000' : '#888',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                paddingBottom: '5px'
                            }}
                        >
                            SOMMER
                        </button>
                        <button
                            onClick={() => { setGalleryFilter('vinter'); setVisibleImagesCount(6); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: galleryFilter === 'vinter' ? '2px solid #c5a059' : '2px solid transparent',
                                color: galleryFilter === 'vinter' ? '#000' : '#888',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                paddingBottom: '5px'
                            }}
                        >
                            VINTER
                        </button>
                    </div>
                </div>

                {/* --- DYNAMISK TEXT --- */}
                <div className="gallery-dynamic-text" style={{ maxWidth: '800px', margin: '0 auto 40px auto', textAlign: 'center', padding: '0 20px' }}>
                    {galleryFilter === 'vinter' ? (
                        <RevealOnScroll>
                            <h4 style={{ fontSize: '1.8rem', marginBottom: '20px', fontFamily: 'var(--font-serif)' }}>{content.winter?.title}</h4>
                            <p style={{ whiteSpace: 'pre-line', marginBottom: '15px' }}>{content.winter?.textPart1}</p>
                            <p style={{ whiteSpace: 'pre-line', marginBottom: '20px' }}>{content.winter?.textPart2}</p>
                            <button className="btn-primary" style={{ marginTop: '20px', opacity: 0.5, cursor: 'not-allowed' }} disabled>Bestill Bålpanne (Stengt for sesongen)</button>
                        </RevealOnScroll>
                    ) : (
                        <RevealOnScroll>
                            <h4 style={{ fontSize: '1.8rem', marginBottom: '20px', fontFamily: 'var(--font-serif)' }}>{content.summer?.title}</h4>
                            <p style={{ whiteSpace: 'pre-line', marginBottom: '15px' }}>{content.summer?.textPart1}</p>
                            <p style={{ whiteSpace: 'pre-line', marginBottom: '20px' }}>{content.summer?.textPart2}</p>
                        </RevealOnScroll>
                    )}
                </div>

                <div className="masonry-grid">
                    {displayedGalleryImages.slice(0, visibleImagesCount).map((imgObj, index) => (
                        <div key={index} className="masonry-item">
                            <img src={imgObj.url} alt={`Tufte Gård ${imgObj.category || 'stemning'} bild ${index + 1}`} loading="lazy" />
                        </div>
                    ))}
                </div>
                {visibleImagesCount < displayedGalleryImages.length && (
                    <div className="gallery-button-container">
                        <button onClick={showMoreImages} className="btn-outline">
                            Se flere bilder ({displayedGalleryImages.length - visibleImagesCount} til)
                        </button>
                    </div>
                )}
            </section>

            <section id="meny" className="menu-section" style={{ backgroundImage: "url('/tufte2.png')" }}>
                <div className="menu-overlay"></div>
                <div className="menu-content-wrapper" style={{ maxWidth: '1100px', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <span className="label" style={{ color: 'var(--gold)' }}>{content.menu.label}</span>
                        <button
                            onClick={() => setShowAllergens(v => !v)}
                            style={{ background: showAllergens ? 'var(--gold)' : 'transparent', color: showAllergens ? '#1a1a1a' : 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '20px', padding: '5px 14px', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            {showAllergens ? 'Skjul allergener' : 'Vis allergener'}
                        </button>
                    </div>
                    <h2 className="yellowh3">{content.menu.title}</h2>
                    <p className="menu-intro">{(content.menu.intro || '').replace(/Tufte Gård/g, 'Tufte Gård')}</p>
                    
                    <div className="menu-columns-container">
                        {(() => {
                            // 1. Filtrera fram relevanta rätter för valt datum (eller alla om inget datum valt)
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

                            const exclusiveDish = relevantDishes.find(d => d.isExclusive);
                            const displayedDishes = exclusiveDish
                                ? relevantDishes.filter(d => d.isExclusive)
                                : relevantDishes;

                            const matDishes = displayedDishes.filter(d => d.category !== 'maevl');
                            const maevlDishes = displayedDishes.filter(d => d.category === 'maevl');

                            return (
                                <>
                                    <div className="menu-column-half">
                                        <h4 className="menu-column-title">&nbsp;</h4>
                                        <ul className="menu-list">
                                            {matDishes.map((item, index) => (
                                                <li key={index} className="menu-item">
                                                    <div className="menu-item-header">
                                                        <span className="menu-item-title">{item.title}</span>
                                                        {item.price && <span className="menu-item-price">{item.price}</span>}
                                                    </div>
                                                    <div className="menu-item-desc">
                                                        {renderMenuItemContent(item)}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="menu-column-half">
                                        <h4 className="menu-column-title">MÆVLEMENY <span className="menu-column-subtitle">(småretter/snacks)</span></h4>
                                        <ul className="menu-list">
                                            {maevlDishes.map((item, index) => (
                                                <li key={index} className="menu-item">
                                                    <div className="menu-item-header">
                                                        <span className="menu-item-title">{item.title}</span>
                                                        {item.price && <span className="menu-item-price">{item.price}</span>}
                                                    </div>
                                                    <div className="menu-item-desc">
                                                        {renderMenuItemContent(item)}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {showAllergens && <div style={{ marginTop: '35px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '14px' }}>Allergener</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {Object.entries(ALLERGENS).map(([code, { emoji, label }]) => (
                                <span key={code} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                    <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
                                    <span>{label}</span>
                                </span>
                            ))}
                        </div>
                    </div>}

                    <p className="menu-info-note" style={{ marginTop: '40px', textAlign: 'center', fontSize: 'var(--fs-base)', color: 'var(--gold)', fontStyle: 'italic' }}>
                        Vi har drop-in, men om dere er et større selskap må dere gjerne reservere bord.
                    </p>

                </div>
            </section>

            <section id="kontakt" className="booking-section">
                <div className="booking-container">
                    <h2>{content.booking?.title}</h2>
                    <p>{content.booking?.subtitle}</p>

                    <form className="booking-form" onSubmit={handleSubmitBooking}>
                        <div className="input-grid-row">
                            <input type="text" placeholder="Ditt navn" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
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
                                    <div style={{ margin: "5px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", background: 'transparent' }}>
                                        <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#c5a059', padding: '0 10px' }}>{"‹"}</button>
                                        <div style={{ fontWeight: 'bold', color: '#c5a059', textTransform: 'capitalize', whiteSpace: 'nowrap', fontSize: '1rem' }}>{format(date, "MMMM yyyy", { locale: nb })}</div>
                                        <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#c5a059', padding: '0 10px' }}>{"›"}</button>
                                    </div>
                                )}
                            />
                        </div>

                        <div className="input-grid-row">
                            <input
                                type="number"
                                min="1"
                                required
                                placeholder="Antall personer"
                                value={formData.guests}
                                onChange={e => setFormData({ ...formData, guests: e.target.value })}
                            />
                            <input
                                type="text"
                                required
                                placeholder="Ca. når kommer dere? (f.eks. 18:30)"
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>

                        <textarea placeholder="Har du allergener eller andre ønsker? Legg igjen en kommentar." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} style={{ marginBottom: '20px' }}></textarea>
                        
                        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>{submitting ? "Sender..." : "Send forespørsel"}</button>
                    </form>
                    <p className="booking-info" style={{ marginTop: '20px' }}>{renderWithPhoneLinks(content.booking.contactInfo)}</p>
                </div>
            </section>

            <MorellGame />

            <section id="hitta-hit" className="map-section">
                <div className="section-header">
                    <h2>Finn frem</h2>
                </div>
                <div className="map-container" style={{ height: '500px' }}>
                    <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight="0"
                        marginWidth="0"
                        src="https://maps.google.com/maps?width=100%25&height=500&hl=no&q=Tufte%20G%C3%A5rd,%20Ulefoss&t=&z=14&ie=UTF8&iwloc=B&output=embed"
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
                    <p>Tufte Gård © 2025 | Kaféen på Fen</p>
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
