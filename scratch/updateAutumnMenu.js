const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc, setDoc } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyCFiUE2G4YIN9Sf0RHcAs26iq3lXqOB3S0",
    authDomain: "tuftegaard-12305.firebaseapp.com",
    projectId: "tuftegaard-12305",
    storageBucket: "tuftegaard-12305.firebasestorage.app",
    messagingSenderId: "999882090382",
    appId: "1:999882090382:web:c68f3d8261a2da87e066df"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const autumnMenu = {
    label: "Kafé & Gårdsutsalg",
    title: "Høstmeny",
    intro: "Velkommen til en smak av høst på Tufte Gård! Vi serverer varme, gode retter laget med kjærlighet og sesongens beste råvarer.",
    priceNote: "",
    priceNotePrefix: "",
    openingTimes: [],
    mainCourses: [
        {
            title: "Gulasj",
            price: "229,-",
            description: "Med chorizo, høyrygg, paprika, potet og rømme",
            category: "mat"
        },
        {
            title: "Bakt potet",
            price: "199,-",
            description: "Med revet fe, chipotle, røkt rømme, vårløk, mais og syltet jalapeño",
            category: "mat"
        },
        {
            title: "Focaccia",
            price: "159,-",
            description: "Med tryffelsalami, sopp, karamellisert løk og västerbottenost",
            category: "mat"
        },
        {
            title: "Spicy maisribs",
            price: "95,-",
            description: "m/gressløkmayo og gresskarkjerner",
            category: "maevl"
        },
        {
            title: "Fritert brie",
            price: "105,-",
            description: "m/multesyltetøy",
            category: "maevl"
        },
        {
            title: "Pommes frites",
            price: "69,-",
            description: "m/steinsoppmajones",
            category: "maevl"
        },
        {
            title: "Potetgull med smak av høst",
            price: "119,-",
            description: "Steinsoppmajones, västerbottenost, tryffelsalami, syltet løk og gressløk",
            category: "maevl"
        }
    ],
    drinksGroups: []
};

async function run() {
    try {
        const docRef = doc(db, "content", "main");
        const docSnap = await getDoc(docRef);

        let existingData = {};
        if (docSnap.exists()) {
            existingData = docSnap.data();
            console.log("Found existing document data!");
        } else {
            console.log("No existing document data, initializing empty.");
        }

        const updatedData = {
            ...existingData,
            menu: autumnMenu,
            archivedMenus: {
                ...(existingData.archivedMenus || {}),
                // Arkivera den meny som ligger live just nu som sommarmeny
                ...(existingData.menu ? { summer: existingData.menu } : {})
            }
        };

        await setDoc(docRef, updatedData);
        console.log("Successfully updated Firestore content document!");
        process.exit(0);
    } catch (e) {
        console.error("Error updating Firestore:", e);
        process.exit(1);
    }
}

run();
