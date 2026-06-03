const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc, updateDoc } = require("firebase/firestore");

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

async function run() {
    try {
        const docRef = doc(db, "content", "main");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const updatedWinter = {
                ...(data.winter || {}),
                title: "Vinter på Tufte Gård"
            };
            const updatedGallery = {
                ...(data.gallery || {}),
                title: "Glimt fra gården"
            };
            await updateDoc(docRef, {
                winter: updatedWinter,
                gallery: updatedGallery
            });
            console.log("Successfully updated winter and gallery titles in Firestore!");
        } else {
            console.log("Document main does not exist");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
