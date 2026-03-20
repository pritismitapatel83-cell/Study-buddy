function showSection(id) {
    document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

// USERS (now loaded from localStorage 'users')
function getUsers() {
    const raw = JSON.parse(localStorage.getItem('users')) || [];
    // Normalize to { name, subjects: [] }
    return raw.map(u => ({ username: u.username, email: u.email, subject: u.subject }));
}

// MATCH
function findMatches() {
    let sub = document.getElementById("subject").value;
    let div = document.getElementById("matches");

    div.innerHTML = "";

    const users = JSON.parse(localStorage.getItem('users')) || [];
    users.forEach((u, i) => {
        if (u.subject && sub && u.subject === sub) {
            const safeName = (u.username || u.email || ('user'+i)).replace(/'/g, "\\'");
            div.innerHTML += `<div style="margin-bottom:10px;">${safeName}
                <button onclick="sendRequestByName('${safeName}')">Connect</button>
                <button onclick="openStudentConnectWith('${safeName}')">Chat</button>
            </div>`;
        }
    });
}

// Open studentconnect with selected username (store match and target)
function openStudentConnectWith(username) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const match = users.find(u => (u.username === username) || (u.email === username));
    // store the single match (studentconnect will read this)
    if (match) {
        localStorage.setItem('connectMatches', JSON.stringify([match]));
        localStorage.setItem('connectTarget', match.username || match.email || username);
        window.location.href = 'studentconnect.html';
    } else {
        alert('User not found');
    }
}

// REQUEST
function sendRequestByName(name) {
    let r = JSON.parse(localStorage.getItem('req')) || [];
    if (!r.includes(name)) r.push(name);
    localStorage.setItem('req', JSON.stringify(r));
    loadRequests();
}

function loadRequests() {
    let r = JSON.parse(localStorage.getItem("req")) || [];
    let div = document.getElementById("requests");

    div.innerHTML = "";
    r.forEach(n => {
        div.innerHTML += `<div>${n}
        <button onclick="accept('${n}')">Accept</button></div>`;
    });
}

function accept(name) {
    let c = JSON.parse(localStorage.getItem("con")) || [];
    c.push(name);
    localStorage.setItem("con", JSON.stringify(c));
    loadUsers();
}

// CHAT
let currentUser = "";

function loadUsers() {
    let c = JSON.parse(localStorage.getItem("con")) || [];
    let div = document.getElementById("userList");

    div.innerHTML = "";
    c.forEach(n => {
        div.innerHTML += `<div onclick="selectUser('${n}')">${n}</div>`;
    });
}

function selectUser(name) {
    currentUser = name;
    document.getElementById("chatHeader").innerText = name;
    displayChat();
}

function sendMessage() {
    let msg = document.getElementById("message").value;
    let chats = JSON.parse(localStorage.getItem("chat")) || [];

    chats.push({ user: currentUser, msg: msg, sender: "You" });
    localStorage.setItem("chat", JSON.stringify(chats));

    displayChat();
}

function displayChat() {
    let chats = JSON.parse(localStorage.getItem("chat")) || [];
    let box = document.getElementById("chatMessages");

    box.innerHTML = "";

    chats.forEach(c => {
        if (c.user === currentUser) {
            box.innerHTML += `
                <div class="message ${c.sender === "You" ? "sent" : "received"}">
                    ${c.msg}
                </div>`;
        }
    });
}

// GROUP
function createGroup() {
    let name = document.getElementById("groupName").value;
    let g = JSON.parse(localStorage.getItem("groups")) || [];

    g.push(name);
    localStorage.setItem("groups", JSON.stringify(g));
    loadGroups();
}

function loadGroups() {
    let g = JSON.parse(localStorage.getItem('groups')) || [];
    let div = document.getElementById('groupList');

    div.innerHTML = '';
    g.forEach((name, i) => {
        div.innerHTML += `<div onclick="openGroup(${i})">${name}</div>`;
    });
    renderSubjectGroups();
}

function renderSubjectGroups() {
    const container = document.getElementById('subjectGroups');
    const membersDiv = document.getElementById('subjectGroupMembers');
    container.innerHTML = '';
    membersDiv.innerHTML = '';
    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    const members = JSON.parse(localStorage.getItem('groupMembers')) || {};
    if (groups.length === 0) {
        container.innerHTML = '<small>No subject groups yet.</small>';
        return;
    }
    groups.forEach((g, idx) => {
        const safe = g.replace(/'/g,"\\'");
        const btnOpen = `<button onclick="openGroupByName('${safe}')">Open Group</button>`;
        const btnView = `<button onclick="viewGroupMembers('${safe}')">View Members</button>`;
        const btnJoin = `<button onclick="joinGroupByName('${safe}')">Join</button>`;
        container.innerHTML += `<div style="margin-bottom:8px;"><strong>${g}</strong> ${btnOpen} ${btnView} ${btnJoin} <small>(${(members[g]||[]).length} members)</small></div>`;
    });
}

function openGroupByName(name) {
    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    const idx = groups.indexOf(name);
    if (idx !== -1) openGroup(idx);
}

function viewGroupMembers(name) {
    const members = JSON.parse(localStorage.getItem('groupMembers')) || {};
    const list = members[name] || [];
    const out = document.getElementById('subjectGroupMembers');
    if (list.length === 0) {
        out.innerHTML = `<div>No members in ${name} yet.</div>`;
        return;
    }
    out.innerHTML = `<h4>Members of ${name}</h4><ul>` + list.map(u => `<li>${u}</li>`).join('') + '</ul>';
}

function joinGroupByName(name) {
    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!cur) return alert('Please login/register first');
    const members = JSON.parse(localStorage.getItem('groupMembers')) || {};
    if (!members[name]) members[name] = [];
    if (!members[name].includes(cur.username)) {
        members[name].push(cur.username);
        localStorage.setItem('groupMembers', JSON.stringify(members));
    }
    renderSubjectGroups();
    // open the group automatically
    openGroupByName(name);
}

let currentGroup = null; // will store group name

function openGroup(i) {
    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    currentGroup = groups[i];
    document.getElementById('groupTitle').innerText = currentGroup;
    // show/hide leave button based on membership
    const leaveBtn = document.getElementById('leaveGroupBtn');
    const members = JSON.parse(localStorage.getItem('groupMembers')) || {};
    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (cur && members[currentGroup] && members[currentGroup].includes(cur.username)) {
        leaveBtn.style.display = 'inline-block';
    } else {
        leaveBtn.style.display = 'none';
    }
    displayGroupChat();
}

function getCurrentUsername() {
    try {
        const cur = JSON.parse(localStorage.getItem('currentUser')) || null;
        return cur ? cur.username : 'You';
    } catch (e) { return 'You'; }
}

// initialize mute toggle control


function sendGroupMessage() {
    if (!currentGroup) return alert('Open a group first');
    let msg = document.getElementById('groupMsg').value.trim();
    if (!msg) return;
    // membership check
    const members = JSON.parse(localStorage.getItem('groupMembers')) || {};
    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!cur || !members[currentGroup] || !members[currentGroup].includes(cur.username)) return alert('Join the group to send messages');
    let g = JSON.parse(localStorage.getItem('gchat')) || {};
    if (!g[currentGroup]) g[currentGroup] = [];
    g[currentGroup].push({ user: getCurrentUsername(), msg, date: new Date().toISOString() });
    localStorage.setItem('gchat', JSON.stringify(g));
    document.getElementById('groupMsg').value = '';
    displayGroupChat();
}

function displayGroupChat() {
    let g = JSON.parse(localStorage.getItem('gchat')) || {};
    let box = document.getElementById('groupMessages');
    box.innerHTML = '';
    if (!currentGroup || !g[currentGroup]) return;
    g[currentGroup].forEach(m => {
        const time = m.date ? new Date(m.date).toLocaleString() : '';
        const cls = (m.user === getCurrentUsername()) ? 'message sent' : 'message received';
        box.innerHTML += `<div class="${cls}"><strong>${m.user}:</strong> ${m.msg}<small class="time">${time}</small></div>`;
    });
    // smooth-scroll to last message
    const last = box.lastElementChild;
    if (last) last.scrollIntoView({ behavior: 'smooth', block: 'end' });
    // show toast for new messages not from current user
    try {
        const messages = g[currentGroup];
        const lastMsg = messages[messages.length - 1];
        const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const isOwn = cur && lastMsg && lastMsg.user === cur.username;
        if (!isOwn && lastMsg) showToast(`${lastMsg.user}: ${lastMsg.msg}`);
    } catch (e) {}
}

function showToast(text) {
    let t = document.querySelector('.toast');
    if (!t) {
        t = document.createElement('div');
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

function leaveGroup() {
    if (!currentGroup) return;
    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!cur) return alert('No user logged in');
    const members = JSON.parse(localStorage.getItem('groupMembers')) || {};
    if (!members[currentGroup]) return;
    members[currentGroup] = members[currentGroup].filter(u => u !== cur.username);
    localStorage.setItem('groupMembers', JSON.stringify(members));
    // hide leave button and clear view
    document.getElementById('leaveGroupBtn').style.display = 'none';
    document.getElementById('groupTitle').innerText = '';
    document.getElementById('groupMessages').innerHTML = '';
    currentGroup = null;
    renderSubjectGroups();
}

loadRequests();
loadUsers();
loadGroups();
// auto-join current user to their subject group
(function autoJoinSubjectGroup(){
    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!cur) return;
    const subj = cur.subject;
    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    // if group not exists, create
    if (!groups.includes(subj)) {
        groups.push(subj);
        localStorage.setItem('groups', JSON.stringify(groups));
    }
    // ensure membership list stored under 'groupMembers'
    const members = JSON.parse(localStorage.getItem('groupMembers')) || {};
    if (!members[subj]) members[subj] = [];
    if (!members[subj].includes(cur.username)) members[subj].push(cur.username);
    localStorage.setItem('groupMembers', JSON.stringify(members));
})();

