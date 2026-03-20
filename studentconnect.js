// Populate the student connect sidebar and handle simple chat storage
document.addEventListener('DOMContentLoaded', () => {
    populateMatches();
});

function populateMatches() {
    const sidebar = document.querySelector('.sidebar');
    const messagesEl = document.getElementById('messages');
    const chatHeader = document.querySelector('.chat-header h3');
    const chatHeaderImg = document.querySelector('.chat-header img');
    const matches = JSON.parse(localStorage.getItem('connectMatches')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { username: 'Guest' };

    // clear existing users (keep header title)
    sidebar.innerHTML = '<h2>\uD83D\uDCAC Student Connect</h2>';

    if (matches.length === 0) {
        sidebar.innerHTML += '<div style="padding:12px;color:#475569">No matches found</div>';
        return;
    }

    matches.forEach((u, idx) => {
        const div = document.createElement('div');
        div.className = 'user';
        div.dataset.username = u.username || u.email || ('user' + idx);
        div.innerHTML = `<img src="profile1.jpeg"><span>${u.username || u.email} (${u.subject || ''})</span>`;
        div.addEventListener('click', () => openChatWith(u));
        sidebar.appendChild(div);
    });

    // If a target was set (from connection page), open that user specifically
    const target = localStorage.getItem('connectTarget');
    if (target) {
        const targetUser = matches.find(m => (m.username === target) || (m.email === target));
        if (targetUser) openChatWith(targetUser);
        localStorage.removeItem('connectTarget');
    } else {
        // open first match by default
        if (matches[0]) openChatWith(matches[0]);
    }
}

function conversationId(a, b) {
    const ids = [a, b].sort();
    return `chat_${ids[0]}_${ids[1]}`;
}

function openChatWith(peer) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { username: 'Guest' };
    const chatHeader = document.querySelector('.chat-header h3');
    const chatHeaderImg = document.querySelector('.chat-header img');
    const messagesEl = document.getElementById('messages');
    chatHeader.textContent = peer.username || peer.email || 'Student';
    chatHeaderImg.src = 'profile1.jpeg';

    // highlight active user
    document.querySelectorAll('.sidebar .user').forEach(el => el.classList.remove('active'));
    const activeEl = Array.from(document.querySelectorAll('.sidebar .user')).find(el => el.dataset.username === (peer.username || peer.email));
    if (activeEl) activeEl.classList.add('active');

    // load messages
    const conv = conversationId(currentUser.username || currentUser.email, peer.username || peer.email);
    const chats = JSON.parse(localStorage.getItem('chats') || '{}');
    const msgs = chats[conv] || [];
    messagesEl.innerHTML = '';
    msgs.forEach(m => {
        const div = document.createElement('div');
        div.className = 'message ' + (m.from === (currentUser.username || currentUser.email) ? 'sent' : 'received');
        div.textContent = m.text;
        messagesEl.appendChild(div);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
    // store current conversation for sendMessage
    messagesEl.dataset.currentConv = conv;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = (input.value || '').trim();
    if (!text) return;
    const messagesEl = document.getElementById('messages');
    const conv = messagesEl.dataset.currentConv;
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { username: 'Guest' };
    const chats = JSON.parse(localStorage.getItem('chats') || '{}');
    chats[conv] = chats[conv] || [];
    const msg = { from: currentUser.username || currentUser.email || 'Guest', text, date: new Date().toISOString() };
    chats[conv].push(msg);
    localStorage.setItem('chats', JSON.stringify(chats));
    // append to UI
    const div = document.createElement('div');
    div.className = 'message sent';
    div.textContent = text;
    document.getElementById('messages').appendChild(div);
    input.value = '';
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

window.sendMessage = sendMessage;
*** End Patch