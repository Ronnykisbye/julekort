/* js/data.js
   Alt indhold: sprog, labels, korttyper, design, tekstforslag
*/

window.CARD_DATA = {
  languages: [
    { code: "da", name: "Dansk" },
    { code: "de", name: "Tysk" },
    { code: "en", name: "Engelsk" },
    { code: "pl", name: "Polsk" },
    { code: "lt", name: "Litauisk" }
  ],

  types: [
    { id: "xmas", key: "xmas" },
    { id: "bday", key: "bday" },
    { id: "special", key: "special" }
  ],

  labels: {
    da: {
      subtitle: "Lav et kort på 30 sek.",
      wizardTitle: "Opsætning",
      previewTitle: "Live preview",
      layer1Title: "Grundvalg",
      layer2Title: "Design",
      layer3Title: "Tekst",
      lang: "Sprog",
      theme: "Tema",
      type: "Korttype",
      occasion: "Anledning",
      from: "Fra",
      to: "Til",
      suggestions: "Forslag",
      message: "Din tekst",
      next1: "Vælg design",
      next2: "Skriv teksten",
      designHint: "Swipe/scroll – klik for at vælge.",
      chosenNone: "Intet valgt",
      status1: "Vælg Lag 1",
      status2: "Vælg design",
      status3: "Skriv tekst",
      types: {
        xmas: "Julekort",
        bday: "Fødselsdagskort",
        special: "Speciel anledning"
      },
      help: [
        "Start i Lag 1 og klik “Vælg design”.",
        "Vælg et design i Lag 2 (swipe/scroll).",
        "Udfyld Fra/Til og vælg et tekstforslag i Lag 3.",
        "Brug actionbaren nederst til PNG/PDF/E-mail/Del."
      ]
    },

    en: {
      subtitle: "Create a card in 30 sec.",
      wizardTitle: "Setup",
      previewTitle: "Live preview",
      layer1Title: "Basics",
      layer2Title: "Design",
      layer3Title: "Text",
      lang: "Language",
      theme: "Theme",
      type: "Card type",
      occasion: "Occasion",
      from: "From",
      to: "To",
      suggestions: "Suggestions",
      message: "Your message",
      next1: "Choose design",
      next2: "Write text",
      designHint: "Swipe/scroll – tap to select.",
      chosenNone: "None selected",
      status1: "Choose Layer 1",
      status2: "Pick a design",
      status3: "Write text",
      types: {
        xmas: "Christmas",
        bday: "Birthday",
        special: "Special occasion"
      },
      help: [
        "Start in Layer 1 and click “Choose design”.",
        "Pick a design in Layer 2 (swipe/scroll).",
        "Fill From/To and choose a suggestion in Layer 3.",
        "Use the action bar for PNG/PDF/Email/Share."
      ]
    },

    de: {
      subtitle: "Erstelle eine Karte in 30 Sek.",
      wizardTitle: "Setup",
      previewTitle: "Live-Vorschau",
      layer1Title: "Grundlagen",
      layer2Title: "Design",
      layer3Title: "Text",
      lang: "Sprache",
      theme: "Modus",
      type: "Kartentyp",
      occasion: "Anlass",
      from: "Von",
      to: "An",
      suggestions: "Vorschläge",
      message: "Dein Text",
      next1: "Design wählen",
      next2: "Text schreiben",
      designHint: "Wischen/Scrollen – antippen zum Auswählen.",
      chosenNone: "Nichts gewählt",
      status1: "Layer 1 wählen",
      status2: "Design wählen",
      status3: "Text schreiben",
      types: {
        xmas: "Weihnachten",
        bday: "Geburtstag",
        special: "Besonderer Anlass"
      },
      help: [
        "Beginne in Layer 1 und klicke „Design wählen“.",
        "Wähle ein Design in Layer 2 (Wischen/Scrollen).",
        "Fülle Von/An aus und wähle einen Vorschlag in Layer 3.",
        "Nutze die Actionbar für PNG/PDF/E-Mail/Teilen."
      ]
    },

    pl: {
      subtitle: "Zrób kartkę w 30 sek.",
      wizardTitle: "Ustawienia",
      previewTitle: "Podgląd na żywo",
      layer1Title: "Podstawy",
      layer2Title: "Design",
      layer3Title: "Tekst",
      lang: "Język",
      theme: "Motyw",
      type: "Typ kartki",
      occasion: "Okazja",
      from: "Od",
      to: "Dla",
      suggestions: "Propozycje",
      message: "Twoja wiadomość",
      next1: "Wybierz design",
      next2: "Napisz tekst",
      designHint: "Przewiń – kliknij, aby wybrać.",
      chosenNone: "Nie wybrano",
      status1: "Wybierz warstwę 1",
      status2: "Wybierz design",
      status3: "Napisz tekst",
      types: {
        xmas: "Boże Narodzenie",
        bday: "Urodziny",
        special: "Specjalna okazja"
      },
      help: [
        "Zacznij w warstwie 1 i kliknij „Wybierz design”.",
        "Wybierz design w warstwie 2 (scroll).",
        "Uzupełnij Od/Dla i wybierz propozycję w warstwie 3.",
        "Użyj paska akcji: PNG/PDF/E-mail/Udostępnij."
      ]
    },

    lt: {
      subtitle: "Sukurk atviruką per 30 s.",
      wizardTitle: "Nustatymai",
      previewTitle: "Tiesioginė peržiūra",
      layer1Title: "Pagrindai",
      layer2Title: "Dizainas",
      layer3Title: "Tekstas",
      lang: "Kalba",
      theme: "Tema",
      type: "Atviruko tipas",
      occasion: "Proga",
      from: "Nuo",
      to: "Kam",
      suggestions: "Pasiūlymai",
      message: "Tavo tekstas",
      next1: "Rinktis dizainą",
      next2: "Rašyti tekstą",
      designHint: "Slink – spausk pasirinkti.",
      chosenNone: "Nepasirinkta",
      status1: "Pasirink 1 sluoksnį",
      status2: "Pasirink dizainą",
      status3: "Rašyk tekstą",
      types: {
        xmas: "Kalėdos",
        bday: "Gimtadienis",
        special: "Ypatinga proga"
      },
      help: [
        "Pradėk 1 sluoksnyje ir spausk „Rinktis dizainą“.",
        "Pasirink dizainą 2 sluoksnyje (slink).",
        "Užpildyk Nuo/Kam ir pasirink pasiūlymą 3 sluoksnyje.",
        "Naudok veiksmų juostą: PNG/PDF/El. paštas/Dalintis."
      ]
    }
  },

  designs: [
    { id:"nordicGlow",  name:"Nordic Glow",  icon:"❄️", a:"#0b2b4a", b:"#7b2cff", c:"#00e5ff", pattern:"sparkle" },
    { id:"candleHygge", name:"Candle Hygge", icon:"🕯️", a:"#2b1b3a", b:"#ffb86b", c:"#ffd37a", pattern:"bokeh" },
    { id:"mintNeon",    name:"Mint Neon",    icon:"✨", a:"#05302b", b:"#00f0ff", c:"#7dffb2", pattern:"grid" },
    { id:"snowBloom",   name:"Snow Bloom",   icon:"🌨️", a:"#16234f", b:"#7aa7ff", c:"#d7a9ff", pattern:"snow" },
    { id:"goldWarmth",  name:"Gold Warmth",  icon:"🌟", a:"#2b1f10", b:"#ffcf66", c:"#ff6bd6", pattern:"dust" },
    { id:"blueAurora",  name:"Blue Aurora",  icon:"🌌", a:"#031a2a", b:"#1d6bff", c:"#8bf7ff", pattern:"aurora" },
    { id:"berryXmas",   name:"Berry Xmas",   icon:"🍒", a:"#2a0710", b:"#ff4d6d", c:"#7dffb2", pattern:"confetti" },
    { id:"iceGlass",    name:"Ice Glass",    icon:"🧊", a:"#0f2230", b:"#3b8cff", c:"#d7a9ff", pattern:"glass" },
    { id:"sunsetParty", name:"Sunset Party", icon:"🎉", a:"#2a0b2f", b:"#ff6bd6", c:"#ffd37a", pattern:"rays" },
    { id:"calmForest",  name:"Calm Forest",  icon:"🌲", a:"#062016", b:"#2cff9a", c:"#8bf7ff", pattern:"leaf" }
  ],

  suggestions: {
    da: {
      xmas: [
        "Glædelig jul og et godt nytår! 🎄✨",
        "Må din jul være fyldt med hygge, varme og smil.",
        "Tak for året der gik – glædelig jul!",
        "Rigtig glædelig jul – vi ses snart!",
        "Julens magi til dig og dine ❤️"
      ],
      bday: [
        "Stort tillykke med fødselsdagen! 🎉",
        "Håber du får en dag fyldt med glæde og kage!",
        "Tillykke! Du fortjener den bedste dag.",
        "Kæmpe kram og tillykke i dag!",
        "Hurra! Nyd dagen – og året der kommer."
      ],
      special: [
        "Tillykke med {occasion}! 🌟",
        "Jeg tænker på dig – tillykke med {occasion}.",
        "Hvor er det stort! Tillykke med {occasion} ❤️",
        "Alt det bedste til {occasion} – du klarer det!",
        "En varm hilsen i anledning af {occasion}."
      ]
    },
    en: {
      xmas: [
        "Merry Christmas and a Happy New Year! 🎄✨",
        "Wishing you a warm, cozy Christmas.",
        "Thank you for this year — Merry Christmas!",
        "Merry Christmas — see you soon!",
        "Sending Christmas magic your way ❤️"
      ],
      bday: [
        "Happy Birthday! 🎉",
        "Hope your day is full of joy (and cake).",
        "Big congratulations — you deserve the best!",
        "Sending hugs and birthday vibes!",
        "Cheers to you — have an amazing year ahead."
      ],
      special: [
        "Congrats on your {occasion}! 🌟",
        "Thinking of you — happy {occasion}.",
        "So happy for you — {occasion} ❤️",
        "All the best for your {occasion}!",
        "Warm wishes for your {occasion}."
      ]
    },
    de: {
      xmas: [
        "Frohe Weihnachten und ein gutes neues Jahr! 🎄✨",
        "Ich wünsche dir eine gemütliche Weihnachtszeit.",
        "Danke für das Jahr — frohe Weihnachten!",
        "Frohe Weihnachten — bis bald!",
        "Weihnachtsmagie für dich ❤️"
      ],
      bday: [
        "Alles Gute zum Geburtstag! 🎉",
        "Ich wünsche dir einen tollen Tag (mit Kuchen!).",
        "Herzlichen Glückwunsch — du hast es verdient!",
        "Fühl dich umarmt — alles Gute!",
        "Auf ein großartiges neues Jahr für dich."
      ],
      special: [
        "Glückwunsch zu {occasion}! 🌟",
        "Ich denke an dich — alles Gute zu {occasion}.",
        "So schön! Glückwunsch zu {occasion} ❤️",
        "Alles Gute für {occasion}!",
        "Herzliche Grüße zu {occasion}."
      ]
    },
    pl: {
      xmas: [
        "Wesołych Świąt i Szczęśliwego Nowego Roku! 🎄✨",
        "Niech te Święta będą pełne ciepła i spokoju.",
        "Dziękuję za ten rok — Wesołych Świąt!",
        "Wesołych Świąt — do zobaczenia!",
        "Świątecznej magii dla Ciebie ❤️"
      ],
      bday: [
        "Wszystkiego najlepszego z okazji urodzin! 🎉",
        "Niech ten dzień będzie pełen radości (i tortu).",
        "Sto lat! Zasługujesz na najlepsze.",
        "Moc uścisków — wszystkiego dobrego!",
        "Niech kolejny rok będzie wspaniały."
      ],
      special: [
        "Gratulacje z okazji {occasion}! 🌟",
        "Myślę o Tobie — wszystkiego dobrego na {occasion}.",
        "Tak się cieszę — {occasion} ❤️",
        "Wszystkiego najlepszego z okazji {occasion}!",
        "Ciepłe życzenia na {occasion}."
      ]
    },
    lt: {
      xmas: [
        "Linksmų Kalėdų ir laimingų Naujųjų! 🎄✨",
        "Tegul Kalėdos būna jaukios ir šiltos.",
        "Ačiū už šiuos metus — linksmų Kalėdų!",
        "Linksmų Kalėdų — iki greito!",
        "Siunčiu Kalėdų magiją ❤️"
      ],
      bday: [
        "Su gimtadieniu! 🎉",
        "Tegul diena būna pilna džiaugsmo (ir torto).",
        "Sveikinimai — tu to nusipelnei!",
        "Didelis apkabinimas — su gimtadieniu!",
        "Nuostabių metų į priekį."
      ],
      special: [
        "Sveikinu su {occasion}! 🌟",
        "Galvoju apie tave — su {occasion}.",
        "Labai džiaugiuosi — {occasion} ❤️",
        "Viskas geriausia su {occasion}!",
        "Šilti linkėjimai su {occasion}."
      ]
    }
  }
};
