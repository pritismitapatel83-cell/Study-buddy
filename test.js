// Client-side tests + results (localStorage prototype)
document.addEventListener('DOMContentLoaded', () => {
    initAdminToggle();
    bindAdminButtons();
    loadTests();
    prefillUserName();
    bindSummaryHandlers();
});

function uuid() {
    return 't' + Date.now() + Math.floor(Math.random() * 1000);
}

function initAdminToggle() {
    const adminToggle = document.getElementById('adminToggle');
    const adminArea = document.getElementById('adminArea');
    adminToggle.addEventListener('change', () => {
        adminArea.style.display = adminToggle.checked ? 'block' : 'none';
    });
}

function bindAdminButtons() {
    document.getElementById('addQuestionBtn').addEventListener('click', addQuestionInput);
    document.getElementById('saveTestBtn').addEventListener('click', saveTestFromUI);
}

function addQuestionInput() {
    const container = document.getElementById('questionsContainer');
    const idx = container.children.length;
    const div = document.createElement('div');
    div.className = 'question-block';
    div.innerHTML = `
        <input type="text" class="q-text" placeholder="Question text">
        <div class="q-options">
            <input type="text" class="opt" placeholder="Option 1">
            <input type="text" class="opt" placeholder="Option 2">
            <input type="text" class="opt" placeholder="Option 3">
            <input type="text" class="opt" placeholder="Option 4">
        </div>
        <label>Answer index (0-3): <input type="number" class="q-answer" min="0" max="3" value="0"></label>
        <button class="remove-q">Remove</button>
        <hr>
    `;
    container.appendChild(div);
    div.querySelector('.remove-q').addEventListener('click', () => div.remove());
}

function saveTestFromUI() {
    const title = document.getElementById('title').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    if (!title || !date || !time) return alert('Please fill title, date and time');

    const qBlocks = Array.from(document.querySelectorAll('#questionsContainer .question-block'));
    const questions = qBlocks.map(b => {
        const text = b.querySelector('.q-text').value.trim();
        const opts = Array.from(b.querySelectorAll('.opt')).map(i => i.value);
        const answerIndex = Number(b.querySelector('.q-answer').value);
        return { id: uuid(), text, options: opts, answerIndex };
    }).filter(q => q.text && q.options.every(o => o));

    if (questions.length === 0) return alert('Add at least one complete question');

    const test = { id: uuid(), title, date, time, questions };
    const tests = JSON.parse(localStorage.getItem('tests')) || [];
    tests.push(test);
    localStorage.setItem('tests', JSON.stringify(tests));

    // clear UI
    document.getElementById('title').value = '';
    document.getElementById('date').value = '';
    document.getElementById('time').value = '';
    document.getElementById('questionsContainer').innerHTML = '';

    loadTests();
    showNotification('Test saved');
}

function loadTests() {
    const list = document.getElementById('testItems');
    list.innerHTML = '';
    const tests = JSON.parse(localStorage.getItem('tests')) || [];
    tests.forEach(test => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${test.title}</strong> <small>${test.date} | ${test.time}</small>`;
        const takeBtn = document.createElement('button');
        takeBtn.textContent = 'Take';
        takeBtn.addEventListener('click', () => startTest(test.id));
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', () => deleteTest(test.id));
        li.appendChild(takeBtn);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

function deleteTest(testId) {
    let tests = JSON.parse(localStorage.getItem('tests')) || [];
    tests = tests.filter(t => t.id !== testId);
    localStorage.setItem('tests', JSON.stringify(tests));
    loadTests();
}

function startTest(testId) {
    const tests = JSON.parse(localStorage.getItem('tests')) || [];
    const test = tests.find(t => t.id === testId);
    if (!test) return alert('Test not found');
    document.getElementById('takeTestArea').style.display = 'block';
    document.getElementById('takingTitle').textContent = `Taking: ${test.title}`;
    renderTest(test);
}

function renderTest(test) {
    const area = document.getElementById('testArea');
    area.innerHTML = '';
    test.questions.forEach((q, i) => {
        const div = document.createElement('div');
        div.className = 'q';
        // include data-answer index so we can reveal correct option later
        div.dataset.answer = q.answerIndex;
        div.innerHTML = `<p>${i+1}. ${q.text}</p>` +
            q.options.map((opt, idx) => `<label data-idx="${idx}"><input type="radio" name="q${i}" value="${idx}"> ${opt}</label>`).join('');
        area.appendChild(div);
    });
    const submit = document.createElement('button');
    submit.textContent = 'Submit Answers';
    submit.addEventListener('click', () => submitAnswers(test));
    area.appendChild(submit);
}

function submitAnswers(test) {
    // Prefer logged-in user when available
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let userNameInput = document.getElementById('userName');
    let userName = (userNameInput.value || '').trim();
    if (currentUser) {
        userName = currentUser.username || userName || currentUser.email || 'Student';
    }
    if (!userName) return alert('Please enter your name');
    let score = 0;
    const perQuestion = [];
    test.questions.forEach((q, i) => {
        const qDiv = document.querySelector(`.q:nth-of-type(${i+1})`);
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        const selectedIdx = sel ? Number(sel.value) : null;
        const correctIdx = Number(q.answerIndex);
        const isCorrect = selectedIdx === correctIdx;
        if (isCorrect) score++;
        perQuestion.push({ index: i, selectedIdx, correctIdx, question: q.text, options: q.options, isCorrect });
    });
    const userId = (currentUser && currentUser.username) ? currentUser.username : userName.toLowerCase().replace(/\s+/g,'_');
    const result = { userId, userName, testId: test.id, score, total: test.questions.length, date: new Date().toISOString() };
    saveResult(result);
    // show per-question feedback inline
    revealFeedback(perQuestion);
    // show summary modal with details
    showSummaryModal({ userName, score, total: test.questions.length, perQuestion, testTitle: test.title });
    // update ranking in dashboard if open
    try { if (window.opener && window.opener.updateRanking) window.opener.updateRanking(); } catch (e) {}
}

function revealFeedback(perQuestion) {
    perQuestion.forEach(p => {
        const qDiv = document.querySelector(`.q:nth-of-type(${p.index+1})`);
        if (!qDiv) return;
        if (p.isCorrect) {
            qDiv.classList.add('correct');
        } else {
            qDiv.classList.add('incorrect');
        }
        // highlight correct option label
        const correctLabel = qDiv.querySelector(`label[data-idx="${p.correctIdx}"]`);
        if (correctLabel) {
            const span = document.createElement('div');
            span.className = 'correct-answer';
            span.textContent = `Correct answer: ${correctLabel.textContent.trim()}`;
            qDiv.appendChild(span);
        }
        if (p.selectedIdx !== null && p.selectedIdx !== p.correctIdx) {
            const selectedLabel = qDiv.querySelector(`label[data-idx="${p.selectedIdx}"]`);
            if (selectedLabel) {
                selectedLabel.classList.add('wrong-answer');
            }
        }
    });
}

function showSummaryModal(data) {
    const modal = document.getElementById('summaryModal');
    const body = document.getElementById('summaryBody');
    const title = document.getElementById('summaryTitle');
    title.textContent = `${data.testTitle || 'Test'} — ${data.userName}`;
    body.innerHTML = '';
    const scoreLine = document.createElement('div');
    scoreLine.innerHTML = `<strong>Score:</strong> ${data.score}/${data.total} — <strong>${Math.round((data.score/data.total)*100)}%</strong>`;
    body.appendChild(scoreLine);
    const list = document.createElement('div');
    list.className = 'summary-body-list';
    data.perQuestion.forEach(p => {
        const item = document.createElement('div');
        item.className = 'summary-item';
        const qh = document.createElement('h4');
        qh.textContent = `${p.index+1}. ${p.question}`;
        const meta = document.createElement('div');
        meta.className = 'meta';
        const selectedText = p.selectedIdx !== null ? p.options[p.selectedIdx] : '(no answer)';
        const correctText = p.options[p.correctIdx];
        meta.innerHTML = `Your answer: <strong>${selectedText}</strong> — ${p.isCorrect ? '<span style="color:#059669">Correct</span>' : '<span style="color:#b91c1c">Incorrect</span>'}`;
        const correctLine = document.createElement('div');
        correctLine.textContent = `Correct answer: ${correctText}`;
        item.appendChild(qh);
        item.appendChild(meta);
        item.appendChild(correctLine);
        list.appendChild(item);
    });
    body.appendChild(list);
    modal.style.display = 'flex';
}

function bindSummaryHandlers() {
    const close = document.getElementById('summaryClose');
    const goDash = document.getElementById('summaryDashboard');
    if (close) close.addEventListener('click', () => { document.getElementById('summaryModal').style.display = 'none'; });
    if (goDash) goDash.addEventListener('click', () => { window.location.href = 'dashboard.html'; });
    // close when clicking outside
    const modal = document.getElementById('summaryModal');
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}

function prefillUserName() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    const userNameInput = document.getElementById('userName');
    if (!userNameInput) return;
    if (currentUser) {
        userNameInput.value = currentUser.username || currentUser.email || '';
        userNameInput.disabled = true;
        userNameInput.style.opacity = 0.9;
    } else {
        userNameInput.disabled = false;
    }
}

function saveResult(result) {
    const results = JSON.parse(localStorage.getItem('results')) || [];
    results.push(result);
    localStorage.setItem('results', JSON.stringify(results));
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}
