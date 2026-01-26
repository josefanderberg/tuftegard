import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Admin from './Admin';
import { defaultContent } from './defaultContent';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './App.css';

function App() {
  // --- STATE ---
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);

  // --- HÄMTA DATA ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. Försök hämta från Firebase först
      if (db) {
        try {
          const docRef = doc(db, "content", "main");
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            console.log("Loaded content from Firebase!");
            setContent(docSnap.data());
            setLoading(false);
            return;
          } else {
            console.log("No content in Firebase found, using default/local.");
          }
        } catch (error) {
          console.error("Error connecting to Firebase:", error);
        }
      }

      // 2. Fallback: LocalStorage (för dev/offline)
      const savedContent = localStorage.getItem('siteContent');
      if (savedContent) {
        setContent(JSON.parse(savedContent));
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // --- SPARA DATA ---
  const handleSaveContent = async (newContent) => {
    // Uppdatera React State direkt (så det känns snabbt)
    setContent(newContent);

    // 1. Spara till LocalStorage (alltid bra backup)
    localStorage.setItem('siteContent', JSON.stringify(newContent));

    // 2. Spara till Firebase (om konfigurerat)
    if (db) {
      try {
        await setDoc(doc(db, "content", "main"), newContent);
        console.log("Saved content to Firebase!");
        return true; // Return success status
      } catch (e) {
        console.error("Error adding document: ", e);
        alert("Kunde inte spara till molnet (Firebase). Kontrollera dina inställningar.");
        return false;
      }
    } else {
      console.log("Firebase not configured, saved only locally.");
      // alert("Firebase är inte konfigurerat. Sparat lokalt i webbläsaren.");
    }
  };

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1a1a1a', color: '#fff' }}>Laddar Tufte Gård...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home content={content} />} />
        <Route path="/admin" element={<Admin content={content} onSave={handleSaveContent} />} />
      </Routes>
    </Router>
  );
}

export default App;