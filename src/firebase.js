// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCFiUE2G4YIN9Sf0RHcAs26iq3lXqOB3S0",
    authDomain: "tuftegaard-12305.firebaseapp.com",
    projectId: "tuftegaard-12305",
    storageBucket: "tuftegaard-12305.firebasestorage.app",
    messagingSenderId: "999882090382",
    appId: "1:999882090382:web:c68f3d8261a2da87e066df"
};

// Initialize Firebase
// Här startar vi appen med din konfiguration
const app = initializeApp(firebaseConfig);

// "Det andra" du undrade över:
// För att din React-app ska kunna PRATA med databasen måste vi initiera den här.
// Vi exporterar 'db' så att App.js och Admin.js kan importera den och använda den.
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
