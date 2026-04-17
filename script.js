let currentMode = 'kanji'; 
let databases = {
    kanji: { 'N5': [], 'N4': [], 'N3': [], 'N2': [], 'N1': [] },
    kotoba: { 'N5': [], 'N4': [], 'N3': [], 'N2': [], 'N1': [] },
    ujian: { '1': [], '2': [], '3': [], '4': [], '5': [] }
};

let selectedLevel = 'N5';
let selectedQty = 5;
let isMeaningVisible = true;
let currentQuestions = [];
let questionIndex = 0;
let score = 0;
let currentInput = "";
let history = [];

const hiraList = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゃゅょっ".split("");
const kataList = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポャュョッ".split("");

// Load 3 Database Berbeda
async function loadAllDatabases() {
    await loadCSV('kanji.csv', 'kanji');
    await loadCSV('kotoba.csv', 'kotoba');
    await loadCSV('ujian.csv', 'ujian');
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
                        a: cols[2].trim().split(';'), // Multi-Jawaban didukung di sini
                        m: cols[3].trim()
                    });
                }
            }
        });
    } catch (e) { console.warn(fileName + " tidak ditemukan."); }
}

loadAllDatabases();

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

function startQuiz() {
    const db = databases[currentMode][selectedLevel];
    if (!db || db.length === 0) return alert("File CSV belum siap atau kosong!");
    
    isMeaningVisible = document.getElementById('toggle-meaning').checked;

    // LOGIKA BARU: Cek apakah user pilih jumlah tertentu atau FULL
    let limit;
    if (selectedQty === 'all') {
        limit = db.length; // Ambil semua soal yang ada di CSV stage tersebut
    } else {
        limit = selectedQty; // Ambil sesuai angka (5, 10, 15)
    }

    // Acak soal dan potong sesuai limit yang ditentukan tadi
    currentQuestions = [...db].sort(() => Math.random() - 0.5).slice(0, limit);
    
    questionIndex = 0; 
    score = 0; 
    history = [];
    
    showScreen('quiz');
    loadQuestion();
    switchKb('hira');
}

function loadQuestion() {
    const q = currentQuestions[questionIndex];
    document.getElementById('current-question').innerText = q.q;
    const meaningEl = document.getElementById('kanji-meaning');
    meaningEl.innerText = isMeaningVisible ? "Arti: " + q.m : "";
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
        btn.onclick = () => { if(currentInput.length < 12) { currentInput += char; updateDisplay(); } };
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
    const isCorrect = q.a.includes(currentInput); // Cek apakah input ada di list jawaban
    if(isCorrect) score += 100;
    
    history.push({ q: q.q, a: q.a.join(' / '), u: currentInput, s: isCorrect, m: q.m });
    
    questionIndex++;
    if(questionIndex < currentQuestions.length) loadQuestion(); else showResult();
}

function showResult() {
    showScreen('result');
    document.getElementById('final-score').innerText = score;
    const reviewList = document.getElementById('review-list');
    
    // Ini akan me-render soal yang SUDAH dijawab saja (yang ada di array history)
    reviewList.innerHTML = history.map(h => `
        <div class="review-item">
            <div style="display:flex; justify-content:space-between; font-weight:bold;">
                <span>${h.q} <small>(${h.u})</small></span>
                <span style="color:${h.s ? 'var(--success)' : 'var(--danger)'}">
                    ${h.s ? '✓' : '✗'}
                </span>
            </div>
            <div style="font-size:12px; color:#7f8c8d;">Benar: ${h.a} | Arti: ${h.m}</div>
        </div>
    `).join('');
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-' + id).classList.remove('hidden');
}

function selectQty(qty, btn) {
    selectedQty = qty;
    document.querySelectorAll('.btn-qty').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function quitQuiz() {
    // Jika belum ada soal yang dijawab sama sekali, langsung balik ke awal
    if (history.length === 0) {
        if (confirm("Belum ada soal dijawab. Yakin ingin keluar?")) {
            location.reload();
        }
        return;
    }

    // Jika sudah ada soal terjawab, tawarkan untuk lihat hasil
    if (confirm("Ingin berhenti dan lihat hasil skor sekarang?")) {
        showResult(); // Panggil fungsi hasil untuk nampilin skor sementara
    }
}