// Force Update / Reset Admin Credentials in Storage
(function initSuperAdmin() {
    let members = JSON.parse(localStorage.getItem('tnpb_members')) || [];
    const superAdminIndex = members.findIndex(m => m.personalUser === "ponnarasu.17");
    
    if (superAdminIndex !== -1) {
        // Update password & status force reset
        members[superAdminIndex].personalPass = "Pilot@17";
        members[superAdminIndex].role = "ADMIN";
        members[superAdminIndex].status = "Approved";
    } else {
        // Create fresh Admin profile
        members.push({
            id: 9999,
            gameName: "Ponnarasu (Boss)",
            level: "100",
            rank: "Leader / Super Admin",
            famName: "TNPB",
            personalUser: "ponnarasu.17",
            personalPass: "Pilot@17",
            status: "Approved",
            role: "ADMIN"
        });
    }
    localStorage.setItem('tnpb_members', JSON.stringify(members));
})();

function switchTab(tab) {
    document.getElementById('login-error').innerText = '';
    if(tab === 'old') {
        document.getElementById('old-member-box').classList.remove('hidden');
        document.getElementById('user-login-box').classList.add('hidden');
        document.getElementById('tab-old-btn').classList.add('active-tab');
        document.getElementById('tab-user-btn').classList.remove('active-tab');
    } else {
        document.getElementById('old-member-box').classList.add('hidden');
        document.getElementById('user-login-box').classList.remove('hidden');
        document.getElementById('tab-user-btn').classList.add('active-tab');
        document.getElementById('tab-old-btn').classList.remove('active-tab');
    }
}

function verifyCommonLogin() {
    const user = document.getElementById('common-user').value.trim();
    const pass = document.getElementById('common-pass').value.trim();

    if (user === "TN PEAKY BLINDERS" && pass === "TNPB") {
        document.getElementById('step-1').classList.add('hidden');
        document.getElementById('step-2').classList.remove('hidden');
    } else {
        document.getElementById('login-error').innerText = "Invalid Common Credentials!";
    }
}

function loginPersonalUser() {
    const user = document.getElementById('personal-user').value.trim();
    const pass = document.getElementById('personal-pass').value.trim();
    const errorMsg = document.getElementById('login-error');

    let members = JSON.parse(localStorage.getItem('tnpb_members')) || [];
    
    // Direct Admin Hardcode Fallback Check (Guarantees Login Always)
    if (user === "ponnarasu.17" && pass === "Pilot@17") {
        document.getElementById('step-1').classList.add('hidden');
        document.getElementById('member-dashboard').classList.remove('hidden');

        document.getElementById('dash-player-name').innerText = "ponnarasu.17";
        document.getElementById('dash-game-name').innerText = "TN76_Tamilian";
        document.getElementById('dash-level').innerText = "17";
        document.getElementById('dash-rank').innerText = "Leader / Super Admin";
        document.getElementById('dash-fam').innerText = "TNPB";
        
        document.getElementById('dash-role-badge').innerText = "ROLE: ADMIN";
        document.getElementById('dash-role-badge').style.background = "#eab308";
        document.getElementById('dash-role-badge').style.color = "#000";
        document.getElementById('admin-only-tools').classList.remove('hidden');
        return;
    }

    const foundUser = members.find(m => m.personalUser === user && m.personalPass === pass);

    if (foundUser) {
        if (foundUser.status === 'Approved') {
            document.getElementById('step-1').classList.add('hidden');
            document.getElementById('member-dashboard').classList.remove('hidden');

            document.getElementById('dash-player-name').innerText = foundUser.personalUser;
            document.getElementById('dash-game-name').innerText = foundUser.gameName;
            document.getElementById('dash-level').innerText = foundUser.level;
            document.getElementById('dash-rank').innerText = foundUser.rank;
            document.getElementById('dash-fam').innerText = foundUser.famName;
            
            const role = foundUser.role || "MEMBER";
            document.getElementById('dash-role-badge').innerText = `ROLE: ${role}`;
            
            if(role === "ADMIN") {
                document.getElementById('dash-role-badge').style.background = "#eab308";
                document.getElementById('dash-role-badge').style.color = "#000";
                document.getElementById('admin-only-tools').classList.remove('hidden');
            } else {
                document.getElementById('admin-only-tools').classList.add('hidden');
            }
        } else {
            errorMsg.innerText = "Account Pending! Admin approval required.";
        }
    } else {
        errorMsg.innerText = "Incorrect Username or Password!";
    }
}

function submitMemberData(e) {
    e.preventDefault();
    const newMember = {
        id: Date.now(),
        gameName: document.getElementById('game-name').value,
        level: document.getElementById('game-level').value,
        rank: document.getElementById('game-rank').value,
        famName: document.getElementById('fam-name').value,
        personalUser: document.getElementById('new-user').value.trim(),
        personalPass: document.getElementById('new-pass').value.trim(),
        status: 'Pending',
        role: 'MEMBER'
    };

    let members = JSON.parse(localStorage.getItem('tnpb_members')) || [];
    if(members.some(m => m.personalUser === newMember.personalUser)) {
        alert("Username already taken!");
        return;
    }

    members.push(newMember);
    localStorage.setItem('tnpb_members', JSON.stringify(members));

    document.getElementById('step-2').classList.add('hidden');
    document.getElementById('step-3').classList.remove('hidden');
}

// Notice Modal Controls
function openNoticeModal() { document.getElementById('notice-modal').classList.remove('hidden'); }
function closeNoticeModal() { document.getElementById('notice-modal').classList.add('hidden'); }

// Admin Actions
function showAdminPanel() {
    document.getElementById('admin-panel').classList.remove('hidden');
    renderAdminTable();
}
function closeAdminPanel() { document.getElementById('admin-panel').classList.add('hidden'); }

function renderAdminTable() {
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = '';
    let members = JSON.parse(localStorage.getItem('tnpb_members')) || [];

    members.forEach(member => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member.gameName}</td>
            <td>${member.level}</td>
            <td>${member.rank}</td>
            <td>${member.famName}</td>
            <td>${member.personalUser}</td>
            <td><strong style="color:${member.role==='ADMIN'?'#eab308':'#38bdf8'}">${member.role || 'MEMBER'}</strong></td>
            <td style="color:${member.status === 'Approved' ? '#22c55e' : '#eab308'}">${member.status}</td>
            <td>
                ${member.status === 'Pending' ? `<button onclick="approveMember(${member.id})" class="action-btn btn-success">Accept</button>` : ''}
                ${member.role !== 'ADMIN' ? `<button onclick="makeAdmin(${member.id})" class="action-btn btn-admin">Make Admin</button>` : ''}
                <button onclick="editMember(${member.id})" class="action-btn" style="background:#0284c7;">Edit</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function approveMember(id) {
    let members = JSON.parse(localStorage.getItem('tnpb_members')) || [];
    members = members.map(m => { if(m.id === id) m.status = 'Approved'; return m; });
    localStorage.setItem('tnpb_members', JSON.stringify(members));
    renderAdminTable();
}

function makeAdmin(id) {
    let members = JSON.parse(localStorage.getItem('tnpb_members')) || [];
    members = members.map(m => { if(m.id === id) { m.role = 'ADMIN'; m.status = 'Approved'; } return m; });
    localStorage.setItem('tnpb_members', JSON.stringify(members));
    alert("User promoted to Admin!");
    renderAdminTable();
}

function editMember(id) {
    let members = JSON.parse(localStorage.getItem('tnpb_members')) || [];
    const member = members.find(m => m.id === id);

    if(member) {
        const newRank = prompt("Edit Rank:", member.rank);
        const newLevel = prompt("Edit Level:", member.level);
        const newFam = prompt("Edit Fam Name:", member.famName);

        if(newRank !== null) member.rank = newRank;
        if(newLevel !== null) member.level = newLevel;
        if(newFam !== null) member.famName = newFam;

        localStorage.setItem('tnpb_members', JSON.stringify(members));
        renderAdminTable();
    }
}