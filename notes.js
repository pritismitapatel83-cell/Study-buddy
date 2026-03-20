// Toggle mobile menu
function toggleMenu() {
    const nav = document.getElementById("navMenu");
    nav.style.display = nav.style.display === "flex" ? "none" : "flex";
}

// Upload a note: store as data URL in localStorage with subject and uploader
function uploadNote() {
    const subject = (document.getElementById("subject").value || '').trim();
    const fileInput = document.getElementById("file");

    if (!subject || !fileInput.files || fileInput.files.length === 0) {
        alert("Please enter subject and select a file");
        return;
    }

        const file = fileInput.files[0];
        const isPublic = !!document.getElementById('publicNote').checked;
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
            const uploader = cur ? cur.username : 'Anonymous';
            const notes = JSON.parse(localStorage.getItem('notes')) || [];
            notes.push({ id: 'n' + Date.now(), subject: subject.trim(), fileName: file.name, dataUrl, uploader, public: isPublic, date: new Date().toISOString() });
            localStorage.setItem('notes', JSON.stringify(notes));
            document.getElementById("subject").value = "";
            fileInput.value = "";
            document.getElementById('publicNote').checked = false;
            loadNotes();
        };
        reader.readAsDataURL(file);
}

// Load notes visible to the current user's subject (group members)
document.addEventListener('DOMContentLoaded', loadNotes);

function loadNotes() {
    const table = document.getElementById('notesTable');
    table.innerHTML = '';
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const mySubject = cur ? (cur.subject || '').toLowerCase() : null;

        const adminOnly = document.getElementById('adminOnly') && document.getElementById('adminOnly').checked;
        const search = (document.getElementById('searchInput') && document.getElementById('searchInput').value || '').toLowerCase();
        const visible = (cur ? notes.filter(n => n.public || ((n.subject || '').toLowerCase() === mySubject)) : notes.filter(n => n.public))
            .filter(n => {
                if (adminOnly) {
                    if ((n.uploader||'').toLowerCase() !== 'admin') return false;
                }
                if (!search) return true;
                return (n.fileName||'').toLowerCase().includes(search) || (n.subject||'').toLowerCase().includes(search);
            });

    visible.forEach(n => {
        const tr = document.createElement('tr');
        const tdSub = document.createElement('td'); tdSub.innerText = n.subject;
        const tdName = document.createElement('td'); tdName.innerHTML = `<span class="file-icon">${fileIconFor(n.fileName)}</span>${n.fileName}`;
        const tdUploader = document.createElement('td'); tdUploader.innerText = n.uploader || '';
            const tdAction = document.createElement('td');
            if (n.public) tdUploader.innerText += ' (public)';
            const a = document.createElement('a'); 
            a.href = n.dataUrl; 
            a.download = n.fileName; 
            a.innerText = 'Download'; 
            tdAction.appendChild(a); 
            const btnDetails = document.createElement('button'); btnDetails.style.marginLeft='8px'; btnDetails.textContent='Details'; btnDetails.addEventListener('click', () => openNoteDetails(n.id)); 
            btnDetails.className = 'btn small ghost'; tdAction.appendChild(btnDetails);
            const btnToggle = document.createElement('button'); btnToggle.className = 'btn small ghost'; btnToggle.style.marginLeft='8px'; btnToggle.textContent = n.public ? 'Make Private' : 'Make Public'; btnToggle.addEventListener('click', () => togglePublic(n.id));
            tdAction.appendChild(btnToggle);
            const btnDelete = document.createElement('button'); btnDelete.className = 'btn small danger'; btnDelete.style.marginLeft='8px'; btnDelete.textContent='Delete'; btnDelete.addEventListener('click', () => deleteNote(n.id));
            tdAction.appendChild(btnDelete);

        tr.appendChild(tdSub);
        tr.appendChild(tdName);
        tr.appendChild(tdUploader);
        tr.appendChild(tdAction);
        tr.classList.add('fade-in');
        table.appendChild(tr);
    });
}

    // helpers
    function findNoteById(id) {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        return notes.find(n => n.id === id);
    }

    function saveNotes(notes) { localStorage.setItem('notes', JSON.stringify(notes)); }

    function deleteNote(id) {
        if (!confirm('Delete this note?')) return;
        let notes = JSON.parse(localStorage.getItem('notes')) || [];
        notes = notes.filter(n => n.id !== id);
        saveNotes(notes);
        loadNotes();
    }

    function togglePublic(id) {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        const idx = notes.findIndex(n => n.id === id);
        if (idx === -1) return;
        notes[idx].public = !notes[idx].public;
        saveNotes(notes);
        loadNotes();
    }

    function openNoteDetails(id) {
        const n = findNoteById(id);
        if (!n) return alert('Note not found');
        document.getElementById('modalTitle').innerText = n.fileName;
        document.getElementById('modalUploader').innerText = n.uploader || '';
        document.getElementById('modalSubject').value = n.subject || '';
        document.getElementById('modalFileName').innerText = n.fileName;
        document.getElementById('modalDate').innerText = new Date(n.date).toLocaleString();
        document.getElementById('modalPublic').checked = !!n.public;
        const down = document.getElementById('modalDownload'); down.href = n.dataUrl; down.download = n.fileName;
        document.getElementById('noteModal').style.display = 'flex';
        // attach save/delete handlers
        document.getElementById('saveNoteBtn').onclick = () => saveNoteEdits(id);
        document.getElementById('deleteNoteBtn').onclick = () => { deleteNote(id); document.getElementById('noteModal').style.display='none'; };
    }

    function saveNoteEdits(id) {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        const idx = notes.findIndex(n => n.id === id);
        if (idx === -1) return;
        notes[idx].subject = document.getElementById('modalSubject').value.trim();
        notes[idx].public = document.getElementById('modalPublic').checked;
        saveNotes(notes);
        document.getElementById('noteModal').style.display='none';
        loadNotes();
    }

    // wire search and admin filter
    document.getElementById('searchInput').addEventListener('input', loadNotes);
    document.getElementById('adminOnly').addEventListener('change', loadNotes);

    // modal close
    document.getElementById('closeModal').addEventListener('click', () => document.getElementById('noteModal').style.display='none');

    // upload progress and icons
    function fileIconFor(name) {
        const ext = (name.split('.').pop() || '').toLowerCase();
        const map = { pdf: '📄', doc: '📝', docx: '📝', ppt: '📊', pptx: '📊', jpg: '🖼️', jpeg: '🖼️', png: '🖼️' };
        return map[ext] || '📁';
    }

    // override uploadNote to show progress
    const originalUploadNote = uploadNote;
    uploadNote = function() {
        const fileInput = document.getElementById('file');
        const progress = document.getElementById('uploadProgress');
        if (!fileInput.files || fileInput.files.length === 0) return originalUploadNote();
        const file = fileInput.files[0];
        progress.style.display = 'inline-block'; progress.value = 0;
        const reader = new FileReader();
        reader.onprogress = function(e) { if (e.lengthComputable) progress.value = Math.round((e.loaded / e.total) * 100); };
        reader.onloadend = function() { progress.style.display='none'; progress.value=0; };
        reader.onload = function(e) {
            // reuse previous logic by writing data directly
            const subject = (document.getElementById("subject").value || '').trim();
            const isPublic = !!document.getElementById('publicNote').checked;
            const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
            const uploader = cur ? cur.username : 'Anonymous';
            const notes = JSON.parse(localStorage.getItem('notes')) || [];
            notes.push({ id: 'n' + Date.now(), subject: subject, fileName: file.name, dataUrl: e.target.result, uploader, public: isPublic, date: new Date().toISOString() });
            localStorage.setItem('notes', JSON.stringify(notes));
            document.getElementById("subject").value = "";
            fileInput.value = "";
            document.getElementById('publicNote').checked = false;
            loadNotes();
        };
        reader.readAsDataURL(file);
    };