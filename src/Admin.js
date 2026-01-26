import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
// Vi tog bort Firebase Auth-importerna eftersom vi kör enkelt lösenord

const Admin = ({ content, onSave }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [formData, setFormData] = useState(content);
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Login states
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    // HÄR STÄLLER DU IN LÖSENORDET
    const PASSWORD = "tufte";

    useEffect(() => {
        const sessionAuth = sessionStorage.getItem('isAdminAuthenticated');
        if (sessionAuth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        setFormData(prev => ({
            ...content,
            menu: {
                ...content.menu,
                mainCourses: content.menu.mainCourses || [],
                drinksGroups: content.menu.drinksGroups || []
            },
            calendar: {
                openDates: content.calendar?.openDates || []
            },
            booking: {
                ...content.booking,
                timeSlots: content.booking?.timeSlots || ["18:00"]
            }
        }));
    }, [content]);

    const handleDateChange = (date) => {
        if (!date) return;
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        const dateString = localDate.toISOString().split('T')[0];
        const currentDates = formData.calendar?.openDates || [];
        let newDates;
        if (currentDates.includes(dateString)) {
            newDates = currentDates.filter(d => d !== dateString);
        } else {
            newDates = [...currentDates, dateString].sort();
        }
        setFormData(prev => ({
            ...prev,
            calendar: {
                ...prev.calendar,
                openDates: newDates
            }
        }));
    };

    const parseDates = (dateStrings) => {
        if (!dateStrings) return [];
        return dateStrings.map(ds => new Date(ds));
    };


    const handleLogin = (e) => {
        e.preventDefault();
        if (password === PASSWORD) {
            setIsAuthenticated(true);
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            setLoginError('');
        } else {
            setLoginError('Fel lösenord.');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('isAdminAuthenticated');
    };

    const handleChange = (section, key, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    const handleArrayChange = (section, key, index, value) => {
        const newArray = [...formData[section][key]];
        newArray[index] = value;
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: newArray
            }
        }));
    };

    const handleObjectArrayChange = (section, listKey, index, fieldKey, value) => {
        const newList = [...formData[section][listKey]];
        newList[index] = {
            ...newList[index],
            [fieldKey]: value
        };
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [listKey]: newList
            }
        }));
    };

    const handleAddItem = (section, listKey, newItem) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [listKey]: [...prev[section][listKey], newItem]
            }
        }));
    };

    const handleDeleteItem = (section, listKey, index) => {
        if (!window.confirm("Är du säker på att du vill ta bort denna?")) return;
        const newList = formData[section][listKey].filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [listKey]: newList
            }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');

        try {
            const success = await onSave(formData);

            if (success !== false) {
                setMessage('✅ Uppdaterat! Alla ändringar är sparade.');
                setTimeout(() => setMessage(''), 3000);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert("Något gick fel vid sparning. Kontrollera att Firebase är igång.");
            }
        } catch (error) {
            console.error(error);
            alert("Ett fel inträffade.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', color: '#fff', flexDirection: 'column' }}>
                <div style={{ maxWidth: '400px', width: '100%', padding: '2rem', backgroundColor: '#333', borderRadius: '8px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Admin - Tufte Gård</h2>
                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Lösenord</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ange lösenord..." style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#222', color: '#fff' }} />
                        </div>
                        {loginError && <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{loginError}</p>}
                        <button type="submit" style={{ width: '100%', padding: '1rem', backgroundColor: '#d4a373', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer' }}>Logga in</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: '#fff', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem' }}>Admin - Redigera Texter & Kalender</h1>
                <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', backgroundColor: '#444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logga ut</button>
            </div>

            <p style={{ marginBottom: '2rem', color: '#ccc' }}>Glöm inte att klicka på "SPARA ALLT" längst ner för att verkställa ändringar.</p>

            {message && (
                <div style={{
                    backgroundColor: '#4caf50',
                    color: '#fff',
                    padding: '1rem',
                    marginBottom: '2rem',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    animation: 'fadeIn 0.5s'
                }}>
                    {message}
                </div>
            )}


            {/* --- KALENDER & TIDER SEKTION --- */}
            <div className="admin-section" style={{ marginBottom: '3rem', padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px', border: '1px solid #444' }}>
                <h2 style={{ color: '#c5a059', borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '20px' }}>Hantera Öppettider</h2>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>

                    {/* Vänster: Kalender */}
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <h4 style={{ marginBottom: '1rem' }}>1. Välj Datum (Öppet)</h4>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <DatePicker
                                inline
                                selected={null}
                                onChange={handleDateChange}
                                highlightDates={[
                                    { "react-datepicker__day--highlighted-custom-1": parseDates(formData.calendar?.openDates) }
                                ]}
                                dayClassName={(date) => {
                                    const offset = date.getTimezoneOffset();
                                    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                                    const dateString = localDate.toISOString().split('T')[0];
                                    return (formData.calendar?.openDates || []).includes(dateString) ? "calendar-open-day" : undefined
                                }}
                            />
                        </div>
                        <p style={{ textAlign: 'center', marginTop: '10px' }}>Klicka för att toggla öppet/stängt.</p>
                    </div>

                    {/* Höger: Tider */}
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <h4 style={{ marginBottom: '1rem' }}>2. Bokningsbara Tider</h4>
                        <p style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '1rem' }}>De tider kunden får välja mellan i formuläret.</p>

                        {formData.booking?.timeSlots?.map((slot, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <input
                                    type="text"
                                    value={slot}
                                    onChange={(e) => handleArrayChange('booking', 'timeSlots', index, e.target.value)}
                                    placeholder="T.ex. 18:00"
                                    style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: '#fff' }}
                                />
                                <button
                                    onClick={() => handleDeleteItem('booking', 'timeSlots', index)}
                                    style={{ background: '#ff4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0 15px', cursor: 'pointer' }}
                                >X</button>
                            </div>
                        ))}
                        <button
                            onClick={() => handleAddItem('booking', 'timeSlots', "18:00")}
                            style={{ marginTop: '10px', padding: '10px', width: '100%', background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            + Lägg till tid
                        </button>
                    </div>

                </div>
            </div>


            {/* --- MENY SEKTION --- */}
            <div className="admin-section">
                <h2>Meny</h2>
                {/* ... (Menyinnehållet är oförändrat, men vi fortsätter rendera det för komplett fil) */}
                <Input label="Etikett" value={formData.menu?.label} onChange={(e) => handleChange('menu', 'label', e.target.value)} />
                <Input label="Rubrik" value={formData.menu?.title} onChange={(e) => handleChange('menu', 'title', e.target.value)} />
                <TextArea label="Intro" value={formData.menu?.intro} onChange={(e) => handleChange('menu', 'intro', e.target.value)} />
                <TextArea label="Prisinfo / Notis" value={formData.menu?.priceNote} onChange={(e) => handleChange('menu', 'priceNote', e.target.value)} />

                <h3 style={{ marginTop: '2rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>Maträtter</h3>
                {formData.menu?.mainCourses?.map((dish, index) => (
                    <div key={index} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '4px', position: 'relative' }}>
                        <button
                            onClick={() => handleDeleteItem('menu', 'mainCourses', index)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem 0.5rem' }}
                        >X</button>
                        <Input label="Maträttens Namn" value={dish.title} onChange={(e) => handleObjectArrayChange('menu', 'mainCourses', index, 'title', e.target.value)} />
                        <TextArea label="Beskrivning" value={dish.description} onChange={(e) => handleObjectArrayChange('menu', 'mainCourses', index, 'description', e.target.value)} />
                    </div>
                ))}
                <button
                    onClick={() => handleAddItem('menu', 'mainCourses', { title: 'Ny rätt', description: 'Beskrivning...' })}
                    style={{ backgroundColor: '#444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', marginBottom: '2rem' }}
                >
                    + Lägg till rätt
                </button>

                <h3 style={{ marginTop: '1rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>Dryck & Övrigt</h3>
                {formData.menu?.drinksGroups?.map((item, index) => (
                    <div key={index} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '4px', position: 'relative' }}>
                        <button
                            onClick={() => handleDeleteItem('menu', 'drinksGroups', index)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem 0.5rem' }}
                        >X</button>
                        <Input label="Titel" value={item.title} onChange={(e) => handleObjectArrayChange('menu', 'drinksGroups', index, 'title', e.target.value)} />
                        <TextArea label="Beskrivning" value={item.description} onChange={(e) => handleObjectArrayChange('menu', 'drinksGroups', index, 'description', e.target.value)} />
                    </div>
                ))}
                <button
                    onClick={() => handleAddItem('menu', 'drinksGroups', { title: 'Ny dryck/info', description: 'Beskrivning...' })}
                    style={{ backgroundColor: '#444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', marginBottom: '2rem' }}
                >
                    + Lägg till alternativ
                </button>

                <h3>Öppettider (Text)</h3>
                {formData.menu?.openingTimes?.map((time, index) => (
                    <Input
                        key={index}
                        label={`Tid ${index + 1}`}
                        value={time}
                        onChange={(e) => handleArrayChange('menu', 'openingTimes', index, e.target.value)}
                    />
                ))}
            </div>


            {/* --- HUVUDSEKTIONER --- */}
            <div className="admin-section">
                <h2>Huvudsektion (Hero)</h2>
                <Input label="Underrubrik" value={formData.hero?.subtitle} onChange={(e) => handleChange('hero', 'subtitle', e.target.value)} />
                <Input label="Huvudrubrik" value={formData.hero?.title} onChange={(e) => handleChange('hero', 'title', e.target.value)} />
                <TextArea label="Beskrivning" value={formData.hero?.description} onChange={(e) => handleChange('hero', 'description', e.target.value)} />
                <Input label="Knapptext" value={formData.hero?.buttonText} onChange={(e) => handleChange('hero', 'buttonText', e.target.value)} />
            </div>

            <div className="admin-section">
                <h2>Intro (Filosofi)</h2>
                <Input label="Etikett" value={formData.intro?.label} onChange={(e) => handleChange('intro', 'label', e.target.value)} />
                <Input label="Rubrik" value={formData.intro?.title} onChange={(e) => handleChange('intro', 'title', e.target.value)} />
                <TextArea label="Ingress" value={formData.intro?.lead} onChange={(e) => handleChange('intro', 'lead', e.target.value)} />
                <TextArea label="Brödtext" value={formData.intro?.text} onChange={(e) => handleChange('intro', 'text', e.target.value)} />
            </div>

            <div className="admin-section">
                <h2>Vinter / Nytt Konsept</h2>
                <Input label="Etikett" value={formData.winter?.label} onChange={(e) => handleChange('winter', 'label', e.target.value)} />
                <Input label="Rubrik" value={formData.winter?.title} onChange={(e) => handleChange('winter', 'title', e.target.value)} />
                <TextArea label="Text del 1" value={formData.winter?.textPart1} onChange={(e) => handleChange('winter', 'textPart1', e.target.value)} />
                <TextArea label="Text del 2" value={formData.winter?.textPart2} onChange={(e) => handleChange('winter', 'textPart2', e.target.value)} />
            </div>

            <div className="admin-section">
                <h2>Galleri</h2>
                <Input label="Rubrik" value={formData.gallery?.title} onChange={(e) => handleChange('gallery', 'title', e.target.value)} />
                <Input label="Underrubrik" value={formData.gallery?.subtitle} onChange={(e) => handleChange('gallery', 'subtitle', e.target.value)} />
            </div>

            <div className="admin-section">
                <h2>Bokning</h2>
                <Input label="Rubrik" value={formData.booking?.title} onChange={(e) => handleChange('booking', 'title', e.target.value)} />
                <Input label="Underrubrik" value={formData.booking?.subtitle} onChange={(e) => handleChange('booking', 'subtitle', e.target.value)} />
                <TextArea label="Kontaktinfo" value={formData.booking?.contactInfo} onChange={(e) => handleChange('booking', 'contactInfo', e.target.value)} />
            </div>

            <div className="admin-section">
                <h2>Footer</h2>
                <Input label="Copyright text" value={formData.footer?.text} onChange={(e) => handleChange('footer', 'text', e.target.value)} />
            </div>

            <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                    marginTop: '2rem',
                    padding: '1rem 2rem',
                    backgroundColor: isSaving ? '#888' : '#d4a373',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '1.2rem',
                    cursor: isSaving ? 'wait' : 'pointer',
                    width: '100%',
                    marginBottom: '4rem'
                }}
            >
                {isSaving ? 'SPARAR...' : 'SPARA ALLT'}
            </button>
        </div>
    );
};

const Input = ({ label, value, onChange }) => (
    <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#bbb' }}>{label}</label>
        <input type="text" value={value || ''} onChange={onChange} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: '#fff', fontSize: '1rem' }} />
    </div>
);

const TextArea = ({ label, value, onChange }) => (
    <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#bbb' }}>{label}</label>
        <textarea value={value || ''} onChange={onChange} rows={4} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: '#fff', fontFamily: 'inherit', fontSize: '1rem' }} />
    </div>
);

export default Admin;
