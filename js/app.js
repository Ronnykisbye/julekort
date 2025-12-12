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
  const btnBack = $("btnBack");

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
   AFSNIT 06 – SIMPEL WIZARD (KUN ÉT LAG AD GANGEN) + TILBAGE
========================================================= */
function setStep(step){
  state.step = step;
  saveState();

  // Vis kun det aktive lag
  stepBlocks.forEach(block => {
    const s = parseInt(block.dataset.step, 10);
    if (s === step) block.classList.add("active");
    else block.classList.remove("active");
  });

  // Tilbage-knap: skjul på trin 1
  if (btnBack) btnBack.disabled = (step === 1);

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
        setStep(3); // efter design: hop til tekst
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
   AFSNIT 10 – Events + Boot (simpel wizard + tilbage)
========================================================= */
function bindEvents(){
  // Sprog
  langSelect.addEventListener("change", ()=>{
    state.lang = langSelect.value;
    saveState();
    applyTexts();
    refreshPreviewText();
  });

  // Korttype
  typeSelect.addEventListener("change", ()=>{
    state.type = typeSelect.value;
    saveState();
    refreshOccasionVisibility();
    refreshSuggestions();
    refreshPreviewText();
  });

  // Anledning (kun special)
  occasionInput.addEventListener("input", ()=>{
    state.occasion = occasionInput.value;
    saveState();
    refreshSuggestions();
    refreshPreviewText();
  });

  // Tema
  themeLight.addEventListener("click", ()=>{
    state.theme = "light";
    saveState();
    applyTheme();
  });
  themeDark.addEventListener("click", ()=>{
    state.theme = "dark";
    saveState();
    applyTheme();
  });

  // Wizard navigation
  toStep2.addEventListener("click", ()=> setStep(2));

  toStep3.addEventListener("click", ()=>{
    if(!state.designId) return;
    setStep(3);
  });

  // Tilbage (altid muligt at komme tilbage)
  if (btnBack){
    btnBack.addEventListener("click", ()=>{
      const next = Math.max(1, (state.step || 1) - 1);
      setStep(next);
    });
  }

  // Fra/Til
  fromInput.addEventListener("input", ()=>{
    state.from = fromInput.value;
    saveState();
    refreshPreviewText();
  });

  toInput.addEventListener("input", ()=>{
    state.to = toInput.value;
    saveState();
    refreshPreviewText();
  });

  // Forslag
  suggestSelect.addEventListener("change", ()=>{
    const idx = parseInt(suggestSelect.value, 10);
    const list = buildSuggestions();
    const picked = list[idx] || list[0] || "";
    state.message = picked;
    messageInput.value = picked;
    saveState();
    refreshPreviewText();
  });

  // Fri tekst
  messageInput.addEventListener("input", ()=>{
    state.message = messageInput.value;
    saveState();
    refreshPreviewText();
  });

  // Ny variant / reset
  btnRandom.addEventListener("click", randomSuggestion);
  btnReset.addEventListener("click", ()=>{
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  // Output
  btnPng.addEventListener("click", downloadPNG);
  btnPdf.addEventListener("click", printAsPDF);
  btnMail.addEventListener("click", sendEmail);
  btnShare.addEventListener("click", shareCard);

  // Help modal
  btnHelp.addEventListener("click", ()=> { helpModal.hidden = false; });
  btnCloseHelp.addEventListener("click", ()=> { helpModal.hidden = true; });
  helpModal.addEventListener("click", (e)=>{
    const target = e.target;
    if(target && target.dataset && target.dataset.close === "1") helpModal.hidden = true;
  });
}

function restoreUI(){
  // Restore values
  langSelect.value = state.lang;
  typeSelect.value = state.type;

  occasionInput.value = state.occasion || "";
  refreshOccasionVisibility();

  fromInput.value = state.from || "";
  toInput.value = state.to || "";
  messageInput.value = state.message || "";

  // Apply UI
  applyTheme();
  applyTexts();
  buildDesignTiles();

  if(state.designId){
    toStep3.disabled = false;
    applyDesignToPreview();
  } else {
    toStep3.disabled = true;
  }

  refreshPreviewText();
  refreshProgress();
  refreshStatus();
}

function boot(){
  loadState();
  initLanguageSelect();
  applyTheme();

  bindEvents();
  restoreUI();

  // Start altid i Lag 1
  setStep(1);
}

boot();
