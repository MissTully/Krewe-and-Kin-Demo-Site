/* ============================================================
   Krewe of Unicorns member app: behavior
   A single-page app with five tabs (Home, Events, Herd, Parade, Me).
   The address bar "hash" (#home, #events, #chat/general ...) decides
   which screen is shown, so the Android back button works naturally.

   All member activity (RSVPs, chat messages, checklist, dues) is saved
   only in this phone's browser storage. Nothing is sent to a server.
   ============================================================ */
(function () {
  "use strict";

  const D = KOU_DATA;
  const STORE_KEY = "kou-app-v1";
  const $ = (sel, root = document) => root.querySelector(sel);

  /* ---------------- saved state ---------------- */
  const defaults = () => ({
    signedIn: false,
    firstSeen: Date.now(),
    theme: "dark",
    rsvp: {},            // eventId -> { status: "going" | "maybe" | "no", guests: 0 }
    shifts: {},          // shiftId -> true
    chat: {},            // channelId -> [{ from, at, text }]
    dms: [],             // memberIds with a direct-message thread
    unread: { general: 3, announce: 1, parade: 0, float: 1, rides: 0 },
    reactions: {},       // announcementId -> true
    checklist: { costume: true, wristband: false },
    duesPaid: false,
    sparkles: D.me.sparkles,
    notifRead: false,
    notifOn: false,
    installDismissed: false
  });

  let state = load();
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return Object.assign(defaults(), JSON.parse(raw));
    } catch (e) { /* storage blocked: fall back to defaults */ }
    return defaults();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* ---------------- small helpers ---------------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const img = (name) => `img/${name}.jpg`;
  const memberById = (id) => (id === "me" || id === D.me.id) ? meAsMember() : D.members.find((m) => m.id === id);
  const meAsMember = () => ({ id: D.me.id, first: D.me.first, last: D.me.last, role: D.me.role, since: D.me.since, subkrewe: D.me.subkrewe });
  const fullName = (m) => `${m.first} ${m.last}`;
  const isOfficer = (m) => m.role !== "Member";

  const GRADIENTS = [["#8b5cf6", "#ec4899"], ["#f59e0b", "#ec4899"], ["#22d3ee", "#8b5cf6"], ["#34d399", "#22d3ee"], ["#fb7185", "#f59e0b"], ["#6366f1", "#22d3ee"]];
  function avatar(m, size = "") {
    const i = [...m.id].reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length;
    const [a, b] = GRADIENTS[i];
    return `<span class="avatar ${size}" style="--a:${a};--b:${b}" aria-hidden="true">${esc(m.first[0] + m.last[0])}</span>`;
  }

  function eventDate(ev, which = "time") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + ev.days);
    const [h, min] = ev[which].split(":").map(Number);
    d.setHours(h, min, 0, 0);
    return d;
  }
  const fmtDay = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const fmtLong = (d) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const fmtTime = (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  function ago(ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} hr ago`;
    const d = Math.round(h / 24);
    return d === 1 ? "yesterday" : `${d} days ago`;
  }
  const baseTime = (minutesAgo) => state.firstSeen - minutesAgo * 60000;
  const upcoming = () => D.events.slice().sort((a, b) => a.days - b.days);
  const paradeEvent = () => D.events.find((e) => e.id === "parade");
  const goingCount = (ev) => ev.going + (state.rsvp[ev.id]?.status === "going" ? 1 + (state.rsvp[ev.id].guests || 0) : 0);

  function toast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function addSparkles(n, why) {
    state.sparkles += n;
    save();
    toast(`+${n} Sparkles ✨ ${why}`);
  }

  /* ---------------- router ---------------- */
  const TITLES = { home: "Home", events: "Events", herd: "The Herd", parade: "Parade Day", me: "My Krewe" };
  let rafId = null;

  function route() {
    if (!state.signedIn) return showLogin();
    cancelAnimationFrame(rafId);
    const hash = (location.hash || "#home").slice(1);
    const [page, arg] = hash.split("/");
    const app = $("#app");
    app.classList.remove("chat-mode");
    $("#view").classList.remove("no-tabbar");

    // Shortcut routes open a sheet on top of their tab.
    if (page === "card") { history.replaceState(null, "", "#me"); renderTab("me"); return openCard(); }
    if (page === "dues") { history.replaceState(null, "", "#me"); renderTab("me"); return openDues(); }
    if (page === "chat" && arg) return renderChat(arg);
    renderTab(TITLES[page] ? page : "home", arg);
  }

  function renderTab(page, arg) {
    document.querySelectorAll(".tabbar button").forEach((b) => b.classList.toggle("on", b.dataset.go === page));
    $("#topTitle").textContent = TITLES[page];
    $("#topEyebrow").textContent = page === "home" ? greeting() : "Krewe of Unicorns";
    const view = $("#view");
    view.innerHTML = VIEWS[page](arg);
    view.firstElementChild?.classList.add("fade-in");
    window.scrollTo(0, 0);
    if (page === "parade") drawRoute();
    tick();
    updateBadges();
  }

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }

  /* ---------------- views ---------------- */
  const VIEWS = {
    home() {
      const next = upcoming()[0];
      const parade = paradeEvent();
      const rank = rankOf();
      const pct = Math.min(100, Math.round((state.sparkles / 2310) * 100));
      return `
      <div>
        <div class="greet">
          <h1>${greeting()}, ${esc(D.me.first)} 🦄</h1>
          <p>${D.krewe.motto}</p>
        </div>

        <section class="hero-count" style="background-image:url('${img(parade.img)}')" aria-label="Parade countdown">
          <p class="eyebrow">Countdown to the parade</p>
          <h2>${esc(parade.name)}</h2>
          <div class="count" data-countdown="${eventDate(parade).getTime()}">
            <div><b data-u="d">0</b><span>Days</span></div>
            <div><b data-u="h">0</b><span>Hours</span></div>
            <div><b data-u="m">0</b><span>Min</span></div>
            <div><b data-u="s">0</b><span>Sec</span></div>
          </div>
        </section>

        <div class="quick" role="group" aria-label="Quick actions">
          ${quick("🪪", "Member Card", "open-card")}
          ${quick("📅", "RSVP", "go", "events")}
          ${quick("💳", "Pay Dues", "open-dues")}
          ${quick("💬", "Chat", "go", "herd")}
          ${quick("🚗", "Carpool", "go", "chat/rides")}
          ${quick("🙋", "Volunteer", "go", "events/volunteer")}
          ${quick("🛍️", "Shop", "link", "../store.html")}
          ${quick("📸", "Photos", "open-gallery")}
        </div>

        <section class="section">
          <div class="section-head"><h2>Next up</h2><button class="link-btn" data-go="events">All events</button></div>
          ${nextCard(next)}
        </section>

        <section class="section">
          <div class="section-head"><h2>From the officers</h2></div>
          ${D.announcements.map(postCard).join("")}
        </section>

        <section class="section">
          <div class="section-head"><h2>The Sparkle Cup</h2><button class="link-btn" data-action="open-cup">Leaderboard</button></div>
          <div class="card sparkle-card">
            <div class="sparkle-ring" style="--p:${pct}"><span>#${rank}</span></div>
            <div>
              <b>${state.sparkles.toLocaleString()} Sparkles</b>
              <p class="muted" style="margin:2px 0 0;font-size:14px">You are #${rank} in the herd. RSVP, volunteer and pay dues to earn more.</p>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head"><h2>Fresh from the float</h2><button class="link-btn" data-action="open-gallery">See all</button></div>
          <div class="strip">
            ${D.gallery.slice(0, 6).map((p) => `<button data-action="open-photo" data-id="${p}" aria-label="Open photo"><img src="${img(p)}" alt="Krewe of Unicorns members at a parade" loading="lazy" /></button>`).join("")}
          </div>
        </section>
      </div>`;
    },

    events(filter = "upcoming") {
      let list = upcoming();
      if (filter === "mine") list = list.filter((e) => ["going", "maybe"].includes(state.rsvp[e.id]?.status));
      if (filter === "volunteer") list = list.filter((e) => e.shifts.length);
      const seg = (id, label) => `<button class="${filter === id ? "on" : ""}" data-go="events/${id}">${label}</button>`;
      return `
      <div>
        <div class="seg" role="tablist">${seg("upcoming", "Upcoming")}${seg("mine", "My RSVPs")}${seg("volunteer", "Volunteer")}</div>
        <div class="section">
          ${list.length ? list.map(eventCard).join("") : `<div class="empty"><div class="big">📅</div><p>No RSVPs yet. Tap an event and choose “Going”.</p><button class="btn btn-glow" data-go="events">Browse events</button></div>`}
        </div>
      </div>`;
    },

    herd(tab = "chat") {
      const seg = (id, label) => `<button class="${tab === id ? "on" : ""}" data-go="herd/${id}">${label}</button>`;
      return `
      <div>
        <div class="seg">${seg("chat", "Krewe Chat")}${seg("directory", "Directory")}</div>
        <div class="section">${tab === "directory" ? directoryHTML() : chatListHTML()}</div>
      </div>`;
    },

    parade() {
      const parade = paradeEvent();
      const done = D.checklist.filter((c) => isChecked(c.id)).length;
      const pct = Math.round((done / D.checklist.length) * 100);
      return `
      <div>
        <section class="hero-count" style="background-image:url('${img("parade-19")}');min-height:180px">
          <p class="eyebrow">${fmtLong(eventDate(parade))}</p>
          <h2>${esc(parade.name)}</h2>
          <div class="count" data-countdown="${eventDate(parade).getTime()}">
            <div><b data-u="d">0</b><span>Days</span></div>
            <div><b data-u="h">0</b><span>Hours</span></div>
            <div><b data-u="m">0</b><span>Min</span></div>
            <div><b data-u="s">0</b><span>Sec</span></div>
          </div>
        </section>

        <section class="section">
          <div class="section-head"><h2>Your line-up</h2></div>
          <div class="card">
            <div class="lineup">
              <div><b>#27</b><small>Float</small></div>
              <div><b>11:30</b><small>Arrive AM</small></div>
              <div><b>B-4</b><small>Walk group</small></div>
            </div>
            <p class="muted" style="margin:12px 0 0;font-size:14px">📍 Staging at <b>Bayshore Boulevard &amp; Rome Avenue</b>. Check in with Aurora at the float's rear ladder.</p>
          </div>
        </section>

        <section class="section">
          <div class="section-head"><h2>Parade-ready checklist</h2></div>
          <div class="card">
            <div class="ready-top">
              <div class="ready-ring" id="readyRing" style="--p:${pct}"><span><span id="readyPct">${pct}%<small>ready</small></span></span></div>
              <p class="muted" style="margin:0;font-size:14.5px" id="readyMsg">${readyMessage(done)}</p>
            </div>
            <div style="margin-top:10px">
              ${D.checklist.map((c) => `
                <label class="check">
                  <input type="checkbox" data-check="${c.id}" ${isChecked(c.id) ? "checked" : ""} ${c.id === "dues" ? "disabled" : ""} />
                  <span class="box" aria-hidden="true"></span>
                  <span><b>${esc(c.label)}</b><small>${c.id === "dues" && !state.duesPaid ? `<a href="#dues">Pay dues now →</a>` : esc(c.note)}</small></span>
                </label>`).join("")}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head"><h2>Live float tracker</h2><span class="tag pink">Demo</span></div>
          <div class="card">
            <svg id="routeMap" class="route" viewBox="0 0 360 230" role="img" aria-label="Map of the Bayshore parade route with the float's position"></svg>
            <div class="tracker-status"><span class="live-dot" id="liveDot"></span><span id="trackText">Tracking starts when the parade rolls. Tap below to preview.</span></div>
            <button class="btn btn-glow btn-block" data-action="track">▶ Preview live tracking</button>
          </div>
        </section>

        <section class="section">
          <div class="section-head"><h2>Rides to staging</h2></div>
          <div class="card" style="display:flex;gap:12px;align-items:center">
            <div style="font-size:30px">🚗</div>
            <div style="flex:1"><b>Need a ride or have seats?</b><p class="muted" style="margin:2px 0 0;font-size:14px">Road closures start at 9 AM. Carpool with the herd.</p></div>
            <button class="btn btn-ghost btn-sm" data-go="chat/rides">Open</button>
          </div>
        </section>

        <section class="section">
          <div class="section-head"><h2>Safety &amp; help</h2></div>
          <div class="card">
            ${D.emergency.map((c) => `<div class="contact"><span>${esc(c.label)}</span><button class="btn btn-ghost btn-sm" data-action="call" data-id="${esc(c.phone)}">📞 ${esc(c.phone)}</button></div>`).join("")}
            <p class="tiny" style="margin:10px 0 0">Lost and found meeting point: the first-aid wagon behind Float #27.</p>
            <button class="btn sos" data-action="sos">🆘 I need help on the route</button>
          </div>
        </section>

        <p class="about"><a href="../parades.html">Full parade guide on the krewe website →</a></p>
      </div>`;
    },

    me() {
      const going = Object.values(state.rsvp).filter((r) => r.status === "going").length;
      const hours = 14 + Object.keys(state.shifts).length * 2;
      return `
      <div>
        ${memberCardHTML()}
        <p class="tiny" style="text-align:center;margin:8px 0 0">Tap your card to show the check-in code</p>

        <div class="stat-grid section">
          <div class="stat"><b>${state.sparkles.toLocaleString()}</b><small>Sparkles</small></div>
          <div class="stat"><b>${going}</b><small>RSVPs</small></div>
          <div class="stat"><b>${hours}</b><small>Service hrs</small></div>
        </div>

        <section class="section card" style="padding:4px 14px">
          ${listBtn("💳", "Season dues", state.duesPaid ? "Paid for 2026–2027. Thank you!" : `$${D.me.duesAmount} due before the Enchanted Ball`, "open-dues", state.duesPaid ? `<span class="tag green">Paid</span>` : `<span class="tag gold">Due</span>`)}
          ${listBtn("🏆", "The Sparkle Cup", `Rank #${rankOf()} · badges and leaderboard`, "open-cup")}
          ${listBtn("📅", "My RSVPs", `${going} event${going === 1 ? "" : "s"} you are going to`, "go", "", "events/mine")}
          ${listBtn("💬", "Krewe Chat", "Channels and direct messages", "go", "", "herd")}
        </section>

        <section class="section">
          <div class="section-head"><h2>Settings</h2></div>
          <div class="card" style="padding:4px 14px">
            ${toggleRow("🌙", "Dark mode", "Midnight violet theme", "theme", state.theme === "dark")}
            ${toggleRow("🔔", "Notifications", "Event reminders and krewe news", "notif", state.notifOn)}
            ${listBtn("🧪", "Send a test alert", "See how a krewe alert looks on your phone", "test-notif")}
            ${listBtn("📲", "Add to home screen", "Install the app on this phone", "install")}
            ${listBtn("🌐", "Krewe website", "Visit kreweofunicorns (demo site)", "link", "", "../index.html")}
            ${listBtn("↺", "Reset demo", "Clear RSVPs, chats and checklist", "reset")}
            ${listBtn("🚪", "Sign out", "Return to the welcome screen", "signout")}
          </div>
        </section>

        <div class="about">
          <img src="icons/icon-192.png" alt="" />
          <b>Krewe of Unicorns · Member App</b><br />
          Version 1.0 · A Krewe &amp; Kin sample app for demonstration.<br />
          The Krewe of Unicorns and all members shown are fictional.
        </div>
      </div>`;
    }
  };

  /* ---------------- view pieces ---------------- */
  function quick(icon, label, action, arg = "") {
    const attr = action === "go" ? `data-go="${arg}"` : `data-action="${action}" data-id="${arg}"`;
    return `<button ${attr}><span class="qi" aria-hidden="true">${icon}</span>${label}</button>`;
  }

  function rsvpTag(ev) {
    const s = state.rsvp[ev.id]?.status;
    if (s === "going") return `<span class="tag green">Going</span>`;
    if (s === "maybe") return `<span class="tag gold">Maybe</span>`;
    return "";
  }

  function dateBlock(d) {
    return `<div class="date-block"><small>${d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</small><b>${d.getDate()}</b></div>`;
  }

  function nextCard(ev) {
    const d = eventDate(ev);
    const going = state.rsvp[ev.id]?.status === "going";
    return `
      <div class="card next-card">
        ${dateBlock(d)}
        <div class="info" data-action="open-event" data-id="${ev.id}" style="cursor:pointer">
          <h3>${esc(ev.name)}</h3>
          <p>${fmtDay(d)} · ${fmtTime(d)}</p>
          <p>📍 ${esc(ev.location.split(",")[0])}</p>
        </div>
        <button class="btn ${going ? "btn-ok" : "btn-gold"} btn-sm" data-action="quick-rsvp" data-id="${ev.id}">${going ? "✓ Going" : "RSVP"}</button>
      </div>`;
  }

  function postCard(a) {
    const m = memberById(a.from);
    const on = !!state.reactions[a.id];
    return `
      <article class="card post">
        <div class="post-head">${avatar(m, "sm")}<div><b>${esc(fullName(m))}</b><small>${esc(m.role)} · ${ago(baseTime(a.minutesAgo))}</small></div></div>
        <div class="post-body"><h3>${esc(a.title)}</h3><p>${esc(a.body)}</p></div>
        ${a.img ? `<img src="${img(a.img)}" alt="" loading="lazy" />` : ""}
        <div class="post-foot">
          <button class="react ${on ? "on" : ""}" data-action="react" data-id="${a.id}" aria-pressed="${on}">✨ ${a.sparkles + (on ? 1 : 0)}</button>
          <button class="react" data-go="chat/announce">💬 Discuss</button>
        </div>
      </article>`;
  }

  function eventCard(ev) {
    const d = eventDate(ev);
    return `
      <article class="card event-card" data-action="open-event" data-id="${ev.id}" tabindex="0" role="button" aria-label="${esc(ev.name)}">
        <div class="event-img" style="background-image:url('${img(ev.img)}')">
          <span class="tag">${esc(ev.type)}</span>
          <span class="rsvp-flag">${rsvpTag(ev)}</span>
        </div>
        <div class="event-body">
          ${dateBlock(d)}
          <div class="info">
            <h3>${esc(ev.name)}</h3>
            <p>${fmtDay(d)} · ${fmtTime(d)}</p>
            <p>📍 ${esc(ev.location.split(",")[0])} · ${goingCount(ev)} going</p>
          </div>
        </div>
      </article>`;
  }

  function lastMessage(channelId) {
    const all = messagesFor(channelId);
    return all[all.length - 1];
  }

  function messagesFor(channelId) {
    const base = (D.messages[channelId] || []).map((m) => ({ from: m.from, at: baseTime(m.minutesAgo), text: m.text }));
    return base.concat(state.chat[channelId] || []).sort((a, b) => a.at - b.at);
  }

  function chatListHTML() {
    const row = (id, icon, name, sub, iconHTML) => {
      const last = lastMessage(id);
      const who = last ? (last.from === "me" ? "You" : memberById(last.from).first) : "";
      const unread = state.unread[id] || 0;
      return `
        <button class="channel" data-go="chat/${id}">
          ${iconHTML || `<span class="ci" aria-hidden="true">${icon}</span>`}
          <span class="info"><b>${esc(name)}</b><p>${last ? `${esc(who)}: ${esc(last.text)}` : esc(sub)}</p></span>
          <span class="meta">${last ? ago(last.at) : ""}${unread ? `<span class="unread">${unread}</span>` : ""}</span>
        </button>`;
    };
    const channels = D.channels.map((c) => row(c.id, c.icon, c.name, c.desc)).join("");
    const dms = state.dms.map((id) => {
      const m = memberById(id);
      return row("dm-" + id, "", fullName(m), "Direct message", avatar(m));
    }).join("");
    return `
      ${channels}
      <div class="section-head section"><h2>Direct messages</h2><button class="link-btn" data-go="herd/directory">+ New</button></div>
      ${dms || `<p class="muted" style="font-size:14px;margin:0">Open the Directory and tap “Message” on any member to start a private chat.</p>`}`;
  }

  let dirFilter = "All";
  let dirQuery = "";
  function directoryHTML() {
    const subkrewes = [...new Set(D.members.map((m) => m.subkrewe))];
    const chips = ["All", "Officers", ...subkrewes];
    return `
      <div class="search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.41 1.4-5.4-5.39A8 8 0 1 1 10 2Zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"/></svg>
        <input id="dirSearch" type="search" placeholder="Search ${D.members.length} members" value="${esc(dirQuery)}" aria-label="Search members" />
      </div>
      <div class="chips" role="group" aria-label="Filter members">
        ${chips.map((c) => `<button class="chip ${c === dirFilter ? "on" : ""}" data-action="dir-filter" data-id="${esc(c)}">${esc(c)}</button>`).join("")}
      </div>
      <div id="dirList" style="margin-top:8px">${directoryRows()}</div>`;
  }
  function directoryRows() {
    const q = dirQuery.trim().toLowerCase();
    const rows = D.members.filter((m) => {
      if (dirFilter === "Officers" && !isOfficer(m)) return false;
      if (!["All", "Officers"].includes(dirFilter) && m.subkrewe !== dirFilter) return false;
      return !q || `${fullName(m)} ${m.role} ${m.subkrewe}`.toLowerCase().includes(q);
    });
    if (!rows.length) return `<div class="empty"><div class="big">🔍</div><p>No unicorns match that search.</p></div>`;
    return rows.map((m) => `
      <button class="person" data-action="open-member" data-id="${m.id}">
        ${avatar(m)}
        <span class="info"><b>${esc(fullName(m))}</b><small>${esc(m.role)} · ${esc(m.subkrewe)}</small></span>
        ${isOfficer(m) ? `<span class="tag violet">Officer</span>` : ""}
      </button>`).join("");
  }

  function memberCardHTML() {
    return `
      <div class="member-card" data-action="open-card" role="button" tabindex="0" aria-label="Show my membership check-in code">
        <div class="mc-top">
          <div><div class="mc-krewe">Krewe of Unicorns</div><small style="color:#e9dcff">${D.krewe.city} · Est. ${D.krewe.founded}</small></div>
          <img src="icons/icon-192.png" alt="" />
        </div>
        <div class="mc-name">${esc(D.me.first)} ${esc(D.me.last)}</div>
        <div class="mc-row">
          <span>Member no.<b>${D.me.memberNo}</b></span>
          <span>Season<b>2026–2027</b></span>
          <span>Status<b>${state.duesPaid ? "Active ✓" : "Dues due"}</b></span>
        </div>
        <div class="rainbow-line"></div>
      </div>`;
  }

  function listBtn(icon, title, sub, action, right = "", arg = "") {
    const attr = action === "go" ? `data-go="${arg}"` : `data-action="${action}" data-id="${arg}"`;
    return `<button class="list-btn" ${attr}><span class="li" aria-hidden="true">${icon}</span><span class="info"><b>${title}</b><small>${sub}</small></span>${right || `<span class="chev" aria-hidden="true">›</span>`}</button>`;
  }
  function toggleRow(icon, title, sub, id, on) {
    return `<label class="list-btn"><span class="li" aria-hidden="true">${icon}</span><span class="info"><b>${title}</b><small>${sub}</small></span><span class="switch"><input type="checkbox" data-toggle="${id}" ${on ? "checked" : ""} /><i></i></span></label>`;
  }

  function rankOf() {
    const board = D.leaderboard.map((r) => ({ ...r, points: r.id === "me" ? state.sparkles : r.points })).sort((a, b) => b.points - a.points);
    return board.findIndex((r) => r.id === "me") + 1;
  }

  function isChecked(id) {
    return id === "dues" ? state.duesPaid : !!state.checklist[id];
  }
  function readyMessage(done) {
    const left = D.checklist.length - done;
    return left === 0 ? "You are 100% parade ready. See you on Bayshore! 🌈" : `${left} thing${left === 1 ? "" : "s"} left before you roll. Tap each item as you finish it.`;
  }

  /* ---------------- chat screen ---------------- */
  function channelInfo(id) {
    if (id.startsWith("dm-")) {
      const m = memberById(id.slice(3));
      return m ? { id, name: fullName(m), desc: m.role, member: m } : null;
    }
    return D.channels.find((c) => c.id === id);
  }

  function renderChat(id) {
    const ch = channelInfo(id);
    if (!ch) { location.hash = "#herd"; return; }
    state.unread[id] = 0;
    save();
    $("#app").classList.add("chat-mode");
    document.querySelectorAll(".tabbar button").forEach((b) => b.classList.toggle("on", b.dataset.go === "herd"));
    $("#topTitle").textContent = ch.name;
    $("#topEyebrow").textContent = ch.member ? "Direct message" : "Krewe Chat";
    const view = $("#view");
    view.classList.add("no-tabbar");
    view.innerHTML = `
      <div>
        <div class="chat-head">
          <button class="icon-btn sm" data-go="herd" aria-label="Back to chats">‹</button>
          ${ch.member ? avatar(ch.member, "sm") : `<span class="ci" style="font-size:24px" aria-hidden="true">${ch.icon}</span>`}
          <div><b>${esc(ch.name)}</b><small>${esc(ch.desc)}</small></div>
        </div>
        <div class="msgs" id="msgs">${messagesFor(id).map(msgHTML).join("")}</div>
        <div class="typing" id="typing" aria-live="polite"></div>
      </div>
      ${ch.readOnly
        ? `<div class="readonly-note">📣 Only officers can post here. Reply in <a href="#chat/general">General Herd</a>.</div>`
        : `<form class="composer" id="composer" data-id="${id}">
             <input id="composerInput" type="text" placeholder="Message ${esc(ch.member ? ch.member.first : ch.name)}…" aria-label="Message" autocomplete="off" enterkeyhint="send" />
             <button class="btn btn-glow" type="submit" aria-label="Send">➤</button>
           </form>`}`;
    scrollChat();
    updateBadges();
  }

  function msgHTML(m) {
    if (m.from === "me") {
      return `<div class="msg mine"><div><div class="bubble">${esc(m.text)}</div><time>${ago(m.at)}</time></div></div>`;
    }
    const who = memberById(m.from);
    return `<div class="msg">${avatar(who, "sm")}<div><div class="bubble"><small>${esc(who.first)} · ${esc(who.role)}</small>${esc(m.text)}</div><time>${ago(m.at)}</time></div></div>`;
  }
  function scrollChat() { requestAnimationFrame(() => window.scrollTo(0, document.body.scrollHeight)); }

  function sendMessage(channelId, text) {
    (state.chat[channelId] = state.chat[channelId] || []).push({ from: "me", at: Date.now(), text });
    save();
    appendIfViewing(channelId, { from: "me", at: Date.now(), text });

    // A friendly auto-reply so the demo feels alive.
    const pool = channelId.startsWith("dm-")
      ? [channelId.slice(3)]
      : [...new Set((D.messages[channelId] || []).map((m) => m.from))];
    const replier = pool[Math.floor(Math.random() * pool.length)] || "m-luna";
    const typing = $("#typing");
    setTimeout(() => { if (typing && isViewing(channelId)) typing.textContent = `${memberById(replier).first} is typing…`; }, 700);
    setTimeout(() => {
      const reply = { from: replier, at: Date.now(), text: D.replies[Math.floor(Math.random() * D.replies.length)] };
      state.chat[channelId].push(reply);
      if (!isViewing(channelId)) state.unread[channelId] = (state.unread[channelId] || 0) + 1;
      save();
      const t = $("#typing"); if (t) t.textContent = "";
      appendIfViewing(channelId, reply);
      updateBadges();
    }, 2200);
  }
  const isViewing = (channelId) => location.hash === "#chat/" + channelId;
  function appendIfViewing(channelId, m) {
    if (!isViewing(channelId)) return;
    $("#msgs").insertAdjacentHTML("beforeend", msgHTML(m));
    scrollChat();
  }

  function updateBadges() {
    const total = Object.values(state.unread).reduce((a, b) => a + b, 0);
    const badge = $("#chatBadge");
    badge.hidden = total === 0;
    badge.textContent = total;
    $("#notifDot").hidden = state.notifRead;
  }

  /* ---------------- sheets (pop-up panels) ---------------- */
  function openSheet(title, html) {
    const wrap = $("#sheetWrap");
    if (wrap.hidden) history.pushState({ sheet: true }, "", location.hash);
    $("#sheetTitle").textContent = title;
    $("#sheetBody").innerHTML = html;
    $("#sheetBody").scrollTop = 0;
    wrap.hidden = false;
    document.body.style.overflow = "hidden";
    $("#sheet").focus?.();
  }
  function hideSheet() {
    $("#sheetWrap").hidden = true;
    document.body.style.overflow = "";
  }
  function closeSheet() {
    if (history.state && history.state.sheet) history.back(); else hideSheet();
  }
  window.addEventListener("popstate", () => { if (!$("#sheetWrap").hidden) hideSheet(); });

  function openEvent(id) {
    const ev = D.events.find((e) => e.id === id);
    if (!ev) return;
    const d = eventDate(ev), end = eventDate(ev, "end");
    const r = state.rsvp[id] || { status: null, guests: 0 };
    const btn = (status, label) => `<button class="btn ${r.status === status ? (status === "no" ? "btn-ghost" : "btn-ok") : "btn-ghost"}" data-action="rsvp" data-id="${id}" data-status="${status}" aria-pressed="${r.status === status}">${r.status === status ? "✓ " : ""}${label}</button>`;
    openSheet(ev.name, `
      <div class="detail-hero" style="background-image:url('${img(ev.img)}')"></div>
      <p style="margin:0 0 12px"><span class="tag violet">${esc(ev.type)}</span> ${rsvpTag(ev)}</p>
      <div class="facts">
        <div class="fact"><span class="fi">🗓️</span><span><b>${fmtLong(d)}</b><small>${fmtTime(d)} to ${fmtTime(end)}</small></span></div>
        <div class="fact"><span class="fi">📍</span><span><b>${esc(ev.location.split(",")[0])}</b><small>${esc(ev.location.split(",").slice(1).join(",").trim())} · <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}" target="_blank" rel="noopener">Directions</a></small></span></div>
        <div class="fact"><span class="fi">🦄</span><span><b>${goingCount(ev)} unicorns going</b><small>Members can bring guests</small></span></div>
      </div>
      <p class="muted" style="margin:0 0 16px">${esc(ev.desc)}</p>

      <h3 style="font-size:15px;margin:0 0 10px">Are you coming?</h3>
      <div class="btn-row">${btn("going", "Going")}${btn("maybe", "Maybe")}${btn("no", "Can't go")}</div>
      ${r.status === "going" ? `
        <div class="guests" style="margin-top:14px">
          <span class="muted" style="flex:1">Guests you are bringing</span>
          <button data-action="guests" data-id="${id}" data-step="-1" aria-label="Fewer guests">−</button>
          <b>${r.guests || 0}</b>
          <button data-action="guests" data-id="${id}" data-step="1" aria-label="More guests">+</button>
        </div>` : ""}

      <div class="btn-row" style="margin-top:14px">
        <button class="btn btn-ghost btn-sm" data-action="ics" data-id="${id}">📆 Add to calendar</button>
        <button class="btn btn-ghost btn-sm" data-action="share-event" data-id="${id}">💌 Invite a friend</button>
      </div>

      ${ev.shifts.length ? `
        <h3 style="font-size:15px;margin:22px 0 4px">Volunteer shifts</h3>
        ${ev.shifts.map((s) => {
          const mine = !!state.shifts[s.id];
          const open = s.open - (mine ? 1 : 0);
          return `<div class="shift"><span>${esc(s.label)}<small>${mine ? "You are signed up 🎉" : open > 0 ? `${open} spot${open === 1 ? "" : "s"} open` : "Full, join the waitlist"}</small></span>
            <button class="btn ${mine ? "btn-ok" : "btn-gold"} btn-sm" data-action="shift" data-id="${s.id}" data-event="${id}">${mine ? "✓ Signed up" : open > 0 ? "Sign up" : "Waitlist"}</button></div>`;
        }).join("")}` : ""}
    `);
  }

  function openMember(id) {
    const m = memberById(id);
    const i = D.members.indexOf(m);
    openSheet("Member profile", `
      <div class="profile-top">
        ${avatar(m, "lg")}
        <h3>${esc(fullName(m))}</h3>
        <p>${esc(m.role)} · ${esc(m.subkrewe)}</p>
        <p class="tiny">In the herd since ${m.since}</p>
      </div>
      <div class="card" style="margin-bottom:14px"><b>✨ Fun fact</b><p class="muted" style="margin:4px 0 0">${esc(m.fact)}</p></div>
      <div class="btn-row">
        <button class="btn btn-glow" data-action="dm" data-id="${m.id}">💬 Message</button>
        <button class="btn btn-ghost" data-action="call" data-id="555-01${String(10 + i).padStart(2, "0")}">📞 Call</button>
      </div>
      <p class="tiny" style="text-align:center;margin-top:14px">Members choose what contact details the herd can see.</p>
    `);
  }

  function openNotifs() {
    const html = D.notifications.map((n) => `
      <button class="notif ${state.notifRead ? "" : "unread"}" data-go="${n.go}">
        <span class="ni" aria-hidden="true">${n.icon}</span>
        <span><p>${esc(n.text)}</p><small>${ago(baseTime(n.minutesAgo))}</small></span>
      </button>`).join("");
    openSheet("Notifications", html);
    state.notifRead = true;
    save();
    updateBadges();
  }

  function openCard() {
    let qrSVG = "";
    try {
      const qr = qrcode(0, "M");
      qr.addData(`KOU-MEMBER|${D.me.memberNo}|${D.me.first} ${D.me.last}|2026-2027`);
      qr.make();
      qrSVG = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true, alt: "Membership check-in code" });
    } catch (e) { qrSVG = "<p>Code unavailable</p>"; }
    openSheet("Check-in code", `
      ${memberCardHTML().replace(/ data-action="open-card" role="button" tabindex="0"/, "")}
      <div class="qr-wrap" style="margin-top:18px">${qrSVG}</div>
      <p class="muted" style="text-align:center;margin:12px 0 0">Show this code at the door for events, the Enchanted Ball and parade check-in.</p>
      <p class="tiny" style="text-align:center">Turn your screen brightness up for faster scanning.</p>
    `);
  }

  function openDues() {
    if (state.duesPaid) {
      openSheet("Season dues", `
        <div class="dues-box"><div style="font-size:48px">🎉</div><div class="amt">Paid</div><p class="muted">2026–2027 season dues of $${D.me.duesAmount} received. Thank you for keeping the magic rolling!</p></div>
        ${duesHistory(true)}`);
      return;
    }
    openSheet("Season dues", `
      <div class="dues-box">
        <span class="tag gold">Due before the Enchanted Ball</span>
        <div class="amt">$${D.me.duesAmount}</div>
        <p class="muted" style="margin:0">2026–2027 Full Membership: ball ticket, parade spot, krewe beads and your cape.</p>
      </div>
      <div class="pay-methods" role="radiogroup" aria-label="Payment method">
        <label class="pay-method"><input type="radio" name="pay" checked /> 💳 <span>Visa ending in 4242 <small class="tiny">(demo card)</small></span></label>
        <label class="pay-method"><input type="radio" name="pay" /> 📱 <span>Google Pay</span></label>
        <label class="pay-method"><input type="radio" name="pay" /> 🏦 <span>Bank transfer</span></label>
      </div>
      <button class="btn btn-gold btn-block" data-action="pay" id="payBtn">Pay $${D.me.duesAmount} now</button>
      <p class="tiny" style="text-align:center;margin-top:10px">Demo only: no money moves and no card details are collected.</p>
      ${duesHistory(false)}`);
  }
  function duesHistory(includeThisSeason) {
    const rows = (includeThisSeason ? [{ season: "2026–2027", amount: D.me.duesAmount, paid: "Paid today" }] : []).concat(D.duesHistory);
    return `<h3 style="font-size:15px;margin:22px 0 4px">Payment history</h3>` +
      rows.map((r) => `<div class="hist"><span>${r.season}<br /><small class="tiny">${r.paid}</small></span><b>$${r.amount}</b></div>`).join("");
  }

  function openCup() {
    const board = D.leaderboard.map((r) => ({ ...r, points: r.id === "me" ? state.sparkles : r.points })).sort((a, b) => b.points - a.points);
    const medal = ["🥇", "🥈", "🥉"];
    openSheet("The Sparkle Cup", `
      <p class="muted" style="margin:0 0 12px">Earn Sparkles for showing up, volunteering and helping the herd. The top unicorn is crowned at the Enchanted Ball.</p>
      <div class="card" style="padding:6px 14px">
        ${board.map((r, i) => {
          const m = memberById(r.id);
          return `<div class="lb-row ${r.id === "me" ? "me-row" : ""}"><span class="rank">${medal[i] || i + 1}</span>${avatar(m, "sm")}<span class="info"><b>${r.id === "me" ? "You" : esc(fullName(m))}</b></span><b>${r.points.toLocaleString()}</b></div>`;
        }).join("")}
      </div>
      <h3 style="font-size:15px;margin:20px 0 10px">Your badges</h3>
      <div class="badges">
        ${D.badges.map((b) => `<div class="badge ${b.earned ? "" : "locked"}"><div class="bi">${b.icon}</div><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`).join("")}
      </div>
      <h3 style="font-size:15px;margin:20px 0 6px">How to earn</h3>
      <p class="muted" style="margin:0;font-size:14px">RSVP “Going” +25 · Volunteer shift +50 · Pay dues +50 · Share a photo +10</p>`);
  }

  function openGallery() {
    openSheet("Krewe photos", `<div class="badges" style="grid-template-columns:repeat(2,1fr)">
      ${D.gallery.map((p) => `<button style="border:0;padding:0;background:none;cursor:pointer" data-action="open-photo" data-id="${p}" aria-label="Open photo"><img src="${img(p)}" alt="Krewe of Unicorns members at a parade" loading="lazy" style="border-radius:14px;aspect-ratio:1;object-fit:cover;width:100%" /></button>`).join("")}
    </div>`);
  }
  function openPhoto(p) {
    openSheet("Photo", `<img class="photo-full" src="${img(p)}" alt="Krewe of Unicorns members at a parade" />
      <div class="btn-row" style="margin-top:12px"><button class="btn btn-ghost" data-action="react-photo">✨ Sparkle it</button><button class="btn btn-ghost" data-action="share-app">💌 Share</button></div>`);
  }

  /* ---------------- parade route map + tracker ---------------- */
  const ROUTE_PATH = "M28 196 C 70 184, 92 150, 128 140 S 196 124, 222 96 S 282 52, 330 36";
  const WAYPOINTS = [[0, "Staging at Rome Avenue"], [0.25, "Passing Howard Avenue"], [0.5, "At the reviewing stand"], [0.75, "Passing Bayshore & Platt Street"], [0.95, "Arriving downtown at the finish"]];
  function drawRoute() {
    const svg = $("#routeMap");
    if (!svg) return;
    svg.innerHTML = `
      <path d="M0 230 L0 150 C 60 170, 120 190, 170 175 S 280 120, 360 110 L360 230 Z" fill="rgba(34,211,238,.28)"/>
      <text x="250" y="200" fill="rgba(255,255,255,.55)" font-size="12" font-style="italic" font-family="Plus Jakarta Sans, sans-serif">Hillsborough Bay</text>
      <path d="${ROUTE_PATH}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="12" stroke-linecap="round"/>
      <path id="routeLine" d="${ROUTE_PATH}" fill="none" stroke="url(#rb)" stroke-width="7" stroke-linecap="round"/>
      <defs><linearGradient id="rb" x1="0" x2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset=".3" stop-color="#ffe066"/><stop offset=".55" stop-color="#5eead4"/><stop offset=".8" stop-color="#8b5cf6"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs>
      <g font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="700" fill="#fff">
        <circle cx="28" cy="196" r="6" fill="#34d399" stroke="#fff" stroke-width="2"/><text x="18" y="178">Start</text>
        <circle cx="330" cy="36" r="6" fill="#ec4899" stroke="#fff" stroke-width="2"/><text x="290" y="22">Finish</text>
        <text x="150" y="118" transform="rotate(-14 150 118)">Bayshore Blvd</text>
        <rect x="186" y="136" width="10" height="10" rx="2" fill="#f5c542"/><text x="200" y="146">Reviewing stand</text>
      </g>
      <g id="floatDot" transform="translate(28 196)">
        <circle r="13" fill="rgba(245,197,66,.35)"/><circle r="8" fill="#f5c542" stroke="#fff" stroke-width="2"/>
        <text y="4" text-anchor="middle" font-size="9">🦄</text>
      </g>`;
  }
  function startTracking(btn) {
    const line = $("#routeLine"), dot = $("#floatDot"), text = $("#trackText");
    if (!line) return;
    $("#liveDot").classList.add("on");
    btn.textContent = "● Live (demo)";
    btn.disabled = true;
    const total = line.getTotalLength();
    const start = performance.now(), duration = 24000;
    cancelAnimationFrame(rafId);
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const p = line.getPointAtLength(t * total);
      dot.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      const wp = WAYPOINTS.filter((w) => t >= w[0]).pop();
      text.textContent = `Float #27 · ${wp[1]} · ${(2.6 * (1 - t)).toFixed(1)} miles to go`;
      if (t < 1) rafId = requestAnimationFrame(step);
      else { text.textContent = "Float #27 has finished the route. What a ride! 🌈"; $("#liveDot").classList.remove("on"); btn.disabled = false; btn.textContent = "↺ Replay tracking"; }
    };
    rafId = requestAnimationFrame(step);
  }

  /* ---------------- countdown ---------------- */
  function tick() {
    document.querySelectorAll("[data-countdown]").forEach((el) => {
      let s = Math.max(0, Math.floor((Number(el.dataset.countdown) - Date.now()) / 1000));
      const d = Math.floor(s / 86400); s -= d * 86400;
      const h = Math.floor(s / 3600); s -= h * 3600;
      const m = Math.floor(s / 60); s -= m * 60;
      const set = (u, v) => { const b = el.querySelector(`[data-u="${u}"]`); if (b) b.textContent = String(v).padStart(u === "d" ? 1 : 2, "0"); };
      set("d", d); set("h", h); set("m", m); set("s", s);
    });
  }
  setInterval(tick, 1000);

  /* ---------------- calendar file (.ics) ---------------- */
  function downloadICS(id) {
    const ev = D.events.find((e) => e.id === id);
    const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Krewe of Unicorns//Member App Demo//EN", "BEGIN:VEVENT",
      `UID:${id}-${eventDate(ev).getTime()}@kreweofunicorns.example`,
      `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(eventDate(ev))}`, `DTEND:${stamp(eventDate(ev, "end"))}`,
      `SUMMARY:${ev.name} (Krewe of Unicorns)`, `LOCATION:${ev.location.replace(/,/g, "\\,")}`,
      `DESCRIPTION:${ev.desc.replace(/,/g, "\\,")}`, "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `${id}-krewe-of-unicorns.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("Calendar file saved. Open it to add the event 📆");
  }

  async function share(title, text) {
    const url = new URL("index.html", location.href).href;
    try {
      if (navigator.share) { await navigator.share({ title, text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast("Invite link copied 💌");
    } catch (e) { /* the member cancelled the share sheet */ }
  }

  /* ---------------- confetti ---------------- */
  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = $("#confetti"), ctx = c.getContext("2d");
    c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const colors = ["#ff6b6b", "#ffb84d", "#ffe066", "#5eead4", "#4cc9f0", "#8b5cf6", "#ec4899", "#f5c542"];
    const bits = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2, y: innerHeight * 0.45, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 13 - 4,
      r: Math.random() * 6 + 3, c: colors[Math.floor(Math.random() * colors.length)], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3
    }));
    const t0 = performance.now();
    const frame = (now) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      bits.forEach((b) => { b.vy += 0.35; b.x += b.vx; b.y += b.vy; b.a += b.va; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.fillStyle = b.c; ctx.fillRect(-b.r / 2, -b.r / 2, b.r, b.r * 1.6); ctx.restore(); });
      if (now - t0 < 2600) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    requestAnimationFrame(frame);
  }

  /* ---------------- notifications ---------------- */
  async function sendTestNotification() {
    const title = "🦄 Krewe of Unicorns";
    const body = "Float Build Saturday starts at 9 AM at the Unicorn Den. Coffee and glitter are waiting!";
    if (!("Notification" in window)) return toast("This browser cannot show notifications");
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted") return toast("Notifications are blocked in your phone settings");
    state.notifOn = true; save();
    try {
      const reg = await navigator.serviceWorker?.ready;
      if (reg) reg.showNotification(title, { body, icon: "icons/icon-192.png", badge: "icons/badge-96.png", tag: "kou-test", data: { url: "./index.html#events" } });
      else new Notification(title, { body, icon: "icons/icon-192.png" });
      toast("Test alert sent 🔔");
    } catch (e) { toast("Could not show the alert on this device"); }
  }

  /* ---------------- install to home screen ---------------- */
  let installEvent = null;
  const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installEvent = e;
    if (!state.installDismissed && !isStandalone()) $("#installBar").hidden = false;
  });
  window.addEventListener("appinstalled", () => { $("#installBar").hidden = true; toast("Installed! Find the unicorn on your home screen 🦄"); });
  async function install() {
    if (isStandalone()) return toast("You are already using the installed app ✨");
    if (installEvent) {
      installEvent.prompt();
      await installEvent.userChoice;
      installEvent = null;
      $("#installBar").hidden = true;
      return;
    }
    openSheet("Add to home screen", `
      <p class="muted" style="margin-top:0">On an Android phone using Chrome:</p>
      <ol style="padding-left:20px;line-height:1.8">
        <li>Tap the <b>⋮ menu</b> (three dots) in the top-right corner.</li>
        <li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li>
        <li>Tap <b>Install</b>. The unicorn icon appears on your home screen.</li>
      </ol>
      <p class="muted">On an iPhone using Safari: tap the <b>Share</b> button, then <b>Add to Home Screen</b>.</p>`);
  }

  /* ---------------- login ---------------- */
  function showLogin() {
    $("#app").hidden = true;
    $("#login").hidden = false;
  }
  $("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.signedIn = true;
    save();
    $("#login").hidden = true;
    $("#app").hidden = false;
    location.hash = "#home";
    route();
    setTimeout(() => toast(`Welcome back, ${D.me.first}! 🦄`), 300);
  });

  /* ---------------- one click handler for the whole app ---------------- */
  document.addEventListener("click", (e) => {
    const goEl = e.target.closest("[data-go]");
    if (goEl) {
      e.preventDefault();
      if (!$("#sheetWrap").hidden) hideSheet();
      const target = "#" + goEl.dataset.go;
      if (location.hash === target) route(); else location.hash = target;
      return;
    }
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const { action, id } = el.dataset;
    const ACTIONS = {
      "close-sheet": closeSheet,
      "open-notifs": openNotifs,
      "open-event": () => openEvent(id),
      "open-member": () => openMember(id),
      "open-card": openCard,
      "open-dues": openDues,
      "open-cup": openCup,
      "open-gallery": openGallery,
      "open-photo": () => openPhoto(id),
      "link": () => { location.href = id; },
      "quick-rsvp": () => {
        const going = state.rsvp[id]?.status === "going";
        setRsvp(id, going ? null : "going");
        refreshBehindSheet();
      },
      "rsvp": () => {
        const current = state.rsvp[id]?.status;
        setRsvp(id, current === el.dataset.status ? null : el.dataset.status);
        openEvent(id); refreshBehindSheet();
      },
      "guests": () => {
        const r = state.rsvp[id];
        r.guests = Math.max(0, Math.min(4, (r.guests || 0) + Number(el.dataset.step)));
        save(); openEvent(id); refreshBehindSheet();
      },
      "shift": () => {
        if (state.shifts[id]) { delete state.shifts[id]; save(); toast("Removed from shift"); }
        else { state.shifts[id] = true; addSparkles(50, "for volunteering"); confetti(); }
        openEvent(el.dataset.event); refreshBehindSheet();
      },
      "ics": () => downloadICS(id),
      "share-event": () => {
        const ev = D.events.find((x) => x.id === id);
        share(ev.name, `Come with me to ${ev.name} with the Krewe of Unicorns on ${fmtDay(eventDate(ev))}! 🦄`);
      },
      "share-app": () => share("Krewe of Unicorns", "Check out the Krewe of Unicorns member app 🦄"),
      "react": () => { state.reactions[id] = !state.reactions[id]; save(); refreshBehindSheet(); },
      "react-photo": () => { toast("✨ Sparkled!"); },
      "dir-filter": () => { dirFilter = id; $("#view").querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.dataset.id === id)); $("#dirList").innerHTML = directoryRows(); },
      "dm": () => {
        if (!state.dms.includes(id)) state.dms.unshift(id);
        save(); hideSheet(); location.hash = "#chat/dm-" + id;
      },
      "call": () => toast(`Calling ${id} is turned off in this demo 📞`),
      "sos": () => {
        openSheet("Help is on the way", `<div class="dues-box"><div style="font-size:48px">🆘</div>
          <p>In a live app, this sends your location to the parade marshal and the first-aid wagon.</p>
          <p class="muted"><b>For a real emergency, always call 911.</b></p></div>
          <button class="btn btn-ghost btn-block" data-action="close-sheet">Close (demo)</button>`);
      },
      "track": () => startTracking(el),
      "pay": () => {
        el.disabled = true;
        el.textContent = "Processing…";
        setTimeout(() => {
          state.duesPaid = true;
          save();
          confetti();
          addSparkles(50, "for paying dues");
          openDues();
          refreshBehindSheet();
        }, 1300);
      },
      "test-notif": sendTestNotification,
      "install": install,
      "dismiss-install": () => { state.installDismissed = true; save(); $("#installBar").hidden = true; },
      "reset": () => {
        if (!confirm("Reset the demo? Your RSVPs, chats and checklist will be cleared.")) return;
        state = Object.assign(defaults(), { signedIn: true, theme: state.theme });
        save(); applyTheme(); location.hash = "#home"; route(); toast("Demo reset ✨");
      },
      "signout": () => { state.signedIn = false; save(); showLogin(); }
    };
    if (ACTIONS[action]) { e.preventDefault(); ACTIONS[action](); }
  });

  // Keyboard: Enter or Space on card-like elements.
  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches('[role="button"][data-action]')) { e.preventDefault(); e.target.click(); }
    if (e.key === "Escape" && !$("#sheetWrap").hidden) closeSheet();
  });

  function setRsvp(id, status) {
    const prev = state.rsvp[id]?.status;
    if (!status) { delete state.rsvp[id]; save(); toast("RSVP removed"); return; }
    state.rsvp[id] = { status, guests: state.rsvp[id]?.guests || 0 };
    save();
    if (status === "going" && prev !== "going") { addSparkles(25, "for RSVPing"); confetti(); }
    else if (status === "maybe") toast("Marked as maybe");
    else if (status === "no") toast("Thanks for letting the herd know");
  }

  // Re-render the tab behind an open sheet, without touching the sheet.
  function refreshBehindSheet() {
    const hash = (location.hash || "#home").slice(1);
    const [page, arg] = hash.split("/");
    if (TITLES[page]) { const y = scrollY; $("#view").innerHTML = VIEWS[page](arg); if (page === "parade") drawRoute(); tick(); scrollTo(0, y); }
  }

  document.addEventListener("change", (e) => {
    const check = e.target.dataset.check;
    if (check) {
      state.checklist[check] = e.target.checked;
      save();
      const done = D.checklist.filter((c) => isChecked(c.id)).length;
      const pct = Math.round((done / D.checklist.length) * 100);
      $("#readyRing").style.setProperty("--p", pct);
      $("#readyPct").innerHTML = `${pct}%<small>ready</small>`;
      $("#readyMsg").textContent = readyMessage(done);
      if (pct === 100) confetti();
    }
    const toggle = e.target.dataset.toggle;
    if (toggle === "theme") { state.theme = e.target.checked ? "dark" : "light"; save(); applyTheme(); }
    if (toggle === "notif") {
      if (e.target.checked) sendTestNotification().then(() => { e.target.checked = state.notifOn; });
      else { state.notifOn = false; save(); toast("Notifications off"); }
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.id === "dirSearch") { dirQuery = e.target.value; $("#dirList").innerHTML = directoryRows(); }
  });

  document.addEventListener("submit", (e) => {
    if (e.target.id !== "composer") return;
    e.preventDefault();
    const input = $("#composerInput");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendMessage(e.target.dataset.id, text);
  });

  /* ---------------- theme, online status, start-up ---------------- */
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    document.querySelector('meta[name="theme-color"]').content = state.theme === "light" ? "#f6efff" : "#1a0638";
  }
  function updateOnline() { $("#offline").hidden = navigator.onLine; }
  window.addEventListener("online", updateOnline);
  window.addEventListener("offline", updateOnline);
  window.addEventListener("hashchange", route);

  applyTheme();
  updateOnline();
  const me = meAsMember();
  $("#topAvatar").outerHTML = avatar(me, "sm");
  if (state.signedIn) { $("#app").hidden = false; route(); } else showLogin();

  // The service worker makes the app installable and lets it open offline.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
