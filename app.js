const STORAGE_KEY = 'org-study-progress';
let currentTopic = null;
let progress = loadProgress();

function loadProgress() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
}

function saveProgress() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {}
}

function getTopicProgress(topicId) {
    return progress[topicId] || { theoryRead: false, abcdAnswered: {}, openRevealed: {} };
}

function setTopicProgress(topicId, data) {
    progress[topicId] = { ...getTopicProgress(topicId), ...data };
    saveProgress();
    renderProgress();
}

function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('theme-toggle').textContent = saved === 'dark' ? '☀️' : '🌙';
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    document.getElementById('theme-toggle').textContent = next === 'dark' ? '☀️' : '🌙';
});

function renderNavigation() {
    const nav = document.getElementById('topic-nav');
    nav.innerHTML = '';
    topicsData.forEach(topic => {
        const btn = document.createElement('button');
        btn.className = 'topic-link';
        btn.dataset.topicId = topic.id;
        btn.innerHTML = `<span class="topic-icon">${topic.icon}</span> ${topic.title}`;
        btn.addEventListener('click', () => showTopic(topic.id));
        nav.appendChild(btn);
    });
}

function renderTopicGrid() {
    const grid = document.getElementById('topic-grid');
    if (!grid) return;
    grid.innerHTML = '';
    topicsData.forEach(topic => {
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.innerHTML = `
            <div class="topic-card-icon">${topic.icon}</div>
            <h3>${topic.title}</h3>
            <p>${topic.description}</p>
        `;
        card.addEventListener('click', () => showTopic(topic.id));
        grid.appendChild(card);
    });
}

function showTopic(topicId) {
    const topic = topicsData.find(t => t.id === topicId);
    if (!topic) return;
    currentTopic = topicId;

    document.querySelectorAll('.topic-link').forEach(link => {
        link.classList.toggle('active', link.dataset.topicId === topicId);
    });

    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="topic-content">
            <h2>${topic.icon} ${topic.title}</h2>
            <p class="topic-meta">${topic.subtitle}</p>
            <div class="tabs">
                <button class="tab-btn active" data-tab="theory">📖 Teorie</button>
                <button class="tab-btn" data-tab="abcd">✅ ABCD Test (${topic.abcd.length})</button>
                <button class="tab-btn" data-tab="open">💭 Otevřené otázky (${topic.open.length})</button>
            </div>
            <div id="tab-theory" class="tab-content active">
                <div class="theory-section">${topic.theory}</div>
            </div>
            <div id="tab-abcd" class="tab-content"></div>
            <div id="tab-open" class="tab-content"></div>
        </div>
    `;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    renderABCD(topic);
    renderOpenQuestions(topic);

    setTopicProgress(topicId, { theoryRead: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tab}`);
    });
}

function renderABCD(topic) {
    const container = document.getElementById('tab-abcd');
    const topicProg = getTopicProgress(topic.id);

    const summaryHtml = `
        <div class="test-summary">
            <h3>ABCD Test - ${topic.title}</h3>
            <p>Odpovězte na ${topic.abcd.length} testových otázek. U každé hned uvidíte správnou odpověď a vysvětlení.</p>
            <p id="score-display">Zodpovězeno: <strong id="answered-count">${Object.keys(topicProg.abcdAnswered).length}</strong> / ${topic.abcd.length} | Správně: <strong id="correct-count">${Object.values(topicProg.abcdAnswered).filter(v => v.correct).length}</strong></p>
            <button class="btn-secondary" id="reset-test" style="width: auto; margin-top: 0.5rem;">Resetovat test</button>
        </div>
        <div id="abcd-questions"></div>
    `;
    container.innerHTML = summaryHtml;

    document.getElementById('reset-test').addEventListener('click', () => {
        if (confirm('Opravdu chcete resetovat odpovědi v tomto testu?')) {
            setTopicProgress(topic.id, { abcdAnswered: {} });
            renderABCD(topic);
        }
    });

    const questionsContainer = document.getElementById('abcd-questions');
    const letters = ['A', 'B', 'C', 'D'];

    topic.abcd.forEach((question, qIdx) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        const savedAnswer = topicProg.abcdAnswered[qIdx];

        card.innerHTML = `
            <div class="question-number">Otázka ${qIdx + 1} / ${topic.abcd.length}</div>
            <div class="question-text">${question.q}</div>
            <div class="answer-options" id="options-${qIdx}"></div>
            <div class="explanation" id="explanation-${qIdx}" style="display: ${savedAnswer ? 'block' : 'none'};">
                <div class="explanation-title">💡 Vysvětlení</div>
                <div>${question.explanation}</div>
            </div>
        `;

        questionsContainer.appendChild(card);

        const optionsDiv = document.getElementById(`options-${qIdx}`);
        question.options.forEach((opt, optIdx) => {
            const optDiv = document.createElement('div');
            optDiv.className = 'answer-option';

            if (savedAnswer) {
                optDiv.classList.add('disabled');
                if (optIdx === question.correct) optDiv.classList.add('correct');
                if (optIdx === savedAnswer.selected && optIdx !== question.correct) optDiv.classList.add('incorrect');
            }

            optDiv.innerHTML = `
                <div class="answer-letter">${letters[optIdx]}</div>
                <div>${opt}</div>
            `;

            if (!savedAnswer) {
                optDiv.addEventListener('click', () => answerQuestion(topic, qIdx, optIdx));
            }
            optionsDiv.appendChild(optDiv);
        });
    });
}

function answerQuestion(topic, qIdx, optIdx) {
    const topicProg = getTopicProgress(topic.id);
    if (topicProg.abcdAnswered && topicProg.abcdAnswered[qIdx]) return;

    const question = topic.abcd[qIdx];
    const isCorrect = optIdx === question.correct;

    topicProg.abcdAnswered = topicProg.abcdAnswered || {};
    topicProg.abcdAnswered[qIdx] = { selected: optIdx, correct: isCorrect };
    setTopicProgress(topic.id, { abcdAnswered: topicProg.abcdAnswered });

    const optionsDiv = document.getElementById(`options-${qIdx}`);
    optionsDiv.querySelectorAll('.answer-option').forEach((opt, idx) => {
        opt.classList.add('disabled');
        if (idx === question.correct) opt.classList.add('correct');
        if (idx === optIdx && !isCorrect) opt.classList.add('incorrect');
    });

    document.getElementById(`explanation-${qIdx}`).style.display = 'block';
    document.getElementById('answered-count').textContent = Object.keys(topicProg.abcdAnswered).length;
    document.getElementById('correct-count').textContent = Object.values(topicProg.abcdAnswered).filter(v => v.correct).length;
}

function renderOpenQuestions(topic) {
    const container = document.getElementById('tab-open');
    const topicProg = getTopicProgress(topic.id);

    container.innerHTML = `
        <div class="test-summary">
            <h3>Otevřené otázky - ${topic.title}</h3>
            <p>Procvičte si formulaci odpovědí. Napište svou odpověď a poté si zobrazte vzorovou odpověď pro porovnání.</p>
        </div>
        <div id="open-questions"></div>
    `;

    const qContainer = document.getElementById('open-questions');
    topic.open.forEach((question, qIdx) => {
        const card = document.createElement('div');
        card.className = 'open-question';
        const revealed = topicProg.openRevealed && topicProg.openRevealed[qIdx];

        card.innerHTML = `
            <div class="question-number">Otázka ${qIdx + 1} / ${topic.open.length}</div>
            <div class="question-text">${question.q}</div>
            <textarea id="answer-${qIdx}" placeholder="Napište svou odpověď..."></textarea>
            <button class="btn" id="show-${qIdx}">Zobrazit vzorovou odpověď</button>
            <div class="sample-answer ${revealed ? 'show' : ''}" id="sample-${qIdx}">
                <div class="sample-answer-title">✅ Vzorová odpověď</div>
                <div>${question.sample}</div>
            </div>
        `;
        qContainer.appendChild(card);

        document.getElementById(`show-${qIdx}`).addEventListener('click', () => {
            const sample = document.getElementById(`sample-${qIdx}`);
            sample.classList.add('show');
            const tp = getTopicProgress(topic.id);
            tp.openRevealed = tp.openRevealed || {};
            tp.openRevealed[qIdx] = true;
            setTopicProgress(topic.id, { openRevealed: tp.openRevealed });
        });
    });
}

function renderProgress() {
    const statsDiv = document.getElementById('progress-stats');
    if (!statsDiv) return;

    let totalQuestions = 0;
    let answeredQuestions = 0;
    let correctAnswers = 0;
    let topicsStarted = 0;

    topicsData.forEach(topic => {
        const tp = getTopicProgress(topic.id);
        totalQuestions += topic.abcd.length;
        const answered = Object.keys(tp.abcdAnswered || {}).length;
        answeredQuestions += answered;
        correctAnswers += Object.values(tp.abcdAnswered || {}).filter(v => v.correct).length;
        if (tp.theoryRead || answered > 0) topicsStarted++;
    });

    const percent = totalQuestions ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    const successRate = answeredQuestions ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;

    statsDiv.innerHTML = `
        <div>Témata: <strong>${topicsStarted}/${topicsData.length}</strong></div>
        <div>Test: <strong>${answeredQuestions}/${totalQuestions}</strong> (${percent}%)</div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${percent}%;"></div></div>
        <div style="margin-top: 0.5rem;">Úspěšnost: <strong>${successRate}%</strong></div>
    `;
}

function startExamMode() {
    currentTopic = '__exam__';
    document.querySelectorAll('.topic-link').forEach(link => link.classList.remove('active'));

    const allQuestions = [];
    topicsData.forEach(topic => {
        topic.abcd.forEach((q, idx) => {
            allQuestions.push({ ...q, topicTitle: topic.title, topicIcon: topic.icon });
        });
    });

    for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    const examQuestions = allQuestions.slice(0, 30);
    let answered = {};

    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="topic-content">
            <h2>🎓 Souhrnný test</h2>
            <p class="topic-meta">30 náhodných otázek ze všech 9 témat</p>
            <div class="test-summary">
                <h3>Příprava na zkoušku</h3>
                <p>Otázky z různých témat v náhodném pořadí. U každé hned uvidíte správnou odpověď.</p>
                <p id="score-display">Zodpovězeno: <strong id="answered-count">0</strong> / ${examQuestions.length} | Správně: <strong id="correct-count">0</strong></p>
                <button class="btn" id="new-exam" style="width: auto; margin-top: 0.5rem;">Nový test</button>
            </div>
            <div id="exam-questions"></div>
        </div>
    `;

    document.getElementById('new-exam').addEventListener('click', () => startExamMode());

    const qContainer = document.getElementById('exam-questions');
    const letters = ['A', 'B', 'C', 'D'];

    examQuestions.forEach((question, qIdx) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerHTML = `
            <div class="question-number">Otázka ${qIdx + 1} / ${examQuestions.length} • ${question.topicIcon} ${question.topicTitle}</div>
            <div class="question-text">${question.q}</div>
            <div class="answer-options" id="exam-options-${qIdx}"></div>
            <div class="explanation" id="exam-explanation-${qIdx}" style="display: none;">
                <div class="explanation-title">💡 Vysvětlení</div>
                <div>${question.explanation}</div>
            </div>
        `;
        qContainer.appendChild(card);

        const optionsDiv = document.getElementById(`exam-options-${qIdx}`);
        question.options.forEach((opt, optIdx) => {
            const optDiv = document.createElement('div');
            optDiv.className = 'answer-option';
            optDiv.innerHTML = `<div class="answer-letter">${letters[optIdx]}</div><div>${opt}</div>`;
            optDiv.addEventListener('click', () => {
                if (answered[qIdx] !== undefined) return;
                const isCorrect = optIdx === question.correct;
                answered[qIdx] = { selected: optIdx, correct: isCorrect };

                optionsDiv.querySelectorAll('.answer-option').forEach((o, idx) => {
                    o.classList.add('disabled');
                    if (idx === question.correct) o.classList.add('correct');
                    if (idx === optIdx && !isCorrect) o.classList.add('incorrect');
                });
                document.getElementById(`exam-explanation-${qIdx}`).style.display = 'block';
                document.getElementById('answered-count').textContent = Object.keys(answered).length;
                document.getElementById('correct-count').textContent = Object.values(answered).filter(v => v.correct).length;
            });
            optionsDiv.appendChild(optDiv);
        });
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('exam-mode-btn').addEventListener('click', startExamMode);

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    const key = e.key.toLowerCase();
    const map = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
    if (!(key in map)) return;

    const visibleOptions = document.querySelectorAll('.answer-option:not(.disabled)');
    if (visibleOptions.length === 0) return;

    const firstUnanswered = Array.from(document.querySelectorAll('.answer-options')).find(group => {
        return group.querySelector('.answer-option:not(.disabled)');
    });
    if (!firstUnanswered) return;

    const target = firstUnanswered.children[map[key]];
    if (target && !target.classList.contains('disabled')) {
        target.click();
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
});

document.getElementById('reset-progress').addEventListener('click', () => {
    if (confirm('Opravdu chcete resetovat veškerý pokrok?')) {
        progress = {};
        saveProgress();
        renderProgress();
        if (currentTopic) showTopic(currentTopic);
    }
});

initTheme();
renderNavigation();
renderTopicGrid();
renderProgress();
