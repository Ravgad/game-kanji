let currentMode = 'kanji'; 
let databases = {
    kanji: { 'N5': [], 'N4': [], 'N3': [], 'N2': [], 'N1': [] },
    kotoba: { 'N5': [], 'N4': [], 'N3': [], 'N2': [], 'N1': [] },
    ujian: { '1': [], '2': [], '3': [], '4': [], '5': [] }
};

let flashcards = [];
let fcIndex = 0;
let selectedLevel = 'N5';
let selectedQty = 5;
let isMeaningVisible = true;
let currentQuestions = [];
let questionIndex = 0;
let score = 0;
let currentInput = "";
let history = [];

const hiraList = "あいうえおかきくけこさしすせそたちつteとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゃゅょっ".split("");
const kataList = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポャュョッ".split("");

// 1. Inisialisasi: Load semua CSV
async function loadAllDatabases() {
    await loadCSV('kanji.csv', 'kanji');
    await loadCSV('kotoba.csv', 'kotoba');
    await loadCSV('ujian.csv', 'ujian');
    await loadFlashcardCSV();
}

async function loadCSV(fileName, mode) {
    try {
        const response = await fetch(fileName);
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        rows.forEach(row => {
            const cols = row.split(',');
            if (cols.length >= 4) {
                const lvl = cols[0].trim();
                if(databases[mode][lvl]) {
                    databases[mode][lvl].push({
                        q: cols[1].trim(), 
                        a: cols[2].trim().split(';'), 
                        m: cols[3].trim()
                    });
                }
            }
        });
    } catch (e) { console.warn(fileName + " tidak ditemukan."); }
}

async function loadFlashcardCSV() {
    try {
        const response = await fetch('flashcard.csv');
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        flashcards = rows.map(row => {
            const cols = row.split(',');
            if (cols.length >= 3) {
                return { k: cols[0].trim(), f: cols[1].trim(), m: cols[2].trim() };
            }
        }).filter(Boolean);
    } catch (e) { console.warn("flashcard.csv tidak ditemukan."); }
}

loadAllDatabases();

// 2. Navigasi Screen
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-' + id).classList.remove('hidden');
}

// 3. Logika Menu Utama & Sub-Menu
function openSubMenu(mode) {
    currentMode = mode;
    showScreen('home');
    const title = document.getElementById('menu-title');
    const levelContainer = document.getElementById('level-buttons');
    levelContainer.innerHTML = "";

    if (mode === 'kanji' || mode === 'kotoba') {
        title.innerText = mode === 'kanji' ? "Menu Kanji" : "Menu Kotoba";
        ['N5','N4','N3','N2','N1'].forEach(lvl => createLevelBtn(lvl, levelContainer));
        selectedLevel = 'N5';
    } else {
        title.innerText = "Ujian Stage";
        ['1','2','3','4','5'].forEach(stg => createLevelBtn(stg, levelContainer, "Stage "));
        selectedLevel = '1';
    }
}

function createLevelBtn(val, container, prefix = "") {
    const btn = document.createElement('button');
    btn.className = "btn-choice btn-level" + (val === selectedLevel ? " selected" : "");
    btn.innerText = prefix + val;
    btn.onclick = () => {
        selectedLevel = val;
        document.querySelectorAll('.btn-level').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    };
    container.appendChild(btn);
}

function selectQty(qty, btn) {
    selectedQty = qty;
    document.querySelectorAll('.btn-qty').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

// 4. Logika Flashcard
function startFlashcards() {
    if (flashcards.length === 0) return alert("Database flashcard kosong!");
    fcIndex = 0;
    showScreen('flashcard');
    updateFC();
}

function updateFC() {
    const card = flashcards[fcIndex];
    document.getElementById('fc-card').classList.remove('flipped');
    document.getElementById('fc-front-text').innerText = card.k;
    document.getElementById('fc-back-furi').innerText = card.f;
    document.getElementById('fc-back-arti').innerText = card.m;
    document.getElementById('fc-counter').innerText = `${fcIndex + 1}/${flashcards.length}`;
}

function flipCard() { document.getElementById('fc-card').classList.toggle('flipped'); }
function nextFC() { if (fcIndex < flashcards.length - 1) { fcIndex++; updateFC(); } }
function prevFC() { if (fcIndex > 0) { fcIndex--; updateFC(); } }

function toggleEditFC() {
    const form = document.getElementById('fc-edit-form');
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
        const card = flashcards[fcIndex];
        document.getElementById('edit-kanji').value = card.k;
        document.getElementById('edit-furi').value = card.f;
        document.getElementById('edit-arti').value = card.m;
    }
}

function saveFCEdit() {
    flashcards[fcIndex] = {
        k: document.getElementById('edit-kanji').value,
        f: document.getElementById('edit-furi').value,
        m: document.getElementById('edit-arti').value
    };
    updateFC();
    toggleEditFC();
    alert("Berhasil disimpan!");
}

// 5. Logika Quiz
function startQuiz() {
    const db = databases[currentMode][selectedLevel];
    if (!db || db.length === 0) return alert("Data kosong untuk level ini!");
    
    isMeaningVisible = document.getElementById('toggle-meaning').checked;
    let limit = (selectedQty === 'all') ? db.length : selectedQty;
    
    currentQuestions = [...db].sort(() => Math.random() - 0.5).slice(0, limit);
    questionIndex = 0; score = 0; history = [];
    
    showScreen('quiz');
    loadQuestion();
    switchKb('hira');
}

function loadQuestion() {
    const q = currentQuestions[questionIndex];
    document.getElementById('current-question').innerText = q.q;
    document.getElementById('kanji-meaning').innerText = isMeaningVisible ? "Arti: " + q.m : "";
    document.getElementById('q-count').innerText = `${questionIndex + 1}/${currentQuestions.length}`;
    document.getElementById('progress-fill').style.width = `${(questionIndex / currentQuestions.length) * 100}%`;
    currentInput = ""; updateDisplay();
}

function updateDisplay() { document.getElementById('user-answer').innerText = currentInput; }

function renderKeys(list) {
    const container = document.getElementById('keys-container');
    container.innerHTML = "";
    list.forEach(char => {
        const btn = document.createElement('button');
        btn.className = 'key'; btn.innerText = char;
        btn.onclick = () => { if(currentInput.length < 15) { currentInput += char; updateDisplay(); } };
        container.appendChild(btn);
    });
}

function switchKb(type) {
    document.getElementById('btn-hira').classList.toggle('active', type === 'hira');
    document.getElementById('btn-kata').classList.toggle('active', type === 'kata');
    renderKeys(type === 'hira' ? hiraList : kataList);
}

function deleteChar() { currentInput = currentInput.slice(0, -1); updateDisplay(); }

function submitAnswer() {
    if(!currentInput) return;
    const q = currentQuestions[questionIndex];
    const isCorrect = q.a.includes(currentInput);
    if(isCorrect) score += 100;
    
    history.push({ q: q.q, a: q.a.join(' / '), u: currentInput, s: isCorrect, m: q.m });
    
    questionIndex++;
    if(questionIndex < currentQuestions.length) loadQuestion(); else showResult();
}

function showResult() {
    showScreen('result');
    document.getElementById('final-score').innerText = score;
    const reviewList = document.getElementById('review-list');
    reviewList.innerHTML = history.map(h => `
        <div class="review-item">
            <div style="display:flex; justify-content:space-between; font-weight:bold;">
                <span>${h.q} <small>(${h.u})</small></span>
                <span style="color:${h.s ? 'var(--success)' : 'var(--danger)'}">${h.s ? '✓' : '✗'}</span>
            </div>
            <div style="font-size:12px; color:#7f8c8d;">Benar: ${h.a} | Arti: ${h.m}</div>
        </div>
    `).join('');
}

function quitQuiz() {
    if (history.length === 0) {
        if (confirm("Keluar kuis?")) showScreen('main-menu');
        return;
    }
    if (confirm("Ingin berhenti dan lihat hasil skor sekarang?")) showResult();
}