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

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

// Submit Member Form Function
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

// Register Event Listeners after DOM Load
document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', window.submitMemberForm);
    }
    
    // Start Gaming Background Particles Animation
    initGamingBackground();
});

// --- GAMING ANIMATED CANVAS BACKGROUND ---
function initGamingBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 1,
            color: Math.random() > 0.5 ? '#00f0ff' : '#8b5cf6',
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw animated cyber grid lines
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Draw and update neon particles
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fill();

            // Connect nearby particles with lines
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(0, 240, 255, ${1 - dist / 120 * 0.8})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });

        requestAnimationFrame(animate);
    }
    animate();
}
