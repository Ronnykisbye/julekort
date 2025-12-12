/* js/app.js
   Al logik: wizard-flow, state, preview, output (PNG/PDF/email/share)
*/

(function(){
  const $ = (id) => document.getElementById(id);

  // ------- DOM -------
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

  // ------- State -------
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

  // ------- i18n -------
  function t(){
    return window.CARD_DATA.labels[state.lang] || window.CARD_DATA.labels.da;
  }

  function typeLabel(){
    return t().types?.[state.type] || state.type;
  }

  // ------- Init UI -------
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

  // ------- Wizard UX -------
  function setStep(step){
    state.step = Math.max(1, Math.min(3, step));
    saveState();
    refreshProgress();
    refreshStatus();

    // “Én skærm” men vi guider opmærksomheden:
    const target = document.querySelector(`[data-step="${state.step}"]`);
    if(target){
      target.scrollIntoView({ behavior:"smooth", block:"start" });
    }
  }

  function refreshProgress(){
    const pct = (state.step - 1) / 2 * 100;
    progressBar.style.width = `${pct}%`;
  }

  function refreshStatus(){
    if(state.step === 1) statusChip.textContent = t().status1;
    if(state.step === 2) statusChip.textContent = t().status2;
    if(state.step === 3) statusChip.textContent = t().status3;
  }

  function refreshOccasionVisibility(){
    const isSpecial = state.type === "special";
    occasionWrap.hidden = !isSpecial;
  }

  // ------- Designs -------
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

      tile.addEventListener("click", () => selectDesign(d.id));

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

    // små “pattern vibes” uden billeder:
    const p = d.pattern;
    let overlay = "";
    if(p==="sparkle") overlay = "radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.55), transparent 60%), radial-gradient(2px 2px at 70% 40%, rgba(255,255,255,0.45), transparent 60%), radial-gradient(2px 2px at 55% 75%, rgba(255,255,255,0.40), transparent 60%)";
    if(p==="snow")    overlay = "radial-gradient(2px 2px at 18% 20%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(2px 2px at 60% 30%, rgba(255,255,255,0.30), transparent 60%), radial-gradient(2px 2px at 80% 70%, rgba(255,255,255,0.28), transparent 60%)";
    if(p==="grid")    overlay = "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)";
    if(p==="bokeh")   overlay = "radial-gradient(80px 60px at 25% 30%, rgba(255,255,255,0.14), transparent 60%), radial-gradient(90px 70px at 70% 40%, rgba(255,255,255,0.12), transparent 62%)";
    if(p==="aurora")  overlay = "radial-gradient(500px 280px at 30% 30%, rgba(139,247,255,0.18), transparent 60%), radial-gradient(520px 300px at 70% 40%, rgba(215,169,255,0.18), transparent 62%)";
    if(p==="confetti")overlay = "radial-gradient(3px 3px at 15% 20%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(3px 3px at 55% 35%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(3px 3px at 80% 60%, rgba(255,255,255,0.25), transparent 60%)";
    if(p==="glass")   overlay = "linear-gradient(135deg, rgba(255,255,255,0.10), transparent 40%), linear-gradient(315deg, rgba(255,255,255,0.08), transparent 50%)";
    if(p==="rays")    overlay = "conic-gradient(from 220deg at 60% 40%, rgba(255,255,255,0.10), transparent 20%, rgba(255,255,255,0.06), transparent 40%, rgba(255,255,255,0.08), transparent 70%)";
    if(p==="dust")    overlay = "radial-gradient(2px 2px at 20% 20%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(2px 2px at 70% 65%, rgba(255,255,255,0.22), transparent 60%)";
    if(p==="leaf")    overlay = "radial-gradient(140px 90px at 25% 30%, rgba(125,255,178,0.10), transparent 60%), radial-gradient(160px 110px at 70% 60%, rgba(139,247,255,0.10), transparent 62%)";

    // apply overlay via backgroundImage stacking
    const inner = cardPreview.querySelector(".card-inner");
    inner.style.backgroundImage = `${overlay ? overlay + "," : ""} linear-gradient(135deg, var(--cardA), var(--cardB))`;
    if(p==="grid"){
      inner.style.backgroundSize = "auto, 26px 26px, 26px 26px";
      inner.style.backgroundBlendMode = "screen";
    } else {
      inner.style.backgroundSize = "auto";
      inner.style.backgroundBlendMode = "normal";
    }
  }

  // ------- Suggestions -------
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

    // Auto-fill message hvis tom
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

  // ------- Preview text -------
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

  // ------- Output helpers (Canvas render) -------
  function getActiveDesign(){
    return window.CARD_DATA.designs.find(x=>x.id===state.designId) || window.CARD_DATA.designs[0];
  }

  function renderCardToCanvas(scale=2){
    const d = getActiveDesign();
    const W = 1080 * scale;
    const H = 1350 * scale;

    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");

    // Background gradient
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, d.a);
    g.addColorStop(0.55, d.b);
    g.addColorStop(1, d.c);
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // Soft glow blobs
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

    // Frame
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 6*scale;
    roundRect(ctx, 40*scale, 40*scale, W-80*scale, H-80*scale, 54*scale);
    ctx.stroke();

    // Badge
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

    // Stamp icon
    ctx.font = `${64*scale}px ${getFontStack()}`;
    ctx.fillText(d.icon, W - 150*scale, 132*scale);

    // To/From + Message
    const toLine = (state.to||"").trim() ? `${t().to}: ${(state.to||"").trim()}` : `${t().to}: …`;
    const fromLine = (state.from||"").trim() ? `${t().from}: ${(state.from||"").trim()}` : `${t().from}: …`;
    const msg = (state.message||"").trim() || "";

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `${44*scale}px ${getFontStack()}`;
    ctx.fillText(toLine, 90*scale, 260*scale);

    // Message (wrap)
    ctx.font = `${72*scale}px ${getFontStack()}`;
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    const boxX = 90*scale, boxY = 340*scale, boxW2 = W - 180*scale, boxH2 = 740*scale;
    drawWrappedText(ctx, msg, boxX, boxY, boxW2, boxH2, 84*scale);

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `${44*scale}px ${getFontStack()}`;
    ctx.fillText(fromLine, 90*scale, H - 170*scale);

    // micro footer
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `${30*scale}px ${getFontStack()}`;
    ctx.fillText("kisbye.eu", W - 210*scale, H - 95*scale);

    return c;
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

    // Hvis beskeden er meget lang, skru lidt ned automatisk
    let fontSize = parseInt(ctx.font, 10);
    const targetLines = 8;
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
    if(yy <= y + maxHeight){
      ctx.fillText(line, x, yy);
    }
  }

  async function downloadPNG(){
    const canvas = renderCardToCanvas(2);
    canvas.toBlob((blob)=>{
      if(!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileBaseName() + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  function fileBaseName(){
    const safe = (s)=> (s||"").trim().toLowerCase().replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"");
    const tp = safe(typeLabel()) || "kort";
    const to = safe(state.to) || "til";
    const from = safe(state.from) || "fra";
    return `kisbye-${tp}-${to}-${from}`.slice(0,60);
  }

  function printAsPDF(){
    // Browser-print: vælg “Gem som PDF”
    window.print();
  }

  function sendEmail(){
    const subj = `${typeLabel()} – ${((state.to||"").trim() ? (state.to||"").trim() : "")}`.trim();
    const bodyLines = [
      `${typeLabel()}`,
      "",
      `${t().to}: ${(state.to||"").trim() || "…"}`,
      `${t().from}: ${(state.from||"").trim() || "…"}`,
      "",
      (state.message||"").trim()
    ];
    const body = encodeURIComponent(bodyLines.join("\n"));
    const href = `mailto:?subject=${encodeURIComponent(subj)}&body=${body}`;
    window.location.href = href;
  }

  async function shareCard(){
    const text = (state.message||"").trim();
    const title = typeLabel();

    // Forsøg at dele PNG som fil (hvis understøttet)
    const canvas = renderCardToCanvas(2);
    const blob = await new Promise(res => canvas.toBlob(res, "image/png"));

    const canShareFiles = blob && navigator.canShare && navigator.canShare({ files: [new File([blob], "kort.png", {type:"image/png"})] });

    try{
      if(canShareFiles){
        const file = new File([blob], fileBaseName()+".png", { type:"image/png" });
        await navigator.share({ title, text, files:[file] });
      } else if(navigator.share){
        await navigator.share({ title, text });
      } else {
        // fallback: kopiér tekst
        await navigator.clipboard.writeText(text);
        alert("Din tekst er kopieret – del den hvor du vil.");
      }
    }catch(e){
      // user cancelled – ok
    }
  }

  // ------- Events -------
  function bindEvents(){
    langSelect.addEventListener("change", ()=>{
      state.lang = langSelect.value;
      saveState();
      applyTexts();
      refreshPreviewText();
    });

    typeSelect.addEventListener("change", ()=>{
      state.type = typeSelect.value;
      saveState();
      refreshOccasionVisibility();
      refreshSuggestions();
      previewBadge.textContent = typeLabel();
    });

    occasionInput.addEventListener("input", ()=>{
      state.occasion = occasionInput.value;
      saveState();
      refreshSuggestions();
    });

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

    toStep2.addEventListener("click", ()=>{
      setStep(2);
    });

    toStep3.addEventListener("click", ()=>{
      if(!state.designId) return;
      setStep(3);
    });

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

    suggestSelect.addEventListener("change", ()=>{
      const idx = parseInt(suggestSelect.value, 10);
      const list = buildSuggestions();
      const picked = list[idx] || list[0] || "";
      state.message = picked;
      messageInput.value = picked;
      saveState();
      refreshPreviewText();
    });

    messageInput.addEventListener("input", ()=>{
      state.message = messageInput.value;
      saveState();
      refreshPreviewText();
    });

    btnRandom.addEventListener("click", randomSuggestion);

    btnReset.addEventListener("click", ()=>{
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    });

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

  // ------- Restore UI from state -------
  function restoreUI(){
    langSelect.value = state.lang;
    typeSelect.value = state.type;

    occasionInput.value = state.occasion || "";
    refreshOccasionVisibility();

    fromInput.value = state.from || "";
    toInput.value = state.to || "";
    messageInput.value = state.message || "";

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
    setStep(state.step || 1);

    // Hvis type=special og occasion tom: brug placeholder
    if(state.type === "special" && !state.occasion){
      occasionInput.placeholder = state.lang === "da" ? "Fx Bryllup, Dåb, Tak..." : "e.g. Wedding, Thanks...";
    }
  }

  // ------- Boot -------
  function boot(){
    loadState();
    initLanguageSelect();
    applyTheme();
    bindEvents();
    restoreUI();
  }

  boot();

})();
