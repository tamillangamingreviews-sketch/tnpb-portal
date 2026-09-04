/* =========================================================
   TN PEAKY BLINDERS
   SECURE FIREBASE GAMING PORTAL
   ========================================================= */

/* =========================================================
   FIREBASE IMPORTS
   ========================================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* =========================================================
   FIREBASE CONFIG
   ========================================================= */
const firebaseConfig = {
    apiKey: "AIzaSyBrGyZQmh-83iqUt1SBsFDXECOEFYNQs0",
    authDomain: "tnpb-portal.firebaseapp.com",
    projectId: "tnpb-portal",
    storageBucket: "tnpb-portal.firebasestorage.app",
    messagingSenderId: "72478695514",
    appId: "1:72478695514:web:7515c8e1a60654c6e47863",
    measurementId: "G-FZN9MTMKGM"
};

/* =========================================================
   INITIALIZE FIREBASE
   ========================================================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* =========================================================
   GLOBAL STATE
   ========================================================= */
window.allMembersList = [];
let currentMember = null;
let membersUnsubscribe = null;

/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */
function getElement(id) {
    return document.getElementById(id);
}

function showError(message) {
    const errorBox = getElement("login-error");
    if (errorBox) errorBox.innerText = message;
}

function clearError() {
    const errorBox = getElement("login-error");
    if (errorBox) errorBox.innerText = "";
}

function setButtonLoading(button, loading, normalText) {
    if (!button) return;
    button.disabled = loading;
    button.innerText = loading ? "PLEASE WAIT..." : normalText;
}

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   UI NAVIGATION
   ========================================================= */
window.switchTab = function(tab) {
    clearError();
    getElement("old-member-box")?.classList.add("hidden");
    getElement("user-login-box")?.classList.add("hidden");
    getElement("visitor-login-box")?.classList.add("hidden");

    getElement("tab-old-btn")?.classList.remove("active-tab");
    getElement("tab-user-btn")?.classList.remove("active-tab");
    getElement("tab-visitor-btn")?.classList.remove("active-tab");

    if (tab === "old") {
        getElement("old-member-box")?.classList.remove("hidden");
        getElement("tab-old-btn")?.classList.add("active-tab");
    } else if (tab === "user") {
        getElement("user-login-box")?.classList.remove("hidden");
        getElement("tab-user-btn")?.classList.add("active-tab");
    } else if (tab === "visitor") {
        getElement("visitor-login-box")?.classList.remove("hidden");
        getElement("tab-visitor-btn")?.classList.add("active-tab");
    }
};

/* =========================================================
   COMMON SQUAD ACCESS
   ========================================================= */
window.verifyCommonLogin = function() {
    clearError();
    const user = getElement("common-user")?.value.trim();
    const pass = getElement("common-pass")?.value.trim();

    if (user === "TN PEAKY BLINDERS" && pass === "TNPB") {
        getElement("step-1")?.classList.add("hidden");
        getElement("step-2")?.classList.remove("hidden");
    } else {
        showError("INVALID SQUAD CREDENTIALS!");
    }
};

/* =========================================================
   MEMBER REGISTRATION (AUTH + FIRESTORE)
   ========================================================= */
window.submitMemberForm = async function() {
    const submitBtn = getElement("submit-btn");
    try {
        clearError();

        const gameName = getElement("game-name").value.trim();
        const gameLevel = getElement("game-level").value.trim();
        const gameRank = getElement("game-rank").value.trim();
        const famName = getElement("fam-name").value.trim();
        const personalUser = getElement("new-user").value.trim();
        const email = getElement("new-email").value.trim().toLowerCase();
        const password = getElement("new-pass").value;
        const confirmPassword = getElement("confirm-pass").value;

        if (!gameName || !gameLevel || !gameRank || !famName || !personalUser || !email || !password || !confirmPassword) {
            alert("Please fill all fields!");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (password.length < 6) {
            alert("Password must contain at least 6 characters.");
            return;
        }

        setButtonLoading(submitBtn, true, "SUBMIT FOR APPROVAL");

        // 1. Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Save profile in Firestore with UID
        const memberData = {
            uid: user.uid,
            email: email,
            personalUser: personalUser,
            gameName: gameName,
            level: gameLevel,
            rank: gameRank,
            famName: famName,
            role: "MEMBER",
            status: "Pending",
            createdAt: serverTimestamp()
        };

        await setDoc(doc(db, "members", user.uid), memberData);

        setButtonLoading(submitBtn, false, "SUBMIT FOR APPROVAL");
        getElement("step-2")?.classList.add("hidden");
        getElement("step-3")?.classList.remove("hidden");

    } catch (error) {
        console.error("Registration Error: ", error);
        setButtonLoading(submitBtn, false, "SUBMIT FOR APPROVAL");
        alert(error.message || "Error during registration.");
    }
};

/* =========================================================
   PERSONAL / ADMIN LOGIN (FIREBASE AUTH)
   ========================================================= */
window.loginPersonalUser = async function() {
    clearError();
    const email = getElement("personal-user")?.value.trim().toLowerCase();
    const password = getElement("personal-pass")?.value;

    if (!email || !password) {
        showError("Please enter email and password!");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Login Error: ", error);
        showError("INVALID EMAIL OR PASSWORD!");
    }
};

/* =========================================================
   VISITOR ACCESS
   ========================================================= */
window.loginVisitor = function() {
    const visitorName = getElement("visitor-name")?.value.trim() || "Guest Gamer";
    openDashboard({
        personalUser: visitorName,
        email: "guest@tnpb.portal",
        gameName: "Visitor Mode",
        level: "N/A",
        rank: "Guest",
        famName: "Public Viewer",
        role: "VISITOR"
    });
};

/* =========================================================
   AUTH STATE LISTENER & DASHBOARD LOGIC
   ========================================================= */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const docRef = doc(db, "members", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.status === "Approved" || userData.role === "ADMIN") {
                    currentMember = userData;
                    openDashboard(userData);
                } else {
                    showError("ACCOUNT PENDING! Admin approval required.");
                    await signOut(auth);
                }
            } else {
                showError("User profile not found in database.");
            }
        } catch (err) {
            console.error("Profile Fetch Error: ", err);
        }
    } else {
        currentMember = null;
    }
});

function openDashboard(user) {
    getElement("step-1")?.classList.add("hidden");
    getElement("step-2")?.classList.add("hidden");
    getElement("step-3")?.classList.add("hidden");
    getElement("member-dashboard")?.classList.remove("hidden");

    getElement("dash-player-name").innerText = user.personalUser || "-";
    getElement("dash-email").innerText = user.email || "-";
    
    const role = user.role || "MEMBER";
    const roleBadge = getElement("dash-role-badge");
    roleBadge.innerText = `ROLE: ${role}`;

    if (role === "VISITOR") {
        getElement("member-info-panel")?.classList.add("hidden");
        getElement("visitor-info-panel")?.classList.remove("hidden");
        getElement("admin-only-tools")?.classList.add("hidden");
    } else {
        getElement("dash-game-name").innerText = user.gameName || "-";
        getElement("dash-level").innerText = user.level || "-";
        getElement("dash-rank").innerText = user.rank || "-";
        getElement("dash-fam").innerText = user.famName || "-";

        getElement("member-info-panel")?.classList.remove("hidden");
        getElement("visitor-info-panel")?.classList.add("hidden");

        if (role === "ADMIN") {
            getElement("admin-only-tools")?.classList.remove("hidden");
            listenToRealtimeMembers();
        } else {
            getElement("admin-only-tools")?.classList.add("hidden");
        }
    }
}

window.logoutPortal = async function() {
    if (membersUnsubscribe) membersUnsubscribe();
    await signOut(auth);
    location.reload();
};

/* =========================================================
   ADMIN PANEL CONTROLS
   ========================================================= */
function listenToRealtimeMembers() {
    if (membersUnsubscribe) return;

    membersUnsubscribe = onSnapshot(collection(db, "members"), (snapshot) => {
        window.allMembersList = [];
        snapshot.forEach((docSnap) => {
            window.allMembersList.push({ id: docSnap.id, ...docSnap.data() });
        });

        const adminPanel = getElement("admin-panel");
        if (adminPanel && !adminPanel.classList.contains("hidden")) {
            renderAdminTableUI();
        }
    });
}

window.showAdminPanel = function() {
    getElement("admin-panel")?.classList.remove("hidden");
    renderAdminTableUI();
};

window.closeAdminPanel = function() {
    getElement("admin-panel")?.classList.add("hidden");
};

function renderAdminTableUI() {
    const tbody = getElement("admin-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (window.allMembersList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No Member Profiles Found.</td></tr>';
        return;
    }

    window.allMembersList.forEach((member) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(member.gameName)}</td>
            <td>${escapeHtml(member.level)}</td>
            <td>${escapeHtml(member.rank)}</td>
            <td>${escapeHtml(member.famName)}</td>
            <td>${escapeHtml(member.personalUser)}</td>
            <td><strong style="color:${member.role === 'ADMIN' ? '#f59e0b' : '#00f0ff'}">${escapeHtml(member.role)}</strong></td>
            <td style="color:${member.status === 'Approved' ? '#22c55e' : '#f59e0b'}">${escapeHtml(member.status)}</td>
            <td>
                ${member.status === "Pending" ? `<button onclick="approveMember('${member.id}')" class="action-btn btn-success">ACCEPT</button>` : ""}
                ${member.role !== "ADMIN" ? `<button onclick="makeAdmin('${member.id}')" class="action-btn btn-admin">MAKE ADMIN</button>` : ""}
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.approveMember = async function(uid) {
    try {
        const memberRef = doc(db, "members", uid);
        await updateDoc(memberRef, { status: "Approved" });
    } catch (err) {
        alert("Error approving member: " + err.message);
    }
};

window.makeAdmin = async function(uid) {
    try {
        const memberRef = doc(db, "members", uid);
        await updateDoc(memberRef, { role: "ADMIN", status: "Approved" });
        alert("User Promoted to Admin!");
    } catch (err) {
        alert("Error promoting member: " + err.message);
    }
};

/* =========================================================
   NOTICE MODAL & CANVAS INIT
   ========================================================= */
window.openNoticeModal = function() { getElement("notice-modal")?.classList.remove("hidden"); };
window.closeNoticeModal = function() { getElement("notice-modal")?.classList.add("hidden"); };

window.publishNotice = function() {
    const text = getElement("notice-text")?.value.trim();
    if (!text) {
        alert("Please enter a notice!");
        return;
    }
    alert("Notice Published: " + text);
    getElement("notice-text").value = "";
    closeNoticeModal();
};

document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = getElement("submit-btn");
    if (submitBtn) {
        submitBtn.addEventListener("click", window.submitMemberForm);
    }
    initGamingBackground();
});

function initGamingBackground() {
    const canvas = getElement("bg-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 45 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? "#00f0ff" : "#8b5cf6",
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8
    }));

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(0, 240, 255, ${1 - (dist / 120) * 0.8})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });
        requestAnimationFrame(animate);
    }
    animate();
}
