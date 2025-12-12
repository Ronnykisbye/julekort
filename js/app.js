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
