/* ============================================================
   Krewe of Unicorns member app: sample data
   Everything here is invented for the demo. The Krewe of Unicorns
   is fictional, and so is every member, phone number, and message.

   Event dates are stored as "days from today" so the demo always
   shows upcoming events, no matter when it is opened.
   On a live Krewe & Kin build, this file is replaced by a database.
   ============================================================ */

const KOU_DATA = {
  krewe: {
    name: "Krewe of Unicorns",
    city: "Tampa Bay",
    founded: 2020,
    motto: "Believe · Belong · Sparkle",
    websiteHome: "../index.html"
  },

  /* The signed-in demo member. */
  me: {
    id: "m-ruby",
    first: "Ruby",
    last: "Glimmerhoof",
    memberNo: "KOU-2020-0417",
    role: "Social Coordinator",
    tier: "Full Member",
    since: 2021,
    subkrewe: "The Glitter Guard",
    duesAmount: 150,
    sparkles: 1240
  },

  events: [
    { id: "float", name: "Float Build Saturday", days: 6, time: "09:00", end: "14:00", type: "Work Day",
      location: "The Unicorn Den (float barn), Palmetto Street, Tampa", img: "parade-13",
      going: 23, desc: "Help finish the new rainbow turrets on the Castle of Wonder. Coffee, donuts and glitter provided. Wear closed-toe shoes.",
      shifts: [{ id: "f1", label: "Painting crew · 9 to 11 AM", open: 4 }, { id: "f2", label: "Lighting crew · 11 AM to 2 PM", open: 2 }] },
    { id: "drive", name: "Glitter & Give Charity Drive", days: 13, time: "10:00", end: "15:00", type: "Service",
      location: "Curtis Hixon Park, Tampa", img: "parade-26",
      going: 41, desc: "Our fall service day. We collect school supplies and coats for local children's charities. Bring a donation and your brightest smile.",
      shifts: [{ id: "d1", label: "Donation table · 10 AM to 12:30 PM", open: 3 }, { id: "d2", label: "Sorting and packing · 12:30 to 3 PM", open: 5 }] },
    { id: "mixer", name: "New Member Mixer: Meet the Herd", days: 20, time: "18:30", end: "21:00", type: "Social",
      location: "The Rainbow Room, Ybor City", img: "parade-04",
      going: 58, desc: "Bring a friend who is curious about the krewe! Officers will share what a season looks like, and new members receive their welcome beads.",
      shifts: [{ id: "x1", label: "Welcome table greeter · 6 to 7:30 PM", open: 2 }] },
    { id: "ball", name: "The Enchanted Ball", days: 41, time: "19:00", end: "23:30", type: "Gala",
      location: "Crystal Ballroom, Downtown Tampa", img: "unicorn-cosmic",
      going: 212, desc: "Our black-tie-and-sparkle gala. Coronation of the Unicorn Royal Court, dinner, dancing and the grand midnight reveal. Tickets included with Full Membership.",
      shifts: [{ id: "b1", label: "Court procession marshal · 6 to 8 PM", open: 1 }] },
    { id: "moon", name: "Full-Moon Members Social", days: 83, time: "20:00", end: "22:30", type: "Social",
      location: "Bayshore Rooftop, Tampa", img: "unicorn-forest",
      going: 64, desc: "An easy evening under the full moon with lanterns, mocktails and music. Members only, plus one guest.",
      shifts: [] },
    { id: "kids", name: "Children's Gasparilla", days: 118, time: "11:00", end: "15:00", type: "Parade",
      location: "Bayshore Boulevard, Tampa", img: "parade-16",
      going: 77, desc: "The family-friendly, alcohol-free daytime parade. Rainbow beads, bubbles and big smiles for the little ones.",
      shifts: [{ id: "k1", label: "Walking herd (bead tossers)", open: 12 }] },
    { id: "parade", name: "Gasparilla Unicorn Parade", days: 125, time: "14:00", end: "18:00", type: "Parade",
      location: "Bayshore Parade Route, Tampa", img: "parade-18",
      going: 186, desc: "The crown jewel of the season. The Castle of Wonder float and the walking herd roll down Bayshore Boulevard in a shower of glitter and rainbow throws.",
      shifts: [{ id: "p1", label: "Float rider · upper deck", open: 0 }, { id: "p2", label: "Float walker (safety escort)", open: 6 }, { id: "p3", label: "Water and first-aid wagon", open: 2 }] }
  ],

  members: [
    { id: "m-luna",   first: "Luna",   last: "Sparklemane", role: "Captain",            since: 2020, subkrewe: "Founders' Circle",  fact: "Designed the original unicorn crest on a napkin." },
    { id: "m-star",   first: "Star",   last: "Rainbowdash", role: "First Lieutenant",   since: 2020, subkrewe: "Founders' Circle",  fact: "Has never missed a parade, even the rainy one." },
    { id: "m-pearl",  first: "Pearl",  last: "Moonhoof",    role: "Treasurer",          since: 2020, subkrewe: "The Ledger Lights", fact: "Counts beads faster than anyone alive." },
    { id: "m-aurora", first: "Aurora", last: "Prism",       role: "Parade Marshal",     since: 2021, subkrewe: "The Glitter Guard", fact: "Knows every inch of the Bayshore route." },
    { id: "m-comet",  first: "Comet",  last: "Silvermane",  role: "Membership Chair",   since: 2021, subkrewe: "Welcome Wagon",     fact: "Brought in 30 new members last season." },
    { id: "m-jasper", first: "Jasper", last: "Twinklehoof", role: "Float Captain",      since: 2020, subkrewe: "Castle Builders",   fact: "Engineered the float's glowing horn." },
    { id: "m-willow", first: "Willow", last: "Stardust",    role: "Member",             since: 2022, subkrewe: "The Glitter Guard", fact: "Hand-sews capes for the whole herd." },
    { id: "m-sage",   first: "Sage",   last: "Cloudleaper", role: "Member",             since: 2023, subkrewe: "Castle Builders",   fact: "Wires every light on the castle towers." },
    { id: "m-dahlia", first: "Dahlia", last: "Moonbeam",    role: "Member",             since: 2022, subkrewe: "Lantern Walkers",   fact: "Leads the Full-Moon Lantern Walk." },
    { id: "m-ivy",    first: "Ivy",    last: "Shimmertail", role: "Volunteer Lead",     since: 2021, subkrewe: "Welcome Wagon",     fact: "Organizes every service day." },
    { id: "m-coral",  first: "Coral",  last: "Dewdrop",     role: "Member",             since: 2024, subkrewe: "Lantern Walkers",   fact: "Newest member of the drum line." },
    { id: "m-nova",   first: "Nova",   last: "Brighthoof",  role: "Photographer",       since: 2022, subkrewe: "Media Magic",       fact: "Took the photo on the krewe's website." },
    { id: "m-basil",  first: "Basil",  last: "Meadowlight", role: "Member",             since: 2025, subkrewe: "Castle Builders",   fact: "Can fix anything with zip ties." },
    { id: "m-opal",   first: "Opal",   last: "Starwhisper", role: "Throws Chair",       since: 2021, subkrewe: "The Ledger Lights", fact: "Orders 40,000 beads a year." }
  ],

  channels: [
    { id: "general",   name: "General Herd",        icon: "🦄", desc: "Everyone in the krewe" },
    { id: "announce",  name: "Announcements",       icon: "📣", desc: "Officers post, everyone reads", readOnly: true },
    { id: "parade",    name: "Parade Crew",         icon: "🎺", desc: "Line-up, costumes and route talk" },
    { id: "float",     name: "Float Builders",      icon: "🏰", desc: "Castle of Wonder work crew" },
    { id: "rides",     name: "Rides & Carpools",    icon: "🚗", desc: "Share a ride to events" }
  ],

  /* minutesAgo lets the timestamps stay fresh. */
  messages: {
    general: [
      { from: "m-luna",   minutesAgo: 1440, text: "Good morning, herd! 🌈 So proud of everyone who showed up to the park clean-up this weekend." },
      { from: "m-willow", minutesAgo: 300,  text: "Cape fitting sign-ups are open in the Parade tab. I have 20 fittings left before the ball!" },
      { from: "m-coral",  minutesAgo: 95,   text: "Is anyone else doing the Glitter & Give drive? I am bringing three boxes of crayons 🖍️" },
      { from: "m-ivy",    minutesAgo: 80,   text: "Yes! Please sign up for a shift in the Events tab so we know how many tables to set up." },
      { from: "m-nova",   minutesAgo: 22,   text: "New photos from the float build are up in the gallery ✨" }
    ],
    announce: [
      { from: "m-pearl",  minutesAgo: 2880, text: "Reminder: season dues are due before the Enchanted Ball. You can pay right in the app under Me → Dues." },
      { from: "m-aurora", minutesAgo: 600,  text: "Parade line-up posted! We are Float #27, staging at Bayshore Boulevard and Rome Avenue. Arrive by 11:30 AM." },
      { from: "m-luna",   minutesAgo: 45,   text: "The Royal Court nominations close Friday. Nominate your favorite unicorn! 👑" }
    ],
    parade: [
      { from: "m-aurora", minutesAgo: 700, text: "Walkers: comfortable shoes, water bottle, and your krewe wristband. No wristband, no walking." },
      { from: "m-opal",   minutesAgo: 400, text: "Throws are in! Pick up your bead bags at the den the week before the parade." },
      { from: "m-star",   minutesAgo: 60,  text: "Who is bringing the portable fans this year? It gets hot on Bayshore!" }
    ],
    float: [
      { from: "m-jasper", minutesAgo: 1500, text: "Turret number 3 is framed. Paint crew, it is all yours Saturday 🎨" },
      { from: "m-sage",   minutesAgo: 240,  text: "I ordered the new rainbow LED strips. They arrive Thursday." },
      { from: "m-basil",  minutesAgo: 30,   text: "I will bring the big ladder and extra zip ties." }
    ],
    rides: [
      { from: "m-dahlia", minutesAgo: 900, text: "Driving from St. Petersburg to the Enchanted Ball. 3 seats open!" },
      { from: "m-comet",  minutesAgo: 120, text: "Anyone near Brandon going to the float build? I can pick up two unicorns." }
    ]
  },

  announcements: [
    { id: "a1", from: "m-luna",   title: "Royal Court nominations are open 👑", body: "Nominate a fellow member for Queen, King or Royal Unicorn of the 2026–2027 season. Nominations close Friday at midnight.", minutesAgo: 45, img: "trio-ornate", sparkles: 48 },
    { id: "a2", from: "m-aurora", title: "Parade line-up is posted", body: "We roll as Float #27. Staging is at Bayshore Boulevard and Rome Avenue. Check the Parade tab for your checklist.", minutesAgo: 600, img: "parade-19", sparkles: 73 },
    { id: "a3", from: "m-pearl",  title: "Dues reminder", body: "Pay your season dues before the Enchanted Ball to keep your ball tickets and parade spot.", minutesAgo: 2880, img: null, sparkles: 12 }
  ],

  notifications: [
    { id: "n1", icon: "📣", text: "Luna Sparklemane posted: Royal Court nominations are open.", minutesAgo: 45, go: "home" },
    { id: "n2", icon: "💬", text: "3 new messages in General Herd.", minutesAgo: 22, go: "herd" },
    { id: "n3", icon: "📅", text: "Float Build Saturday is in 6 days. You have not RSVPed yet.", minutesAgo: 180, go: "events" },
    { id: "n4", icon: "💳", text: "Your season dues ($150) are due before the Enchanted Ball.", minutesAgo: 2880, go: "dues" }
  ],

  /* Parade-ready checklist shown in the Parade tab. */
  checklist: [
    { id: "dues",     label: "Season dues paid",               note: "Pay in Me → Dues" },
    { id: "waiver",   label: "Parade safety waiver signed",    note: "Required by the city for every rider and walker" },
    { id: "costume",  label: "Costume and cape ready",         note: "Cape fittings with Willow before the ball" },
    { id: "throws",   label: "Throws ordered and picked up",   note: "Bead bags at the den, week before the parade" },
    { id: "wristband",label: "Krewe wristband picked up",      note: "No wristband, no walking" },
    { id: "ride",     label: "Ride to staging arranged",       note: "Use Rides & Carpools in Krewe Chat" },
    { id: "water",    label: "Water, sunscreen, comfy shoes",  note: "Bayshore gets hot!" }
  ],

  badges: [
    { id: "b1", icon: "🌈", name: "First Parade",      desc: "Marched in your first parade", earned: true },
    { id: "b2", icon: "🏰", name: "Castle Builder",     desc: "5 float build days",          earned: true },
    { id: "b3", icon: "🤝", name: "Herd Helper",        desc: "10 volunteer hours",           earned: true },
    { id: "b4", icon: "✨", name: "Sparkle Streak",     desc: "RSVP to 5 events in a row",    earned: false },
    { id: "b5", icon: "👑", name: "Royal Court",        desc: "Serve on the Royal Court",     earned: false },
    { id: "b6", icon: "📸", name: "Shutterbug",         desc: "Share 10 photos",              earned: true }
  ],

  leaderboard: [
    { id: "m-ivy",    points: 2310 },
    { id: "m-jasper", points: 1985 },
    { id: "m-willow", points: 1560 },
    { id: "me",       points: 1240 },
    { id: "m-sage",   points: 1105 }
  ],

  duesHistory: [
    { season: "2025–2026", amount: 150, paid: "Paid Oct 2, 2025" },
    { season: "2024–2025", amount: 135, paid: "Paid Sep 18, 2024" },
    { season: "2023–2024", amount: 135, paid: "Paid Oct 9, 2023" }
  ],

  gallery: ["parade-02", "parade-06", "parade-11", "parade-14", "parade-15", "parade-21", "parade-23", "parade-27", "parade-24", "rainbow-prance"],

  emergency: [
    { label: "Parade Marshal (Aurora)", phone: "555-0142" },
    { label: "Krewe Captain (Luna)",    phone: "555-0101" },
    { label: "First-aid wagon",         phone: "555-0199" }
  ],

  /* Auto-replies so the chat feels alive during a demo. */
  replies: [
    "Love this! 🦄",
    "Count me in ✨",
    "Yes! See you there 🌈",
    "Thank you for sharing!",
    "The herd is the best herd 💜",
    "I can help with that.",
    "Sparkle on! ✨"
  ]
};
