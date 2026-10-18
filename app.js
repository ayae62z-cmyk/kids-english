/**
 * ==========================================================================
 * LINGOBEE - Core Game Engine & Speech Synthesis
 * منصة لينجوبي - محرك التلعيب، النطق الصوتي التفاعلي، ونظام المكافآت
 * ==========================================================================
 */

// Global State
let userStars = parseInt(localStorage.getItem('kids_english_stars') || '10');
let soundEnabled = true;
let currentView = 'home';
let currentQuizQuestion = null;
let quizScore = 0;
let memoryCards = [];
let memoryFlipped = [];
let memoryMatchedCount = 0;
let currentSpellingWord = null;
let currentSpellingInput = [];
let quickEditMode = false;
let currentPhraseFilter = 'all';

function extractYouTubeId(urlOrId) {
  if (!urlOrId) return '';
  const str = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  return match ? match[1] : str;
}

function attachCardAdminActions(card, category, realIndex) {
  if (!quickEditMode) return;
  card.classList.add('in-edit-mode');
  const actionsWrap = document.createElement('div');
  actionsWrap.className = 'card-admin-actions';
  actionsWrap.innerHTML = `
    <button type="button" class="btn-card-edit" title="تعديل هذا العنصر">✏️</button>
    <button type="button" class="btn-card-delete" title="حذف هذا العنصر">🗑️</button>
  `;
  actionsWrap.querySelector('.btn-card-edit').onclick = (e) => {
    e.stopPropagation();
    LingoAdmin.openEditModal(category, realIndex);
  };
  actionsWrap.querySelector('.btn-card-delete').onclick = (e) => {
    e.stopPropagation();
    LingoAdmin.deleteItem(category, realIndex);
  };
  card.appendChild(actionsWrap);
}

// ==========================================================================
// 1. Audio Synthesizer (Web Audio API - No external audio files needed!)
// ==========================================================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playPopSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch (e) {
    console.warn(e);
  }
}

function playCorrectSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.26);
    });
  } catch (e) {}
}

function playWrongSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.21);
  } catch (e) {}
}

function playFanfareSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const notes = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.50];
    const times = [0, 0.12, 0.24, 0.36, 0.48, 0.65];
    const lens = [0.1, 0.1, 0.1, 0.1, 0.15, 0.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + times[idx];
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + lens[idx]);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + lens[idx] + 0.05);
    });
  } catch (e) {}
}

// ==========================================================================
// 2. Dual-Engine Speech Synthesis & Universal Audio Fallback
// ==========================================================================
let englishVoice = null;
window._activeUtterances = [];
let audioUnlocked = false;
let fallbackAudioEl = null;

function getFallbackAudio() {
  if (!fallbackAudioEl) {
    fallbackAudioEl = new Audio();
    fallbackAudioEl.crossOrigin = "anonymous";
  }
  return fallbackAudioEl;
}

// Unlock audio on iOS, Android, and WebViews on the very first touch/click
function unlockAudioEngine() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  // 1. Web Audio Context Unlock
  try {
    const ctx = getAudioCtx();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch (e) {}

  // 2. Speech Synthesis Warmup (crucial for iOS Safari)
  try {
    if ('speechSynthesis' in window && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(u);
    }
  } catch (e) {}

  // 3. HTML5 Audio Warmup
  try {
    const a = getFallbackAudio();
    a.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    a.play().catch(() => {});
  } catch (e) {}
}

window.addEventListener('click', unlockAudioEngine, { passive: true });
window.addEventListener('touchstart', unlockAudioEngine, { passive: true });
window.addEventListener('pointerdown', unlockAudioEngine, { passive: true });

function loadVoices() {
  if (!('speechSynthesis' in window) || !window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices() || [];
  englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Daniel') || v.name.includes('Ava') || v.name.includes('Zira'))) ||
                 voices.find(v => v.lang === 'en-US') ||
                 voices.find(v => v.lang.startsWith('en')) || null;
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

// Clean text for audio TTS (removes emojis and special chars)
function cleanTextForAudio(text) {
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
             .replace(/[!?,.:;]/g, ' ')
             .replace(/\s+/g, ' ')
             .trim();
}

// Universal Audio Fallback (works in WhatsApp WebView and on all phones)
function speakWithAudioFallback(text) {
  if (!soundEnabled) return;
  try {
    const clean = cleanTextForAudio(text);
    if (!clean) return;

    const audio = getFallbackAudio();
    audio.pause();
    
    // High quality native US English pronunciation dictionary stream
    audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(clean)}&type=2`;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Backup Google TTS stream
        audio.src = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(clean)}`;
        audio.play().catch(e => console.warn('Audio stream fallback failed:', e));
      });
    }
  } catch (err) {
    console.warn('Fallback audio failed:', err);
  }
}

function speakWord(text, rate = 0.9, pitch = 1.1) {
  if (!soundEnabled) return;

  unlockAudioEngine();

  const hasSynth = ('speechSynthesis' in window) && window.speechSynthesis;

  if (!hasSynth) {
    // WebViews without Speech Synthesis
    speakWithAudioFallback(text);
    return;
  }

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    if (!englishVoice) {
      loadVoices();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = pitch;

    let hasStarted = false;

    utterance.onstart = () => {
      hasStarted = true;
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error, falling back to audio stream:', e);
      speakWithAudioFallback(text);
    };

    window._activeUtterances.push(utterance);
    utterance.onend = () => {
      const idx = window._activeUtterances.indexOf(utterance);
      if (idx !== -1) window._activeUtterances.splice(idx, 1);
    };

    window.speechSynthesis.speak(utterance);

    // Timeout safety net (e.g. Android with missing voice pack)
    setTimeout(() => {
      if (!hasStarted && window.speechSynthesis.speaking === false) {
        speakWithAudioFallback(text);
      }
    }, 450);

  } catch (err) {
    console.warn('SpeechSynthesis failed, using fallback:', err);
    speakWithAudioFallback(text);
  }
}

// User-Facing Sound Test Function
function testSoundWithVoice() {
  unlockAudioEngine();
  soundEnabled = true;
  const toggleBtn = document.getElementById('soundToggleBtn');
  if (toggleBtn) {
    toggleBtn.innerHTML = '🔊';
    toggleBtn.style.opacity = '1';
  }

  // Play pleasant arpeggio chime
  playCorrectSound();

  // Speak greeting
  setTimeout(() => {
    speakWord('Hello! Welcome to LingoBee!');
  }, 250);

  // Animate the button to show it worked
  const testBtn = document.getElementById('soundTestBtn');
  if (testBtn) {
    testBtn.innerText = '🎵 الصوت يعمل!';
    testBtn.style.background = '#10B981';
    testBtn.style.color = '#FFF';
    setTimeout(() => {
      testBtn.innerText = '🔊 جرّب الصوت';
      testBtn.style.background = '';
      testBtn.style.color = '';
    }, 2000);
  }
}

// ==========================================================================
// 3. Navigation & View Routing
// ==========================================================================
function switchView(viewName) {
  playPopSound();
  currentView = viewName;

  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.nav-pill').forEach(btn => btn.classList.remove('active'));

  const targetSec = document.getElementById(`view-${viewName}`);
  if (targetSec) targetSec.classList.add('active');

  const targetBtn = document.querySelector(`.nav-pill[data-view="${viewName}"]`);
  if (targetBtn) targetBtn.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (viewName === 'games') {
    startQuizGame();
  } else if (viewName === 'phrases') {
    renderPhrases('all');
  } else if (viewName === 'videos') {
    renderVideos('all');
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('soundToggleBtn');
  if (btn) {
    btn.innerHTML = soundEnabled ? '🔊' : '🔇';
    btn.style.opacity = soundEnabled ? '1' : '0.6';
  }
}

function addStars(num = 1) {
  userStars += num;
  localStorage.setItem('kids_english_stars', userStars.toString());
  const starCountEl = document.getElementById('starCounter');
  if (starCountEl) {
    starCountEl.innerText = userStars;
  }
  const badge = document.querySelector('.star-badge');
  if (badge) {
    badge.classList.remove('pop');
    void badge.offsetWidth;
    badge.classList.add('pop');
  }
}

// ==========================================================================
// 4. Render Modules
// ==========================================================================

// Alphabet
function renderAlphabet() {
  const container = document.getElementById('alphabetGrid');
  if (!container) return;
  container.innerHTML = '';

  ALPHABET_DATA.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'alpha-card';
    card.innerHTML = `
      <div class="alpha-letter">${item.letter}${item.small}</div>
      <span class="alpha-emoji">${item.emoji}</span>
      <div class="alpha-word">${item.word}</div>
      <div class="alpha-ar">${item.arabic}</div>
    `;
    card.onclick = () => {
      if (quickEditMode) {
        LingoAdmin.openEditModal('alphabet', index);
        return;
      }
      playPopSound();
      speakWord(`${item.letter}. ${item.word}!`);
      addStars(1);
    };
    attachCardAdminActions(card, 'alphabet', index);
    container.appendChild(card);
  });
}

// Numbers
function renderNumbers() {
  const container = document.getElementById('numbersGrid');
  if (!container) return;
  container.innerHTML = '';

  NUMBERS_DATA.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'num-card';
    const countVal = item.count !== undefined ? item.count : (item.num || 1);
    const itemsPreview = item.emoji.repeat(Math.min(countVal, 6)) + (countVal > 6 ? '...' : '');
    card.innerHTML = `
      <div class="num-digit">${item.num}</div>
      <div class="num-word">${item.word}</div>
      <div class="num-ar">${item.arabic}</div>
      <div class="num-items">${itemsPreview}</div>
    `;
    card.onclick = () => {
      if (quickEditMode) {
        LingoAdmin.openEditModal('numbers', index);
        return;
      }
      playPopSound();
      speakWord(`${item.num}. ${item.word}!`);
      addStars(1);
    };
    attachCardAdminActions(card, 'numbers', index);
    container.appendChild(card);
  });
}

// Animals
function renderAnimals() {
  const container = document.getElementById('animalsGrid');
  if (!container) return;
  container.innerHTML = '';

  ANIMALS_DATA.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.style.backgroundColor = item.bg || '#FFF';
    card.innerHTML = `
      <span class="item-emoji">${item.emoji}</span>
      <div class="item-word">${item.word}</div>
      <div class="item-ar">${item.arabic}</div>
      <span class="item-tag">${item.category}</span>
    `;
    card.onclick = () => {
      if (quickEditMode) {
        LingoAdmin.openEditModal('animals', index);
        return;
      }
      playPopSound();
      speakWord(`${item.word}! ${item.sound || ''}`);
      addStars(1);
    };
    attachCardAdminActions(card, 'animals', index);
    container.appendChild(card);
  });
}

// Colors & Shapes
function renderColorsAndShapes() {
  const colContainer = document.getElementById('colorsGrid');
  if (colContainer) {
    colContainer.innerHTML = '';
    COLORS_DATA.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div style="width: 60px; height: 60px; border-radius: 50%; background-color: ${item.hex}; border: 3px solid #FFF; box-shadow: 0 4px 8px rgba(0,0,0,0.15); margin: 0 auto 0.75rem;"></div>
        <div class="item-word">${item.word}</div>
        <div class="item-ar">${item.arabic}</div>
        <div style="font-size: 0.8rem; color: #64748B; margin-top: 0.3rem;">${item.example || ''}</div>
      `;
      card.onclick = () => {
        if (quickEditMode) {
          LingoAdmin.openEditModal('colors', index);
          return;
        }
        playPopSound();
        speakWord(`${item.word}! ${item.example || ''}`);
        addStars(1);
      };
      attachCardAdminActions(card, 'colors', index);
      colContainer.appendChild(card);
    });
  }

  const shpContainer = document.getElementById('shapesGrid');
  if (shpContainer) {
    shpContainer.innerHTML = '';
    SHAPES_DATA.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <span class="item-emoji">${item.emoji}</span>
        <div class="item-word">${item.word}</div>
        <div class="item-ar">${item.arabic}</div>
        <div style="font-size: 0.8rem; color: #64748B; margin-top: 0.3rem;">${item.desc || ''}</div>
      `;
      card.onclick = () => {
        if (quickEditMode) {
          LingoAdmin.openEditModal('shapes', index);
          return;
        }
        playPopSound();
        speakWord(`${item.word}!`);
        addStars(1);
      };
      attachCardAdminActions(card, 'shapes', index);
      shpContainer.appendChild(card);
    });
  }
}

// Fruits
function renderFruits() {
  const container = document.getElementById('fruitsGrid');
  if (!container) return;
  container.innerHTML = '';

  FRUITS_DATA.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <span class="item-emoji">${item.emoji}</span>
      <div class="item-word">${item.word}</div>
      <div class="item-ar">${item.arabic}</div>
    `;
    card.onclick = () => {
      if (quickEditMode) {
        LingoAdmin.openEditModal('fruits', index);
        return;
      }
      playPopSound();
      speakWord(`${item.word}! Delicious!`);
      addStars(1);
    };
    attachCardAdminActions(card, 'fruits', index);
    container.appendChild(card);
  });
}

// ==========================================================================
// 5. Interactive Games Hub
// ==========================================================================

function switchGameMode(mode) {
  playPopSound();
  document.querySelectorAll('.game-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.game-sub-view').forEach(v => v.style.display = 'none');

  const activeBtn = document.querySelector(`.game-tab-btn[data-mode="${mode}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const activeView = document.getElementById(`game-mode-${mode}`);
  if (activeView) activeView.style.display = 'block';

  if (mode === 'quiz') startQuizGame();
  else if (mode === 'memory') startMemoryGame();
  else if (mode === 'spelling') startSpellingGame();
  else if (mode === 'balloons') startBalloonGame();
}

// Game 1: Listen & Pick Quiz
function getQuizPool() {
  const pool = [];
  if (Array.isArray(ANIMALS_DATA)) ANIMALS_DATA.forEach(a => pool.push({ word: a.word, arabic: a.arabic, emoji: a.emoji }));
  if (Array.isArray(FRUITS_DATA)) FRUITS_DATA.forEach(f => pool.push({ word: f.word, arabic: f.arabic, emoji: f.emoji }));
  if (Array.isArray(ALPHABET_DATA)) ALPHABET_DATA.forEach(l => pool.push({ word: l.word, arabic: l.arabic, emoji: l.emoji }));
  return pool.length >= 4 ? pool : [
    { word: 'Apple', arabic: 'تفاحة', emoji: '🍎' },
    { word: 'Cat', arabic: 'قطة', emoji: '🐱' },
    { word: 'Dog', arabic: 'كلب', emoji: '🐶' },
    { word: 'Sun', arabic: 'شمس', emoji: '☀️' }
  ];
}

function startQuizGame() {
  const pool = getQuizPool().sort(() => 0.5 - Math.random());
  currentQuizQuestion = pool[0];

  const options = [currentQuizQuestion, pool[1], pool[2], pool[3]].sort(() => 0.5 - Math.random());

  const container = document.getElementById('quizOptionsContainer');
  if (!container) return;
  container.innerHTML = '';

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-btn';
    btn.innerHTML = `<span style="font-size: 2.2rem;">${opt.emoji}</span> <span>${opt.word}</span>`;
    btn.onclick = () => handleQuizChoice(opt, btn);
    container.appendChild(btn);
  });

  setTimeout(() => {
    repeatQuizAudio();
  }, 350);
}

function repeatQuizAudio() {
  if (currentQuizQuestion) {
    speakWord(`Find the: ${currentQuizQuestion.word}!`, 0.85);
  }
}

function handleQuizChoice(selected, btnEl) {
  if (!currentQuizQuestion) return;

  if (selected.word === currentQuizQuestion.word) {
    btnEl.classList.add('correct');
    playCorrectSound();
    addStars(5);
    speakWord(`Great job! It is ${currentQuizQuestion.word}!`);

    setTimeout(() => {
      showCelebration('رائع جداً! 🎉', `لقد اخترت كلمة (${currentQuizQuestion.word}) بشكل صحيح!`, 5);
      startQuizGame();
    }, 1200);
  } else {
    btnEl.classList.add('wrong');
    playWrongSound();
    speakWord(`Try again! Listen closely: ${currentQuizQuestion.word}`);
    setTimeout(() => {
      btnEl.classList.remove('wrong');
    }, 600);
  }
}

// Game 2: Memory Match Game
function startMemoryGame() {
  const container = document.getElementById('memoryGridContainer');
  if (!container) return;
  container.innerHTML = '';
  memoryFlipped = [];
  memoryMatchedCount = 0;

  // Pick 6 random items with rich visual emojis from animals and fruits
  const pool = [...ANIMALS_DATA, ...FRUITS_DATA].sort(() => 0.5 - Math.random()).slice(0, 6);
  const deck = [];
  
  // Create matching pairs - both cards have clear colorful pictures and words
  pool.forEach((item, idx) => {
    deck.push({ id: idx, emoji: item.emoji, word: item.word, arabic: item.arabic });
    deck.push({ id: idx, emoji: item.emoji, word: item.word, arabic: item.arabic });
  });

  deck.sort(() => 0.5 - Math.random());
  memoryCards = deck;

  deck.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'memory-card';
    el.dataset.index = i;
    el.innerHTML = '<span class="card-face-down">❓</span>';
    el.onclick = () => handleMemoryFlip(i, el);
    container.appendChild(el);
  });
}

function handleMemoryFlip(index, cardEl) {
  if (memoryFlipped.length >= 2 || cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) {
    return;
  }

  playPopSound();
  const cardData = memoryCards[index];
  cardEl.classList.add('flipped');
  cardEl.innerHTML = `
    <div class="card-content">
      <span class="card-img">${cardData.emoji}</span>
      <span class="card-word">${cardData.word}</span>
      <span class="card-ar">${cardData.arabic}</span>
    </div>
  `;

  speakWord(cardData.word);
  memoryFlipped.push({ index, data: cardData, el: cardEl });

  if (memoryFlipped.length === 2) {
    const [c1, c2] = memoryFlipped;
    if (c1.data.id === c2.data.id) {
      // Matched!
      setTimeout(() => {
        playCorrectSound();
        c1.el.classList.add('matched');
        c2.el.classList.add('matched');
        memoryFlipped = [];
        memoryMatchedCount++;
        addStars(5);

        if (memoryMatchedCount === 6) {
          playFanfareSound();
          setTimeout(() => {
            showCelebration('بطل الذاكرة! 🏆', 'أكملت جميع بطاقات الذاكرة والصور بنجاح مبهر!', 10);
            startMemoryGame();
          }, 600);
        }
      }, 500);
    } else {
      // Not matched
      setTimeout(() => {
        playWrongSound();
        c1.el.classList.remove('flipped');
        c1.el.innerHTML = '<span class="card-face-down">❓</span>';
        c2.el.classList.remove('flipped');
        c2.el.innerHTML = '<span class="card-face-down">❓</span>';
        memoryFlipped = [];
      }, 900);
    }
  }
}

// Game 3: Spelling Pop
function startSpellingGame() {
  const words = [...SPELLING_WORDS].sort(() => 0.5 - Math.random());
  currentSpellingWord = words[0];
  currentSpellingInput = [];

  const emojiEl = document.getElementById('spellingEmoji');
  const hintEl = document.getElementById('spellingArabicHint');
  if (emojiEl) emojiEl.innerText = currentSpellingWord.emoji;
  if (hintEl) hintEl.innerText = currentSpellingWord.arabic;

  const targetSlots = document.getElementById('spellingSlotsContainer');
  if (targetSlots) {
    targetSlots.innerHTML = '';
    for (let i = 0; i < currentSpellingWord.word.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'spell-slot';
      slot.dataset.index = i;
      targetSlots.appendChild(slot);
    }
  }

  const letters = currentSpellingWord.word.split('').sort(() => 0.5 - Math.random());
  const bubblesContainer = document.getElementById('spellingBubblesContainer');
  if (bubblesContainer) {
    bubblesContainer.innerHTML = '';
    letters.forEach(char => {
      const bubble = document.createElement('div');
      bubble.className = 'letter-bubble';
      bubble.innerText = char;
      bubble.onclick = () => handleLetterBubbleClick(char, bubble);
      bubblesContainer.appendChild(bubble);
    });
  }

  speakWord(currentSpellingWord.word);
}

function handleLetterBubbleClick(char, bubbleEl) {
  if (bubbleEl.style.opacity === '0.2') return;

  playPopSound();
  speakWord(char);

  const neededIndex = currentSpellingInput.length;
  const targetChar = currentSpellingWord.word[neededIndex];

  if (char === targetChar) {
    currentSpellingInput.push(char);
    bubbleEl.style.opacity = '0.2';
    bubbleEl.style.pointerEvents = 'none';

    const slot = document.querySelectorAll('.spell-slot')[neededIndex];
    if (slot) {
      slot.innerText = char;
      slot.classList.add('filled');
    }

    if (currentSpellingInput.length === currentSpellingWord.word.length) {
      playCorrectSound();
      speakWord(`Super! ${currentSpellingWord.word}!`);
      addStars(5);
      setTimeout(() => {
        showCelebration('تهجئة عبقرية! 🌟', `لقد قمت بتهجئة كلمة (${currentSpellingWord.word}) بشكل سليم!`, 5);
        startSpellingGame();
      }, 1200);
    }
  } else {
    playWrongSound();
    speakWord(`Oops! Try another letter for ${currentSpellingWord.word}`);
    bubbleEl.style.animation = 'shakeWrong 0.4s ease';
    setTimeout(() => bubbleEl.style.animation = '', 400);
  }
}

// Celebration Modal
function showCelebration(title, msg, starsEarned = 5) {
  const modal = document.getElementById('celebModalOverlay');
  if (!modal) return;

  document.getElementById('celebTitle').innerText = title;
  document.getElementById('celebMsg').innerText = msg;
  document.getElementById('celebStarsText').innerText = `+${starsEarned} ⭐ نجوم جديدة!`;
  modal.classList.add('open');

  playFanfareSound();
}

function closeCelebration() {
  playPopSound();
  const modal = document.getElementById('celebModalOverlay');
  if (modal) modal.classList.remove('open');
}

function openCertificateFromCeleb() {
  closeCelebration();
  setTimeout(() => {
    openCertificateModal();
  }, 200);
}

// ==========================================================================
// 6. Daily Phrases World Module
// ==========================================================================
function renderPhrases(filter = 'all') {
  currentPhraseFilter = filter;
  const container = document.getElementById('phrasesGrid');
  if (!container) return;
  container.innerHTML = '';

  const filtered = filter === 'all'
    ? DAILY_PHRASES_DATA
    : DAILY_PHRASES_DATA.filter(item => item.category === filter);

  filtered.forEach(item => {
    const realIndex = DAILY_PHRASES_DATA.indexOf(item);
    const card = document.createElement('div');
    card.className = 'phrase-card';
    card.style.borderTop = `6px solid ${item.color || '#3A86FF'}`;
    card.innerHTML = `
      <div class="phrase-top-row">
        <span class="phrase-tag-badge" style="color: ${item.color || '#3A86FF'}; background: ${item.color || '#3A86FF'}15;">${item.categoryAr || item.category}</span>
        <span class="phrase-emoji-box">${item.emoji}</span>
      </div>
      <div class="phrase-content-box">
        <div class="phrase-english-text">${item.phrase}</div>
        <div class="phrase-pronounce-text">نطق: ${item.pronunciation || ''}</div>
        <div class="phrase-arabic-text">${item.arabic}</div>
      </div>
      <button type="button" class="phrase-audio-btn" style="background: linear-gradient(135deg, ${item.color || '#3A86FF'}, #0F172A);" title="استمع وكرر">
        <span>🔊</span> استمع وردد
      </button>
    `;

    card.onclick = () => {
      if (quickEditMode) {
        LingoAdmin.openEditModal('phrases', realIndex);
        return;
      }
      playPopSound();
      speakWord(item.phrase, 0.82);
      addStars(1);
    };

    attachCardAdminActions(card, 'phrases', realIndex);
    container.appendChild(card);
  });
}

function filterPhrases(category, btn) {
  playPopSound();
  document.querySelectorAll('.phrases-filter-bar .filter-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderPhrases(category);
}

// ==========================================================================
// 7. Balloon Pop Game Module (لعبة فرقعة البالونات)
// ==========================================================================
let balloonStreak = 0;
let balloonPopsCount = 0;
let currentBalloonTarget = null;
let balloonCategory = 'words';

const BALLOON_COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06D6A0', '#FB5607'
];

function openBalloonGameDirect() {
  switchView('games');
  switchGameMode('balloons');
}

function changeBalloonCategory(category) {
  balloonCategory = category;
  balloonStreak = 0;
  updateBalloonCounters();
  startBalloonGame();
}

function updateBalloonCounters() {
  const streakEl = document.getElementById('balloonStreakCounter');
  const popsEl = document.getElementById('balloonPopsCounter');
  if (streakEl) streakEl.innerText = balloonStreak;
  if (popsEl) popsEl.innerText = balloonPopsCount;
}

function startBalloonGame() {
  const arena = document.getElementById('balloonSkyArena');
  if (!arena) return;
  arena.innerHTML = '';

  let candidatePool = [];

  if (balloonCategory === 'letters') {
    candidatePool = ALPHABET_DATA.map(l => ({
      key: l.letter,
      displayTitle: `${l.letter} ${l.small}`,
      speakText: `Letter ${l.letter}`,
      emoji: l.emoji,
      arabic: `حرف ${l.letter}`
    }));
  } else if (balloonCategory === 'numbers') {
    candidatePool = NUMBERS_DATA.map(n => ({
      key: n.num.toString(),
      displayTitle: `${n.num} (${n.word})`,
      speakText: `Number ${n.num}, ${n.word}`,
      emoji: n.emoji,
      arabic: n.arabic
    }));
  } else {
    // words: Animals + Fruits
    candidatePool = [...ANIMALS_DATA, ...FRUITS_DATA].map(item => ({
      key: item.word,
      displayTitle: `${item.word} ${item.emoji}`,
      speakText: item.word,
      emoji: item.emoji,
      arabic: item.arabic
    }));
  }

  // Shuffle candidate pool
  const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());
  currentBalloonTarget = shuffled[0];

  // Pick 5 options (including target)
  const roundOptions = [currentBalloonTarget, shuffled[1], shuffled[2], shuffled[3], shuffled[4]].sort(() => 0.5 - Math.random());

  // Update target banner
  const targetDisplay = document.getElementById('balloonTargetText');
  if (targetDisplay) {
    targetDisplay.innerText = currentBalloonTarget.displayTitle;
  }

  // Speak prompt
  setTimeout(() => {
    repeatBalloonAudio();
  }, 300);

  // Layout 5 balloons across the arena width
  const leftSlots = [6, 25, 44, 63, 82];
  roundOptions.forEach((option, idx) => {
    const balloon = document.createElement('div');
    const color = BALLOON_COLORS[idx % BALLOON_COLORS.length];
    balloon.className = 'balloon-item';
    balloon.style.backgroundColor = color;
    
    // Position with gentle variation
    const leftPos = leftSlots[idx] + (Math.random() * 4 - 2);
    const topPos = 60 + (idx % 2 === 0 ? 30 : 130) + Math.floor(Math.random() * 40);
    balloon.style.left = `${leftPos}%`;
    balloon.style.top = `${topPos}px`;
    balloon.style.animationDelay = `${(idx * 0.3).toFixed(1)}s`;
    balloon.style.animationDuration = `${(2.4 + (idx * 0.4)).toFixed(1)}s`;

    balloon.innerHTML = `
      <div class="balloon-inner-emoji">${option.emoji}</div>
      <div class="balloon-inner-text">${option.key}</div>
      <div class="balloon-string"></div>
    `;

    balloon.onclick = () => handleBalloonClick(option, balloon);
    arena.appendChild(balloon);
  });
}

function repeatBalloonAudio() {
  if (currentBalloonTarget) {
    speakWord(`Pop the balloon with ${currentBalloonTarget.speakText}!`, 0.85);
  }
}

function handleBalloonClick(option, balloonEl) {
  if (!currentBalloonTarget || balloonEl.classList.contains('popping')) return;

  if (option.key === currentBalloonTarget.key) {
    // Correct pop!
    playPopSound();
    playCorrectSound();
    balloonEl.classList.add('popping');

    balloonStreak++;
    balloonPopsCount++;
    updateBalloonCounters();
    addStars(3);

    speakWord(`Super! ${currentBalloonTarget.speakText}!`);

    setTimeout(() => {
      if (balloonStreak > 0 && balloonStreak % 5 === 0) {
        showCelebration('بطل فرقعة البالونات! 🎈', `أنت مذهل! لقد حققت سلسلة فوز من ${balloonStreak} بالونات متتالية!`, 5);
      }
      startBalloonGame();
    }, 850);

  } else {
    // Wrong balloon
    playWrongSound();
    balloonEl.classList.add('wobble');
    balloonStreak = 0;
    updateBalloonCounters();
    speakWord(`Oops! Try to find ${currentBalloonTarget.speakText}`);
    setTimeout(() => {
      balloonEl.classList.remove('wobble');
    }, 450);
  }
}

// ==========================================================================
// 8. Smart Certificate of Achievement Module (شهادة الإنجاز الفخرية)
// ==========================================================================
let currentCertTheme = 'gold';

function openCertificateModal() {
  playFanfareSound();
  const modal = document.getElementById('certModalOverlay');
  if (modal) modal.classList.add('open');

  // Format today's date
  const today = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('ar-EG', options) || '14 أكتوبر 2026';
  
  const dateEl = document.getElementById('certDateDisplay');
  if (dateEl) dateEl.innerText = formattedDate;

  // Update stars count display
  const starsEl = document.getElementById('certStarsCount');
  if (starsEl) starsEl.innerText = `(برصيد ${userStars} نجمة ذهبية)`;

  updateCertificatePreview();
}

function closeCertificateModal() {
  playPopSound();
  const modal = document.getElementById('certModalOverlay');
  if (modal) modal.classList.remove('open');
}

function updateCertificatePreview() {
  const input = document.getElementById('childNameInput');
  const display = document.getElementById('certDisplayName');
  const val = input ? input.value.trim() : '';
  if (display) {
    display.innerText = val ? val : 'بطل الإنجليزية';
  }
}

function setCertTheme(theme, btn) {
  playPopSound();
  currentCertTheme = theme;
  document.querySelectorAll('.theme-buttons-row .theme-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const paper = document.getElementById('certificatePaper');
  if (paper) {
    paper.className = `certificate-paper theme-${theme}`;
  }
}

function printCertificate() {
  playPopSound();
  window.print();
}

function downloadCertificateAsImage() {
  playPopSound();
  const childName = (document.getElementById('childNameInput')?.value.trim()) || 'بطل الإنجليزية';
  const starsCount = userStars;
  const dateText = document.getElementById('certDateDisplay')?.innerText || '14 أكتوبر 2026';

  // Create High-Resolution Canvas (1200x840)
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');

  // Colors per theme
  let borderColor = '#D97706';
  let innerBorder = '#B45309';
  let bgGrad1 = '#FFFFFB';
  let bgGrad2 = '#FEF9C3';
  let nameColor = '#D97706';
  let titleColor = '#B45309';

  if (currentCertTheme === 'blue') {
    borderColor = '#0284C7';
    innerBorder = '#0369A1';
    bgGrad1 = '#FFFFFF';
    bgGrad2 = '#E0F2FE';
    nameColor = '#0284C7';
    titleColor = '#0369A1';
  } else if (currentCertTheme === 'pink') {
    borderColor = '#E11D48';
    innerBorder = '#9F1239';
    bgGrad1 = '#FFFFFF';
    bgGrad2 = '#FFE4E6';
    nameColor = '#E11D48';
    titleColor = '#BE123C';
  }

  // Draw Background
  const radialBg = ctx.createRadialGradient(600, 420, 100, 600, 420, 650);
  radialBg.addColorStop(0, bgGrad1);
  radialBg.addColorStop(1, bgGrad2);
  ctx.fillStyle = radialBg;
  ctx.fillRect(0, 0, 1200, 840);

  // Outer Border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 18;
  ctx.strokeRect(18, 18, 1164, 804);

  // Inner Double Border
  ctx.strokeStyle = innerBorder;
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, 1120, 760);
  ctx.strokeRect(46, 46, 1108, 748);

  // Corner Stars
  ctx.font = '28px serif';
  ctx.fillStyle = borderColor;
  ctx.fillText('✦', 60, 80);
  ctx.fillText('✦', 1120, 80);
  ctx.fillText('✦', 60, 770);
  ctx.fillText('✦', 1120, 770);

  // Top Sub Brand
  ctx.font = 'bold 22px Cairo, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'center';
  ctx.fillText('🐝 LINGOBEE - منصة لينجوبي لتعليم الإنجليزية للأطفال', 600, 105);

  // Medal Icon
  ctx.font = '50px sans-serif';
  ctx.fillText('🏅', 600, 175);

  // Main Arabic Title
  ctx.font = '900 48px Cairo, sans-serif';
  ctx.fillStyle = titleColor;
  ctx.fillText('شهادة إنجاز وتفوق', 600, 240);

  // English Subtitle
  ctx.font = 'bold 22px Fredoka, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', 600, 275);

  // Awarded text
  ctx.font = 'bold 24px Cairo, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('تُمنح هذه الشهادة بكل فخر واعتزاز للبطل المتميز:', 600, 335);

  // Child Name
  ctx.font = '900 60px Cairo, sans-serif';
  ctx.fillStyle = nameColor;
  ctx.fillText(childName, 600, 420);

  // Line below name
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(350, 445);
  ctx.lineTo(850, 445);
  ctx.stroke();

  // Citation text
  ctx.font = '600 20px Cairo, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('تقديراً لشغفه الكبير وإتقانه أساسيات اللغة الإنجليزية، واجتياز التحديات والمحادثات والألعاب', 600, 500);
  ctx.fillText('التفاعلية في منصة لينجوبي (LINGOBEE) بكل ذكاء وإبداع ومثابرة!', 600, 535);

  // Star Rating
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#D97706';
  ctx.fillText(`⭐⭐⭐⭐⭐  (برصيد ${starsCount} نجمة ذهبية)`, 600, 595);

  // Signatures Row
  ctx.font = 'bold 20px Cairo, sans-serif';
  ctx.fillStyle = '#1E293B';

  // Left: Teacher
  ctx.textAlign = 'left';
  ctx.fillText('LINGOBEE AI Teacher ✍️', 120, 690);
  ctx.font = '16px Cairo, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('المعلم الذكي والمنصة', 120, 720);

  // Center Seal
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = borderColor;
  ctx.fillText('★ OFFICIAL SEAL 2026 ★', 600, 715);

  // Right: Date
  ctx.textAlign = 'right';
  ctx.font = 'bold 20px Cairo, sans-serif';
  ctx.fillStyle = '#1E293B';
  ctx.fillText(dateText, 1080, 690);
  ctx.font = '16px Cairo, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('تاريخ الإصدار المعتمد', 1080, 720);

  // Trigger Download
  const link = document.createElement('a');
  link.download = `شهادة_لينجوبي_${childName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();

  addStars(5);
  playFanfareSound();
}

// ==========================================================================
// 10. Educational Videos Module (سينما الفيديوهات التعليمية)
// ==========================================================================
let currentVideoFilter = 'all';

function renderVideos(filter = 'all') {
  currentVideoFilter = filter;
  const container = document.getElementById('videosGrid');
  if (!container) return;
  container.innerHTML = '';

  const list = filter === 'all'
    ? VIDEOS_DATA
    : VIDEOS_DATA.filter(v => v.category === filter);

  list.forEach(video => {
    const realIndex = VIDEOS_DATA.indexOf(video);
    const card = document.createElement('div');
    card.className = 'video-card';
    card.onclick = () => {
      if (quickEditMode) {
        LingoAdmin.openEditModal('videos', realIndex);
        return;
      }
      openVideoPlayer(video.id, video.titleAr);
    };

    // Official YouTube High-Resolution thumbnail
    const thumbUrl = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;

    card.innerHTML = `
      <div class="video-thumb-container">
        <img class="video-thumb-img" src="${thumbUrl}" alt="${video.titleEn}" loading="lazy">
        <div class="video-play-badge">▶</div>
        <div class="video-duration-pill">⏱ ${video.duration || '2:30'}</div>
      </div>
      <div class="video-card-body">
        <div class="video-card-top-tag">
          <span class="video-category-tag">${video.categoryAr || video.category}</span>
          <span style="font-size: 1.5rem;">${video.emoji || '🎬'}</span>
        </div>
        <h4 class="video-card-title-ar">${video.titleAr}</h4>
        <div class="video-card-title-en">${video.titleEn}</div>
        <p class="video-card-desc">${video.desc || ''}</p>
        <button type="button" class="video-watch-btn">
          <span>🍿</span> شاهد وتعلّم (+5 ⭐)
        </button>
      </div>
    `;

    attachCardAdminActions(card, 'videos', realIndex);
    container.appendChild(card);
  });
}

function filterVideos(category, btnEl) {
  playPopSound();
  document.querySelectorAll('.videos-filter-bar .filter-pill').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderVideos(category);
}

function openVideoPlayer(videoId, titleAr) {
  playPopSound();
  const modal = document.getElementById('videoModalOverlay');
  const titleEl = document.getElementById('videoModalTitle');
  const wrapper = document.getElementById('videoFrameWrapper');

  if (titleEl) titleEl.innerText = titleAr;
  if (wrapper) {
    wrapper.innerHTML = `
      <iframe 
        src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1" 
        title="${titleAr}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    `;
  }

  if (modal) modal.classList.add('open');

  // Reward child with 5 stars for learning!
  addStars(5);
  playCorrectSound();
}

function closeVideoPlayer() {
  playPopSound();
  const modal = document.getElementById('videoModalOverlay');
  const wrapper = document.getElementById('videoFrameWrapper');
  if (wrapper) wrapper.innerHTML = '';
  if (modal) modal.classList.remove('open');
}

// ==========================================================================
// 11. Content Management System & Full Control Engine (LingoAdmin)
// لوحة تحكم وإدارة المحتوى الشاملة: إضافة، تعديل، حذف، نسخ احتياطي واستعادة
// ==========================================================================
const LingoAdmin = {
  currentCategory: 'alphabet',
  quickEditMode: false,
  searchTerm: '',

  openPanel(category = null) {
    playPopSound();
    if (category && typeof CATEGORIES_META !== 'undefined' && CATEGORIES_META[category]) {
      this.currentCategory = category;
    }
    const modal = document.getElementById('adminPanelModal');
    if (modal) modal.classList.add('open');
    this.renderCategoryTabs();
    this.renderAdminTable();
  },

  closePanel() {
    playPopSound();
    const modal = document.getElementById('adminPanelModal');
    if (modal) modal.classList.remove('open');
  },

  renderCategoryTabs() {
    const container = document.getElementById('adminCategoryTabs');
    if (!container || typeof CATEGORIES_META === 'undefined') return;
    container.innerHTML = '';

    Object.keys(CATEGORIES_META).forEach(catKey => {
      const meta = CATEGORIES_META[catKey];
      const count = meta.getData().length;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `admin-tab-btn ${catKey === this.currentCategory ? 'active' : ''}`;
      btn.innerHTML = `<span>${meta.emoji}</span> <span>${meta.nameAr}</span> <small class="tab-count">${count}</small>`;
      btn.onclick = () => {
        playPopSound();
        this.currentCategory = catKey;
        this.renderCategoryTabs();
        this.renderAdminTable();
      };
      container.appendChild(btn);
    });
  },

  filterTable() {
    const input = document.getElementById('adminSearchInput');
    this.searchTerm = input ? input.value.trim().toLowerCase() : '';
    this.renderAdminTable();
  },

  renderAdminTable() {
    const tbody = document.getElementById('adminTableBody');
    const emptyState = document.getElementById('adminEmptyState');
    if (!tbody || typeof CATEGORIES_META === 'undefined') return;
    tbody.innerHTML = '';

    const meta = CATEGORIES_META[this.currentCategory];
    if (!meta) return;

    let items = meta.getData();
    if (this.searchTerm) {
      items = items.filter(item => {
        const text = JSON.stringify(item).toLowerCase();
        return text.includes(this.searchTerm);
      });
    }

    if (items.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    } else {
      if (emptyState) emptyState.style.display = 'none';
    }

    const fullData = meta.getData();
    items.forEach(item => {
      const realIndex = fullData.indexOf(item);
      const tr = document.createElement('tr');

      // 1. Emoji / Icon
      const emojiCol = item.emoji || (item.hex ? '🎨' : '📝');
      
      // 2. English primary
      const enText = item.word || item.phrase || item.titleEn || item.letter || '';
      
      // 3. Arabic
      const arText = item.arabic || item.titleAr || '';

      // 4. Details
      let details = '';
      if (this.currentCategory === 'alphabet') details = `${item.small ? `(${item.small}) ` : ''}${item.phonics || ''}`;
      else if (this.currentCategory === 'numbers') details = `العدد: ${item.count !== undefined ? item.count : item.num}`;
      else if (this.currentCategory === 'animals') details = `${item.category} • ${item.sound || ''}`;
      else if (this.currentCategory === 'colors') details = `<span class="color-dot" style="background:${item.hex}"></span> ${item.example || item.hex}`;
      else if (this.currentCategory === 'shapes') details = item.desc || '';
      else if (this.currentCategory === 'fruits') details = item.color || '';
      else if (this.currentCategory === 'phrases') details = `<span class="phrase-cat-tag">${item.category}</span> ${item.pronunciation ? `[${item.pronunciation}]` : ''}`;
      else if (this.currentCategory === 'videos') details = `${item.categoryAr || item.category} • ${item.duration || '2:30'}`;
      else if (this.currentCategory === 'spelling') details = item.hint || '';

      const speakTarget = enText;

      tr.innerHTML = `
        <td style="text-align: center; font-size: 1.5rem;">${emojiCol}</td>
        <td><strong>${enText}</strong></td>
        <td>${arText}</td>
        <td style="font-size: 0.88rem; color: #64748B;">${details}</td>
        <td style="text-align: center;">
          <button type="button" class="btn-table-speech" title="استمع للنطق">🔊</button>
        </td>
        <td style="text-align: center;">
          <div class="table-actions-cell">
            <button type="button" class="btn-table-edit" title="تعديل هذا العنصر">✏️</button>
            <button type="button" class="btn-table-delete" title="حذف هذا العنصر">🗑️</button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-table-speech').onclick = () => {
        playPopSound();
        speakWord(speakTarget);
      };
      tr.querySelector('.btn-table-edit').onclick = () => {
        this.openEditModal(this.currentCategory, realIndex);
      };
      tr.querySelector('.btn-table-delete').onclick = () => {
        this.deleteItem(this.currentCategory, realIndex);
      };

      tbody.appendChild(tr);
    });
  },

  openAddModal(category = null) {
    playPopSound();
    const cat = category || this.currentCategory;
    this.currentCategory = cat;
    const meta = CATEGORIES_META[cat];
    if (!meta) return;

    document.getElementById('adminItemCategory').value = cat;
    document.getElementById('adminItemIndex').value = '-1';
    document.getElementById('adminItemModalTitle').innerText = `➕ إضافة عنصر جديد إلى (${meta.nameAr})`;
    document.getElementById('adminItemModalSubtitle').innerText = `أدخل تفاصيل العنصر الجديد ليظهر فوراً للأطفال مع النطق الصوتي`;
    document.getElementById('adminItemHeaderIcon').innerText = meta.emoji;

    this.renderFormFields(cat, null);
    const modal = document.getElementById('adminItemModal');
    if (modal) modal.classList.add('open');
  },

  openEditModal(category, index) {
    playPopSound();
    this.currentCategory = category;
    const meta = CATEGORIES_META[category];
    if (!meta) return;

    const data = meta.getData();
    const item = data[index];
    if (!item) return;

    document.getElementById('adminItemCategory').value = category;
    document.getElementById('adminItemIndex').value = index.toString();
    document.getElementById('adminItemModalTitle').innerText = `✏️ تعديل عنصر في (${meta.nameAr})`;
    document.getElementById('adminItemModalSubtitle').innerText = `عدّل البيانات ثم اضغط حفظ لتحديث البطاقة والنطق فوراً`;
    document.getElementById('adminItemHeaderIcon').innerText = meta.emoji;

    this.renderFormFields(category, item);
    const modal = document.getElementById('adminItemModal');
    if (modal) modal.classList.add('open');
  },

  closeItemModal() {
    playPopSound();
    const modal = document.getElementById('adminItemModal');
    if (modal) modal.classList.remove('open');
  },

  renderFormFields(category, item = null) {
    const grid = document.getElementById('adminFormGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const meta = CATEGORIES_META[category];
    if (!meta) return;

    meta.fields.forEach(f => {
      const fieldWrapper = document.createElement('div');
      fieldWrapper.className = `form-field-group ${f.width === 'full' ? 'field-full' : 'field-half'}`;

      const label = document.createElement('label');
      label.setAttribute('for', `field_${f.id}`);
      label.innerText = f.label + (f.required ? ' *' : '');
      fieldWrapper.appendChild(label);

      let currentVal = item ? (item[f.id] !== undefined ? item[f.id] : '') : (f.default !== undefined ? f.default : '');

      if (f.type === 'select') {
        const select = document.createElement('select');
        select.id = `field_${f.id}`;
        select.name = f.id;
        f.options.forEach(opt => {
          const optEl = document.createElement('option');
          if (typeof opt === 'string') {
            optEl.value = opt;
            optEl.innerText = opt;
          } else {
            optEl.value = opt.val;
            optEl.innerText = opt.label;
          }
          if (optEl.value === currentVal) optEl.selected = true;
          select.appendChild(optEl);
        });
        fieldWrapper.appendChild(select);
      } else if (f.type === 'color') {
        const colorWrap = document.createElement('div');
        colorWrap.className = 'color-picker-input-wrap';
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.id = `field_${f.id}`;
        colorInput.name = f.id;
        colorInput.value = currentVal || '#3A86FF';

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = colorInput.value;
        textInput.style.maxWidth = '120px';
        textInput.style.direction = 'ltr';

        colorInput.oninput = () => { textInput.value = colorInput.value; };
        textInput.oninput = () => { colorInput.value = textInput.value; };

        colorWrap.appendChild(colorInput);
        colorWrap.appendChild(textInput);
        fieldWrapper.appendChild(colorWrap);
      } else {
        const input = document.createElement('input');
        input.type = f.type || 'text';
        input.id = `field_${f.id}`;
        input.name = f.id;
        input.placeholder = f.placeholder || '';
        input.value = currentVal;
        if (f.required) input.required = true;
        fieldWrapper.appendChild(input);
      }

      grid.appendChild(fieldWrapper);
    });
  },

  testCurrentFormSpeech() {
    playPopSound();
    const wordInput = document.getElementById('field_word') ||
                      document.getElementById('field_phrase') ||
                      document.getElementById('field_titleEn') ||
                      document.getElementById('field_letter');
    if (wordInput && wordInput.value.trim()) {
      speakWord(wordInput.value.trim());
    } else {
      speakWord('Hello! Ready to learn!');
    }
  },

  saveItem() {
    const cat = document.getElementById('adminItemCategory').value;
    const indexStr = document.getElementById('adminItemIndex').value;
    const index = parseInt(indexStr, 10);
    const meta = CATEGORIES_META[cat];
    if (!meta) return;

    const newItem = {};
    meta.fields.forEach(f => {
      const el = document.getElementById(`field_${f.id}`);
      if (el) {
        let val = el.value.trim();
        if (f.type === 'number') {
          val = parseInt(val, 10) || 0;
        }
        if (cat === 'videos' && f.id === 'id') {
          val = extractYouTubeId(val);
        }
        newItem[f.id] = val;
      }
    });

    // Special category enhancements
    if (cat === 'phrases' && !newItem.categoryAr) {
      const catMap = {
        greetings: 'التحيات والوداع',
        manners: 'الكلمات السحرية',
        feelings: 'المشاعر والأحوال',
        conversation: 'التعارف والأسئلة'
      };
      newItem.categoryAr = catMap[newItem.category] || 'عبارات يومية';
    }

    if (cat === 'videos') {
      const catMap = {
        alphabet: 'الحروف الهجائية 🔤',
        numbers: 'الأرقام والعد 🔢',
        colors: 'الألوان والأشكال 🎨',
        animals: 'مملكة الحيوانات 🦁',
        phrases: 'العبارات والتحيات 💬'
      };
      newItem.categoryAr = catMap[newItem.category] || 'فيديوهات تعليمية';
    }

    const data = [...meta.getData()];
    if (index >= 0 && index < data.length) {
      // Edit existing
      data[index] = newItem;
      this.showToast('✅ تم حفظ التعديلات بنجاح!', 'success');
    } else {
      // Add new
      data.push(newItem);
      this.showToast('🎉 تم إضافة العنصر الجديد بنجاح!', 'success');
    }

    meta.setData(data);
    this.closeItemModal();
    this.renderCategoryTabs();
    this.renderAdminTable();
    this.refreshCurrentViews();
    playCorrectSound();
    addStars(2);
  },

  deleteItem(category, index) {
    const meta = CATEGORIES_META[category];
    if (!meta) return;
    const data = [...meta.getData()];
    const item = data[index];
    if (!item) return;

    const title = item.word || item.phrase || item.titleAr || item.letter || 'هذا العنصر';
    const confirmDelete = window.confirm(`هل أنت متأكد من رغبتك في حذف: "${title}"؟\nيمكنك دائماً استعادة المحتوى الافتراضي في أي وقت.`);
    if (!confirmDelete) return;

    data.splice(index, 1);
    meta.setData(data);
    this.showToast(`🗑️ تم حذف "${title}" بنجاح`, 'info');
    playPopSound();

    this.renderCategoryTabs();
    this.renderAdminTable();
    this.refreshCurrentViews();
  },

  resetCurrentCategory() {
    const meta = CATEGORIES_META[this.currentCategory];
    if (!meta) return;

    const confirmReset = window.confirm(`هل تريد استعادة جميع عناصر قسم (${meta.nameAr}) للوضع الأصلي الافتراضي؟`);
    if (!confirmReset) return;

    const defaults = meta.getDefaults();
    meta.setData(JSON.parse(JSON.stringify(defaults)));
    this.showToast(`🔄 تم استعادة الوضع الافتراضي لقسم ${meta.nameAr}!`, 'success');
    playFanfareSound();

    this.renderCategoryTabs();
    this.renderAdminTable();
    this.refreshCurrentViews();
  },

  resetAllCategories() {
    const confirmAll = window.confirm('⚠️ تحذير: هل أنت متأكد من رغبتك في استعادة محتوى كافة أقسام المنصة إلى الحالة التأسيسية الأصلية؟');
    if (!confirmAll) return;

    Object.keys(CATEGORIES_META).forEach(key => {
      const meta = CATEGORIES_META[key];
      meta.setData(JSON.parse(JSON.stringify(meta.getDefaults())));
    });

    this.showToast('🌟 تم استعادة كافة أقسام المنصة للحالة الأصلية بنجاح!', 'success');
    playFanfareSound();

    this.renderCategoryTabs();
    this.renderAdminTable();
    this.refreshCurrentViews();
  },

  exportBackup() {
    playPopSound();
    const backupData = {
      app: 'LINGOBEE',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      content: {}
    };

    Object.keys(CATEGORIES_META).forEach(key => {
      backupData.content[key] = CATEGORIES_META[key].getData();
    });

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lingobee_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('📥 تم تصدير النسخة الاحتياطية بنجاح!', 'success');
  },

  importBackup(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.content) {
          Object.keys(parsed.content).forEach(key => {
            if (CATEGORIES_META[key] && Array.isArray(parsed.content[key])) {
              CATEGORIES_META[key].setData(parsed.content[key]);
            }
          });
          this.showToast('🎉 تم استيراد كافة البيانات بنجاح!', 'success');
          playFanfareSound();
          this.renderCategoryTabs();
          this.renderAdminTable();
          this.refreshCurrentViews();
        } else {
          alert('ملف النسخة الاحتياطية غير متوافق!');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة الملف. تأكد من أنه ملف JSON سليم.');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  },

  toggleQuickEditMode() {
    playPopSound();
    this.quickEditMode = !this.quickEditMode;
    quickEditMode = this.quickEditMode;

    document.querySelectorAll('.btn-quick-edit-toggle').forEach(btn => {
      if (this.quickEditMode) {
        btn.classList.add('active');
        btn.innerHTML = '✏️ وضع التعديل السريع: <span class="status-on">مفعّل ✔️</span>';
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '✏️ وضع التعديل السريع: <span class="status-off">معطّل</span>';
      }
    });

    this.showToast(this.quickEditMode ? '✏️ تم تفعيل وضع التعديل السريع على البطاقات!' : '👁️ تم إيقاف وضع التعديل والعودة للوضع التعليمي', 'info');
    this.refreshCurrentViews();
  },

  refreshCurrentViews() {
    renderAlphabet();
    renderNumbers();
    renderAnimals();
    renderColorsAndShapes();
    renderFruits();
    renderPhrases(currentPhraseFilter || 'all');
    renderVideos(currentVideoFilter || 'all');
  },

  showToast(message, type = 'info') {
    let toast = document.getElementById('lingoAdminToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'lingoAdminToast';
      toast.className = 'admin-toast';
      document.body.appendChild(toast);
    }
    toast.className = `admin-toast ${type} show`;
    toast.innerText = message;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }
};

// ==========================================================================
// 12. Initialize Everything on DOMContentLoaded
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  const starCountEl = document.getElementById('starCounter');
  if (starCountEl) starCountEl.innerText = userStars;

  renderAlphabet();
  renderNumbers();
  renderAnimals();
  renderColorsAndShapes();
  renderFruits();
  renderPhrases('all');
  renderVideos('all');

  // Format today's date for certificate
  const today = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('ar-EG', options) || '14 أكتوبر 2026';
  const dateEl = document.getElementById('certDateDisplay');
  if (dateEl) dateEl.innerText = formattedDate;
});