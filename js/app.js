/* =========================================================
   js/app.js
   Al logik: wizard-flow, state, preview, output (PNG/PDF/email/share)
========================================================= */

(function(){
  "use strict";
  const $ = (id) => document.getElementById(id);

  /* =========================================================
     AFSNIT 01 – DOM refs
  ========================================================= */
  const langSelect = $("langSelect");
  const typeSelect = $("typeSelect");
  const occasionWrap = $("occasionWrap");
  const occasionInput = $("occasionInput");

  const themeLight = $("themeLight");
  const themeDark  = $("themeDark");

  const toStep2 = $("toStep2");
  const toStep3 = $("toStep3");

  const designStrip  = $("designStrip");
  const designChosen = $("designChosen");

  const fromInput = $("fromInput");
  const toInput   = $("toInput");
  const suggestSelect = $("suggestSelect");
  const messageInput  = $("messageInput");
  const charCount     = $("charCount");

  const previewBadge   = $("previewBadge");
  const previewStamp   = $("previewStamp");
  const previewTo      = $("previewTo");
  const previewFrom    = $("previewFrom");
  const previewMessage = $("previewMessage");
  const cardPreview    = $("cardPreview");

  const progressBar = $("progressBar");
  const statusChip  = $("statusChip");

  const btnBack  = $("btnBack");
  const btnPng   = $("btnPng");
  const btnPdf   = $("btnPdf");
  const btnMail  = $("btnMail");
  const btnShare = $("btnShare");

  const btnRandom = $("btnRandom");
  const btnReset  = $("btnReset");

  const btnHelp = $("btnHelp");
  const helpModal = $("helpModal");
  const btnCloseHelp = $("btnCloseHelp");
  const helpList = $("helpList");

  const stepBlocks = Array.from(document.querySelectorAll(".card.block"));

  /* =========================================================
     AFSNIT 02 – Data guard
  ========================================================= */
  function dataOk(){
    return window.CARD_DATA && window.CARD_DATA.labels && window.CARD_DATA.languages;
  }

 /* =========================================================
   AFSNIT 03 – State + storage
========================================================= */
const STORAGE_KEY = "kisbye_julekort_state_v2";

const state = {
  lang: "da",
  theme: "dark",
  type: "xmas",
  occasion: "",
  designId: null,
  from: "",
  to: "",

  // NYT: messageMode styrer om vi må auto-skifte tekst ved sprogskift
  // "suggestion" = appen må automatisk skifte tekst når sprog/type ændres
  // "custom"     = brugeren har skrevet selv, så vi må ikke overskrive
  message: "",
  messageMode: "suggestion",

  step: 1
};

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return;
    const s = JSON.parse(raw);
    Object.assign(state, s || {});
  }catch(e){}
}

function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
}

function setMessage(txt, mode){
  state.message = txt || "";
  state.messageMode = mode || "suggestion";
  if(messageInput) messageInput.value = state.message;
  saveState();
  refreshPreviewText();
}

  /* =========================================================
     AFSNIT 04 – i18n helpers
  ========================================================= */
  function t(){
    const labels = window.CARD_DATA.labels || {};
    return labels[state.lang] || labels.da || {};
  }

  function typeLabel(){
    const types = (t().types || {});
    // data.js kan have enten key-navne eller id'er — vi håndterer begge
    return types[state.type] || state.type;
  }

  /* =========================================================
     AFSNIT 05 – Init selects
  ========================================================= */
  function initLanguageSelect(){
    langSelect.innerHTML = "";
    (window.CARD_DATA.languages || []).forEach(l => {
      const opt = document.createElement("option");
      opt.value = l.code;
      opt.textContent = l.name;
      langSelect.appendChild(opt);
    });
    langSelect.value = state.lang;
  }

  function initTypeSelect(){
    const labels = (t().types || {});
    typeSelect.innerHTML = "";
    (window.CARD_DATA.types || []).forEach(tp => {
      const opt = document.createElement("option");
      opt.value = tp.id;
      opt.textContent = labels[tp.key] || labels[tp.id] || tp.id;
      typeSelect.appendChild(opt);
    });
    typeSelect.value = state.type;
  }

  /* =========================================================
     AFSNIT 06 – Theme + tekster
  ========================================================= */
  function applyTheme(){
    // Sæt på både html og body (så theme.css virker uanset selector)
    document.documentElement.setAttribute("data-theme", state.theme);
    document.body && document.body.setAttribute("data-theme", state.theme);

    themeLight && themeLight.classList.toggle("active", state.theme === "light");
    themeDark  && themeDark.classList.toggle("active",  state.theme === "dark");
  }

  function applyTexts(){
    // Tjek at ids findes før vi skriver
    const L = t();

    const set = (id, txt) => {
      const el = $(id);
      if(el) el.textContent = txt;
    };

    set("subtitle", L.subtitle || "");
    set("wizardTitle", L.wizardTitle || "Opsætning");
    set("previewTitle", L.previewTitle || "Live preview");

    set("layer1Title", L.layer1Title || "Lag 1");
    set("layer2Title", L.layer2Title || "Lag 2");
    set("layer3Title", L.layer3Title || "Lag 3");

    set("lblLang", L.lang || "Sprog");
    set("lblTheme", L.theme || "Tema");
    set("lblType", L.type || "Korttype");
    set("lblOccasion", L.occasion || "Anledning");
    set("lblFrom", L.from || "Fra");
    set("lblTo", L.to || "Til");
    set("lblSuggestions", L.suggestions || "Forslag");
    set("lblMessage", L.message || "Din tekst");

    set("btnNext1", L.next1 || "Vælg design");
    set("btnNext2", L.next2 || "Skriv teksten");
    set("designHint", L.designHint || "Swipe/scroll – klik for at vælge");

    // help
    if(helpList){
      helpList.innerHTML = "";
      (L.help || []).forEach(line=>{
        const li = document.createElement("li");
        li.textContent = line;
        helpList.appendChild(li);
      });
    }

    initTypeSelect();
    refreshOccasionVisibility();
    refreshSuggestions();
    refreshStatus();
  }

 function isSpecialType(){
  // Robust: virker uanset om data.js bruger id "special" eller key "special"
  if(state.type === "special") return true;

  const types = (window.CARD_DATA.types || []);
  const tp = types.find(x => x.id === state.type);
  if(!tp) return false;

  return tp.key === "special" || tp.id === "special";
}

function refreshOccasionVisibility(){
  const show = isSpecialType();
  if(occasionWrap) occasionWrap.hidden = !show;

  // Hvis vi ikke er special: nulstil feltet (så det ikke “blander sig”)
  if(!show){
    state.occasion = "";
    if(occasionInput) occasionInput.value = "";
    saveState();
  }
}


  /* =========================================================
     AFSNIT 07 – Wizard (kun ét lag ad gangen)
  ========================================================= */
  function setStep(step){
    state.step = step;
    saveState();

    stepBlocks.forEach(block => {
      const s = parseInt(block.dataset.step, 10);
      block.classList.toggle("active", s === step);
    });

    if(btnBack) btnBack.disabled = (step === 1);

    refreshProgress();
    refreshStatus();
  }

  function refreshProgress(){
    if(!progressBar) return;
    const pct = ((state.step - 1) / 2) * 100; // 1..3
    progressBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  }

  function refreshStatus(){
    if(!statusChip) return;
    const L = t();
    if(state.step === 1) statusChip.textContent = L.status1 || "Vælg Lag 1";
    if(state.step === 2) statusChip.textContent = L.status2 || "Vælg design";
    if(state.step === 3) statusChip.textContent = L.status3 || "Skriv tekst";
  }

  /* =========================================================
     AFSNIT 08 – Designs
  ========================================================= */
  function buildDesignTiles(){
    if(!designStrip) return;
    designStrip.innerHTML = "";

    (window.CARD_DATA.designs || []).forEach(d => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "design-tile";
      tile.dataset.id = d.id;

      tile.style.background = `
        radial-gradient(220px 140px at 20% 20%, rgba(255,255,255,0.16), transparent 55%),
        linear-gradient(135deg, ${d.a}, ${d.b})
      `;

      const name = document.createElement("div");
      name.className = "name";
      name.textContent = d.name;

      const icon = document.createElement("div");
      icon.className = "icon";
      icon.textContent = d.icon;

      tile.appendChild(name);
      tile.appendChild(icon);

      tile.addEventListener("click", () => {
        selectDesign(d.id);
        setStep(3);
      });

      designStrip.appendChild(tile);
    });

    markActiveDesign();
  }

  function selectDesign(id){
    state.designId = id;
    saveState();
    markActiveDesign();
    applyDesignToPreview();
    if(toStep3) toStep3.disabled = false;
    refreshActionbarEnabled();
  }

  function markActiveDesign(){
    if(designStrip){
      const tiles = [...designStrip.querySelectorAll(".design-tile")];
      tiles.forEach(tl => tl.classList.toggle("active", tl.dataset.id === state.designId));
    }

    const L = t();
    if(!state.designId){
      if(designChosen) designChosen.textContent = L.chosenNone || "Intet valgt";
      if(toStep3) toStep3.disabled = true;
    } else {
      const d = (window.CARD_DATA.designs || []).find(x=>x.id===state.designId);
      if(designChosen) designChosen.textContent = d ? d.name : state.designId;
      if(toStep3) toStep3.disabled = false;
    }
  }

  function applyDesignToPreview(){
    const designs = (window.CARD_DATA.designs || []);
    const d = designs.find(x=>x.id===state.designId) || designs[0];
    if(!d) return;

    document.documentElement.style.setProperty("--cardA", d.a);
    document.documentElement.style.setProperty("--cardB", d.b);
    document.documentElement.style.setProperty("--cardC", d.c);

    if(previewStamp) previewStamp.textContent = d.icon;

    const inner = cardPreview ? cardPreview.querySelector(".card-inner") : null;
    if(inner){
      inner.style.backgroundImage = `linear-gradient(135deg, var(--cardA), var(--cardB))`;
    }
  }

  /* =========================================================
   AFSNIT 09 – Suggestions + Preview
========================================================= */
function currentOccasionToken(){
  const occ = (state.occasion || "").trim();
  if(occ.length) return occ;

  // Placeholder pr. sprog når feltet er tomt
  const placeholders = {
    da: "[ skriv anledning ]",
    en: "[ write occasion ]",
    de: "[ Anlass eingeben ]",
    pl: "[ wpisz okazję ]",
    lt: "[ įrašyk progą ]"
  };

  return placeholders[state.lang] || "[ write occasion ]";
}


function buildSuggestions(){
  const pack =
    (window.CARD_DATA.suggestions || {})[state.lang] ||
    (window.CARD_DATA.suggestions || {}).da ||
    {};

  const list = pack[state.type] || [];

  // Kun “special” bruger {occasion}, men det er ok at replace altid
  const occ = currentOccasionToken();
  return list.map(s => String(s).replaceAll("{occasion}", occ));
}

function refreshSuggestions(){
  if(!suggestSelect) return;

  const list = buildSuggestions();
  suggestSelect.innerHTML = "";

  list.forEach((txt, idx) => {
    const opt = document.createElement("option");
    opt.value = String(idx);
    opt.textContent = txt;
    suggestSelect.appendChild(opt);
  });

  // NYT: Hvis teksten er "suggestion", så følger den automatisk sprog/type/anledning
  if(state.messageMode !== "custom"){
    const first = list[0] || "";
    suggestSelect.value = "0";
    setMessage(first, "suggestion");
    return;
  }

  // Hvis brugeren har custom tekst, så rør vi ikke ved den
  refreshPreviewText();
}

function randomSuggestion(){
  const list = buildSuggestions();
  if(!list.length) return;
  const pick = list[Math.floor(Math.random() * list.length)];
  // NYT: random er også en "suggestion"
  setMessage(pick, "suggestion");
}

function refreshPreviewText(){
  if(previewBadge) previewBadge.textContent = typeLabel();

  const L = t();
  const to = (state.to || "").trim();
  const from = (state.from || "").trim();
  const msg = (state.message || "").trim();

  if(previewTo) previewTo.textContent = to ? `${L.to || "Til"}: ${to}` : `${L.to || "Til"}: …`;
  if(previewFrom) previewFrom.textContent = from ? `${L.from || "Fra"}: ${from}` : `${L.from || "Fra"}: …`;

  if(previewMessage){
    if(msg) previewMessage.textContent = msg;
    else previewMessage.textContent = state.designId
      ? (L.writeYourText || "Skriv din tekst…")
      : (L.pickDesignFirst || "Vælg et design og skriv din tekst…");
  }

  if(charCount && messageInput) charCount.textContent = String((messageInput.value || "").length);

  refreshActionbarEnabled();
}

  /* =========================================================
     AFSNIT 10 – Output (PNG / PDF / Email / Share)
  ========================================================= */
  function getActiveDesign(){
    const designs = (window.CARD_DATA.designs || []);
    return designs.find(x=>x.id===state.designId) || designs[0];
  }

  function fontStack(){
    return "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  }

  function roundRect(ctx, x,y,w,h,r){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y);
    ctx.arcTo(x+w,y,x+w,y+h,rr);
    ctx.arcTo(x+w,y+h,x,y+h,rr);
    ctx.arcTo(x,y+h,x,y,rr);
    ctx.arcTo(x,y,x+w,y,rr);
    ctx.closePath();
  }

  function drawWrapped(ctx, text, x, y, maxWidth, maxHeight, fontSize){
    const words = (text || "").split(/\s+/).filter(Boolean);
    if(!words.length) return;

    ctx.font = `${fontSize}px ${fontStack()}`;
    const lineH = Math.floor(fontSize * 1.18);

    let line = "";
    let yy = y;

    for(let i=0;i<words.length;i++){
      const test = line ? (line + " " + words[i]) : words[i];
      if(ctx.measureText(test).width <= maxWidth){
        line = test;
      }else{
        ctx.fillText(line, x, yy);
        yy += lineH;
        line = words[i];
        if(yy > y + maxHeight) break;
      }
    }
    if(yy <= y + maxHeight) ctx.fillText(line, x, yy);
  }

  function renderCardToCanvas(scale=2){
    const d = getActiveDesign();
    const W = 1080 * scale;
    const H = 1350 * scale;

    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");

    // background
    const a = d?.a || "#1b2b66";
    const b = d?.b || "#6a4cff";
    const c3 = d?.c || "#1b2b66";

    const g = ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0, a);
    g.addColorStop(0.55, b);
    g.addColorStop(1, c3);
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // border
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 6*scale;
    roundRect(ctx, 40*scale, 40*scale, W-80*scale, H-80*scale, 54*scale);
    ctx.stroke();

    // badge + stamp
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 3*scale;

    const badge = typeLabel();
    ctx.font = `${36*scale}px ${fontStack()}`;
    const badgeW = ctx.measureText(badge).width + 46*scale;
    roundRect(ctx, 70*scale, 80*scale, badgeW, 64*scale, 999*scale);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(badge, 92*scale, 124*scale);

    ctx.font = `${64*scale}px ${fontStack()}`;
    ctx.fillText(d?.icon || "✨", W - 150*scale, 132*scale);

    const L = t();
    const toLine = (state.to||"").trim() ? `${L.to || "Til"}: ${(state.to||"").trim()}` : `${L.to || "Til"}: …`;
    const fromLine = (state.from||"").trim() ? `${L.from || "Fra"}: ${(state.from||"").trim()}` : `${L.from || "Fra"}: …`;
    const msg = (state.message||"").trim() || "";

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `${44*scale}px ${fontStack()}`;
    ctx.fillText(toLine, 90*scale, 260*scale);

    ctx.fillStyle = "rgba(255,255,255,0.96)";
    drawWrapped(ctx, msg, 90*scale, 360*scale, W-180*scale, 740*scale, 72*scale);

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `${44*scale}px ${fontStack()}`;
    ctx.fillText(fromLine, 90*scale, H - 170*scale);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `${30*scale}px ${fontStack()}`;
    ctx.fillText("kisbye.eu", W - 210*scale, H - 95*scale);

    return c;
  }

  async function downloadPNG(){
    const canvas = renderCardToCanvas(2);
    canvas.toBlob((blob)=>{
      if(!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kisbye-kort.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  function printAsPDF(){
    window.print();
  }

  function sendEmail(){
    const subj = `${typeLabel()}`.trim();
    const L = t();
    const body = [
      `${typeLabel()}`,
      "",
      `${L.to || "Til"}: ${(state.to||"").trim() || "…"}`,
      `${L.from || "Fra"}: ${(state.from||"").trim() || "…"}`,
      "",
      (state.message||"").trim()
    ].join("\n");
    window.location.href = `mailto:?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  }

  async function shareCard(){
    const text = (state.message||"").trim();
    const title = typeLabel();

    const canvas = renderCardToCanvas(2);
    const blob = await new Promise(res => canvas.toBlob(res, "image/png"));

    try{
      if(blob && navigator.canShare && navigator.canShare({ files: [new File([blob], "kort.png", {type:"image/png"})] })){
        const file = new File([blob], "kisbye-kort.png", { type:"image/png" });
        await navigator.share({ title, text, files:[file] });
      } else if(navigator.share){
        await navigator.share({ title, text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Din tekst er kopieret – del den hvor du vil.");
      }
    }catch(e){}
  }

/* =========================================================
   AFSNIT 11 – Events / bruger-interaktion (FIX)
========================================================= */

/* ---------- Sprog ---------- */
langSelect.addEventListener("change", () => {
  state.lang = langSelect.value;
  saveState();

  applyTexts();          // opdater labels/overskrifter + genbyg korttype-tekster
  refreshSuggestions();  // opdater forslag + evt. auto-tekst
});

/* ---------- Tema (Light / Dark) ---------- */
themeLight.addEventListener("click", () => {
  state.theme = "light";
  saveState();
  applyTheme();
});

themeDark.addEventListener("click", () => {
  state.theme = "dark";
  saveState();
  applyTheme();
});

/* ---------- Korttype ---------- */
typeSelect.addEventListener("change", () => {
  state.type = typeSelect.value;
  saveState();

  refreshOccasionVisibility();
  refreshSuggestions();        // opdater tekst hvis ikke custom
  refreshPreviewText();
});

/* ---------- Anledning (kun special) ---------- */
if (occasionInput) {
  occasionInput.addEventListener("input", () => {
    state.occasion = occasionInput.value;
    saveState();

    // påvirker forslag/tekst hvis messageMode != custom
    refreshSuggestions();
    refreshPreviewText();
  });
}

/* ---------- Vælg design (knap Lag1 → Lag2) ---------- */
if (toStep2) {
  toStep2.addEventListener("click", () => setStep(2));
}

/* ---------- Skriv teksten (knap Lag2 → Lag3) ---------- */
if (toStep3) {
  toStep3.addEventListener("click", () => setStep(3));
}

/* VIGTIGT:
   INGEN ekstra click-handler på designStrip her.
   Dine design-knapper får allerede deres click i buildDesignTiles()
   (den kalder selectDesign(id) + setStep(3))
*/

/* ---------- Forslag (dropdown) ---------- */
suggestSelect.addEventListener("change", () => {
  const idx = parseInt(suggestSelect.value, 10);
  const list = buildSuggestions();
  const picked = list[idx] || list[0] || "";
  setMessage(picked, "suggestion");
});

/* ---------- Ny variant (tilfældigt forslag) ---------- */
btnRandom.addEventListener("click", () => {
  randomSuggestion();
});

/* ---------- Nulstil ---------- */
btnReset.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

/* ---------- Fri tekst (brugeren skriver selv) ---------- */
messageInput.addEventListener("input", () => {
  state.message = messageInput.value;
  state.messageMode = "custom"; // overskrives ikke ved sprogskift
  saveState();
  refreshPreviewText();
});

/* ---------- Fra / Til ---------- */
fromInput.addEventListener("input", () => {
  state.from = fromInput.value;
  saveState();
  refreshPreviewText();
});

toInput.addEventListener("input", () => {
  state.to = toInput.value;
  saveState();
  refreshPreviewText();
});

/* ---------- Navigation (Tilbage) ---------- */
btnBack.addEventListener("click", () => {
  setStep(Math.max(1, state.step - 1));
});

/* ---------- Output ---------- */
btnPng.addEventListener("click", downloadPNG);
btnPdf.addEventListener("click", printAsPDF);
btnMail.addEventListener("click", sendEmail);
btnShare.addEventListener("click", shareCard);

/* ---------- Hjælp modal ---------- */
btnHelp.addEventListener("click", () => {
  helpModal.hidden = false;
});

btnCloseHelp.addEventListener("click", () => {
  helpModal.hidden = true;
});

helpModal.addEventListener("click", (e) => {
  if(e.target.classList.contains("modal-backdrop")) helpModal.hidden = true;
});


  /* =========================================================
     AFSNIT 12 – Restore UI + Boot
  ========================================================= */
  function restoreUI(){
    langSelect.value = state.lang;
    typeSelect.value = state.type;

    if(occasionInput) occasionInput.value = state.occasion || "";
    refreshOccasionVisibility();

    fromInput.value = state.from || "";
    toInput.value = state.to || "";
    messageInput.value = state.message || "";

    applyTheme();
    applyTexts();
    buildDesignTiles();

    if(state.designId){
      if(toStep3) toStep3.disabled = false;
      applyDesignToPreview();
    } else {
      if(toStep3) toStep3.disabled = true;
    }

    refreshPreviewText();
    refreshProgress();
    refreshStatus();
  }

  function boot(){
    if(!dataOk()){
      console.error("CARD_DATA mangler. Tjek js/data.js");
      return;
    }
    loadState();
    initLanguageSelect();
    applyTheme();
    bindEvents();
    restoreUI();

    // Grund-version: start altid i lag 1
    setStep(1);
  }

  boot();

})();
