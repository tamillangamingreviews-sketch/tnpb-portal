import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Switch Between Form Tabs (Old, Member, Visitor)
window.switchTab = function(tab) {
    document.getElementById('login-error').innerText = '';
    
    // Hide all tab views
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

// Verify Common Squad Credentials
window.verifyCommonLogin = function() {
    const user = document.getElementById('common-user').value.trim();
    const pass = document.getElementById('common-pass').value.trim();

    if (user === "TN PEAKY BLINDERS" && pass === "TNPB") {
        document.getElementById('step-1').classList.add('hidden');
        document.getElementById('step-2').classList.remove('hidden');
    } else {
        document.getElementById('login-error').innerText = "Invalid Common Credentials!";
    }
};

// Visitor Quick Login
window.loginVisitor = function() {
    const visitorName = document.getElementById('visitor-name').value.trim() || "Guest Visitor";
    openDashboard({
        personalUser: visitorName,
        gameName: "Visitor Mode",
        level: "N/A",
        rank: "Guest",
        famName: "Public Viewer",
        role: "VISITOR"
    });
};

// Cloud Login Check (Super Admin + Firestore Users)
window.loginPersonalUser = async function() {
    const user = document.getElementById('personal-user').value.trim();
    const pass = document.getElementById('personal-pass').value.trim();
    const errorMsg = document.getElementById('login-error');

    // Super Admin Check
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

    try {
        const querySnapshot = await getDocs(collection(db, "members"));
        let foundUser = null;
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.personalUser === user && data.personalPass === pass) {
                foundUser = { id: docSnap.id, ...data };
            }
        });

        if (foundUser) {
            if (foundUser.status === 'Approved') {
                openDashboard(foundUser);
            } else {
                errorMsg.innerText = "Account Pending! Admin approval required.";
            }
        } else {
            errorMsg.innerText = "Incorrect Personal Username or Password!";
        }
    } catch (e) {
        errorMsg.innerText = "Database connection error!";
    }
};

function openDashboard(user) {
    document.getElementById('step-1').classList.add('hidden');
    document.getElementById('member-dashboard').classList.remove('hidden');

    document.getElementById('dash-player-name').innerText = user.personalUser;
    
    const role = user.role || "MEMBER";
    document.getElementById('dash-role-badge').innerText = `ROLE: ${role}`;

    if (role === "VISITOR") {
        document.getElementById('dash-role-badge').style.background = "#8b5cf6";
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
            document.getElementById('dash-role-badge').style.background = "#eab308";
            document.getElementById('dash-role-badge').style.color = "#000";
            document.getElementById('admin-only-tools').classList.remove('hidden');
        } else {
            document.getElementById('admin-only-tools').classList.add('hidden');
        }
    }
}

// Submit Member Form to Cloud Firestore
window.submitMemberData = async function(e) {
    e.preventDefault();

    const newMember = {
        gameName: document.getElementById('game-name').value,
        level: document.getElementById('game-level').value,
        rank: document.getElementById('game-rank').value,
        famName: document.getElementById('fam-name').value,
        personalUser: document.getElementById('new-user').value.trim(),
        personalPass: document.getElementById('new-pass').value.trim(),
        status: 'Pending',
        role: 'MEMBER',
        createdAt: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "members"), newMember);
        document.getElementById('step-2').classList.add('hidden');
        document.getElementById('step-3').classList.remove('hidden');
    } catch (err) {
        alert("Error saving data to Cloud Database!");
    }
};

// Admin Controls
window.showAdminPanel = function() {
    document.getElementById('admin-panel').classList.remove('hidden');
    renderAdminTable();
};

window.closeAdminPanel = function() {
    document.getElementById('admin-panel').classList.add('hidden');
};

async function renderAdminTable() {
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = '<tr><td colspan="8">Loading Members...</td></tr>';

    try {
        const querySnapshot = await getDocs(collection(db, "members"));
        tbody.innerHTML = '';

        querySnapshot.forEach((docSnap) => {
            const member = docSnap.data();
            const id = docSnap.id;
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
                    ${member.status === 'Pending' ? `<button onclick="approveMember('${id}')" class="action-btn btn-success">Accept</button>` : ''}
                    ${member.role !== 'ADMIN' ? `<button onclick="makeAdmin('${id}')" class="action-btn btn-admin">Make Admin</button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="8">Failed to load data.</td></tr>';
    }
}

window.approveMember = async function(docId) {
    const memberRef = doc(db, "members", docId);
    await updateDoc(memberRef, { status: "Approved" });
    renderAdminTable();
};

window.makeAdmin = async function(docId) {
    const memberRef = doc(db, "members", docId);
    await updateDoc(memberRef, { role: "ADMIN", status: "Approved" });
    alert("User Promoted to Cloud Admin!");
    renderAdminTable();
};

window.openNoticeModal = function() { document.getElementById('notice-modal').classList.remove('hidden'); };
window.closeNoticeModal = function() { document.getElementById('notice-modal').classList.add('hidden'); };

