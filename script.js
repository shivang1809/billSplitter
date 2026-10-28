/**
 * SettleQuick - Vanilla JavaScript Logic
 * High-Performance, Offline-First Bill Splitter & Settlement Ledger
 * Zero external libraries or frameworks.
 */

// Host + Default Friends Structure
const DEFAULT_HOST_NAME = 'Alex';
const DEFAULT_FRIENDS = [
  { id: 'p_1', name: 'person-1', isHost: false },
  { id: 'p_2', name: 'person-2', isHost: false }
];

const AVATAR_COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#ec4899', 
  '#8b5cf6', '#06b6d4', '#14b8a6', '#f97316'
];

let state = {
  currentStep: 1, // 1: Event & Host, 2: Friends & Settlement
  occasion: 'Friday Dinner with Friends',
  hostName: DEFAULT_HOST_NAME,
  currency: '₹',
  billAmount: '',
  tipPercent: 0,
  people: [
    { id: 'host', name: DEFAULT_HOST_NAME, isHost: true },
    ...DEFAULT_FRIENDS
  ],
  selectedPayerId: 'host',
  upiId: '',
  upiQrDataUrl: '',
  hasCalculated: false,
  lastSplitResult: null,
  settledDebtors: {}, // Map of debtor name -> boolean (marked paid by host)
  stickyNotes: [
    {
      id: 'note_init_1',
      authorName: DEFAULT_HOST_NAME,
      isHost: true,
      color: '#fef08a',
      mood: '🎉',
      message: 'Thanks everyone for coming to the dinner! Had a blast catching up.',
      timestamp: 'Just now'
    }
  ]
};

let personCounter = 2;
let activeStickyColor = '#fef08a';
let activeStickyMood = '😋';

// DOM Elements
const heroIntroSection = document.getElementById('heroIntroSection');
const btnGetStarted = document.getElementById('btnGetStarted');
const eventCreationSection = document.getElementById('eventCreationSection');

const eventCompactBar = document.getElementById('eventCompactBar');
const compactOccasionTitle = document.getElementById('compactOccasionTitle');
const compactHostName = document.getElementById('compactHostName');
const compactBillAmount = document.getElementById('compactBillAmount');
const btnEditEventCompact = document.getElementById('btnEditEventCompact');

const stepBtn1 = document.getElementById('stepBtn1');
const stepBtn2 = document.getElementById('stepBtn2');
const stepBtn3 = document.getElementById('stepBtn3');

const step1Card = document.getElementById('step1Card');
const step2Card = document.getElementById('step2Card');
const btnProceedToFriends = document.getElementById('btnProceedToFriends');
const btnBackToEvent = document.getElementById('btnBackToEvent');

const occasionInput = document.getElementById('occasionInput');
const hostNameInput = document.getElementById('hostNameInput');
const currencySelect = document.getElementById('currencySelect');
const billAmountInput = document.getElementById('billAmountInput');

const occasionErrorText = document.getElementById('occasionErrorText');
const hostErrorText = document.getElementById('hostErrorText');
const billErrorText = document.getElementById('billErrorText');

const peopleListContainer = document.getElementById('peopleList');
const peopleCountText = document.getElementById('peopleCountText');
const btnAddPerson = document.getElementById('btnAddPerson');
const payerSelect = document.getElementById('payerSelect');

const upiQrUploadInput = document.getElementById('upiQrUploadInput');
const upiIdInput = document.getElementById('upiIdInput');
const qrPreviewBox = document.getElementById('qrPreviewBox');
const qrPreviewImg = document.getElementById('qrPreviewImg');
const btnRemoveQr = document.getElementById('btnRemoveQr');

const btnCalculate = document.getElementById('btnCalculate');
const errorBanner = document.getElementById('errorBanner');
const errorBannerDesc = document.getElementById('errorBannerDesc');

const emptyPlaceholder = document.getElementById('emptyPlaceholder');
const resultsCard = document.getElementById('resultsCard');

const onlineStatusBadge = document.getElementById('onlineStatusBadge');
const btnSampleBill = document.getElementById('btnSampleBill');
const btnResetBill = document.getElementById('btnResetBill');
const resetModal = document.getElementById('resetModal');
const btnConfirmReset = document.getElementById('btnConfirmReset');
const btnCancelReset = document.getElementById('btnCancelReset');

// Results DOM Elements
const resOccasion = document.getElementById('resOccasion');
const resTotalAmount = document.getElementById('resTotalAmount');
const resPerPerson = document.getElementById('resPerPerson');
const exactMatchText = document.getElementById('exactMatchText');
const sharesListContainer = document.getElementById('sharesList');
const transfersListContainer = document.getElementById('transfersList');

// Host Payment Tracker Elements
const hostPaymentTrackerCard = document.getElementById('hostPaymentTrackerCard');
const trackerProgressBadge = document.getElementById('trackerProgressBadge');
const trackerProgressBar = document.getElementById('trackerProgressBar');
const trackerDebtorsList = document.getElementById('trackerDebtorsList');

// UPI Elements
const upiResultCard = document.getElementById('upiResultCard');
const upiResultQrBox = document.getElementById('upiResultQrBox');
const upiResultPayee = document.getElementById('upiResultPayee');
const upiResultIdText = document.getElementById('upiResultIdText');
const btnCopyUpi = document.getElementById('btnCopyUpi');

// Export Actions
const btnExportPdf = document.getElementById('btnExportPdf');
const btnPrintView = document.getElementById('btnPrintView');
const btnCopyText = document.getElementById('btnCopyText');

// Sticky Board Elements
const stickyAuthorSelect = document.getElementById('stickyAuthorSelect');
const stickyColorPalette = document.getElementById('stickyColorPalette');
const stickyMoodPalette = document.getElementById('stickyMoodPalette');
const stickyMessageInput = document.getElementById('stickyMessageInput');
const btnPinStickyNote = document.getElementById('btnPinStickyNote');
const stickyNotesGrid = document.getElementById('stickyNotesGrid');
const corkboardWatermark = document.getElementById('corkboardWatermark');
const btnDownloadStickyBoardJpg = document.getElementById('btnDownloadStickyBoardJpg');

const toastNotice = document.getElementById('toastNotice');
const toastMessage = document.getElementById('toastMessage');

// ==========================================
// Initialization & LocalStorage Persistence
// ==========================================

function initApp() {
  loadFromLocalStorage();
  setupNetworkListener();
  bindEvents();
  syncInputValues();
  renderPeopleList();
  updatePayerDropdown();
  updateStickyAuthorDropdown();
  renderStickyNotes();
  setStepView(state.currentStep);

  if (state.hasCalculated && isValidBill() && isValidPeople()) {
    calculateBill();
  } else {
    hideResults();
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('settlequick_app_state', JSON.stringify({
      currentStep: state.currentStep,
      occasion: state.occasion,
      hostName: state.hostName,
      currency: state.currency,
      billAmount: state.billAmount,
      tipPercent: state.tipPercent,
      people: state.people,
      selectedPayerId: state.selectedPayerId,
      upiId: state.upiId,
      upiQrDataUrl: state.upiQrDataUrl,
      hasCalculated: state.hasCalculated,
      lastSplitResult: state.lastSplitResult,
      settledDebtors: state.settledDebtors,
      stickyNotes: state.stickyNotes
    }));
  } catch (err) {
    console.warn('Unable to persist to localStorage:', err);
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('settlequick_app_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };

      if (!Array.isArray(state.people) || state.people.length === 0) {
        state.people = [
          { id: 'host', name: state.hostName || DEFAULT_HOST_NAME, isHost: true },
          ...DEFAULT_FRIENDS
        ];
      } else {
        const hostIndex = state.people.findIndex(p => p.isHost || p.id === 'host');
        if (hostIndex === -1) {
          state.people.unshift({ id: 'host', name: state.hostName || DEFAULT_HOST_NAME, isHost: true });
        } else if (hostIndex > 0) {
          const hostObj = state.people.splice(hostIndex, 1)[0];
          state.people.unshift(hostObj);
        }
      }

      if (!state.settledDebtors) state.settledDebtors = {};
      if (!Array.isArray(state.stickyNotes)) state.stickyNotes = [];

      updatePersonCounter();
    }
  } catch (err) {
    console.warn('Unable to parse saved state:', err);
  }
}

function updatePersonCounter() {
  let maxFound = 0;
  state.people.forEach(p => {
    const match = String(p.name).match(/^person-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxFound) maxFound = num;
    }
  });
  personCounter = Math.max(maxFound, state.people.length - 1);
}

function syncInputValues() {
  if (occasionInput) occasionInput.value = state.occasion || '';
  if (hostNameInput) hostNameInput.value = state.hostName || DEFAULT_HOST_NAME;
  if (currencySelect) currencySelect.value = state.currency || '₹';
  if (billAmountInput) billAmountInput.value = state.billAmount || '';
  if (upiIdInput) upiIdInput.value = state.upiId || '';

  // Tip buttons active state
  document.querySelectorAll('.tip-btn').forEach(btn => {
    const tip = parseInt(btn.dataset.tip, 10);
    if (tip === state.tipPercent) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  updateQrPreview();
}

// ==========================================
// Online / Offline Status Detection
// ==========================================

function setupNetworkListener() {
  function updateStatus() {
    if (!onlineStatusBadge) return;
    if (navigator.onLine) {
      onlineStatusBadge.className = 'status-badge';
      onlineStatusBadge.innerHTML = '<span class="pulse-dot"></span><span>100% Offline Ready</span>';
    } else {
      onlineStatusBadge.className = 'status-badge offline-mode';
      onlineStatusBadge.innerHTML = '<span class="pulse-dot"></span><span>Offline Mode (Active)</span>';
    }
  }
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();
}

// ==========================================
// Step Navigation & Elimination of Empty Space
// ==========================================

function setStepView(stepNumber) {
  state.currentStep = stepNumber;
  saveToLocalStorage();

  if (stepNumber === 1) {
    // Show Step 1 Card, Show Hero Section
    if (step1Card) step1Card.classList.add('active');
    if (step2Card) step2Card.classList.remove('active');
    if (heroIntroSection) heroIntroSection.classList.remove('hidden');
    if (eventCompactBar) eventCompactBar.style.display = 'none';

    if (stepBtn1) stepBtn1.classList.add('active');
    if (stepBtn2) stepBtn2.classList.remove('active');
    if (stepBtn3) stepBtn3.classList.remove('active');
  } else if (stepNumber === 2) {
    // Hide Step 1 Card COMPLETELY, Hide Hero Section to REMOVE USELESS EMPTY SPACE!
    if (step1Card) step1Card.classList.remove('active');
    if (step2Card) step2Card.classList.add('active');
    if (heroIntroSection) heroIntroSection.classList.add('hidden');

    // Show Compact Event Bar at top
    if (eventCompactBar) {
      eventCompactBar.style.display = 'flex';
      if (compactOccasionTitle) compactOccasionTitle.textContent = state.occasion || 'Dinner with Friends';
      if (compactHostName) compactHostName.textContent = state.hostName || DEFAULT_HOST_NAME;
      if (compactBillAmount) {
        const val = parseFloat(state.billAmount) || 0;
        compactBillAmount.textContent = `${state.currency}${formatCurrency(val)}`;
      }
    }

    if (stepBtn1) stepBtn1.classList.remove('active');
    if (stepBtn2) stepBtn2.classList.add('active');
    if (state.hasCalculated && stepBtn3) {
      stepBtn3.classList.add('active');
    } else if (stepBtn3) {
      stepBtn3.classList.remove('active');
    }
  }
}

// ==========================================
// Event Bindings
// ==========================================

function bindEvents() {
  // Hero CTA Button
  if (btnGetStarted) {
    btnGetStarted.addEventListener('click', () => {
      if (eventCreationSection) {
        eventCreationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          if (occasionInput) occasionInput.focus();
        }, 500);
      }
    });
  }

  // Stepper Header Navigation buttons
  if (stepBtn1) {
    stepBtn1.addEventListener('click', () => {
      setStepView(1);
    });
  }

  if (stepBtn2) {
    stepBtn2.addEventListener('click', () => {
      if (validateStep1()) {
        setStepView(2);
      }
    });
  }

  if (stepBtn3) {
    stepBtn3.addEventListener('click', () => {
      if (state.hasCalculated && resultsCard) {
        resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        handleCalculateClick();
      }
    });
  }

  // Compact bar Edit button
  if (btnEditEventCompact) {
    btnEditEventCompact.addEventListener('click', () => {
      setStepView(1);
      if (step1Card) {
        step1Card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Occasion input
  if (occasionInput) {
    occasionInput.addEventListener('input', (e) => {
      state.occasion = e.target.value.trim() || 'Dinner with Friends';
      clearInputError(occasionInput, occasionErrorText);
      saveToLocalStorage();
      if (corkboardWatermark) {
        corkboardWatermark.textContent = `${state.occasion} · Memory Board`;
      }
      if (state.hasCalculated) calculateBill();
    });
  }

  // Host Name input (Step 1)
  if (hostNameInput) {
    hostNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim() || DEFAULT_HOST_NAME;
      state.hostName = val;
      const hostPerson = state.people.find(p => p.isHost || p.id === 'host');
      if (hostPerson) {
        hostPerson.name = val;
      }
      clearInputError(hostNameInput, hostErrorText);
      saveToLocalStorage();
      renderPeopleList();
      updatePayerDropdown();
      updateStickyAuthorDropdown();
      if (state.hasCalculated) calculateBill();
    });
  }

  // Bill amount input
  if (billAmountInput) {
    billAmountInput.addEventListener('input', (e) => {
      state.billAmount = e.target.value;
      clearInputError(billAmountInput, billErrorText);
      hideErrorBanner();
      saveToLocalStorage();
    });

    billAmountInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        proceedFromStep1();
      }
    });
  }

  // Currency select
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      state.currency = e.target.value;
      saveToLocalStorage();
      if (state.hasCalculated) calculateBill();
    });
  }

  // Tip Selector buttons
  document.querySelectorAll('.tip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.tipPercent = parseInt(btn.dataset.tip, 10) || 0;
      saveToLocalStorage();
      if (state.hasCalculated) calculateBill();
    });
  });

  // Step 1 -> Step 2 Proceed Button
  if (btnProceedToFriends) {
    btnProceedToFriends.addEventListener('click', proceedFromStep1);
  }

  // Step 2 -> Step 1 Back Button
  if (btnBackToEvent) {
    btnBackToEvent.addEventListener('click', () => {
      setStepView(1);
    });
  }

  // Add person button (dynamic person-1, person-2, ...)
  if (btnAddPerson) {
    btnAddPerson.addEventListener('click', () => {
      addNewPerson();
    });
  }

  // Payer dropdown change
  if (payerSelect) {
    payerSelect.addEventListener('change', (e) => {
      state.selectedPayerId = e.target.value;
      saveToLocalStorage();
      if (state.hasCalculated) calculateBill();
    });
  }

  // UPI ID input
  if (upiIdInput) {
    upiIdInput.addEventListener('input', (e) => {
      state.upiId = e.target.value.trim();
      saveToLocalStorage();
      if (state.hasCalculated) updateUpiDisplay();
    });
  }

  // UPI QR Code Image Upload
  if (upiQrUploadInput) {
    upiQrUploadInput.addEventListener('change', handleQrFileUpload);
  }

  // Remove QR Button
  if (btnRemoveQr) {
    btnRemoveQr.addEventListener('click', () => {
      state.upiQrDataUrl = '';
      if (upiQrUploadInput) upiQrUploadInput.value = '';
      updateQrPreview();
      saveToLocalStorage();
      if (state.hasCalculated) updateUpiDisplay();
      showToast('QR code removed');
    });
  }

  // Primary Calculate Button
  if (btnCalculate) {
    btnCalculate.addEventListener('click', handleCalculateClick);
  }

  // Quick Sample Bill button
  if (btnSampleBill) {
    btnSampleBill.addEventListener('click', loadSampleDinner);
  }

  // Reset modal handlers
  if (btnResetBill && resetModal) {
    btnResetBill.addEventListener('click', () => {
      resetModal.classList.add('open');
    });
  }

  if (btnCancelReset && resetModal) {
    btnCancelReset.addEventListener('click', () => {
      resetModal.classList.remove('open');
    });
  }

  if (btnConfirmReset && resetModal) {
    btnConfirmReset.addEventListener('click', () => {
      resetModal.classList.remove('open');
      resetToDefault();
    });
  }

  // Copy UPI ID button
  if (btnCopyUpi) {
    btnCopyUpi.addEventListener('click', () => {
      if (!state.upiId) return;
      navigator.clipboard.writeText(state.upiId).then(() => {
        showToast('UPI ID copied to clipboard!');
      }).catch(() => {
        showToast('UPI ID: ' + state.upiId);
      });
    });
  }

  // Export PDF Button
  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', exportPdfSummary);
  }

  // Print / Save as PDF Button
  if (btnPrintView) {
    btnPrintView.addEventListener('click', () => {
      window.print();
    });
  }

  // Copy Text Summary for WhatsApp / Chat
  if (btnCopyText) {
    btnCopyText.addEventListener('click', copyTextSummary);
  }

  // Sticky Note Color Palette selection
  if (stickyColorPalette) {
    stickyColorPalette.querySelectorAll('.color-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        stickyColorPalette.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeStickyColor = btn.dataset.color || '#fef08a';
      });
    });
  }

  // Sticky Note Mood Palette selection
  if (stickyMoodPalette) {
    stickyMoodPalette.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        stickyMoodPalette.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeStickyMood = btn.dataset.mood || '😋';
      });
    });
  }

  // Pin Sticky Note Button
  if (btnPinStickyNote) {
    btnPinStickyNote.addEventListener('click', handleAddStickyNote);
  }

  // Download Sticky Board as JPG (Bottom Button)
  const btnDownloadStickyBoardJpgBottom = document.getElementById('btnDownloadStickyBoardJpgBottom');
  if (btnDownloadStickyBoardJpgBottom) {
    btnDownloadStickyBoardJpgBottom.addEventListener('click', exportStickyBoardAsJpg);
  }

  // Multi-Platform Share Buttons
  const btnShareWhatsApp = document.getElementById('btnShareWhatsApp');
  if (btnShareWhatsApp) {
    btnShareWhatsApp.addEventListener('click', () => {
      const payload = getSharePayload();
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(payload.text)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    });
  }

  const btnShareTelegram = document.getElementById('btnShareTelegram');
  if (btnShareTelegram) {
    btnShareTelegram.addEventListener('click', () => {
      const payload = getSharePayload();
      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(payload.url)}&text=${encodeURIComponent(payload.text)}`;
      window.open(tgUrl, '_blank', 'noopener,noreferrer');
    });
  }

  const btnShareTwitter = document.getElementById('btnShareTwitter');
  if (btnShareTwitter) {
    btnShareTwitter.addEventListener('click', () => {
      const payload = getSharePayload();
      const shortText = `Splitting bill for "${payload.occasion}" on SettleQuick!`;
      const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortText)}&url=${encodeURIComponent(payload.url)}`;
      window.open(twUrl, '_blank', 'noopener,noreferrer');
    });
  }

  const btnShareNative = document.getElementById('btnShareNative');
  if (btnShareNative) {
    btnShareNative.addEventListener('click', () => {
      const payload = getSharePayload();
      if (navigator.share) {
        navigator.share({
          title: `SettleQuick - ${payload.occasion}`,
          text: payload.text,
          url: payload.url
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(payload.text).then(() => {
          showToast('Event summary & link copied to clipboard!');
        }).catch(() => {
          showToast('Share link copied!');
        });
      }
    });
  }
}

function getSharePayload() {
  const occasion = state.occasion || 'Dinner with Friends';
  const bill = state.currency + formatCurrency(parseFloat(state.billAmount) || 0);
  const host = state.hostName || 'Host';
  const currentUrl = window.location.href;

  let text = `🧾 *SettleQuick Bill Split: ${occasion}*\n`;
  text += `💰 Total Bill: ${bill} (Host: ${host})\n`;

  if (state.lastSplitResult && state.lastSplitResult.shares) {
    const perPerson = state.currency + formatCurrency(state.lastSplitResult.totalBill / state.lastSplitResult.shares.length);
    text += `👥 Per-person share: ${perPerson}\n\n`;
    text += `*Individual Breakdown:*\n`;
    state.lastSplitResult.shares.forEach(s => {
      text += `• ${s.name}: ${state.currency}${formatCurrency(s.amount)}\n`;
    });
  }

  if (state.upiId) {
    text += `\n📱 Pay via UPI: ${state.upiId}\n`;
  }

  if (state.stickyNotes && state.stickyNotes.length > 0) {
    text += `\n💬 *Event Reviews & Memories:*\n`;
    state.stickyNotes.slice(0, 3).forEach(n => {
      text += `"${n.message}" - ${n.authorName} (${n.mood || '✨'})\n`;
    });
  }

  text += `\nSplit effortlessly with SettleQuick: ${currentUrl}`;
  return { occasion, text, url: currentUrl };
}

// ==========================================
// Step 1 Validation & Transition
// ==========================================

function validateStep1() {
  let isValid = true;

  const hostVal = (hostNameInput ? hostNameInput.value.trim() : state.hostName);
  if (!hostVal) {
    if (hostNameInput) {
      hostNameInput.classList.add('is-invalid');
      if (hostErrorText) hostErrorText.style.display = 'block';
    }
    isValid = false;
  }

  const billVal = parseFloat(billAmountInput ? billAmountInput.value : state.billAmount);
  if (isNaN(billVal) || billVal <= 0) {
    if (billAmountInput) {
      billAmountInput.classList.add('is-invalid');
      if (billErrorText) billErrorText.style.display = 'block';
    }
    isValid = false;
  }

  return isValid;
}

function proceedFromStep1() {
  if (!validateStep1()) {
    showToast('Please enter your name as host and a valid bill amount');
    return;
  }

  state.hostName = hostNameInput.value.trim() || DEFAULT_HOST_NAME;
  state.billAmount = billAmountInput.value;
  state.occasion = (occasionInput.value.trim() || 'Friday Dinner with Friends');

  let hostPerson = state.people.find(p => p.isHost || p.id === 'host');
  if (hostPerson) {
    hostPerson.name = state.hostName;
  } else {
    state.people.unshift({ id: 'host', name: state.hostName, isHost: true });
  }

  saveToLocalStorage();
  renderPeopleList();
  updatePayerDropdown();
  updateStickyAuthorDropdown();

  // Smooth transition to Step 2 (completely eliminates Step 1 and hero space!)
  setStepView(2);
  showToast(`Welcome ${state.hostName}! Now manage your friends roster.`);

  if (step2Card) {
    step2Card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ==========================================
// Dynamic Person Management (Host Locked, Default person-1, person-2...)
// ==========================================

function renderPeopleList() {
  if (!peopleListContainer) return;
  peopleListContainer.innerHTML = '';

  state.people.forEach((person, index) => {
    const item = document.createElement('div');
    const isHost = person.isHost === true || person.id === 'host';
    item.className = `person-item ${isHost ? 'is-host-item' : ''}`;
    item.dataset.id = person.id;

    const color = isHost ? '#2563eb' : AVATAR_COLORS[index % AVATAR_COLORS.length];
    const initial = isHost ? '👑' : (person.name || 'P').charAt(0).toUpperCase();

    if (isHost) {
      item.innerHTML = `
        <div class="person-avatar" style="background: linear-gradient(135deg, #2563eb, #10b981);" title="Event Host">
          ${initial}
        </div>
        <input type="text" 
               class="person-name-input" 
               value="${escapeHtml(person.name)}" 
               placeholder="Host Name" 
               aria-label="Host name"
               data-id="${person.id}" />
        <span class="host-locked-badge" title="The event organizer cannot be removed">
          🔒 Host (Locked)
        </span>
      `;
    } else {
      item.innerHTML = `
        <div class="person-avatar" style="background-color: ${color};">
          ${initial}
        </div>
        <input type="text" 
               class="person-name-input" 
               value="${escapeHtml(person.name)}" 
               placeholder="Friend Name" 
               aria-label="Friend name"
               data-id="${person.id}" />
        <button type="button" 
                class="btn-remove-person" 
                title="Remove ${escapeHtml(person.name)}" 
                aria-label="Remove person"
                data-id="${person.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;
    }

    const nameInput = item.querySelector('.person-name-input');
    nameInput.addEventListener('input', (e) => {
      person.name = e.target.value.trim() || (isHost ? DEFAULT_HOST_NAME : `person-${index}`);
      if (isHost) {
        state.hostName = person.name;
        if (hostNameInput) hostNameInput.value = person.name;
      } else {
        item.querySelector('.person-avatar').textContent = person.name.charAt(0).toUpperCase();
      }
      saveToLocalStorage();
      updatePayerDropdown();
      updateStickyAuthorDropdown();
      if (state.hasCalculated) calculateBill();
    });

    if (!isHost) {
      const removeBtn = item.querySelector('.btn-remove-person');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          removePerson(person.id, item);
        });
      }
    }

    peopleListContainer.appendChild(item);
  });

  if (peopleCountText) {
    peopleCountText.textContent = `${state.people.length} ${state.people.length === 1 ? 'person' : 'people'}`;
  }
}

function addNewPerson() {
  personCounter++;
  const defaultName = `person-${personCounter}`;
  const newPerson = {
    id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: defaultName,
    isHost: false
  };

  state.people.push(newPerson);
  saveToLocalStorage();
  renderPeopleList();
  updatePayerDropdown();
  updateStickyAuthorDropdown();

  if (peopleListContainer) {
    peopleListContainer.scrollTop = peopleListContainer.scrollHeight;
  }

  showToast(`Added ${defaultName}`);

  if (state.hasCalculated) {
    calculateBill();
  }
}

function removePerson(id, element) {
  const target = state.people.find(p => p.id === id);
  if (target && (target.isHost || target.id === 'host')) {
    showToast('The host cannot be removed from the event.');
    return;
  }

  element.classList.add('removing');
  setTimeout(() => {
    state.people = state.people.filter(p => p.id !== id);

    if (state.selectedPayerId === id) {
      state.selectedPayerId = 'host';
    }

    saveToLocalStorage();
    renderPeopleList();
    updatePayerDropdown();
    updateStickyAuthorDropdown();
    if (state.hasCalculated) calculateBill();
  }, 220);
}

function updatePayerDropdown() {
  if (!payerSelect) return;
  payerSelect.innerHTML = '';

  state.people.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.isHost 
      ? `👑 ${p.name} (Host) paid the bill` 
      : `${p.name} paid the bill`;

    if (state.selectedPayerId === p.id) {
      opt.selected = true;
    }
    payerSelect.appendChild(opt);
  });

  if (state.people.length > 0 && !state.people.some(p => p.id === state.selectedPayerId)) {
    state.selectedPayerId = state.people[0].id;
    if (payerSelect.options[0]) {
      payerSelect.options[0].selected = true;
    }
  }
}

function updateStickyAuthorDropdown() {
  if (!stickyAuthorSelect) return;
  const currentVal = stickyAuthorSelect.value;
  stickyAuthorSelect.innerHTML = '';

  state.people.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.isHost ? `👑 ${p.name} (Host)` : p.name;
    stickyAuthorSelect.appendChild(opt);
  });

  if (currentVal && Array.from(stickyAuthorSelect.options).some(o => o.value === currentVal)) {
    stickyAuthorSelect.value = currentVal;
  }
}

// ==========================================
// UPI QR Code Upload & Generation
// ==========================================

function handleQrFileUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file (PNG, JPG, SVG)');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('Image file too large. Please use under 5MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    state.upiQrDataUrl = evt.target.result;
    updateQrPreview();
    saveToLocalStorage();
    if (state.hasCalculated) updateUpiDisplay();
    showToast('UPI QR code uploaded successfully!');
  };
  reader.readAsDataURL(file);
}

function updateQrPreview() {
  if (!qrPreviewBox || !qrPreviewImg) return;
  if (state.upiQrDataUrl) {
    qrPreviewImg.src = state.upiQrDataUrl;
    qrPreviewBox.style.display = 'flex';
  } else {
    qrPreviewBox.style.display = 'none';
  }
}

function renderUpiQrOnCanvas(container, upiString) {
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.borderRadius = '4px';
  container.appendChild(canvas);

  renderStandardQrOnCanvas(canvas, upiString);
}

// ==========================================
// Standard ISO/IEC 18004 QR Code Generator (Model 2, Byte Mode)
// 100% Pure Vanilla JavaScript, Zero External Libraries or APIs
// ==========================================

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_EXP[i + 255] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  GF_LOG[0] = 0;
})();

function gfMul(x, y) {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function getRsPoly(ecCount) {
  let poly = [1];
  for (let i = 0; i < ecCount; i++) {
    const factor = [1, GF_EXP[i]];
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], 1);
      next[j + 1] ^= gfMul(poly[j], factor[1]);
    }
    poly = Array.from(next);
  }
  return poly;
}

function calcRsErrorCorrection(data, ecCount) {
  const gen = getRsPoly(ecCount);
  const remainder = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < ecCount - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    remainder[ecCount - 1] = gfMul(gen[ecCount], factor);
  }
  return remainder;
}

const QR_VERSIONS = [
  { version: 1, size: 21, dataCodewords: 19, ecCodewords: 7, maxBytes: 17, align: [] },
  { version: 2, size: 25, dataCodewords: 34, ecCodewords: 10, maxBytes: 32, align: [18] },
  { version: 3, size: 29, dataCodewords: 55, ecCodewords: 15, maxBytes: 53, align: [22] },
  { version: 4, size: 33, dataCodewords: 80, ecCodewords: 20, maxBytes: 78, align: [26] },
  { version: 5, size: 37, dataCodewords: 108, ecCodewords: 26, maxBytes: 106, align: [30] },
  { version: 6, size: 41, dataCodewords: 136, ecCodewords: 36, maxBytes: 134, align: [34] }
];

function generateStandardQrMatrix(text) {
  const textBytes = new TextEncoder().encode(text);

  // Pick smallest sufficient QR Version
  let vInfo = QR_VERSIONS[0];
  for (let i = 0; i < QR_VERSIONS.length; i++) {
    if (textBytes.length <= QR_VERSIONS[i].maxBytes) {
      vInfo = QR_VERSIONS[i];
      break;
    }
    if (i === QR_VERSIONS.length - 1) {
      vInfo = QR_VERSIONS[i];
    }
  }

  const { size, dataCodewords, ecCodewords, align } = vInfo;

  // Build Bitstream
  const bitStream = [];
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bitStream.push((val >> i) & 1);
    }
  }

  // 1. Mode indicator (0100 for Byte mode)
  pushBits(0b0100, 4);

  // 2. Character count indicator (8 bits for V1-V9 Byte mode)
  pushBits(textBytes.length, 8);

  // 3. Data bytes
  for (let i = 0; i < textBytes.length; i++) {
    pushBits(textBytes[i], 8);
  }

  // 4. Terminator (up to 4 zeroes)
  const maxDataBits = dataCodewords * 8;
  const termLen = Math.min(4, maxDataBits - bitStream.length);
  pushBits(0, termLen);

  // 5. Pad to multiple of 8
  while (bitStream.length % 8 !== 0) {
    bitStream.push(0);
  }

  // Convert bits to byte codewords
  const dataBytes = new Uint8Array(dataCodewords);
  let bIdx = 0;
  for (let i = 0; i < bitStream.length && bIdx < dataCodewords; i += 8) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) {
      byteVal = (byteVal << 1) | bitStream[i + j];
    }
    dataBytes[bIdx++] = byteVal;
  }

  // 6. Pad with alternating 0xEC and 0x11
  let padToggle = false;
  while (bIdx < dataCodewords) {
    dataBytes[bIdx++] = padToggle ? 0x11 : 0xec;
    padToggle = !padToggle;
  }

  // 7. Calculate Error Correction Codewords
  const ecBytes = calcRsErrorCorrection(dataBytes, ecCodewords);

  // 8. Combine total codewords
  const totalCodewords = new Uint8Array(dataCodewords + ecCodewords);
  totalCodewords.set(dataBytes, 0);
  totalCodewords.set(ecBytes, dataCodewords);

  // 9. Matrix construction
  const matrix = Array.from({ length: size }, () => new Int8Array(size).fill(-1));
  const isFunction = Array.from({ length: size }, () => new Uint8Array(size));

  function setModule(r, c, val, func = true) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val ? 1 : 0;
      if (func) isFunction[r][c] = 1;
    }
  }

  // Place Finder Patterns with 1-cell white separator
  function placeFinder(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          setModule(nr, nc, 0, true);
        } else if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          setModule(nr, nc, 1, true);
        } else {
          setModule(nr, nc, 0, true);
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const val = (i % 2 === 0) ? 1 : 0;
    setModule(6, i, val, true);
    setModule(i, 6, val, true);
  }

  // Alignment patterns
  if (align && align.length > 0) {
    align.forEach(center => {
      if (center === 6 || center === size - 7) return;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
          const isCenter = r === 0 && c === 0;
          setModule(center + r, center + c, isBorder || isCenter ? 1 : 0, true);
        }
      }
    });
  }

  // Dark module
  setModule(size - 8, 8, 1, true);

  // Reserve format information modules
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      setModule(8, i, 0, true);
      setModule(i, 8, 0, true);
    }
  }
  for (let i = size - 8; i < size; i++) {
    setModule(8, i, 0, true);
    setModule(i, 8, 0, true);
  }

  // 10. Data Bit Placement in zigzag order
  let bitIndex = 0;
  const totalBits = totalCodewords.length * 8;
  const totalBitArray = new Uint8Array(totalBits);
  for (let i = 0; i < totalCodewords.length; i++) {
    for (let b = 7; b >= 0; b--) {
      totalBitArray[i * 8 + (7 - b)] = (totalCodewords[i] >> b) & 1;
    }
  }

  let upward = true;
  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--; // Skip vertical timing column 6

    const rows = [];
    if (upward) {
      for (let r = size - 1; r >= 0; r--) rows.push(r);
    } else {
      for (let r = 0; r < size; r++) rows.push(r);
    }

    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      for (let c of [rightCol, rightCol - 1]) {
        if (!isFunction[r][c]) {
          const bit = bitIndex < totalBits ? totalBitArray[bitIndex++] : 0;
          // Apply Mask 0: (row + col) % 2 === 0
          const masked = bit ^ (((r + c) % 2 === 0) ? 1 : 0);
          matrix[r][c] = masked;
        }
      }
    }
    upward = !upward;
  }

  // 11. Format Information Bits (Level L, Mask 0 = 0x768B)
  const formatBits = 0x768B;
  const topCoords = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
    [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8],
    [2, 8], [1, 8], [0, 8]
  ];

  // Top-left finder (bits 14 down to 0)
  for (let i = 0; i < 15; i++) {
    const bit = (formatBits >> (14 - i)) & 1;
    const [r, c] = topCoords[i];
    matrix[r][c] = bit;
  }

  // Split positions: bottom-left (bits 0 to 6) and top-right (bits 7 to 14)
  for (let i = 0; i < 7; i++) {
    const bit = (formatBits >> i) & 1;
    matrix[size - 1 - i][8] = bit;
  }
  for (let i = 0; i < 8; i++) {
    const bit = (formatBits >> (7 + i)) & 1;
    matrix[8][size - 8 + i] = bit;
  }

  return matrix;
}

function renderStandardQrOnCanvas(canvas, text) {
  const matrix = generateStandardQrMatrix(text);
  const size = matrix.length;
  const quietZone = 4;
  const totalSize = size + quietZone * 2;

  // Use crisp integer cell sizing for high-contrast scan
  const cellSize = 8;
  const finalDim = cellSize * totalSize;

  canvas.width = finalDim;
  canvas.height = finalDim;
  canvas.style.width = '200px';
  canvas.style.height = '200px';
  canvas.style.maxWidth = '100%';
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, finalDim, finalDim);

  ctx.fillStyle = '#000000';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        ctx.fillRect(
          (c + quietZone) * cellSize,
          (r + quietZone) * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }
}

// ==========================================
// Bill Splitting Math & Validation
// ==========================================

function isValidBill() {
  const raw = parseFloat(state.billAmount);
  return !isNaN(raw) && raw > 0;
}

function isValidPeople() {
  return Array.isArray(state.people) && state.people.length > 0;
}

function handleCalculateClick() {
  const billVal = parseFloat(state.billAmount);
  const peopleCount = state.people.length;

  if (isNaN(billVal) || billVal <= 0 || peopleCount <= 0) {
    let msg = 'Please enter a valid bill amount greater than 0.';
    if (isNaN(billVal) || billVal <= 0) {
      if (billAmountInput) {
        billAmountInput.classList.add('is-invalid');
      }
      setStepView(1);
      if (billAmountInput) billAmountInput.focus();
      msg = 'Bill amount cannot be empty, zero, or negative. Please enter a positive amount.';
    } else if (peopleCount <= 0) {
      msg = 'Number of people must be at least 1.';
    }

    showErrorBanner(msg);
    hideResults();
    state.hasCalculated = false;
    saveToLocalStorage();
    return;
  }

  clearInputError(billAmountInput, billErrorText);
  hideErrorBanner();
  calculateBill();
}

function calculateBill() {
  const rawBill = parseFloat(state.billAmount);
  if (isNaN(rawBill) || rawBill <= 0 || state.people.length <= 0) {
    hideResults();
    return;
  }

  const tipMultiplier = 1 + (state.tipPercent / 100);
  const totalBill = rawBill * tipMultiplier;
  const count = state.people.length;

  const totalCents = Math.round(totalBill * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainderCents = totalCents % count;

  let verifiedSumCents = 0;
  const shares = state.people.map((person, index) => {
    const personCents = index < remainderCents ? baseCents + 1 : baseCents;
    verifiedSumCents += personCents;
    const amount = personCents / 100;
    return {
      id: person.id,
      name: person.name,
      isHost: person.isHost === true || person.id === 'host',
      cents: personCents,
      amount: amount
    };
  });

  let payer = state.people.find(p => p.id === state.selectedPayerId) || state.people[0];
  const payerId = payer ? payer.id : state.people[0].id;
  const payerName = payer ? payer.name : state.people[0].name;

  const balances = shares.map(s => {
    const isPayer = s.id === payerId;
    const paid = isPayer ? (totalCents / 100) : 0;
    const net = paid - s.amount;
    return {
      id: s.id,
      name: s.name,
      isHost: s.isHost,
      isPayer: isPayer,
      share: s.amount,
      paid: paid,
      net: net
    };
  });

  const transfers = [];
  balances.forEach(b => {
    if (!b.isPayer && b.share > 0) {
      transfers.push({
        from: b.name,
        to: payerName,
        amount: b.share
      });
    }
  });

  state.hasCalculated = true;
  state.lastSplitResult = {
    occasion: state.occasion || 'Dinner with Friends',
    rawBill,
    totalBill: totalCents / 100,
    tipPercent: state.tipPercent,
    currency: state.currency,
    shares,
    balances,
    transfers,
    payerName,
    payerId,
    verifiedSum: verifiedSumCents / 100
  };

  saveToLocalStorage();
  renderResults(state.lastSplitResult);
}

// ==========================================
// Render Results UI with Host Payment Tracker
// ==========================================

function renderResults(result) {
  if (!result) return;

  if (emptyPlaceholder) emptyPlaceholder.style.display = 'none';
  if (resultsCard) {
    resultsCard.classList.add('show');
  }

  if (stepBtn3) stepBtn3.classList.add('active');

  if (resOccasion) resOccasion.textContent = result.occasion;
  if (resTotalAmount) {
    resTotalAmount.textContent = `${result.currency}${formatCurrency(result.totalBill)}`;
  }

  if (resPerPerson) {
    const avg = (result.totalBill / result.shares.length);
    resPerPerson.textContent = `${result.currency}${formatCurrency(avg)}`;
  }

  if (exactMatchText) {
    exactMatchText.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>Exact cent match: sum (${result.currency}${formatCurrency(result.verifiedSum)}) == bill (${result.currency}${formatCurrency(result.totalBill)})</span>
    `;
  }

  // Individual Shares Breakdown
  if (sharesListContainer) {
    sharesListContainer.innerHTML = '';
    result.balances.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'share-card';

      const color = item.isHost ? '#2563eb' : AVATAR_COLORS[idx % AVATAR_COLORS.length];
      const initial = item.isHost ? '👑' : item.name.charAt(0).toUpperCase();

      let statusSubtext = '';
      if (item.isPayer) {
        statusSubtext = `<span style="color: #34d399; font-weight: 600;">Paid total bill &middot; Receives ${result.currency}${formatCurrency(item.net)} back</span>`;
      } else {
        const isSettled = !!state.settledDebtors[item.name];
        if (isSettled) {
          statusSubtext = `<span style="color: #34d399; font-weight: 600;">✓ Settled &amp; Marked as Paid to ${escapeHtml(result.payerName)}</span>`;
        } else {
          statusSubtext = `<span style="color: #f87171;">Owes ${result.currency}${formatCurrency(item.share)} to ${escapeHtml(result.payerName)}</span>`;
        }
      }

      card.innerHTML = `
        <div class="share-left">
          <div class="person-avatar" style="background-color: ${color}; width: 36px; height: 36px;">${initial}</div>
          <div>
            <div class="share-name">
              ${escapeHtml(item.name)} 
              ${item.isHost ? '<span style="font-size: 0.72rem; color: #fbbf24; margin-left: 4px;">(Host)</span>' : ''}
              ${item.isPayer ? '<span style="font-size: 0.72rem; color: #60a5fa; margin-left: 4px;">(Payer)</span>' : ''}
            </div>
            <div class="share-subtext">${statusSubtext}</div>
          </div>
        </div>
        <div class="share-amount-box">
          <div class="share-amount">${result.currency}${formatCurrency(item.share)}</div>
          <div style="font-size: 0.72rem; color: var(--text-dim);">individual share</div>
        </div>
      `;
      sharesListContainer.appendChild(card);
    });
  }

  // Settlement Transfers
  if (transfersListContainer) {
    transfersListContainer.innerHTML = '';
    if (result.transfers.length === 0) {
      transfersListContainer.innerHTML = `<div style="font-size: 0.8125rem; color: var(--text-muted); text-align: center; padding: 0.5rem;">Single person bill. No transfers needed!</div>`;
    } else {
      result.transfers.forEach(t => {
        const item = document.createElement('div');
        item.className = 'transfer-item';
        item.innerHTML = `
          <div class="transfer-flow">
            <span class="transfer-from">${escapeHtml(t.from)}</span>
            <span class="transfer-arrow">&rarr; pays &rarr;</span>
            <span class="transfer-to">${escapeHtml(t.to)}</span>
          </div>
          <div class="transfer-amount">${result.currency}${formatCurrency(t.amount)}</div>
        `;
        transfersListContainer.appendChild(item);
      });
    }
  }

  // RENDER HOST PAYMENT TRACKER (Visible only after bill split!)
  renderHostPaymentTracker(result);

  updateUpiDisplay();

  if (resultsCard) {
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ==========================================
// Host Payment Tracker Logic (Mark as Paid)
// ==========================================

function renderHostPaymentTracker(result) {
  if (!hostPaymentTrackerCard) return;

  const debtors = result.transfers;
  if (!debtors || debtors.length === 0) {
    hostPaymentTrackerCard.style.display = 'none';
    return;
  }

  hostPaymentTrackerCard.style.display = 'block';

  let settledCount = 0;
  debtors.forEach(d => {
    if (state.settledDebtors[d.from]) settledCount++;
  });

  const totalDebtors = debtors.length;
  const pct = Math.round((settledCount / totalDebtors) * 100);

  if (trackerProgressBadge) {
    trackerProgressBadge.textContent = `${settledCount} / ${totalDebtors} Paid (${pct}%)`;
  }
  if (trackerProgressBar) {
    trackerProgressBar.style.width = `${pct}%`;
  }

  if (trackerDebtorsList) {
    trackerDebtorsList.innerHTML = '';
    debtors.forEach(d => {
      const isSettled = !!state.settledDebtors[d.from];
      const row = document.createElement('div');
      row.className = `debtor-row ${isSettled ? 'is-settled' : ''}`;

      row.innerHTML = `
        <div class="debtor-info">
          <span style="font-size: 1.1rem;">${isSettled ? '✅' : '⏳'}</span>
          <div>
            <span class="debtor-name">${escapeHtml(d.from)}</span>
            <span class="debtor-amount">${result.currency}${formatCurrency(d.amount)}</span>
          </div>
        </div>
        <button type="button" class="btn-mark-paid" data-debtor="${escapeHtml(d.from)}">
          ${isSettled ? 'Settled ✓ (Undo)' : 'Mark as Paid ✓'}
        </button>
      `;

      const btn = row.querySelector('.btn-mark-paid');
      btn.addEventListener('click', () => {
        toggleDebtorPaid(d.from);
      });

      trackerDebtorsList.appendChild(row);
    });
  }
}

function toggleDebtorPaid(debtorName) {
  const current = !!state.settledDebtors[debtorName];
  state.settledDebtors[debtorName] = !current;
  saveToLocalStorage();

  if (state.lastSplitResult) {
    renderResults(state.lastSplitResult);
  }

  showToast(!current ? `${debtorName} marked as paid!` : `${debtorName} marked as unpaid.`);
}

// ==========================================
// Sticky Note Memory Board
// ==========================================

function renderStickyNotes() {
  if (!stickyNotesGrid) return;
  stickyNotesGrid.innerHTML = '';

  if (state.stickyNotes.length === 0) {
    stickyNotesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-dim); padding: 2rem; font-size: 0.875rem;">
        No memories pinned yet! Be the first to post a sticky note above.
      </div>
    `;
    return;
  }

  state.stickyNotes.forEach((note, index) => {
    const item = document.createElement('div');
    item.className = 'sticky-note';
    item.style.backgroundColor = note.color || '#fef08a';

    // Slight organic tilt
    const tilts = [-2, 1.5, -1, 2, -1.8, 1.2];
    const tilt = tilts[index % tilts.length];
    item.style.transform = `rotate(${tilt}deg)`;

    item.innerHTML = `
      <div class="sticky-pin-dot"></div>
      <div class="sticky-top-bar">
        <span class="sticky-author-tag">
          <span>${note.mood || '😋'}</span>
          <span>${escapeHtml(note.authorName)} ${note.isHost ? '(Host)' : ''}</span>
        </span>
        <button type="button" class="btn-delete-note" title="Delete note" data-id="${note.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
      <div class="sticky-text">${escapeHtml(note.message)}</div>
      <div class="sticky-footer-bar">
        <span>📍 Pinned</span>
        <span>${note.timestamp || 'Just now'}</span>
      </div>
    `;

    const delBtn = item.querySelector('.btn-delete-note');
    delBtn.addEventListener('click', () => {
      deleteStickyNote(note.id);
    });

    stickyNotesGrid.appendChild(item);
  });
}

function handleAddStickyNote() {
  const author = stickyAuthorSelect ? stickyAuthorSelect.value : state.hostName;
  const message = stickyMessageInput ? stickyMessageInput.value.trim() : '';

  if (!message) {
    showToast('Please type a message for your sticky note!');
    if (stickyMessageInput) stickyMessageInput.focus();
    return;
  }

  const isHost = author === state.hostName;
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newNote = {
    id: 'note_' + Date.now(),
    authorName: author,
    isHost: isHost,
    color: activeStickyColor,
    mood: activeStickyMood,
    message: message,
    timestamp: timeStr
  };

  state.stickyNotes.unshift(newNote);
  saveToLocalStorage();
  renderStickyNotes();

  if (stickyMessageInput) stickyMessageInput.value = '';
  showToast('Sticky note pinned to board! 📌');
}

function deleteStickyNote(id) {
  state.stickyNotes = state.stickyNotes.filter(n => n.id !== id);
  saveToLocalStorage();
  renderStickyNotes();
  showToast('Note deleted');
}

// ==========================================
// Offline Canvas JPG Exporter for Sticky Board
// ==========================================

function exportStickyBoardAsJpg() {
  if (state.stickyNotes.length === 0) {
    showToast('Please pin at least one sticky note before downloading the board!');
    return;
  }

  showToast('Rendering memory board image...');

  // Create high-res offscreen canvas
  const canvasWidth = 1200;
  const notesPerRow = 3;
  const noteW = 340;
  const noteH = 210;
  const paddingX = 40;
  const paddingY = 160;
  const gapX = 30;
  const gapY = 35;

  const totalNotes = state.stickyNotes.length;
  const rowCount = Math.ceil(totalNotes / notesPerRow);
  const canvasHeight = Math.max(750, paddingY + rowCount * (noteH + gapY) + 60);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  // 1. Draw Textured Background
  ctx.fillStyle = '#0f1624';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Subtle Corkboard Dots
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let x = 10; x < canvasWidth; x += 24) {
    for (let y = 10; y < canvasHeight; y += 24) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Wooden / Metal Border
  ctx.strokeStyle = '#25334c';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, canvasWidth - 12, canvasHeight - 12);

  // 2. Draw Header Banner
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(`📌 ${state.occasion || 'Dinner with Friends'} - Memory Board`, 45, 65);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px sans-serif';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  ctx.fillText(`Organized by ${state.hostName} · Total: ${state.currency}${formatCurrency(parseFloat(state.billAmount) || 0)} · Saved on ${dateStr}`, 45, 100);

  // Decorative divider line
  ctx.strokeStyle = '#24334c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(45, 125);
  ctx.lineTo(canvasWidth - 45, 125);
  ctx.stroke();

  // 3. Draw Each Sticky Note
  state.stickyNotes.forEach((note, index) => {
    const col = index % notesPerRow;
    const row = Math.floor(index / notesPerRow);
    const x = paddingX + col * (noteW + gapX);
    const y = paddingY + row * (noteH + gapY);

    ctx.save();
    // Tilt slightly
    const tilts = [-0.03, 0.025, -0.015, 0.02, -0.025, 0.015];
    const tilt = tilts[index % tilts.length];
    ctx.translate(x + noteW / 2, y + noteH / 2);
    ctx.rotate(tilt);
    ctx.translate(-(x + noteW / 2), -(y + noteH / 2));

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 8;

    // Note Paper
    ctx.fillStyle = note.color || '#fef08a';
    ctx.beginPath();
    ctx.roundRect(x, y, noteW, noteH, 6);
    ctx.fill();

    // Reset Shadow for content
    ctx.shadowColor = 'transparent';

    // Top Pin
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + noteW / 2, y + 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Author Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    const authorHeader = `${note.mood || '😋'} ${note.authorName} ${note.isHost ? '(Host)' : ''}`;
    ctx.fillText(authorHeader, x + 16, y + 36);

    // Note Message (Wrapped Text)
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px sans-serif';
    wrapCanvasText(ctx, note.message, x + 16, y + 66, noteW - 32, 20, 5);

    // Note Footer
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 16, y + noteH - 32);
    ctx.lineTo(x + noteW - 16, y + noteH - 32);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '11px sans-serif';
    ctx.fillText('📍 Pinned Memory', x + 16, y + noteH - 14);
    ctx.fillText(note.timestamp || '', x + noteW - 75, y + noteH - 14);

    ctx.restore();
  });

  // Footer Watermark
  ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.font = '12px sans-serif';
  ctx.fillText('Generated offline by SettleQuick', canvasWidth - 220, canvasHeight - 20);

  // 4. Download as JPG
  try {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Memory_Board_${sanitizeFilename(state.occasion)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Memory board downloaded as JPG! 📸');
  } catch (err) {
    console.error('Canvas export failed:', err);
    showToast('Unable to export JPG on this browser.');
  }
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text || '').split(' ');
  let line = '';
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1 && n < words.length - 1) {
        ctx.fillText(line + '...', x, y);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

// ==========================================
// Result State & Display Helpers
// ==========================================

function updateUpiDisplay() {
  if (!upiResultCard) return;

  const hasUpiImage = !!state.upiQrDataUrl;
  const hasUpiId = !!state.upiId;

  if (!hasUpiImage && !hasUpiId) {
    upiResultCard.classList.remove('active');
    return;
  }

  upiResultCard.classList.add('active');
  const payer = state.people.find(p => p.id === state.selectedPayerId) || state.people[0];
  const payerName = payer ? payer.name : 'Payer';

  if (upiResultPayee) {
    upiResultPayee.textContent = `Pay ${payerName} via UPI`;
  }

  if (upiResultIdText) {
    upiResultIdText.textContent = state.upiId ? `UPI ID: ${state.upiId}` : 'Scan QR code below with any UPI app';
  }

  if (btnCopyUpi) {
    btnCopyUpi.style.display = state.upiId ? 'inline-flex' : 'none';
  }

  if (upiResultQrBox) {
    upiResultQrBox.innerHTML = '';
    if (hasUpiImage) {
      const img = document.createElement('img');
      img.src = state.upiQrDataUrl;
      img.alt = 'Payer UPI QR Code';
      img.style.width = '170px';
      img.style.height = '170px';
      img.style.objectFit = 'contain';
      upiResultQrBox.appendChild(img);
    } else if (hasUpiId) {
      const upiIdClean = state.upiId.trim();
      const upiUri = `upi://pay?pa=${upiIdClean}&pn=${encodeURIComponent(payerName)}&cu=INR`;
      renderUpiQrOnCanvas(upiResultQrBox, upiUri);
    }
  }
}

function hideResults() {
  if (resultsCard) {
    resultsCard.classList.remove('show');
  }
  if (emptyPlaceholder) {
    emptyPlaceholder.style.display = 'flex';
  }
  if (stepBtn3) {
    stepBtn3.classList.remove('active');
  }
}

function showErrorBanner(message) {
  if (!errorBanner) return;
  if (errorBannerDesc) errorBannerDesc.textContent = message;
  errorBanner.classList.add('show');
}

function hideErrorBanner() {
  if (!errorBanner) return;
  errorBanner.classList.remove('show');
}

function clearInputError(input, errorTextEl) {
  if (input) input.classList.remove('is-invalid');
  if (errorTextEl) errorTextEl.style.display = 'none';
}

// ==========================================
// PDF Summary Export (100% Offline Pure JS)
// ==========================================

function exportPdfSummary() {
  if (!state.lastSplitResult) {
    showToast('Please calculate a bill first!');
    return;
  }

  const res = state.lastSplitResult;
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const title = `SettleQuick - Bill Split Summary`;
  const occasionText = `Occasion: ${res.occasion}`;
  const totalText = `Total Bill: ${res.currency} ${formatCurrency(res.totalBill)} (${res.shares.length} people)`;
  const payerText = `Settled By: ${res.payerName}`;

  let streamContent = `
BT
/F1 20 Tf
50 740 Td
(${sanitizePdf(title)}) Tj
ET

BT
/F2 10 Tf
50 715 Td
(Generated on ${sanitizePdf(dateStr)} | 100% Offline SettleQuick) Tj
ET

BT
/F1 12 Tf
50 675 Td
(${sanitizePdf(occasionText)}) Tj
ET

BT
/F1 12 Tf
50 655 Td
(${sanitizePdf(totalText)}) Tj
ET

BT
/F2 11 Tf
50 635 Td
(${sanitizePdf(payerText)}) Tj
ET

0.2 w
50 615 m 560 615 l S

BT
/F1 11 Tf
55 600 Td
(Member Name) Tj
250 600 Td
(Individual Share) Tj
400 600 Td
(Settlement Status) Tj
ET

0.2 w
50 590 m 560 590 l S
`;

  let yPos = 570;
  res.balances.forEach(b => {
    const isSettled = !!state.settledDebtors[b.name];
    let status = '';
    if (b.isPayer) {
      status = `Paid total (Gets ${res.currency}${formatCurrency(b.net)})`;
    } else if (isSettled) {
      status = `PAID & SETTLED to ${res.payerName} [Verified]`;
    } else {
      status = `Owes ${res.currency}${formatCurrency(b.share)} to ${res.payerName}`;
    }

    streamContent += `
BT
/F2 10 Tf
55 ${yPos} Td
(${sanitizePdf(b.name + (b.isHost ? ' [Host]' : ''))}) Tj
250 ${yPos} Td
(${sanitizePdf(res.currency + ' ' + formatCurrency(b.share))}) Tj
400 ${yPos} Td
(${sanitizePdf(status)}) Tj
ET
`;
    yPos -= 22;
  });

  yPos -= 15;
  streamContent += `
0.2 w
50 ${yPos} m 560 ${yPos} l S

BT
/F1 12 Tf
55 ${yPos - 20} Td
(Settlement Action Ledger:) Tj
ET
`;

  yPos -= 40;
  if (res.transfers.length === 0) {
    streamContent += `
BT
/F2 10 Tf
55 ${yPos} Td
(No transfers required - Single payer.) Tj
ET
`;
  } else {
    res.transfers.forEach(t => {
      const isSettled = !!state.settledDebtors[t.from];
      const transferLine = `-> ${t.from} pays ${res.currency} ${formatCurrency(t.amount)} to ${t.to} [${isSettled ? 'PAID' : 'PENDING'}]`;
      streamContent += `
BT
/F2 10 Tf
55 ${yPos} Td
(${sanitizePdf(transferLine)}) Tj
ET
`;
      yPos -= 20;
    });
  }

  yPos -= 25;
  streamContent += `
0.2 w
50 ${yPos} m 560 ${yPos} l S

BT
/F2 9 Tf
55 ${yPos - 18} Td
(Exact cent allocation verified: Shares add up exactly to the total bill with zero rounding error.) Tj
ET
`;

  const streamLength = streamContent.length;
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000325 00000 n 
0000000401 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
${450 + streamLength}
%%EOF`;

  try {
    const blob = new Blob([pdfString], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SettleQuick_${sanitizeFilename(res.occasion)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('PDF Summary exported successfully!');
  } catch (err) {
    console.error('PDF export failed:', err);
    window.print();
  }
}

function sanitizePdf(text) {
  return String(text || '').replace(/[\(\)\\]/g, '');
}

function sanitizeFilename(name) {
  return String(name || 'Bill').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function copyTextSummary() {
  if (!state.lastSplitResult) return;
  const res = state.lastSplitResult;
  let text = `🧾 *SettleQuick Bill Split: ${res.occasion}*\n`;
  text += `💰 *Total Bill:* ${res.currency}${formatCurrency(res.totalBill)}\n`;
  text += `👑 *Host:* ${state.hostName}\n`;
  text += `👤 *Settled by:* ${res.payerName}\n\n`;
  text += `*Individual Shares:*\n`;
  res.shares.forEach(s => {
    const isSettled = !!state.settledDebtors[s.name];
    text += `• ${s.name}: ${res.currency}${formatCurrency(s.amount)} ${isSettled ? '(PAID ✓)' : ''}\n`;
  });
  text += `\n*Settlement Steps:*\n`;
  if (res.transfers.length === 0) {
    text += `All settled!\n`;
  } else {
    res.transfers.forEach(t => {
      const isSettled = !!state.settledDebtors[t.from];
      text += `👉 ${t.from} pays ${res.currency}${formatCurrency(t.amount)} to ${t.to} ${isSettled ? '✅ [SETTLED]' : '⏳ [PENDING]'}\n`;
    });
  }
  if (state.upiId) {
    text += `\n📱 *UPI ID to Pay:* ${state.upiId}\n`;
  }

  navigator.clipboard.writeText(text).then(() => {
    showToast('Summary copied to clipboard!');
  }).catch(() => {
    showToast('Clipboard unavailable');
  });
}

// ==========================================
// Sample Data & Reset Handlers
// ==========================================

function loadSampleDinner() {
  state.occasion = 'Friday Dinner at Mario\'s';
  state.hostName = 'Alex';
  state.currency = '₹';
  state.billAmount = '1850';
  state.tipPercent = 10;
  personCounter = 3;
  state.people = [
    { id: 'host', name: 'Alex', isHost: true },
    { id: 'p_1', name: 'person-1', isHost: false },
    { id: 'p_2', name: 'person-2', isHost: false },
    { id: 'p_3', name: 'person-3', isHost: false }
  ];
  state.selectedPayerId = 'host';
  state.upiId = 'alex.pay@okhdfcbank';
  state.upiQrDataUrl = '';
  state.settledDebtors = { 'person-1': true };
  state.stickyNotes = [
    {
      id: 'sn_sample_1',
      authorName: 'Alex',
      isHost: true,
      color: '#fef08a',
      mood: '🍕',
      message: 'The woodfired margherita pizza was sensational! Thanks everyone for coming.',
      timestamp: '9:30 PM'
    },
    {
      id: 'sn_sample_2',
      authorName: 'person-1',
      isHost: false,
      color: '#bae6fd',
      mood: '😋',
      message: 'Best tiramisu in town! Already paid my share Alex 👍',
      timestamp: '9:35 PM'
    }
  ];

  saveToLocalStorage();
  syncInputValues();
  renderPeopleList();
  updatePayerDropdown();
  updateStickyAuthorDropdown();
  renderStickyNotes();
  clearInputError(billAmountInput, billErrorText);
  hideErrorBanner();
  setStepView(2);
  calculateBill();
  showToast('Loaded Sample Dinner Bill');
}

function resetToDefault() {
  personCounter = 2;
  state = {
    currentStep: 1,
    occasion: 'Dinner with Friends',
    hostName: DEFAULT_HOST_NAME,
    currency: '₹',
    billAmount: '',
    tipPercent: 0,
    people: [
      { id: 'host', name: DEFAULT_HOST_NAME, isHost: true },
      { id: 'p_1', name: 'person-1', isHost: false },
      { id: 'p_2', name: 'person-2', isHost: false }
    ],
    selectedPayerId: 'host',
    upiId: '',
    upiQrDataUrl: '',
    hasCalculated: false,
    lastSplitResult: null,
    settledDebtors: {},
    stickyNotes: []
  };

  try {
    localStorage.removeItem('settlequick_app_state');
  } catch (e) {}

  syncInputValues();
  renderPeopleList();
  updatePayerDropdown();
  updateStickyAuthorDropdown();
  renderStickyNotes();
  clearInputError(billAmountInput, billErrorText);
  hideErrorBanner();
  hideResults();
  setStepView(1);
  showToast('Reset to default state');
}

// ==========================================
// Utilities
// ==========================================

function formatCurrency(num) {
  if (isNaN(num)) return '0.00';
  return (Math.round(num * 100) / 100).toFixed(2);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let toastTimer = null;
function showToast(message) {
  if (!toastNotice || !toastMessage) return;
  toastMessage.textContent = message;
  toastNotice.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastNotice.classList.remove('show');
  }, 2600);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
