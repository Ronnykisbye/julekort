/* =========================================================
   js/app.js
   Al logik: wizard-flow, state, preview, output (PNG/PDF/email/share)
========================================================= */

(function(){
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
     AFSNIT 02 – State + storage
  ========================================================= */
  const STORAGE_KEY = "kisbye_julekort_state_v1";

  const state = {
    lang: "da",
    theme: "dark",
    type: "xmas",
    occasion: "",
    designId: null,
    from: "",
    to: "",
    message: "",
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /* =========================================================
     AFSNIT 03 – i18n helpers
  ========================================================= */
  function t(){
    return window.CARD_DATA.labels[state.lang] || window.CARD_DATA.labels.da;
  }

  function typeLabel(){
    return t().types?.[state.type] || state.type;
  }

  /* =========================================================
     AFSNIT 04 – Init selects
  ========================================================= */
  function initLanguageSelect(){
    langSelect.innerHTML = "";
    window.CARD_DATA.languages.forEach(l => {
      const opt = document.createElement("option");
      opt.value = l.code;
      opt.textContent = l.name;
      langSelect.appendChild(opt);
    });
    langSelect.value = state.lang;
  }

  function initTypeSelect(){
    const labels = t().types;
    typeSelect.innerHTML = "";
    window.CARD_DATA.types.forEach(tp => {
      const opt = document.createElement("option");
      opt.value = tp.id;
      opt.textContent = labels[tp.key] || tp.id;
      typeSelect.appendChild(opt);
    });
    typeSelect.value = state.type;
  }

  /* =========================================================
     AFSNIT 05 – Theme + texts
  ========================================================= */
  function applyTheme(){
    document.documentElement.setAttribute("data-theme", state.theme);
    themeLight.classList.toggle("active", state.theme === "light");
    themeDark.classList.toggle("active", state.theme === "dark");
  }

  function applyTexts(){
    $("subtitle").textContent = t().subtitle;
    $("wizardTitle").textContent = t().wizardTitle;
    $("previewTitle").textContent = t().previewTitle;
    $("layer1Title").textContent = t().layer1Title;
    $("layer2Title").textContent = t().layer2Title;
    $("layer3Title").textContent = t().layer3Title;

    $("lblLang").textContent = t().lang;
    $("lblTheme").textContent = t().theme;
    $("lblType").textContent = t().type;
    $("lblOccasion").textContent = t().occasion;
    $("lblFrom").textContent = t().from;
    $("lblTo").textContent = t().to;
    $("lblSuggestions").textContent = t().suggestions;
    $("lblMessage").textContent = t().message;

    $("btnNext1").textContent = t().next1;
    $("btnNext2").textContent = t().next2;
    $("designHint").textContent = t().designHint;

    helpList.innerHTML = "";
    (t().help || []).forEach(line=>{
      const li = document.createElement("li");
      li.textContent = line;
      helpList.appendChild(li);
    });

    initTypeSelect();
    refreshSuggestions();
    refreshOccasionVisibility();
    refreshStatus();
  }

/* =========================================================
   AFSNIT 06 – SIMPEL WIZARD (KUN ÉT LAG AD GANGEN)
========================================================= */
function setStep(step){
  state.step = step;
  saveState();

  stepBlocks.forEach(block => {
    const s = parseInt(block.dataset.step, 10);
    block.classList.toggle("active", s === step);
  });

  refreshProgress();
  refreshStatus();
}


  /* =========================================================
     AFSNIT 07 – Designs
  ========================================================= */
  function buildDesignTiles(){
    designStrip.innerHTML = "";
    window.CARD_DATA.designs.forEach(d => {
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
        setStep(3); // efter design: hop direkte til tekst (mere “wizard”)
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
    toStep3.disabled = false;
    refreshActionbarEnabled();
  }

  function markActiveDesign(){
    const tiles = [...designStrip.querySelectorAll(".design-tile")];
    tiles.forEach(tl => tl.classList.toggle("active", tl.dataset.id === state.designId));

    if(!state.designId){
      designChosen.textContent = t().chosenNone;
      toStep3.disabled = true;
    } else {
      const d = window.CARD_DATA.designs.find(x=>x.id===state.designId);
      designChosen.textContent = d ? d.name : state.designId;
      toStep3.disabled = false;
    }
  }

  function applyDesignToPreview(){
    const d = window.CARD_DATA.designs.find(x=>x.id===state.designId) || window.CARD_DATA.designs[0];

    document.documentElement.style.setProperty("--cardA", d.a);
    document.documentElement.style.setProperty("--cardB", d.b);
    document.documentElement.style.setProperty("--cardC", d.c);

    previewStamp.textContent = d.icon;

    const inner = cardPreview.querySelector(".card-inner");
    inner.style.backgroundImage = `linear-gradient(135deg, var(--cardA), var(--cardB))`;
    inner.style.backgroundSize = "auto";
    inner.style.backgroundBlendMode = "normal";
  }

  /* =========================================================
     AFSNIT 08 – Suggestions
  ========================================================= */
  function currentOccasionToken(){
    const occ = (state.occasion || "").trim();
    return occ.length ? occ : (state.lang==="da" ? "anledningen" : "occasion");
  }

  function buildSuggestions(){
    const pack = window.CARD_DATA.suggestions[state.lang] || window.CARD_DATA.suggestions.da;
    const list = pack[state.type] || [];
    const occ = currentOccasionToken();
    return list.map(s => s.replaceAll("{occasion}", occ));
  }

  function refreshSuggestions(){
    suggestSelect.innerHTML = "";
    const list = buildSuggestions();
    list.forEach((txt, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = txt;
      suggestSelect.appendChild(opt);
    });

    if(!state.message || !state.message.trim()){
      const first = list[0] || "";
      state.message = first;
      messageInput.value = first;
      saveState();
    }
    refreshPreviewText();
  }

  function randomSuggestion(){
    const list = buildSuggestions();
    if(!list.length) return;
    const pick = list[Math.floor(Math.random() * list.length)];
    state.message = pick;
    messageInput.value = pick;
    saveState();
    refreshPreviewText();
  }

  /* =========================================================
     AFSNIT 09 – Preview text + actionbar enabled
  ========================================================= */
  function refreshPreviewText(){
    previewBadge.textContent = typeLabel();

    const to = (state.to || "").trim();
    const from = (state.from || "").trim();
    const msg = (state.message || "").trim();

    previewTo.textContent = to ? `${t().to}: ${to}` : `${t().to}: …`;
    previewFrom.textContent = from ? `${t().from}: ${from}` : `${t().from}: …`;
    previewMessage.textContent = msg ? msg : (state.designId ? "Skriv din tekst…" : "Vælg et design og skriv din tekst…");

    charCount.textContent = String((messageInput.value || "").length);

    refreshActionbarEnabled();
  }

  function refreshActionbarEnabled(){
    const ready = Boolean(state.designId) && (state.message || "").trim().length > 0;
    btnPng.disabled = !ready;
    btnPdf.disabled = !ready;
    btnMail.disabled = !ready;
    btnShare.disabled = !ready;
  }

  /* =========================================================
     AFSNIT 10 – Output (PNG / PDF / Email / Share)
  ========================================================= */
  function getActiveDesign(){
    return window.CARD_DATA.designs.find(x=>x.id===state.designId) || window.CARD_DATA.designs[0];
  }

  function getFontStack(){
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

  function drawWrappedText(ctx, text, x, y, maxWidth, maxHeight, lineHeight){
    const words = (text || "").split(/\s+/).filter(Boolean);
    if(!words.length) return;

    let line = "";
    let yy = y;

    let fontSize = parseInt(ctx.font, 10);
    if(words.length > 40) fontSize = Math.max(44, Math.floor(fontSize * 0.82));
    if(words.length > 80) fontSize = Math.max(40, Math.floor(fontSize * 0.78));
    ctx.font = `${fontSize}px ${getFontStack()}`;
    lineHeight = Math.floor(fontSize * 1.18);

    for(let i=0; i<words.length; i++){
      const test = line ? line + " " + words[i] : words[i];
      if(ctx.measureText(test).width <= maxWidth){
        line = test;
      } else {
        ctx.fillText(line, x, yy);
        yy += lineHeight;
        line = words[i];
        if(yy > y + maxHeight) break;
      }
    }
    if(yy <= y + maxHeight) ctx.fillText(line, x, yy);
  }

  function fileBaseName(){
    const safe = (s)=> (s||"").trim().toLowerCase().replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"");
    const tp = safe(typeLabel()) || "kort";
    const to = safe(state.to) || "til";
    const from = safe(state.from) || "fra";
    return `kisbye-${tp}-${to}-${from}`.slice(0,60);
  }

  function renderCardToCanvas(scale=2){
    const d = getActiveDesign();
    const W = 1080 * scale;
    const H = 1350 * scale;

    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");

    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, d.a);
    g.addColorStop(0.55, d.b);
    g.addColorStop(1, d.c);
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    function blob(x,y,r,alpha){
      const rg = ctx.createRadialGradient(x,y,0,x,y,r);
      rg.addColorStop(0, `rgba(255,255,255,${alpha})`);
      rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(x-r,y-r,r*2,r*2);
    }
    blob(W*0.25, H*0.18, W*0.32, 0.16);
    blob(W*0.78, H*0.22, W*0.36, 0.12);
    blob(W*0.60, H*0.86, W*0.44, 0.10);

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 6*scale;
    roundRect(ctx, 40*scale, 40*scale, W-80*scale, H-80*scale, 54*scale);
    ctx.stroke();

    const badgeText = typeLabel();
    ctx.font = `${36*scale}px ${getFontStack()}`;
    const badgeW = ctx.measureText(badgeText).width + 46*scale;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 3*scale;
    roundRect(ctx, 70*scale, 80*scale, badgeW, 64*scale, 999*scale);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(badgeText, 92*scale, 124*scale);

    ctx.font = `${64*scale}px ${getFontStack()}`;
    ctx.fillText(d.icon, W - 150*scale, 132*scale);

    const toLine = (state.to||"").trim() ? `${t().to}: ${(state.to||"").trim()}` : `${t().to}: …`;
    const fromLine = (state.from||"").trim() ? `${t().from}: ${(state.from||"").trim()}` : `${t().from}: …`;
    const msg = (state.message||"").trim() || "";

    ct
