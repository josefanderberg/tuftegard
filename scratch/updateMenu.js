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

const newMenu = {
    label: "Kafé & Gårdsutsalg",
    title: "Sommermeny",
    intro: "Velkommen til en smak av sommer på Tufte Gård! Vi serverer deilige, friske retter laget med kjærlighet.",
    priceNote: "",
    priceNotePrefix: "",
    openingTimes: [],
    mainCourses: [
        {
            title: "Focaccia",
            price: "139 kr",
            description: "Luftig italiensk brød fylt med gode råvarer\n\n• Spekeskinke, mozzarella, pesto og tomat\n• Porchetta, bakt hvitløk, chimichurri og syltet rødløk",
            category: "mat"
        },
        {
            title: "Langos",
            price: "179 kr",
            description: "Ungarsk gatemat på sitt beste – et gyllent, frityrstekt potetbrød toppet med smakfulle råvarer.\n\n• Skagenrøre, rødløk, dill og rogn\n• Spekeskinke, urtekremost, rødløk og syltet chili",
            category: "mat"
        },
        {
            title: "Smørgåstårta",
            price: "199 kr",
            description: "En svensk favoritt med lag på lag av mykt brød, kremet fyll og friske smaker fra hav og hage.",
            category: "mat"
        },
        {
            title: "Kroketter",
            price: "105 kr",
            description: "Ølkokt svinekjake med grillet paprikamajones",
            category: "maevl"
        },
        {
            title: "Tuftes Chili Cheese",
            price: "89 kr",
            description: "Fritert brie med rips- og chilisyltetøy",
            category: "maevl"
        },
        {
            title: "Lammeribbe",
            price: "125 kr",
            description: "Glasert lammeribbe med jalapeño og vårløk",
            category: "maevl"
        },
        {
            title: "Luksus Potetgull",
            price: "115 kr",
            description: "Med rogn, rømme, rødløk og dill",
            category: "maevl"
        },
        {
            title: "Pommes frites",
            price: "69 kr",
            description: "Med aioli",
            category: "maevl"
        }
    ],
    drinksGroups: []
};

const winterMenuArchive = {
    label: "Sesongens Oppleving",
    title: "Vintermeny: Rundt Bålet",
    intro: "Mat bestilles på forhånd og dessert er inkludert i prisen! I baren finn du øl, vin, deilige varme drinker og mykje anna godt å kose seg med mellom glørne.",
    mainCourses: [
        {
            title: "Grillplanke",
            price: "(Pris pr. pers: 399 kr inkl. dessert)",
            description: "Me serverer kjøtt som ølmarinert svinekjake, lokale pølser m.m., grønnsakspyd, grilla flatbrød, fries og tilbehør som verkeleg løfter smaksopplevelsen. Me er behjelpelege med grillinga."
        },
        {
            title: "Tuftes Chili con Carne",
            price: "(Pris pr. pers: 329 kr inkl. dessert)",
            description: "Serverast i baren med ris, brød, nachoschips og anna deilig tilbehør."
        },
        {
            title: "Fastilavnboller & Semlor",
            price: "(Pris pr.stk: 65 kr)",
            description: "Hembakade boller med mandelmassa och grädde. Serveras 12-15.",
            specificDate: "2026-02-17",
            isExclusive: true
        }
    ],
    drinksGroups: [
        {
            title: "For de minste (Pris pr. pers: 119 kr inkl. dessert)",
            description: "Velg mellom enkle grillspyd og fries, eller pølse og brød."
        },
        {
            title: "Varm Eple- & Morellgløgg",
            description: "Garden sin eigen eplemost krydra med stjerneanis, kanel og ein dæsj morellsirup. Varmar heilt ned i tærne."
        },
        {
            title: "Klar deg godt",
            description: "Vår uniform blir varmeklede, og for frysepinnane har me tepper og pledd for alle som trengjer det ekstra lunt."
        }
    ]
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
            menu: newMenu,
            archivedMenus: {
                ...(existingData.archivedMenus || {}),
                winter: winterMenuArchive
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
