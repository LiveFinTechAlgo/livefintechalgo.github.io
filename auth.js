// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
                window.location.href = "index.html";
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
                    window.location.href = "index.html";
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
                window.location.href = "index.html";
            } else if (email && password) {
                // Allow any login in demo mode if keys aren't set, or show error
                alert("(DEMO) Login Successful! (Config keys needed for real auth)");
                window.location.href = "index.html";
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

// --- Auth State Observer (Optional: To update UI if logged in) ---
if (auth) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, maybe update Navbar to say "Logout"
            console.log("User is logged in:", user.email);
            // Example: const navLogin = document.querySelector('a[href="login.html"]');
            // if(navLogin) navLogin.textContent = "Logout";
        } else {
            // User is signed out
        }
    });
}
