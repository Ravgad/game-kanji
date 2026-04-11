let databaseSoal = { 'N5': [], 'N4': [], 'N3': [], 'N2': [], 'N1': [] };
let selectedLevel = 'N5';
let selectedQty = 5;
let isMeaningVisible = true; // Status fitur show/hide
let currentQuestions = [];
let questionIndex = 0;
let score = 0;
let currentInput = "";
let history = [];

// Daftar karakter lengkap (termasuk karakter kecil)
const hiraList = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん".split("");
const kataList = "がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゃゅょっ".split("");

async function loadCSV() {
    try {
        const response = await fetch('soal.csv');
        const data = await response.text();
        const rows = data.split('\n').slice(1); 
        rows.forEach(row => {
            const cols = row.split(',');
            if (cols.length >= 4) {
                const lvl = cols[0].trim();
                if (databaseSoal[lvl]) {
                    databaseSoal[lvl].push({ k: cols[1].trim(), a: cols[2].trim().split(';'), m: cols[3].trim() });
                }
            }
        });
        console.log("Database Siap!");
    } catch (e) { console.error("Gagal load CSV"); }
}

loadCSV();

function selectLevel(lvl, btn) {
    selectedLevel = lvl;
    document.querySelectorAll('.btn-level').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function selectQty(qty, btn) {
    selectedQty = qty;
    document.querySelectorAll('.btn-qty').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function startQuiz() {
    if (databaseSoal[selectedLevel].length === 0) return alert("Soal belum siap!");
    
    // Cek status toggle arti di home
    isMeaningVisible = document.getElementById('toggle-meaning').checked;

    currentQuestions = [...databaseSoal[selectedLevel]].sort(() => Math.random() - 0.5).slice(0, selectedQty);
    questionIndex = 0; score = 0; history = [];
    showScreen('quiz');
    loadQuestion();
    switchKb('hira');
}

function loadQuestion() {
    const q = currentQuestions[questionIndex];
    document.getElementById('current-kanji').innerText = q.k;
    
    // Logika Show/Hide Arti
    const meaningEl = document.getElementById('kanji-meaning');
    if (isMeaningVisible) {
        meaningEl.innerText = "Arti: " + q.m;
        meaningEl.classList.remove('hidden');
    } else {
        meaningEl.innerText = "";
        meaningEl.classList.add('hidden');
    }

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
    const isCorrect = q.a.includes(currentInput);
    if(isCorrect) score += 100;

    history.push({ kanji: q.k, jawabanBenar: q.a.join(' / '), arti: q.m, inputUser: currentInput, status: isCorrect });

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
                <span>${h.kanji} <small>(${h.inputUser})</small></span>
                <span style="color:${h.status ? 'var(--success)' : 'var(--danger)'}">
                    ${h.status ? '✓ Benar' : '✗ Salah'}
                </span>
            </div>
            <div style="font-size:13px; color:#7f8c8d; margin-top:5px;">
                Benar: ${h.jawabanBenar} | Arti: ${h.arti}
            </div>
        </div>
    `).join('');
}

function quitQuiz() { if(confirm("Keluar?")) location.reload(); }
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-' + id).classList.remove('hidden');
}