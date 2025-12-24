// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TODO: Replace the following with your app's Firebase project configuration
// You can obtain these details from the Firebase Console (https://console.firebase.google.com/)
// 1. Create a new project
// 2. Go to Project Settings
// 3. Scroll down to "Your apps" and select Web (</>)
// 4. Copy the config object below
// ------------------------------------------------------------------
// IMPORTANT: PASTE YOUR FIREBASE CONFIG HERE
// Go to Firebase Console -> Project Settings -> Scroll down to "Your apps"
// Copy the "const firebaseConfig = { ... };" block and PASTE it below, replacing the one here.
// ------------------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyBhcD-C0wMb53xGwKQlpTBZkFO2AyZpgHU",
    authDomain: "livefintech-auth.firebaseapp.com",
    projectId: "livefintech-auth",
    storageBucket: "livefintech-auth.firebasestorage.app",
    messagingSenderId: "527797574356",
    appId: "1:527797574356:web:e17cf9d6a655bcbf9fb941",
    measurementId: "G-6SS44MFKR1"
};
// ------------------------------------------------------------------

// Initialize Firebase
let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.warn("Firebase not initialized correctly. Please update auth.js with your keys.", error);
}

// --- Sign Up Logic ---
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const phone = document.getElementById('signupPhone').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMsg = document.getElementById('error-message');

        if (password !== confirmPassword) {
            showError(errorMsg, "Passwords do not match");
            return;
        }

        if (auth) {
            try {
                // 1. Create User in Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 2. Save Extra Details to Firestore Database
                await setDoc(doc(db, "users", user.uid), {
                    name: name,
                    phone: phone,
                    email: email,
                    createdAt: new Date().toISOString()
                });

                alert("Account Created Successfully! Redirecting...");
                window.location.href = "subscription.html";
            } catch (error) {
                const errorCode = error.code;
                const errorMessage = error.message;
                showError(errorMsg, errorMessage);
                console.error("Signup Error:", error);
            }
        } else {
            // Mock Success for Demo if no Keys
            if (email && password) {
                alert("(DEMO) Account Created! Note: Real storage requires Firebase Keys.");
                window.location.href = "index.html";
            }
        }
    });
}

// --- Login Logic ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorMsg = document.getElementById('login-error-message');

        if (auth) {
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Signed in 
                    const user = userCredential.user;
                    // alert("Login Successful!");
                    window.location.href = "subscription.html";
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    showError(errorMsg, "Invalid Email or Password");
                    console.error(error);
                });
        } else {
            // Mock Login for Demo
            if (email === "demo@livefintech.com" && password === "123456") {
                alert("(DEMO) Login Successful!");
                window.location.href = "subscription.html";
            } else if (email && password) {
                // Allow any login in demo mode if keys aren't set, or show error
                alert("(DEMO) Login Successful! (Config keys needed for real auth)");
                window.location.href = "subscription.html";
            }
        }
    });
}

// --- Helper Functions ---
function showError(element, message) {
    if (element) {
        element.style.display = 'block';
        element.textContent = message;
    } else {
        alert(message);
    }
}

// --- Forgot Password Logic ---
const forgotLink = document.getElementById('forgotPasswordLink');
const backToLogin = document.getElementById('backToLoginLink');
const resetForm = document.getElementById('resetForm');

if (forgotLink && loginForm && resetForm) {
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        resetForm.style.display = 'block';
        document.querySelector('.signup-link').style.display = 'none'; // Hide signup link when resetting
        const headerH1 = document.querySelector('.login-header h1');
        const headerP = document.querySelector('.login-header p');
        if (headerH1) headerH1.innerText = "RECOVER ACCOUNT";
        if (headerP) headerP.innerText = "";
    });
}

if (backToLogin && loginForm && resetForm) {
    backToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        resetForm.style.display = 'none';
        loginForm.style.display = 'block';
        document.querySelector('.signup-link').style.display = 'block';
        const headerH1 = document.querySelector('.login-header h1');
        const headerP = document.querySelector('.login-header p');
        if (headerH1) headerH1.innerText = "WELCOME BACK";
        if (headerP) headerP.innerText = "Enter your credentials to access your account";
    });
}

if (resetForm) {
    resetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value;

        if (auth) {
            sendPasswordResetEmail(auth, email)
                .then(() => {
                    alert("Password reset email sent! Please check your inbox.");
                    // Switch back to login
                    resetForm.style.display = 'none';
                    loginForm.style.display = 'block';
                    document.querySelector('.signup-link').style.display = 'block';
                })
                .catch((error) => {
                    console.error(error);
                    alert("Error: " + error.message);
                });
        }
    });
}

// --- ADMIN: Fetch Users ---
async function fetchUsers() {
    const tableBody = document.getElementById('users-table-body');
    const loading = document.getElementById('admin-loading');
    const wrapper = document.getElementById('admin-table-wrapper');
    const totalBadge = document.getElementById('total-users');

    if (!tableBody) return;

    try {
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        loading.style.display = 'none';
        wrapper.style.display = 'block';

        if (totalBadge) totalBadge.textContent = querySnapshot.size;

        let index = 1;
        let html = "";

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "N/A";

            html += `
                <tr>
                    <td>${index++}</td>
                    <td>${data.name || "N/A"}</td>
                    <td>${data.email || "N/A"}</td>
                    <td>${data.phone || "N/A"}</td>
                    <td>${date}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;

    } catch (err) {
        console.error("Error fetching users:", err);
        loading.innerHTML = `<p style="color:red">Error loading data: ${err.message}</p>`;
    }
}


// --- Auth State Observer (UI Updates) ---
if (auth) {
    onAuthStateChanged(auth, async (user) => {
        const loginLink = document.getElementById('nav-login-btn');
        const isProfilePage = window.location.pathname.includes('profile.html');
        const isAdminPage = window.location.pathname.includes('admin.html');

        if (user) {
            // User is signed in
            console.log("User logged in:", user.email);

            // ADMIN PAGE logic
            if (isAdminPage) {
                if (user.email !== "info.livefintech@gmail.com") {
                    // Silent Redirect
                    window.location.replace("index.html");
                } else {
                    const adminSection = document.querySelector('.admin-section');
                    if (adminSection) adminSection.style.display = 'block';
                    fetchUsers();
                }
            }

            // 1. Update Navbar to Avatar
            if (loginLink) {
                // Determine Initials
                let initials = "U";
                let fullName = "User";

                // Fetch User Details from Firestore
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        fullName = userData.name || "User";
                        if (fullName) {
                            initials = fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
                        }

                        // If on profile page, populate details
                        if (isProfilePage) {
                            document.getElementById('profile-name').textContent = fullName;
                            document.getElementById('profile-email').textContent = userData.email;
                            document.getElementById('profile-phone').textContent = userData.phone || "N/A";
                            document.getElementById('profile-initials').textContent = initials;

                            if (userData.createdAt) {
                                const year = new Date(userData.createdAt).getFullYear();
                                document.getElementById('profile-joined').textContent = year;
                            }

                            document.getElementById('profile-loading').style.display = 'none';
                            document.getElementById('profile-content').style.display = 'block';
                        }
                    } else {
                        // Fallback if no db record found (rare)
                        if (isProfilePage) {
                            document.getElementById('profile-loading').style.display = 'none';
                            document.getElementById('profile-content').style.display = 'block';
                            document.getElementById('profile-email').textContent = user.email;
                        }
                    }
                } catch (e) {
                    console.error("Error fetching user data:", e);
                }

                // Render Avatar in Navbar
                loginLink.innerHTML = `<div style="width: 35px; height: 35px; background: linear-gradient(135deg, #3b82f6, #ec4899); border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.9rem;">${initials}</div>`;
                loginLink.href = "profile.html";
                loginLink.title = "View Profile";
            }

        } else {
            // User is signed out
            if (loginLink) {
                loginLink.innerHTML = "Login";
                loginLink.href = "login.html";
            }
            // If on profile page and not logged in, redirect
            if (isProfilePage) {
                window.location.href = "login.html";
            }
            if (isAdminPage) {
                window.location.replace("login.html");
            }
        }
    });

    // Logout Logic for Profile Page
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent any default behavior
            signOut(auth).then(() => {
                // Force UI Reset immediately
                if (document.getElementById('nav-login-btn')) {
                    document.getElementById('nav-login-btn').innerHTML = "Login";
                    document.getElementById('nav-login-btn').href = "login.html";
                }
                alert("Signed out successfully");
                // Use replace to avoid back-history issues
                window.location.replace("index.html");
            }).catch((error) => {
                console.error("Sign out error", error);
                alert("Error signing out: " + error.message);
            });
        });
    }
}
