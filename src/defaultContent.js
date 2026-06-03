export const defaultContent = {
    hero: {
        subtitle: "",
        title: "Midt i morellhagen",
        description: "Velkommen til Tufte Gård – en familiedrevet morellgård og gårdskafé i Telemark.",
        buttonText: "Opplev Sesongens Tilbud"
    },
    intro: {
        label: "Tufte Gård",
        mainTitle: "Om oss",
        mainDescription: "Tufte Gård er en familiedrevet morellgård og kafé – midt blant trær, folk og gode smaker.\n\nHer blomstrer morelltrærne om våren, og om sommeren fylles grenene av røde, søte bær.\n\nMange sier det minner om vinrankene i Italia eller Frankrike – vi liker å tro det er litt av den samme følelsen: det gode liv, enkelt og ekte.",
        gardenTitle: "Stemninga",
        gardenText: "Hos oss handler det ikke om å skynde seg videre.\n\nOm sommeren sitter du i morellhagen og nyter deilig mat og drikke under åpen himmel \nOm vinteren samles vi rundt bålpanner, pakket inn i ullpledd, med varme smaker og glør som knitrer i mørket.\n\nVi ønsker å skape et sted for hygge og nærhet – et sted der du kan senke skuldrene og bare være.",
        foodTitle: "Mat og Drikke",
        foodText: "Vi serverer mat med røtter i det norske og svenske kjøkkenet, inspirert av det italienske kjøkkenets enkelhet og varme. Sesongen får sette smaken.\n\nDrikkene våre bygger på det vi har rundt oss: egne moreller, rabarbra, bær og fantastiske lokale produkter.\n\nNår du kommer hit, håper vi du føler deg hjemme – enten det er første gang, eller du kommer tilbake igjen."
    },
    winter: {
        label: "Vinter: Nytt Konsept",
        title: "Vinter på Tufte Gård",
        textPart1: "Velkommen til Tufte Gård rundt bålpanna.\nVi gleder oss stort til å introdusere vårt nye vinterkonsept.\n\nUnder denne sesongen kan du og gjengen booke deres egen bålpanne (min. 4 personer) og nyte en koselig stund under åpen himmel – med god mat, lune tepper og ekte vinterstemning.",
        textPart2: "Vi planlegger å holde åpent hver helg framover så lenge vi har været på vår side. Sikre deg plass ved bålpanna nå!"
    },
    summer: {
        label: "Sommer i hagen",
        title: "Sommer på Tufte Gård",
        textPart1: "Om sommeren er det morellene som står i sentrum. Vi høster fra egen hage, og fyller disken med friske smaker, gode retter og søte fristelser. Du får sveler rett fra takka, saftige ostekaker og småretter laget med sesongens beste råvarer.",
        textPart2: "Her sitter du bokstavelig talt midt i morellhagen – omringet av trær, folk og gode smaker. På vår store platting kan du senke skuldrene og nyte roen, enten du tar en kaffe i sola eller blir sittende lenge med noe godt i glasset."
    },
    events: [
        {
            id: 1,
            title: "Valentinsmiddag",
            date: "14. Feb",
            description: "Romantisk middag for to med levande lys og kjærleik på menyen.",
            bookingDate: "2025-02-14",
            imageUrl: "/tufte11.png"
        },
        {
            id: 2,
            title: "Fastelavnboller",
            date: "2. Mars",
            description: "Vi serverar våre berømte fastelavnsboller med heimelaga syltetøy og krem.",
            bookingDate: "2025-03-02",
            imageUrl: "/tufte8.png"
        },
        {
            id: 3,
            title: "Vinskule",
            date: "15. Mars",
            description: "Lær om vinens verden med vår sommelier. Smaking av 5 ulike viner.",
            bookingDate: "2025-03-15",
            imageUrl: "/tufte3.png"
        }
    ],
    gallery: {
        title: "Øyeblikk fra gården",
        images: [
            { url: '/tufte18.png', category: 'vinter' },
            { url: '/tufte19.png', category: 'vinter' },
            { url: '/tufte20.png', category: 'sommar' },
            { url: '/tufte6.png', category: 'sommar' },
            { url: '/tufte1.png', category: 'sommar' },
            { url: '/tufte8.png', category: 'vinter' },
            { url: '/tufte9.png', category: 'sommar' },
            { url: '/tufte10.png', category: 'sommar' },
            { url: '/tufte11.png', category: 'vinter' },
            { url: '/tufte12.png', category: 'sommar' },
            { url: '/tufte14.png', category: 'sommar' },
            { url: '/tufte15.png', category: 'sommar' },
            { url: '/tufte16.png', category: 'sommar' },
            { url: '/tufte17.png', category: 'sommar' },
            { url: '/tufte13.png', category: 'sommar' },
            { url: '/tufte21.png', category: 'sommar' },
            { url: '/tufte22.png', category: 'sommar' }

        ]
    },
    menu: {
        label: "Kafé & Gårdsutsalg",
        title: "Sommarmeny",
        intro: "Velkommen til en smak av sommer på Tufte Gård! Vi serverer deilige, friske retter laget med kjærlighet.",
        priceNote: "",
        priceNotePrefix: "",
        openingTimes: [],
        mainCourses: [
            {
                title: "Focaccia",
                price: "139,-",
                description: "Speke, mozzarella, pesto, tomat (GH, M, SV, SEN) / Porchetta, bakt hvitløk, chimmichurri, sylta rødløk (GH, SEN, SV, E)",
                category: "mat"
            },
            {
                title: "Langos",
                price: "169,-",
                description: "Skagenrøre, rødløk, dill, rogn (GH, SK, F, SEN, SV) / Speke, urtekremost, rødløk, sylta chili (GH, M, SV)",
                category: "mat"
            },
            {
                title: "Smørgåstårta",
                price: "199,-",
                description: "(GH, M, F, SK, SV, SEN)",
                category: "mat"
            },
            {
                title: "Krokett",
                price: "95,-",
                description: "Ølkokt svinekjake m/grilla paprikamajones (GH, E, SV, SEN)",
                category: "maevl"
            },
            {
                title: "Fritert brie",
                price: "85,-",
                description: "(Tuftes chili cheese) m/ripssyltetøy og sylta chili (GH, M, SV)",
                category: "maevl"
            },
            {
                title: "Lammeribbe",
                price: "105,-",
                description: "m/glaze og jalapenomayo (SO, E, SV, SES, SEN)",
                category: "maevl"
            },
            {
                title: "Potetgull",
                price: "115,-",
                description: "m/rogn, rømme, rødløk og dill (F, M)",
                category: "maevl"
            },
            {
                title: "Pommes Frites",
                price: "65,-",
                description: "m/aioli (E, SV, SEN)",
                category: "maevl"
            }
        ],
        drinksGroups: []
    },
    archivedMenus: {
        winter: {
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
        }
    },
    booking: {
        title: "Reserver din opplevelse!",
        subtitle: "Siden vi lager maten basert på antall gjester, setter vi pris på bestilling på forhånd.",
        contactInfo: "Du kan også ta kontakt på Tufte Gård Messenger eller tlf: 46824498 for booking og spørsmål.",
        timeSlots: [
            "14:00 - 17:00",
            "18:00 - 22:00"
        ]
    },
    confirmationPopup: {
        title: "Takk for di bestilling!",
        message1: "Me har mottatt di førespurnad og vil sjå over den.",
        message2: "Du vil høyre frå oss på SMS så snart me har bekrefta bordet."
    },
    footer: {
        text: "Tufte Gård © 2026 | Midt i morellhagen"
    },
    calendar: {
        openDates: [
            "2026-02-01",
            "2026-02-02",
            "2026-02-06",
            "2026-02-07",
            "2026-02-08"
        ]
    }
};
