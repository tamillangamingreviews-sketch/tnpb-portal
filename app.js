import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrGyZQmhx-83iqUt1SBsFDXECOEFYNQs0",
  authDomain: "tnpb-portal.firebaseapp.com",
  projectId: "tnpb-portal",
  storageBucket: "tnpb-portal.firebasestorage.app",
  messagingSenderId: "72478695514",
  appId: "1:72478695514:web:7515c8e1a60654c6e47863",
  measurementId: "G-FZN9MTMKGM"
};

// Initialize Firebase & Firestore with Explicit Default Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "(default)");

// Global Array for Cloud Sync
window.allMembersList = [];

// Realtime Cloud Data Listener
onSnapshot(collection(db, "members"), (snapshot) => {
    window.allMembersList = [];
    snapshot.forEach((docSnap) => {
        window.allMembersList.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel && !adminPanel.classList.contains('hidden')) {
        renderAdminTableUI();
    }
}, (error) => {
    console.error("Firestore Listener Error: ", error);
});

// UI Navigation Tab Switcher
window.switchTab = function(tab) {
    document.getElementById('login-error').innerText = '';
    document.getElementById('old-member-box').classList.add('hidden');
    document.getElementById('user-login-box').classList.add('hidden');
    document.getElementById('visitor-login-box').classList.add('hidden');
    
    document.getElementById('tab-old-btn').classList.remove('active-tab');
    document.getElementById('tab-user-btn').classList.remove('active-tab');
    document.getElementById('tab-visitor-btn').classList.remove('active-tab');

    if(tab === 'old') {
        document.getElementById('old-member-box').classList.remove('hidden');
        document.getElementById('tab-old-btn').classList.add('active-tab');
    } else if(tab === 'user') {
        document.getElementById('user-login-box').classList.remove('hidden');
        document.getElementById('tab-user-btn').classList.add('active-tab');
    } else if(tab === 'visitor') {
        document.getElementById('visitor-login-box').classList.remove('hidden');
        document.getElementById('tab-visitor-btn').classList.add('active-tab');
    }
};

// Common Squad Pass Verification
window.verifyCommonLogin = function() {
    const user = document.getElementById('common-user').value.trim();
    const pass = document.getElementById('common-pass').value.trim();

    if (user === "TN PEAKY BLINDERS" && pass === "TNPB") {
        document.getElementById('step-1').classList.add('hidden');
        document.getElementById('step-2').classList.remove('hidden');
    } else {
        document.getElementById('login-error').innerText = "INVALID SQUAD CREDENTIALS!";
    }
};

// Submit Member Form Direct Execution
window.submitMemberForm = async function() {
    try {
        const gameName = document.getElementById('game-name').value.trim();
        const gameLevel = document.getElementById('game-level').value.trim();
        const gameRank = document.getElementById('game-rank').value.trim();
        const famName = document.getElementById('fam-name').value.trim();
        const newUser = document.getElementById('new-user').value.trim();
        const newPass = document.getElementById('new-pass').value.trim();
        const confirmPass = document.getElementById('confirm-pass').value.trim();

        if (!gameName || !gameLevel || !gameRank || !famName || !newUser || !newPass || !confirmPass) {
            alert("Please fill all fields!");
            return;
        }

        if (newPass !== confirmPass) {
            alert("Passwords do not match!");
            return;
        }

        const newMember = {
            gameName: gameName,
            level: gameLevel,
            rank: gameRank,
            famName: famName,
            personalUser: newUser,
            personalPass: newPass,
            status: 'Pending',
            role: 'MEMBER',
            createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, "members"), newMember);
        document.getElementById('step-2').classList.add('hidden');
        document.getElementById('step-3').classList.remove('hidden');
    } catch (err) {
        console.error("Cloud Storage Error: ", err);
        alert("Error submitting form: " + err.message);
    }
};

// Visitor Direct Access
window.loginVisitor = function() {
    const visitorName = document.getElementById('visitor-name').value.trim() || "Guest Gamer";
    openDashboard({
        personalUser: visitorName,
        gameName: "Visitor Mode",
        level: "N/A",
        rank: "Guest",
        famName: "Public Viewer",
        role: "VISITOR"
    });
};

// Personal & Admin User Login Execution
window.loginPersonalUser = function() {
    const user = document.getElementById('personal-user').value.trim();
    const pass = document.getElementById('personal-pass').value.trim();
    const errorMsg = document.getElementById('login-error');

    if (user === "ponnarasu.17" && pass === "Pilot@17") {
        openDashboard({
            personalUser: "ponnarasu.17",
            gameName: "Ponnarasu (Boss)",
            level: "100",
            rank: "Leader / Super Admin",
            famName: "TNPB",
            role: "ADMIN"
        });
        return;
    }

    const foundUser = window.allMembersList.find(m => m.personalUser === user && m.personalPass === pass);

    if (foundUser) {
        if (foundUser.status === 'Approved') {
            openDashboard(foundUser);
        } else {
            errorMsg.innerText = "ACCOUNT PENDING! Admin approval required.";
        }
    } else {
        errorMsg.innerText = "INCORRECT USERNAME OR PASSWORD!";
    }
};

// Open Player / Admin Dashboard
function openDashboard(user) {
    document.getElementById('step-1').classList.add('hidden');
    document.getElementById('member-dashboard').classList.remove('hidden');
    document.getElementById('dash-player-name').innerText = user.personalUser;
    
    const role = user.role || "MEMBER";
    const roleBadge = document.getElementById('dash-role-badge');
    roleBadge.innerText = `ROLE: ${role}`;

    if (role === "VISITOR") {
        roleBadge.style.background = "rgba(139, 92, 246, 0.2)";
        roleBadge.style.borderColor = "#8b5cf6";
        roleBadge.style.color = "#a78bfa";
        document.getElementById('member-info-panel').classList.add('hidden');
        document.getElementById('visitor-info-panel').classList.remove('hidden');
        document.getElementById('admin-only-tools').classList.add('hidden');
    } else {
        document.getElementById('dash-game-name').innerText = user.gameName;
        document.getElementById('dash-level').innerText = user.level;
        document.getElementById('dash-rank').innerText = user.rank;
        document.getElementById('dash-fam').innerText = user.famName;
        document.getElementById('member-info-panel').classList.remove('hidden');
        document.getElementById('visitor-info-panel').classList.add('hidden');

        if (role === "ADMIN") {
            roleBadge.style.background = "rgba(245, 158, 11, 0.2)";
            roleBadge.style.borderColor = "#f59e0b";
            roleBadge.style.color = "#f59e0b";
            document.getElementById('admin-only-tools').classList.remove('hidden');
        } else {
            roleBadge.style.background = "rgba(0, 240, 255, 0.15)";
            roleBadge.style.borderColor = "#00f0ff";
            roleBadge.style.color = "#00f0ff";
            document.getElementById('admin-only-tools').classList.add('hidden');
        }
    }
}

// Admin Control Panel UI Actions
window.showAdminPanel = function() {
    document.getElementById('admin-panel').classList.remove('hidden');
    renderAdminTableUI();
};

window.closeAdminPanel = function() {
    document.getElementById('admin-panel').classList.add('hidden');
};

function renderAdminTableUI() {
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = '';

    if (window.allMembersList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#94a3b8;">No Member Profiles Found in Cloud Database.</td></tr>';
        return;
    }

    window.allMembersList.forEach((member) => {
        const id = member.id;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member.gameName}</td>
            <td>${member.level}</td>
            <td>${member.rank}</td>
            <td>${member.famName}</td>
            <td>${member.personalUser}</td>
            <td><strong style="color:${member.role==='ADMIN'?'#f59e0b':'#00f0ff'}">${member.role || 'MEMBER'}</strong></td>
            <td style="color:${member.status === 'Approved' ? '#22c55e' : '#f59e0b'}">${member.status}</td>
            <td>
                ${member.status === 'Pending' ? `<button onclick="approveMember('${id}')" class="action-btn btn-success">ACCEPT</button>` : ''}
                ${member.role !== 'ADMIN' ? `<button onclick="makeAdmin('${id}')" class="action-btn btn-admin">MAKE ADMIN</button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.approveMember = async function(docId) {
    const memberRef = doc(db, "members", docId);
    await updateDoc(memberRef, { status: "Approved" });
};

window.makeAdmin = async function(docId) {
    const memberRef = doc(db, "members", docId);
    await updateDoc(memberRef, { role: "ADMIN", status: "Approved" });
    alert("User Promoted to Admin!");
};

// Announcement Modal Triggers
window.openNoticeModal = function() { document.getElementById('notice-modal').classList.remove('hidden'); };
window.closeNoticeModal = function() { document.getElementById('notice-modal').classList.add('hidden'); };
