/* =========================================================
   js/app.js
   Al logik: wizard-flow, state, preview, output (PNG/PDF/email/share)
   - Ingen frameworks
   - Matcher 1:1 js/data.js (languages/types/labels/designs/suggestions)
========================================================= */

(function(){
  "use strict";

  /* =========================================================
     AFSNIT 00 – Utils
  ========================================================= */
  const $ = (id) => document.getElementById(id);

 /* =========================================================
   AFSNIT 01 – DOM refs (matcher index.html)
========================================================= */
const langSelect    = $("langSelect");
const typeSelect    = $("typeSelect");
const occasionWrap  = $("occasionWrap");
const occasionInput = $("occasionInput");

const themeLight = $("themeLight");
const themeDark  = $("themeDark");

const toStep2 = $("toStep2");
const toStep3 = $("toStep3");

const designStrip  = $("designStrip");
const designChosen = $("designChosen");

const fromInput    = $("fromInput");
const toInput      = $("toInput");
const suggestSelect = $("suggestSelect");
const messageInput  = $("messageInput");
const charCount     = $("charCount");

const previewBadge   = $("previewBadge");
const previewStamp   = $("previewStamp");
const previewTo      = $("previewTo");
const previewFrom    = $("previewFrom");
const previewMessage = $("previewMessage");
const cardPreview    = $("cardPreview");
const previewMode    = $("previewMode");

const progressBar = $("progressBar");
const statusChip  = $("statusChip");

/* ✅ NYT: der kan være 1 eller flere noter i layoutet */
const exportNotes = Array.from(document.querySelectorAll(".small-note"));

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
     AFSNIT 02 – Data guard (HÅRD validering)
  ========================================================= */
  function dataOk(){
    const D = window.CARD_DATA;
    return !!(
      D &&
      Array.isArray(D.languages) &&
      Array.isArray(D.types) &&
      Array.isArray(D.designs) &&
      D.labels &&
      D.suggestions
    );
  }

  /* =========================================================
     AFSNIT 03 – State + storage
  ========================================================= */
  const STORAGE_KEY = "kisbye_kort_state_v3";

  const state = {
    lang: "da",
    theme: "dark",
    type: "xmas",
    occasion: "",
    designId: null,
    from: "",
    to: "",
    message: "",
    messageMode: "suggestion", // "suggestion" | "custom"
    step: 1
  };

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return;
      const s = JSON.parse(raw);
      if(s && typeof s === "object") Object.assign(state, s);
    }catch(e){}
  }

  function saveState(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
  }

  function setMessage(txt, mode){
    state.message = String(txt || "");
    state.messageMode = mode === "custom" ? "custom" : "suggestion";
    if(messageInput) messageInput.value = state.message;
    saveState();
    refreshPreviewText();
  }

  /* =========================================================
     AFSNIT 04 – i18n helpers (matcher data.js)
  ========================================================= */
  function t(){
    const labels = window.CARD_DATA.labels || {};
    return labels[state.lang] || labels.da || {};
  }

  function typeLabel(){
    const types = (t().types || {});
    return types[state.type] || state.type;
  }

  function isSpecialType(){
    return state.type === "special";
  }

  function currentOccasionToken(){
    const occ = (state.occasion || "").trim();
    if(occ) return occ;

    const placeholders = {
      da: "[ skriv anledning ]",
      en: "[ write occasion ]",
      de: "[ Anlass eingeben ]",
      pl: "[ wpisz okazję ]",
      lt: "[ įrašyk progą ]"
    };
    return placeholders[state.lang] || "[ write occasion ]";
  }

  /* =========================================================
     AFSNIT 05 – Init selects
  ========================================================= */
  function initLanguageSelect(){
    if(!langSelect) return;

    langSelect.innerHTML = "";
    (window.CARD_DATA.languages || []).forEach((l) => {
      const opt = document.createElement("option");
      opt.value = l.code;
      opt.textContent = l.name;
      langSelect.appendChild(opt);
    });

    // hvis state.lang ikke findes i listen, fallback til da
    const exists = (window.CARD_DATA.languages || []).some(x => x.code === state.lang);
    if(!exists) state.lang = "da";

    langSelect.value = state.lang;
  }

  function initTypeSelect(){
    if(!typeSelect) return;

    const typesArr = (window.CARD_DATA.types || []);
    const labels = (t().types || {});

    typeSelect.innerHTML = "";
    typesArr.forEach((tp) => {
      const opt = document.createElement("option");
      opt.value = tp.id;
      opt.textContent = labels[tp.id] || labels[tp.key] || tp.id;
      typeSelect.appendChild(opt);
    });

    // hvis state.type ikke findes, fallback til xmas
    const exists = typesArr.some(x => x.id === state.type);
    if(!exists) state.type = "xmas";

    typeSelect.value = state.type;
  }

 /* =========================================================
   AFSNIT 06 – Theme + UI tekster
========================================================= */
function applyTheme(){
  document.documentElement.setAttribute("data-theme", state.theme);
  if(document.body) document.body.setAttribute("data-theme", state.theme);

  if(themeLight) themeLight.classList.toggle("active", state.theme === "light");
  if(themeDark)  themeDark.classList.toggle("active",  state.theme === "dark");
}

function applyTexts(){
  const L = t();

  const setText = (id, txt) => {
    const el = $(id);
    if(el) el.textContent = (txt != null ? String(txt) : "");
  };

  setText("subtitle",     L.subtitle || "");
  setText("wizardTitle",  L.wizardTitle || "Opsætning");
  setText("previewTitle", L.previewTitle || "Live preview");

  setText("layer1Title",  L.layer1Title || "Lag 1");
  setText("layer2Title",  L.layer2Title || "Lag 2");
  setText("layer3Title",  L.layer3Title || "Lag 3");

  setText("lblLang",        L.lang || "Sprog");
  setText("lblTheme",       L.theme || "Tema");
  setText("lblType",        L.type || "Korttype");
  setText("lblOccasion",    L.occasion || "Anledning");
  setText("lblFrom",        L.from || "Fra");
  setText("lblTo",          L.to || "Til");
  setText("lblSuggestions", L.suggestions || "Forslag");
  setText("lblMessage",     L.message || "Din tekst");

  setText("btnNext1",   L.next1 || "Vælg design");
  setText("btnNext2",   L.next2 || "Skriv teksten");
  setText("designHint", L.designHint || "Swipe/scroll – klik for at vælge.");

  /* ✅ NYT: oversæt den lille note under kortet */
  if(exportNotes && exportNotes.length){
    const fallback = {
      da: "PNG/PDF genereres ud fra samme layout.",
      en: "PNG/PDF are generated from the same layout.",
      de: "PNG/PDF werden aus demselben Layout erzeugt.",
      pl: "PNG/PDF są generowane z tego samego układu.",
      lt: "PNG/PDF generuojami iš to paties maketo."
    };
    const txt = L.exportNote || fallback[state.lang] || fallback.en;
    exportNotes.forEach(el => { el.textContent = txt; });
  }

  // help
  if(helpList){
    helpList.innerHTML = "";
    (L.help || []).forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      helpList.appendChild(li);
    });
  }

  // re-init type labels når sprog ændres
  initTypeSelect();

  // status + chosen chip
  refreshStatus();
  refreshDesignChosenLabel();
}


  /* =========================================================
     AFSNIT 07 – Special / Anledning visibility
  ========================================================= */
  function refreshOccasionVisibility(){
    const show = isSpecialType();
    if(occasionWrap) occasionWrap.hidden = !show;

    if(!show){
      // må ikke påvirke andre typer
      state.occasion = "";
      if(occasionInput) occasionInput.value = "";
      saveState();
    }
  }

  /* =========================================================
     AFSNIT 08 – Wizard / setStep
  ========================================================= */
  function setStep(step){
    const s = Math.max(1, Math.min(3, parseInt(step, 10) || 1));
    state.step = s;
    saveState();

    stepBlocks.forEach((el) => {
      const n = parseInt(el.getAttribute("data-step"), 10);
      el.classList.toggle("active", n === s);
    });

    if(progressBar){
      const pct = (s === 1 ? 33 : (s === 2 ? 66 : 100));
      progressBar.style.width = pct + "%";
    }

    if(btnBack) btnBack.hidden = (s <= 1);

    refreshStatus();

    // vigtig: lag 3 skal altid have forslag fyldt
    if(s === 3) refreshSuggestions();
    refreshPreviewText();
  }

  function refreshStatus(){
    const L = t();
    if(statusChip){
      statusChip.textContent =
        (state.step === 1 ? (L.status1 || "Vælg Lag 1") :
         state.step === 2 ? (L.status2 || "Vælg design") :
                            (L.status3 || "Skriv tekst"));
    }

    if(previewMode){
      previewMode.textContent = (state.messageMode === "custom" ? "Din tekst" : "Forslag");
    }
  }

 /* =========================================================
   AFSNIT 09 – Suggestions + Preview (MED design-hooks)
========================================================= */
function currentOccasionToken(){
  const occ = (state.occasion || "").trim();
  if(occ.length) return occ;

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
  const S = window.CARD_DATA.suggestions || {};
  const langBlock = S[state.lang] || S.da || {};
  const list = langBlock[state.type] || [];

  return list.map(s =>
    String(s || "").replaceAll("{occasion}", currentOccasionToken())
  );
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

  // Regelsæt:
  // suggestion → auto-skift
  // custom → behold tekst
  if(state.messageMode !== "custom"){
    const first = list[0] || "";
    suggestSelect.value = "0";
    setMessage(first, "suggestion");
    return;
  }

  refreshPreviewText();
}

function randomSuggestion(){
  const list = buildSuggestions();
  if(!list.length) return;
  const pick = list[Math.floor(Math.random() * list.length)];
  setMessage(pick, "suggestion");
}

function refreshPreviewText(){
  // === DESIGN-HOOKS TIL CSS ===
  if(cardPreview){
    cardPreview.dataset.type   = state.type || "";
    cardPreview.dataset.design = state.designId || "";
  }

  // Badge = korttype
  if(previewBadge) previewBadge.textContent = typeLabel();

  const L = t();
  const to   = (state.to || "").trim();
  const from = (state.from || "").trim();
  const msg  = (state.message || "").trim();

  if(previewTo){
    previewTo.textContent = `${L.to || "Til"}: ${to || "…"}`;
  }
  if(previewFrom){
    previewFrom.textContent = `${L.from || "Fra"}: ${from || "…"}`;
  }

  if(previewMessage){
    if(msg){
      previewMessage.textContent = msg;
    }else{
      previewMessage.textContent = state.designId
        ? (L.writeYourText || "Skriv din tekst…")
        : (L.pickDesignFirst || "Vælg et design og skriv din tekst…");
    }
  }

  if(charCount && messageInput){
    charCount.textContent = String(messageInput.value.length);
  }

  refreshStatus();
  refreshActionbarEnabled();
}


  /* =========================================================
   AFSNIT 10 – Design tiles + apply (MED design-hooks)
========================================================= */
function getDesignById(id){
  const designs = window.CARD_DATA.designs || [];
  return designs.find(d => d.id === id) || null;
}

function refreshDesignChosenLabel(){
  if(!designChosen) return;
  if(!state.designId){
    designChosen.textContent = "Intet valgt";
    return;
  }
  const d = getDesignById(state.designId);
  designChosen.textContent = d ? d.name : state.designId;
}

function buildDesignTiles(){
  if(!designStrip) return;

  const designs = window.CARD_DATA.designs || [];
  designStrip.innerHTML = "";

  designs.forEach(d => {
    const tile = document.createElement("div");
    tile.className = "design-tile";
    tile.dataset.id = d.id;

    tile.style.backgroundImage =
      `linear-gradient(135deg, ${d.a}, ${d.b}, ${d.c || d.a})`;

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = d.name;

    const icon = document.createElement("div");
    icon.className = "icon";
    icon.textContent = d.icon || "✨";

    tile.appendChild(name);
    tile.appendChild(icon);

    if(state.designId === d.id){
      tile.classList.add("active");
    }

    designStrip.appendChild(tile);
  });

  refreshDesignChosenLabel();
}

function applyDesignToPreview(){
  if(!cardPreview) return;

  const d = getDesignById(state.designId);
  if(!d) return;

  // === CSS DESIGN-VARIABLER ===
  cardPreview.style.setProperty("--cardA", d.a);
  cardPreview.style.setProperty("--cardB", d.b);

  // === DATA ATTRIBUTES (bruges af CSS overlays) ===
  cardPreview.dataset.type   = state.type || "";
  cardPreview.dataset.design = state.designId || "";

  if(previewStamp){
    previewStamp.textContent = d.icon || "✨";
  }

  refreshDesignChosenLabel();
  refreshActionbarEnabled();
}

  /* =========================================================
     AFSNIT 11 – Actionbar enable/disable
  ========================================================= */
  function refreshActionbarEnabled(){
    const ready = !!state.designId && ((state.message || "").trim().length > 0);
    [btnPng, btnPdf, btnMail, btnShare].forEach((btn) => {
      if(btn) btn.disabled = !ready;
    });
  }

/* =========================================================
   AFSNIT 12 – Output (PNG / PDF / Email / Share)
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
  const toLine   = (state.to||"").trim()   ? `${L.to || "Til"}: ${(state.to||"").trim()}`   : `${L.to || "Til"}: …`;
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

/* PDF: åbn print-side med KUN kortet */
function printAsPDF(){
  const canvas = renderCardToCanvas(2);
  const dataUrl = canvas.toDataURL("image/png");

  const w = window.open("", "_blank");
  if(!w) return;

  w.document.open();
  w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>kisbye-kort</title>
  <style>
    @page { margin: 0; }
    html, body { height: 100%; margin: 0; }
    body {
      display: grid;
      place-items: center;
      background: #000;
    }
    img{
      width: min(100vw, 820px);
      height: auto;
      box-shadow: 0 30px 80px rgba(0,0,0,0.55);
    }
    @media print{
      body{ background: #fff; }
      img{ width: 100vw; max-width: none; box-shadow:none; }
    }
  </style>
</head>
<body>
  <img src="${dataUrl}" alt="kort">
  <script>
    window.onload = () => {
      window.focus();
      window.print();
      setTimeout(()=>window.close(), 200);
    };
  </script>
</body>
</html>`);
  w.document.close();
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
     AFSNIT 13 – Events
  ========================================================= */
  function bindEvents(){
    // Sprog
    if(langSelect){
      langSelect.addEventListener("change", () => {
        state.lang = langSelect.value;
        saveState();

        applyTexts();
        refreshOccasionVisibility();

        // suggestion-mode: tekst følger sprog/type
        if(state.messageMode !== "custom"){
          refreshSuggestions();
        }

        refreshPreviewText();
      });
    }

    // Tema
    if(themeLight){
      themeLight.addEventListener("click", () => {
        state.theme = "light";
        saveState();
        applyTheme();
      });
    }
    if(themeDark){
      themeDark.addEventListener("click", () => {
        state.theme = "dark";
        saveState();
        applyTheme();
      });
    }

    // Korttype
    if(typeSelect){
      typeSelect.addEventListener("change", () => {
        state.type = typeSelect.value;
        saveState();

        refreshOccasionVisibility();

        if(state.messageMode !== "custom"){
          refreshSuggestions();
        }

        refreshPreviewText();
      });
    }

    // Anledning (kun special)
    if(occasionInput){
      occasionInput.addEventListener("input", () => {
        state.occasion = occasionInput.value;
        saveState();

        if(state.messageMode !== "custom"){
          refreshSuggestions();
        }

        refreshPreviewText();
      });
    }

    // Navigation
    if(toStep2) toStep2.addEventListener("click", () => setStep(2));
    if(toStep3) toStep3.addEventListener("click", () => setStep(3));
    if(btnBack){
      btnBack.addEventListener("click", () => setStep(state.step - 1));
    }

    // Design (delegation)
    if(designStrip){
      designStrip.addEventListener("click", (e) => {
        const tile = e.target.closest(".design-tile");
        if(!tile) return;

        const id = tile.getAttribute("data-id");
        if(!id) return;

        state.designId = id;
        saveState();

        // mark active
        document.querySelectorAll(".design-tile").forEach((tEl) => {
          tEl.classList.toggle("active", tEl.getAttribute("data-id") === id);
        });

        if(toStep3) toStep3.disabled = false;

        applyDesignToPreview();
        refreshPreviewText();

        // hop til lag 3
        setStep(3);
      });
    }

    // Forslag dropdown
    if(suggestSelect){
      suggestSelect.addEventListener("change", () => {
        const idx = parseInt(suggestSelect.value, 10);
        const list = buildSuggestions();
        const picked = list[idx] || list[0] || "";
        setMessage(picked, "suggestion");
      });
    }

    if(btnRandom){
      btnRandom.addEventListener("click", () => randomSuggestion());
    }

    // Fri tekst
    if(messageInput){
      messageInput.addEventListener("input", () => {
        state.message = messageInput.value;
        state.messageMode = "custom";
        saveState();
        refreshPreviewText();
      });
    }

    // Fra / Til
    if(fromInput){
      fromInput.addEventListener("input", () => {
        state.from = fromInput.value;
        saveState();
        refreshPreviewText();
      });
    }
    if(toInput){
      toInput.addEventListener("input", () => {
        state.to = toInput.value;
        saveState();
        refreshPreviewText();
      });
    }

    // Output
    if(btnPng)   btnPng.addEventListener("click", downloadPNG);
    if(btnPdf)   btnPdf.addEventListener("click", printAsPDF);
    if(btnMail)  btnMail.addEventListener("click", sendEmail);
    if(btnShare) btnShare.addEventListener("click", shareCard);

    // Reset
    if(btnReset){
      btnReset.addEventListener("click", () => {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      });
    }

    // Help
    if(btnHelp){
      btnHelp.addEventListener("click", () => {
        if(helpModal) helpModal.hidden = false;
      });
    }
    if(btnCloseHelp){
      btnCloseHelp.addEventListener("click", () => {
        if(helpModal) helpModal.hidden = true;
      });
    }
    if(helpModal){
      helpModal.addEventListener("click", (e) => {
        if(e.target && e.target.classList && e.target.classList.contains("modal-backdrop")){
          helpModal.hidden = true;
        }
      });
    }
  }

  /* =========================================================
     AFSNIT 14 – Restore UI + Boot
  ========================================================= */
  function restoreUI(){
    if(langSelect) langSelect.value = state.lang;
    if(typeSelect) typeSelect.value = state.type;

    if(occasionInput) occasionInput.value = state.occasion || "";
    refreshOccasionVisibility();

    if(fromInput) fromInput.value = state.from || "";
    if(toInput)   toInput.value   = state.to   || "";
    if(messageInput) messageInput.value = state.message || "";

    applyTheme();
    applyTexts();

    buildDesignTiles();

    if(state.designId){
      if(toStep3) toStep3.disabled = false;
      applyDesignToPreview();
    } else {
      if(toStep3) toStep3.disabled = true;
    }

    // suggestion-mode: sørg for der altid står noget
    if(state.messageMode !== "custom"){
      refreshSuggestions();
    } else {
      refreshPreviewText();
    }

    refreshActionbarEnabled();
  }

  function boot(){
    if(!dataOk()){
      console.error("CARD_DATA mangler/ugyldig. Tjek js/data.js");
      return;
    }

    loadState();

    // init UI
    initLanguageSelect();
    initTypeSelect();
    applyTheme();
    bindEvents();

    // build + restore
    restoreUI();

    // start i lag 1
    setStep(1);
  }

  boot();

})();
