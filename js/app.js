/**
 * OmniSupport Customer Service Chatbot & Studio
 * UI Controller & Application State Manager
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- App State ---
  let kbData = loadKnowledgeBaseFromStorage();
  const nlp = new NLPEngine(kbData);
  
  let chatHistory = [];
  let isVoiceEnabled = true;
  let activeContext = null;
  let slotData = {};
  let fallbackCounter = 0;
  
  // Analytics Tracking
  const analytics = {
    totalQueries: 0,
    matchedQueries: 0,
    escalationCount: 0,
    confidenceSum: 0,
    intentCounts: {},
    sentiments: { positive: 0, neutral: 0, negative: 0 }
  };

  // Web Speech Synthesis (Text-to-Speech)
  const synth = window.speechSynthesis;

  // Speech Recognition (Speech-to-Text)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
  }

  // --- DOM Elements ---
  const chatMessages = document.getElementById("chatMessages");
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const btnMic = document.getElementById("btnMic");
  const engineSelect = document.getElementById("engineSelect");
  const btnVoiceToggle = document.getElementById("btnVoiceToggle");
  const btnInspectorToggle = document.getElementById("btnInspectorToggle");
  const btnThemeToggle = document.getElementById("btnThemeToggle");
  const btnHelpModal = document.getElementById("btnHelpModal");
  const btnCloseHelpModal = document.getElementById("btnCloseHelpModal");
  const modalHelp = document.getElementById("modalHelp");
  const nlpInspector = document.getElementById("nlpInspector");
  const btnEscalateAgent = document.getElementById("btnEscalateAgent");
  const btnClearChat = document.getElementById("btnClearChat");
  const btnExportChat = document.getElementById("btnExportChat");
  const quickPromptsContainer = document.getElementById("quickPromptsContainer");

  // KB Studio DOM
  const kbIntentsList = document.getElementById("kbIntentsList");
  const confidenceThresholdInput = document.getElementById("confidenceThreshold");
  const thresholdValueSpan = document.getElementById("thresholdValue");
  const kbSearchInput = document.getElementById("kbSearchInput");
  const btnOpenAddIntentModal = document.getElementById("btnOpenAddIntentModal");
  const modalAddIntent = document.getElementById("modalAddIntent");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const btnCancelAddIntent = document.getElementById("btnCancelAddIntent");
  const addIntentForm = document.getElementById("addIntentForm");
  const btnResetKB = document.getElementById("btnResetKB");
  const btnExportKB = document.getElementById("btnExportKB");

  // Lab Sandbox DOM
  const labSentA = document.getElementById("labSentA");
  const labSentB = document.getElementById("labSentB");
  const btnRunLabCompare = document.getElementById("btnRunLabCompare");
  const labResultBox = document.getElementById("labResultBox");
  const labCosineVal = document.getElementById("labCosineVal");
  const labJaccardVal = document.getElementById("labJaccardVal");
  const labOverlapVal = document.getElementById("labOverlapVal");
  const labStemInput = document.getElementById("labStemInput");
  const labStemOutput = document.getElementById("labStemOutput");

  // Embed DOM
  const widgetColorPicker = document.getElementById("widgetColorPicker");
  const widgetGreetingInput = document.getElementById("widgetGreetingInput");
  const widgetCodeSnippet = document.getElementById("widgetCodeSnippet");
  const btnCopyWidgetCode = document.getElementById("btnCopyWidgetCode");

  // Charts
  let intentChartInstance = null;
  let sentimentChartInstance = null;

  // --- INITIALIZATION ---
  initApp();

  function initApp() {
    renderWelcomeMessage();
    renderKnowledgeBaseStudio();
    initCharts();
    updateEmbedSnippet();
    bindEvents();
    runLabStemTest();
  }

  function loadKnowledgeBaseFromStorage() {
    const saved = localStorage.getItem("omni_support_kb");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved KB, using default.", e);
      }
    }
    return [...DEFAULT_KNOWLEDGE_BASE];
  }

  function saveKnowledgeBaseToStorage() {
    localStorage.setItem("omni_support_kb", JSON.stringify(kbData));
    nlp.setKnowledgeBase(kbData);
  }

  // --- EVENT LISTENERS ---
  function bindEvents() {
    // Form submit
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleUserMessage(userInput.value);
    });

    // Voice Input Mic Button
    if (recognition) {
      btnMic.addEventListener("click", () => {
        btnMic.classList.add("recording");
        userInput.placeholder = "Listening... Speak now!";
        recognition.start();
      });

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        btnMic.classList.remove("recording");
        userInput.placeholder = "Ask a question...";
        handleUserMessage(transcript);
      };

      recognition.onerror = () => {
        btnMic.classList.remove("recording");
        userInput.placeholder = "Ask a question...";
      };

      recognition.onend = () => {
        btnMic.classList.remove("recording");
        userInput.placeholder = "Ask a question...";
      };
    } else {
      btnMic.style.display = "none";
    }

    // Voice Response Toggle
    btnVoiceToggle.addEventListener("click", () => {
      isVoiceEnabled = !isVoiceEnabled;
      btnVoiceToggle.classList.toggle("active", isVoiceEnabled);
      if (!isVoiceEnabled && synth.speaking) {
        synth.cancel();
      }
      btnVoiceToggle.innerHTML = isVoiceEnabled 
        ? '<i class="fa-solid fa-volume-high"></i>' 
        : '<i class="fa-solid fa-volume-xmark"></i>';
    });

    // Inspector Panel Toggle
    btnInspectorToggle.addEventListener("click", () => {
      nlpInspector.classList.toggle("collapsed");
      btnInspectorToggle.classList.toggle("active");
    });

    // Dark / Light Theme Toggle
    btnThemeToggle.addEventListener("click", () => {
      document.body.classList.toggle("theme-light");
      document.body.classList.toggle("theme-dark");
      const isDark = document.body.classList.contains("theme-dark");
      btnThemeToggle.innerHTML = isDark 
        ? '<i class="fa-solid fa-moon"></i>' 
        : '<i class="fa-solid fa-sun"></i>';
    });

    // How NLP Works Modal
    btnHelpModal.addEventListener("click", () => modalHelp.classList.remove("hidden"));
    btnCloseHelpModal.addEventListener("click", () => modalHelp.classList.add("hidden"));

    // Quick prompt chip clicks
    quickPromptsContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("prompt-chip")) {
        const query = e.target.getAttribute("data-query");
        if (query) handleUserMessage(query);
      }
    });

    // Clear Chat
    btnClearChat.addEventListener("click", () => {
      chatMessages.innerHTML = "";
      chatHistory = [];
      fallbackCounter = 0;
      activeContext = null;
      renderWelcomeMessage();
      updateContextInspector();
    });

    // Escalate to Agent button
    btnEscalateAgent.addEventListener("click", () => triggerAgentEscalation());

    // Export Chat Transcript
    btnExportChat.addEventListener("click", exportTranscript);

    // Studio Tab Switching
    document.querySelectorAll(".studio-tabs .tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".studio-tabs .tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-contents .tab-pane").forEach(p => p.classList.remove("active"));
        
        btn.classList.add("active");
        const targetTab = btn.getAttribute("data-tab");
        document.getElementById(targetTab).classList.add("active");

        if (targetTab === "tabAnalytics") {
          updateCharts();
        }
      });
    });

    // KB Threshold Slider
    confidenceThresholdInput.addEventListener("input", (e) => {
      const val = e.target.value;
      thresholdValueSpan.textContent = `${val}%`;
      nlp.setConfidenceThreshold(val / 100);
    });

    // KB Search
    kbSearchInput.addEventListener("input", (e) => {
      renderKnowledgeBaseStudio(e.target.value.toLowerCase());
    });

    // Add Intent Modal
    btnOpenAddIntentModal.addEventListener("click", () => modalAddIntent.classList.remove("hidden"));
    btnCloseModal.addEventListener("click", () => modalAddIntent.classList.add("hidden"));
    btnCancelAddIntent.addEventListener("click", () => modalAddIntent.classList.add("hidden"));

    addIntentForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("newIntentId").value.trim().toLowerCase().replace(/\s+/g, "_");
      const name = document.getElementById("newIntentName").value.trim();
      const category = document.getElementById("newIntentCategory").value;
      const phrasesStr = document.getElementById("newIntentPhrases").value;
      const responseStr = document.getElementById("newIntentResponse").value;

      const phrases = phrasesStr.split(",").map(s => s.trim()).filter(s => s.length > 0);
      const keywords = phrases.slice(0, 5);

      const newIntent = {
        id,
        name,
        category,
        phrases,
        keywords,
        response: responseStr
      };

      kbData.push(newIntent);
      saveKnowledgeBaseToStorage();
      renderKnowledgeBaseStudio();
      modalAddIntent.classList.add("hidden");
      addIntentForm.reset();

      // Show toast
      showNotification(`Added new intent "${name}" to Knowledge Base!`);
    });

    // Reset KB
    btnResetKB.addEventListener("click", () => {
      if (confirm("Reset Knowledge Base to default intents? Custom intents will be cleared.")) {
        localStorage.removeItem("omni_support_kb");
        kbData = [...DEFAULT_KNOWLEDGE_BASE];
        nlp.setKnowledgeBase(kbData);
        renderKnowledgeBaseStudio();
        showNotification("Knowledge Base reset to default!");
      }
    });

    // Export KB JSON
    btnExportKB.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(kbData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "omnisupport_kb.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    // Lab Sandbox calculation
    btnRunLabCompare.addEventListener("click", runLabSimilarityCheck);
    labStemInput.addEventListener("input", runLabStemTest);

    // Embed Customization
    widgetColorPicker.addEventListener("input", updateEmbedSnippet);
    widgetGreetingInput.addEventListener("input", updateEmbedSnippet);
    btnCopyWidgetCode.addEventListener("click", () => {
      navigator.clipboard.writeText(widgetCodeSnippet.value);
      showNotification("Embed code copied to clipboard!");
    });
  }

  // --- CHAT DISPLAY & PROCESSOR ---

  function renderWelcomeMessage() {
    const welcomeHTML = `
      <div class="message bot-message">
        <div class="message-avatar"><i class="fa-solid fa-headset"></i></div>
        <div class="message-bubble">
          <div class="message-sender">OmniBot • AI Assistant</div>
          <div class="message-text">
            Hello! 👋 Welcome to **OmniSupport AI**. I am your automated customer service agent trained to assist with order tracking, refunds, account security, damaged items, and business policies.
            <br><br>
            How can I help you today? Select a quick query below or type your question!
          </div>
          <div class="message-timestamp">${getCurrentTime()}</div>
          <div class="quick-replies-grid">
            <button class="reply-chip" onclick="window.sendQuickQuery('Where is my order ORD-98234?')">📦 Track Order ORD-98234</button>
            <button class="reply-chip" onclick="window.sendQuickQuery('How do I get a refund?')">💳 Request Refund</button>
            <button class="reply-chip" onclick="window.sendQuickQuery('I forgot my password')">🔐 Password Reset</button>
            <button class="reply-chip" onclick="window.sendQuickQuery('Talk to a human representative')">🎧 Connect to Agent</button>
          </div>
        </div>
      </div>
    `;
    chatMessages.insertAdjacentHTML("beforeend", welcomeHTML);
  }

  // Expose global helper for quick chips in messages
  window.sendQuickQuery = (query) => {
    handleUserMessage(query);
  };

  function handleUserMessage(userText) {
    if (!userText || !userText.trim()) return;
    const cleanUserText = userText.trim();

    // Clear input field
    userInput.value = "";

    // 1. Append User Message to UI
    appendUserMessage(cleanUserText);

    // 2. Show Typing Indicator
    const typingId = appendTypingIndicator();

    // 3. Process via NLP Engine
    const mode = engineSelect.value;
    const nlpResult = nlp.predictIntent(cleanUserText, mode);

    // 4. Update Live NLP Inspector Panel
    updateInspectorPanel(cleanUserText, nlpResult);

    // 5. Update Analytics
    analytics.totalQueries++;
    analytics.confidenceSum += nlpResult.rawTopMatch ? nlpResult.rawTopMatch.confidencePct : 0;
    
    if (nlpResult.sentiment.score <= -0.8) analytics.sentiments.negative++;
    else if (nlpResult.sentiment.score >= 0.8) analytics.sentiments.positive++;
    else analytics.sentiments.neutral++;

    updateAnalyticsSummary();

    // 6. Respond after small realistic latency delay (400ms)
    setTimeout(() => {
      removeTypingIndicator(typingId);

      let responseText = "";
      let quickReplies = [];
      let topIntent = nlpResult.topMatch;

      // Handle multi-turn state slot filling (e.g., user providing Order ID after being asked)
      if (activeContext === "awaiting_order_id" && nlpResult.entities.orderId) {
        slotData.orderId = nlpResult.entities.orderId;
        topIntent = nlp.knowledgeBase.find(i => i.id === "order_tracking");
        activeContext = null; // cleared
      }

      if (topIntent) {
        analytics.matchedQueries++;
        const intentId = topIntent.intentId;
        analytics.intentCounts[intentId] = (analytics.intentCounts[intentId] || 0) + 1;
        fallbackCounter = 0; // reset fallback counter

        const intentObj = topIntent.intentObj;
        
        // Dynamic or static response
        if (typeof intentObj.response === "function") {
          responseText = intentObj.response(nlpResult.entities);
        } else {
          responseText = intentObj.response;
        }

        quickReplies = intentObj.quickReplies || [];

        // Check if intent sets context
        if (intentObj.setContext) {
          activeContext = intentObj.setContext;
        }
      } else {
        // Fallback Response
        fallbackCounter++;
        analytics.escalationCount += (fallbackCounter >= 3 ? 1 : 0);

        if (fallbackCounter >= 3 || nlpResult.sentiment.score <= -1.2) {
          triggerAgentEscalation();
          return;
        }

        responseText = `🤔 **I'm not quite sure I understood that.**\n\n- (Top predicted match: *${nlpResult.rawTopMatch ? nlpResult.rawTopMatch.intentName : 'None'}* with confidence **${nlpResult.rawTopMatch ? nlpResult.rawTopMatch.confidencePct : 0}%**).\n\nCould you try rephrasing your question or pick one of these popular topics?`;
        quickReplies = [
          "Track my package",
          "Refund policy",
          "Speak to human agent"
        ];
      }

      // Check for entity placeholders replacement if needed
      if (nlpResult.entities.email && responseText.includes("your email")) {
        responseText += `\n\n*(Captured email: \`${nlpResult.entities.email}\`)*`;
      }

      // Append Bot Response
      appendBotMessage(responseText, quickReplies, topIntent ? topIntent.intentName : "Fallback", topIntent ? topIntent.confidencePct : 0);

      // Trigger Speech Synthesis if enabled
      if (isVoiceEnabled) {
        speakResponse(responseText);
      }

      // Update context display
      updateContextInspector();

    }, 450);
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: "smooth"
      });
    });
  }

  function appendUserMessage(text) {
    const timeStr = getCurrentTime();
    const userHTML = `
      <div class="message user-message">
        <div class="message-avatar"><i class="fa-solid fa-user"></i></div>
        <div class="message-bubble">
          <div class="message-sender">You</div>
          <div class="message-text">${escapeHTML(text)}</div>
          <div class="message-timestamp">${timeStr}</div>
        </div>
      </div>
    `;
    chatMessages.insertAdjacentHTML("beforeend", userHTML);
    scrollToBottom();

    chatHistory.push({ sender: "You", text, timestamp: timeStr });
  }

  function appendBotMessage(text, quickReplies = [], intentName = "", confidence = 0) {
    const timeStr = getCurrentTime();
    const formattedText = parseMarkdownText(text);

    let chipsHTML = "";
    if (quickReplies.length > 0) {
      chipsHTML = `<div class="quick-replies-grid">` + 
        quickReplies.map(q => `<button class="reply-chip" onclick="window.sendQuickQuery('${escapeHTML(q)}')">${q}</button>`).join('') +
        `</div>`;
    }

    let metaBadge = "";
    if (intentName && confidence > 0) {
      metaBadge = `<span class="intent-meta-badge" title="NLP Intent Match"><i class="fa-solid fa-bullseye"></i> ${intentName} (${confidence}%)</span>`;
    }

    const botHTML = `
      <div class="message bot-message">
        <div class="message-avatar"><i class="fa-solid fa-headset"></i></div>
        <div class="message-bubble">
          <div class="message-sender">OmniBot ${metaBadge}</div>
          <div class="message-text">${formattedText}</div>
          ${chipsHTML}
          <div class="message-timestamp">${timeStr}</div>
        </div>
      </div>
    `;

    chatMessages.insertAdjacentHTML("beforeend", botHTML);
    scrollToBottom();

    chatHistory.push({ sender: "OmniBot", text, timestamp: timeStr });

    // Trigger celebratory confetti if order resolved or thanks
    if (text.includes("You're very welcome") || text.includes("In Transit")) {
      if (window.confetti) {
        window.confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
      }
    }
  }

  function appendTypingIndicator() {
    const id = "typing_" + Date.now();
    const typingHTML = `
      <div id="${id}" class="message bot-message typing-indicator-msg">
        <div class="message-avatar"><i class="fa-solid fa-headset"></i></div>
        <div class="message-bubble">
          <div class="typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    `;
    chatMessages.insertAdjacentHTML("beforeend", typingHTML);
    scrollToBottom();
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function triggerAgentEscalation() {
    analytics.escalationCount++;
    updateAnalyticsSummary();

    appendBotMessage(
      "🎧 **Human Agent Transfer Requested!**\n\nI am escalating your conversation to our Senior Customer Care Representative **Sarah M.**\n\n- **Ticket Reference**: `#TK-${Math.floor(10000 + Math.random() * 90000)}`\n- **Status**: Live Representative Connected! 🟢\n\n*Sarah M: 'Hello! I see you need assistance. How can I resolve this issue for you right now?'*",
      ["I need help with my refund", "My order is delayed", "Issue resolved, thanks!"],
      "Escalated Human Agent",
      100
    );

    if (window.confetti) {
      window.confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
    }
  }

  // --- NLP INSPECTOR UPDATE LOGIC ---
  function updateInspectorPanel(queryText, nlpResult) {
    const { preprocessed, entities, sentiment, intentScores, topMatch } = nlpResult;

    // 1. Sentiment Update
    const sentEl = document.getElementById("inspectorSentiment");
    sentEl.className = `sentiment-badge ${sentiment.cssClass}`;
    sentEl.innerHTML = `<i class="fa-solid ${sentiment.icon}"></i> <span>${sentiment.tag} (${sentiment.score})</span>`;

    // 2. Top Intent Badge
    const intentEl = document.getElementById("inspectorTopIntent");
    if (topMatch) {
      intentEl.className = "intent-pill matched";
      intentEl.innerHTML = `<strong>${topMatch.intentName}</strong> (${topMatch.confidencePct}%)`;
    } else {
      intentEl.className = "intent-pill fallback";
      intentEl.innerHTML = `<span>Fallback / Low Match (${nlpResult.rawTopMatch ? nlpResult.rawTopMatch.confidencePct : 0}%)</span>`;
    }

    // 3. Preprocessing Pipeline Breakdown
    document.getElementById("pipeRaw").textContent = `"${preprocessed.raw}"`;

    const pipeTokens = document.getElementById("pipeTokens");
    pipeTokens.innerHTML = preprocessed.tokens.length > 0
      ? preprocessed.tokens.map(t => `<span class="token-tag">${escapeHTML(t)}</span>`).join("")
      : '<span class="token-tag empty">Empty</span>';

    const pipeClean = document.getElementById("pipeClean");
    pipeClean.innerHTML = preprocessed.cleanTokens.length > 0
      ? preprocessed.cleanTokens.map(t => `<span class="token-tag clean">${escapeHTML(t)}</span>`).join("")
      : '<span class="token-tag empty">All Stopwords</span>';

    const pipeStemmed = document.getElementById("pipeStemmed");
    pipeStemmed.innerHTML = preprocessed.stemmedTokens.length > 0
      ? preprocessed.stemmedTokens.map(t => `<span class="token-tag stem">${escapeHTML(t)}</span>`).join("")
      : '<span class="token-tag empty">Empty</span>';

    // 4. Extracted Entities
    const entContainer = document.getElementById("extractedEntities");
    const activeEntities = [];
    if (entities.orderId) activeEntities.push({ label: "Order ID", val: entities.orderId, icon: "fa-box" });
    if (entities.email) activeEntities.push({ label: "Email", val: entities.email, icon: "fa-envelope" });
    if (entities.date) activeEntities.push({ label: "Date", val: entities.date, icon: "fa-calendar" });
    if (entities.amount) activeEntities.push({ label: "Amount", val: entities.amount, icon: "fa-dollar-sign" });
    if (entities.phone) activeEntities.push({ label: "Phone", val: entities.phone, icon: "fa-phone" });

    if (activeEntities.length > 0) {
      entContainer.innerHTML = activeEntities.map(e => `
        <div class="entity-pill">
          <i class="fa-solid ${e.icon}"></i>
          <span>${e.label}:</span>
          <strong>${escapeHTML(e.val)}</strong>
        </div>
      `).join("");
    } else {
      entContainer.innerHTML = '<p class="empty-state-text">No entities extracted in query.</p>';
    }

    // 5. Intent Confidence Matrix List
    const scoresListEl = document.getElementById("intentScoresList");
    scoresListEl.innerHTML = intentScores.slice(0, 6).map((item, idx) => {
      const isWinner = topMatch && topMatch.intentId === item.intentId;
      const barColor = isWinner ? "#10b981" : (item.confidencePct > 20 ? "#6366f1" : "#64748b");
      return `
        <div class="matrix-row ${isWinner ? 'winner' : ''}">
          <div class="matrix-info">
            <span class="matrix-name">${item.intentName}</span>
            <span class="matrix-pct">${item.confidencePct}%</span>
          </div>
          <div class="matrix-bar-bg">
            <div class="matrix-bar-fill" style="width: ${item.confidencePct}%; background-color: ${barColor};"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  function updateContextInspector() {
    document.getElementById("ctxActiveState").textContent = activeContext ? activeContext : "None (General)";
    document.getElementById("ctxSlotData").textContent = JSON.stringify(slotData, null, 2);
    document.getElementById("ctxFallbackCount").textContent = `${fallbackCounter} / 3`;
  }

  // --- KNOWLEDGE BASE STUDIO RENDERER ---
  function renderKnowledgeBaseStudio(filter = "") {
    kbIntentsList.innerHTML = "";

    const filtered = kbData.filter(intent => {
      if (!filter) return true;
      return intent.name.toLowerCase().includes(filter) ||
             intent.category.toLowerCase().includes(filter) ||
             intent.phrases.some(p => p.toLowerCase().includes(filter));
    });

    if (filtered.length === 0) {
      kbIntentsList.innerHTML = '<p class="empty-state-text">No matching intents found in Knowledge Base.</p>';
      return;
    }

    filtered.forEach((intent) => {
      const respPreview = typeof intent.response === "function" ? "[Dynamic Response Function]" : intent.response;
      const card = document.createElement("div");
      card.className = "kb-intent-item card";
      card.innerHTML = `
        <div class="kb-intent-header">
          <div>
            <span class="badge-category">${intent.category}</span>
            <h4>${escapeHTML(intent.name)}</h4>
            <code class="intent-id-code">${intent.id}</code>
          </div>
          <div class="kb-intent-actions">
            <button class="btn btn-ghost btn-sm btn-delete-intent" data-id="${intent.id}" title="Delete Intent">
              <i class="fa-solid fa-trash text-danger"></i>
            </button>
          </div>
        </div>
        <div class="kb-intent-body">
          <div class="phrases-label">Training Phrases (${intent.phrases.length}):</div>
          <div class="phrases-tags">
            ${intent.phrases.slice(0, 5).map(p => `<span class="phrase-tag">${escapeHTML(p)}</span>`).join("")}
            ${intent.phrases.length > 5 ? `<span class="phrase-tag more">+${intent.phrases.length - 5} more</span>` : ''}
          </div>
          <div class="response-preview">
            <strong>Response:</strong> ${escapeHTML(respPreview.substring(0, 90))}${respPreview.length > 90 ? '...' : ''}
          </div>
        </div>
      `;

      // Delete listener
      card.querySelector(".btn-delete-intent").addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`Delete intent "${intent.name}"?`)) {
          kbData = kbData.filter(i => i.id !== intent.id);
          saveKnowledgeBaseToStorage();
          renderKnowledgeBaseStudio(filter);
          showNotification(`Deleted intent "${intent.name}"`);
        }
      });

      kbIntentsList.appendChild(card);
    });
  }

  // --- LAB SIMILARITY CHECKER ---
  function runLabSimilarityCheck() {
    const sA = labSentA.value.trim();
    const sB = labSentB.value.trim();
    if (!sA || !sB) return;

    const prepA = nlp.preprocess(sA);
    const prepB = nlp.preprocess(sB);

    const vecA = {};
    prepA.stemmedTokens.forEach(t => vecA[t] = (vecA[t] || 0) + 1);
    const vecB = {};
    prepB.stemmedTokens.forEach(t => vecB[t] = (vecB[t] || 0) + 1);

    const cosine = nlp.calculateCosineSimilarity(vecA, vecB);
    const jaccard = nlp.calculateJaccardIndex(prepA.stemmedTokens, prepB.stemmedTokens);

    const setA = new Set(prepA.stemmedTokens);
    const overlap = prepB.stemmedTokens.filter(t => setA.has(t)).length;

    labCosineVal.textContent = (cosine * 100).toFixed(1) + "%";
    labJaccardVal.textContent = (jaccard * 100).toFixed(1) + "%";
    labOverlapVal.textContent = overlap + " stems";

    labResultBox.classList.remove("hidden");
  }

  function runLabStemTest() {
    const text = labStemInput.value;
    const { cleanTokens, stemmedTokens } = nlp.preprocess(text);

    labStemOutput.innerHTML = cleanTokens.map((tok, idx) => `
      <div class="stem-pair">
        <span class="orig-word">${escapeHTML(tok)}</span>
        <i class="fa-solid fa-arrow-right"></i>
        <span class="stemmed-word">${escapeHTML(stemmedTokens[idx] || tok)}</span>
      </div>
    `).join("");
  }

  // --- ANALYTICS & CHARTS ---
  function initCharts() {
    const ctxIntent = document.getElementById("intentDistributionChart").getContext("2d");
    const ctxSentiment = document.getElementById("sentimentChart").getContext("2d");

    intentChartInstance = new Chart(ctxIntent, {
      type: "bar",
      data: {
        labels: ["Shipping", "Billing", "Account", "Technical", "General"],
        datasets: [{
          label: "Query Count",
          data: [0, 0, 0, 0, 0],
          backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });

    sentimentChartInstance = new Chart(ctxSentiment, {
      type: "doughnut",
      data: {
        labels: ["Positive", "Neutral", "Frustrated"],
        datasets: [{
          data: [0, 1, 0],
          backgroundColor: ["#10b981", "#64748b", "#ef4444"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }

  function updateAnalyticsSummary() {
    document.getElementById("statTotalQueries").textContent = analytics.totalQueries;
    
    const accuracy = analytics.totalQueries > 0 
      ? Math.round((analytics.matchedQueries / analytics.totalQueries) * 100) 
      : 100;
    document.getElementById("statResolutionRate").textContent = `${accuracy}%`;

    document.getElementById("statEscalations").textContent = analytics.escalationCount;

    const avgConf = analytics.totalQueries > 0 
      ? Math.round(analytics.confidenceSum / analytics.totalQueries) 
      : 0;
    document.getElementById("statAvgConfidence").textContent = `${avgConf}%`;
  }

  function updateCharts() {
    if (!intentChartInstance || !sentimentChartInstance) return;

    // Categorize counts
    const catCounts = { Shipping: 0, Billing: 0, Account: 0, Technical: 0, General: 0 };
    Object.keys(analytics.intentCounts).forEach(intentId => {
      const intentObj = kbData.find(i => i.id === intentId);
      if (intentObj && catCounts[intentObj.category] !== undefined) {
        catCounts[intentObj.category] += analytics.intentCounts[intentId];
      }
    });

    intentChartInstance.data.datasets[0].data = Object.values(catCounts);
    intentChartInstance.update();

    sentimentChartInstance.data.datasets[0].data = [
      analytics.sentiments.positive,
      analytics.sentiments.neutral,
      analytics.sentiments.negative
    ];
    sentimentChartInstance.update();
  }

  // --- EMBED WIDGET CODE ---
  function updateEmbedSnippet() {
    const color = widgetColorPicker.value;
    const greeting = widgetGreetingInput.value;

    const snippet = `<!-- OmniSupport AI Chatbot Widget -->
<script src="https://cdn.jsdelivr.net/gh/omnisupport/widget@latest/omni_widget.js"
  data-bot-id="OMNI-PRO-889"
  data-theme-color="${color}"
  data-greeting="${escapeHTML(greeting)}">
</script>`;

    widgetCodeSnippet.value = snippet;
  }

  // --- EXPORT TRANSCRIPT ---
  function exportTranscript() {
    if (chatHistory.length === 0) {
      showNotification("No chat history to export yet.");
      return;
    }

    let transcript = "=== OMNISUPPORT AI CHAT TRANSCRIPT ===\n";
    transcript += `Exported Date: ${new Date().toLocaleString()}\n`;
    transcript += `Total Messages: ${chatHistory.length}\n\n`;

    chatHistory.forEach(msg => {
      transcript += `[${msg.timestamp}] ${msg.sender}: ${msg.text}\n\n`;
    });

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(transcript);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `chat_transcript_${Date.now()}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // --- UTILS & HELPERS ---
  function speakResponse(text) {
    if (!synth || !isVoiceEnabled) return;
    synth.cancel(); // stop previous speech

    // Strip markdown formatting symbols for natural speech
    const cleanSpeechText = text.replace(/[*#_`~\[\]]/g, "").replace(/\n+/g, ". ");
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    synth.speak(utterance);
  }

  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function parseMarkdownText(str) {
    if (!str) return "";
    let html = escapeHTML(str);
    
    // Bold **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Code `text`
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    // Bullet points \n- 
    html = html.replace(/\n-\s+(.*?)/g, '<br>• $1');
    // Newlines
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  function showNotification(msg) {
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${escapeHTML(msg)}`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
