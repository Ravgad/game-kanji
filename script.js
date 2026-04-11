/* --- JAVASCRIPT: LOGIKA GAME --- */

// 1. DATA SOAL (N5 - N1)
const databaseSoal = {
    'N5': [
        {k: '水', a: 'みず', m: 'Air'}, 
        {k: '人', a: 'ひと', m: 'Orang'}, 
        {k: '山', a: 'やま', m: 'Gunung'},
        {k: '日', a: 'ひ', m: 'Matahari'}, 
        {k: '木', a: 'き', m: 'Pohon'}
    ],
    'N4': [
        {k: '写真', a: 'しゃしん', m: 'Foto'}, 
        {k: '飲む', a: 'のむ', m: 'Minum'}, 
        {k: '歌', a: 'うた', m: 'Lagu'}
    ],
    'N3': [
        {k: '世界', a: 'せかい', m: 'Dunia'}, 
        {k: '複雑', a: 'ふくざつ', m: 'Rumit'}, 
        {k: '平和', a: 'へいわ', m: 'Damai'}
    ],
    'N2': [
        {k: '範囲', a: 'はんい', m: 'Cakupan'}, 
        {k: '貴重', a: 'きちょう', m: 'Berharga'}
    ],
    'N1': [
        {k: '謙遜', a: 'けんそん', m: 'Rendah Hati'}, 
        {k: '隠蔽', a: 'いんぺい', m: 'Sembunyi'}
    ]
};

const hiraList = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ".split("");
const kataList = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ".split("");

// 2. STATUS GAME (Penyimpan data sementara)
let selectedLevel = 'N5';
let selectedQty = 5;
let currentQuestions = [];
let questionIndex = 0;
let score = 0;
let currentInput = "";
let history = [];

// FUNGSI: Mengubah warna tombol level saat diklik
function selectLevel(lvl, btn) {
    selectedLevel = lvl;
    document.querySelectorAll('.btn-level').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

// FUNGSI: Mengubah warna tombol jumlah soal saat diklik
function selectQty(qty, btn) {
    selectedQty = qty;
    document.querySelectorAll('.btn-qty').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

// FUNGSI: Memulai Kuis
function startQuiz() {
    // Mengambil soal dan mengacaknya (shuffle)
    currentQuestions = [...databaseSoal[selectedLevel]]
        .sort(() => Math.random() - 0.5)
        .slice(0, selectedQty);
    
    questionIndex = 0;
    score = 0;
    history = [];
    showScreen('quiz');
    loadQuestion();
    switchKb('hira');
}

// FUNGSI: Menampilkan soal ke layar
function loadQuestion() {
    const q = currentQuestions[questionIndex];
    document.getElementById('current-kanji').innerText = q.k;
    document.getElementById('kanji-meaning').innerText = "Artinya: " + q.m;
    document.getElementById('q-count').innerText = `${questionIndex + 1}/${currentQuestions.length}`;
    
    const progressPercent = (questionIndex / currentQuestions.length) * 100;
    document.getElementById('progress-fill').style.width = progressPercent + "%";
    
    currentInput = "";
    updateDisplay();
}

// FUNGSI: Update tulisan yang diketik user
function updateDisplay() {
    document.getElementById('user-answer').innerText = currentInput;
}

// FUNGSI: Membuat tombol keyboard Hiragana/Katakana
function renderKeys(list) {
    const container = document.getElementById('keys-container');
    container.innerHTML = "";
    list.forEach(char => {
        const btn = document.createElement('button');
        btn.className = 'key';
        btn.innerText = char;
        btn.onclick = () => {
            if(currentInput.length < 10) {
                currentInput += char;
                updateDisplay();
            }
        };
        container.appendChild(btn);
    });
}

// FUNGSI: Ganti antara keyboard Hiragana atau Katakana
function switchKb(type) {
    if(type === 'hira') {
        renderKeys(hiraList);
        document.getElementById('btn-hira').classList.add('active');
        document.getElementById('btn-kata').classList.remove('active');
    } else {
        renderKeys(kataList);
        document.getElementById('btn-kata').classList.add('active');
        document.getElementById('btn-hira').classList.remove('active');
    }
}

function deleteChar() {
    currentInput = currentInput.slice(0, -1);
    updateDisplay();
}

// FUNGSI: Mengecek jawaban benar atau salah
function submitAnswer() {
    if(currentInput === "") return;

    const q = currentQuestions[questionIndex];
    const isCorrect = (currentInput === q.a);

    if(isCorrect) score += 100;

    // Simpan ke sejarah untuk review nanti
    history.push({ kanji: q.k, correct: q.a, user: currentInput, status: isCorrect });

    questionIndex++;
    if(questionIndex < currentQuestions.length) {
        loadQuestion();
    } else {
        showResult();
    }
}

// FUNGSI: Menampilkan layar skor akhir
function showResult() {
    showScreen('result');
    document.getElementById('final-score').innerText = score;
    const reviewBox = document.getElementById('review-list');
    reviewBox.innerHTML = "<h3>Review Jawaban:</h3>";

    history.forEach(item => {
        reviewBox.innerHTML += `
            <div class="review-item">
                <div>
                    <b>${item.kanji}</b> (${item.correct})
                </div>
                <span style="color:${item.status ? 'var(--success)' : 'var(--danger)'}">
                    ${item.status ? '✓ Benar' : '✗ ' + item.user}
                </span>
            </div>
        `;
    });
}

function quitQuiz() {
    if(confirm("Yakin ingin keluar?")) location.reload();
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-' + screenId).classList.remove('hidden');
}