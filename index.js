const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.onclick = () => container.classList.add('active');
loginBtn.onclick = () => container.classList.remove('active');

// Registration / Login handling (localStorage prototype)
document.getElementById('doRegister').addEventListener('click', () => {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const subject = document.getElementById('regSubject').value;
    if (!username || !email || !password || !subject) return alert('Please fill all fields including subject');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(u => u.username === username)) return alert('Username taken');
    const user = { username, email, password, subject };
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    // auto-login
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'dashboard.html';
});

document.getElementById('doLogin').addEventListener('click', () => {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return alert('Invalid credentials');
    const loginSubject = document.getElementById('loginSubject') ? document.getElementById('loginSubject').value : '';
    if (loginSubject) {
        // update session and persist subject on the stored user record
        user.subject = loginSubject;
        const idx = users.findIndex(u => u.username === username);
        if (idx !== -1) { users[idx].subject = loginSubject; localStorage.setItem('users', JSON.stringify(users)); }
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'dashboard.html';
});