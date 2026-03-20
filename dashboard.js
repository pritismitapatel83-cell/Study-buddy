// Update ranking from localStorage results
function updateRanking() {
    const results = JSON.parse(localStorage.getItem('results')) || [];
    // aggregate points by user (sum of scores)
    const map = {};
    results.forEach(r => {
        if (!map[r.userId]) map[r.userId] = { userId: r.userId, name: r.userName, points: 0 };
        map[r.userId].points += Number(r.score || 0);
    });

    const ranking = Object.values(map).sort((a,b) => b.points - a.points);
    const list = document.querySelector('.ranking-list');
    if (!list) return;
    list.innerHTML = '';

    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    ranking.forEach((u, i) => {
        const li = document.createElement('li');
        if (currentUser && (u.userId === (currentUser.username || currentUser.email))) li.classList.add('current-user');
        li.innerHTML = `<span class="rank">${i+1}</span><span class="name">${u.name}</span><span class="score">${u.points} pts</span>`;
        list.appendChild(li);
    });

    // If no results, show a placeholder
    if (ranking.length === 0) {
        const li = document.createElement('li');
        li.innerHTML = `<span class="rank">—</span><span class="name">No results yet</span><span class="score">—</span>`;
        list.appendChild(li);
    }
}

document.addEventListener('DOMContentLoaded', updateRanking);
window.updateRanking = updateRanking;

// Compute matches by subject and navigate to studentconnect
function dashboardConnect() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!currentUser) return alert('Please login to find study partners');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const subject = currentUser.subject || '';
    // find users with same subject (exclude self)
    let matches = users.filter(u => u.username !== currentUser.username && u.subject && subject && u.subject === subject);
    // fallback: if no matches, include users with no subject set or any other users
    if (matches.length === 0) {
        matches = users.filter(u => u.username !== currentUser.username);
    }
    // store matches for studentconnect page to read
    localStorage.setItem('connectMatches', JSON.stringify(matches));
    // navigate
    window.location.href = 'studentconnect.html';
}

window.dashboardConnect = dashboardConnect;