/**
 * ==========================================================================
 * Kids English Explorer - Core Game Engine & Speech Synthesis
 * محرك التلعيب، النطق الصوتي التفاعلي، ونظام المكافآت
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
// 2. Speech Synthesis (Clear English Native Voice)
// ==========================================================================
let englishVoice = null;

function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))) ||
                 voices.find(v => v.lang === 'en-US') ||
                 voices.find(v => v.lang.startsWith('en')) || null;
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

function speakWord(text, rate = 0.9, pitch = 1.1) {
  if (!('speechSynthesis' in window) || !soundEnabled) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  if (englishVoice) {
    utterance.voice = englishVoice;
  }
  utterance.lang = 'en-US';
  utterance.rate = rate;
  utterance.pitch = pitch;

  window.speechSynthesis.speak(utterance);
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

  ALPHABET_DATA.forEach(item => {
    const card = document.createElement('div');
    card.className = 'alpha-card';
    card.innerHTML = `
      <div class="alpha-letter">${item.letter}${item.small}</div>
      <span class="alpha-emoji">${item.emoji}</span>
      <div class="alpha-word">${item.word}</div>
      <div class="alpha-ar">${item.arabic}</div>
    `;
    card.onclick = () => {
      playPopSound();
      speakWord(`${item.letter}. ${item.word}!`);
      addStars(1);
    };
    container.appendChild(card);
  });
}

// Numbers
function renderNumbers() {
  const container = document.getElementById('numbersGrid');
  if (!container) return;
  container.innerHTML = '';

  NUMBERS_DATA.forEach(item => {
    const card = document.createElement('div');
    card.className = 'num-card';
    const itemsPreview = item.emoji.repeat(Math.min(item.count, 6)) + (item.count > 6 ? '...' : '');
    card.innerHTML = `
      <div class="num-digit">${item.num}</div>
      <div class="num-word">${item.word}</div>
      <div class="num-ar">${item.arabic}</div>
      <div class="num-items">${itemsPreview}</div>
    `;
    card.onclick = () => {
      playPopSound();
      speakWord(`${item.num}. ${item.word}!`);
      addStars(1);
    };
    container.appendChild(card);
  });
}

// Animals
function renderAnimals() {
  const container = document.getElementById('animalsGrid');
  if (!container) return;
  container.innerHTML = '';

  ANIMALS_DATA.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.style.backgroundColor = item.bg;
    card.innerHTML = `
      <span class="item-emoji">${item.emoji}</span>
      <div class="item-word">${item.word}</div>
      <div class="item-ar">${item.arabic}</div>
      <span class="item-tag">${item.category}</span>
    `;
    card.onclick = () => {
      playPopSound();
      speakWord(`${item.word}! ${item.sound}`);
      addStars(1);
    };
    container.appendChild(card);
  });
}

// Colors & Shapes
function renderColorsAndShapes() {
  const colContainer = document.getElementById('colorsGrid');
  if (colContainer) {
    colContainer.innerHTML = '';
    COLORS_DATA.forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div style="width: 60px; height: 60px; border-radius: 50%; background-color: ${item.hex}; border: 3px solid #FFF; box-shadow: 0 4px 8px rgba(0,0,0,0.15); margin: 0 auto 0.75rem;"></div>
        <div class="item-word">${item.word}</div>
        <div class="item-ar">${item.arabic}</div>
        <div style="font-size: 0.8rem; color: #64748B; margin-top: 0.3rem;">${item.example}</div>
      `;
      card.onclick = () => {
        playPopSound();
        speakWord(`${item.word}! ${item.example}`);
        addStars(1);
      };
      colContainer.appendChild(card);
    });
  }

  const shpContainer = document.getElementById('shapesGrid');
  if (shpContainer) {
    shpContainer.innerHTML = '';
    SHAPES_DATA.forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <span class="item-emoji">${item.emoji}</span>
        <div class="item-word">${item.word}</div>
        <div class="item-ar">${item.arabic}</div>
      `;
      card.onclick = () => {
        playPopSound();
        speakWord(`${item.word}!`);
        addStars(1);
      };
      shpContainer.appendChild(card);
    });
  }
}

// Fruits
function renderFruits() {
  const container = document.getElementById('fruitsGrid');
  if (!container) return;
  container.innerHTML = '';

  FRUITS_DATA.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <span class="item-emoji">${item.emoji}</span>
      <div class="item-word">${item.word}</div>
      <div class="item-ar">${item.arabic}</div>
    `;
    card.onclick = () => {
      playPopSound();
      speakWord(`${item.word}! Delicious!`);
      addStars(1);
    };
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
}

// Game 1: Listen & Pick Quiz
const QUIZ_POOL = [
  ...ANIMALS_DATA.map(a => ({ word: a.word, arabic: a.arabic, emoji: a.emoji })),
  ...FRUITS_DATA.map(f => ({ word: f.word, arabic: f.arabic, emoji: f.emoji })),
  ...ALPHABET_DATA.slice(0, 10).map(l => ({ word: l.word, arabic: l.arabic, emoji: l.emoji }))
];

function startQuizGame() {
  const pool = [...QUIZ_POOL].sort(() => 0.5 - Math.random());
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

  const pool = [...ANIMALS_DATA, ...FRUITS_DATA].sort(() => 0.5 - Math.random()).slice(0, 6);
  const deck = [];
  pool.forEach((item, idx) => {
    deck.push({ id: idx, type: 'emoji', val: item.emoji, word: item.word });
    deck.push({ id: idx, type: 'word', val: item.word, word: item.word });
  });

  deck.sort(() => 0.5 - Math.random());
  memoryCards = deck;

  deck.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'memory-card';
    el.dataset.index = i;
    el.innerHTML = '❓';
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
  cardEl.innerHTML = cardData.val;

  speakWord(cardData.word);
  memoryFlipped.push({ index, data: cardData, el: cardEl });

  if (memoryFlipped.length === 2) {
    const [c1, c2] = memoryFlipped;
    if (c1.data.id === c2.data.id) {
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
            showCelebration('بطل الذاكرة! 🏆', 'أكملت جميع بطاقات الذاكرة بنجاح مبهر!', 10);
            startMemoryGame();
          }, 600);
        }
      }, 500);
    } else {
      setTimeout(() => {
        playWrongSound();
        c1.el.classList.remove('flipped');
        c1.el.innerHTML = '❓';
        c2.el.classList.remove('flipped');
        c2.el.innerHTML = '❓';
        memoryFlipped = [];
      }, 1000);
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

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  const starCountEl = document.getElementById('starCounter');
  if (starCountEl) starCountEl.innerText = userStars;

  renderAlphabet();
  renderNumbers();
  renderAnimals();
  renderColorsAndShapes();
  renderFruits();
});