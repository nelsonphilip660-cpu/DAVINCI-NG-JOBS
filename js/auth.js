import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { auth, db } from "./firebase.js";


// =====================================
// USER REGISTRATION
// =====================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

      const cleanPassword = password.trim();
const cleanConfirmPassword = confirmPassword.trim();

if (cleanPassword !== cleanConfirmPassword) {
    alert("Your passwords do not match. Please enter them again.");
    return;
}

        if (password.length < 6) {
            alert("Password must contain at least 6 characters.");
            return;
        }

        try {
            const result = await createUserWithEmailAndPassword(
                auth, email, cleanPassword
            );

            await updateProfile(result.user, {
                displayName: name
            });

            await setDoc(doc(db, "users", result.user.uid), {
                fullName: name,
                email: email,
                role: "jobseeker",
                subscriptionStatus: "inactive",
                createdAt: serverTimestamp()
            });

            alert("Account created successfully!");

            window.location.href = "subscription.html";

        } catch (error) {
            alert(error.message);
        }
    });
}


// =====================================
// USER LOGIN
// =====================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const employerQuery = query(
                collection(db, "companies"),
                where("ownerId", "==", credential.user.uid)
            );
            const employerProfile = await getDocs(employerQuery);

            window.location.href = employerProfile.empty
                ? "jobs.html"
                : "employer-dashboard.html";

        } catch (error) {
            alert("Login failed: " + error.message);
        }
    });
}


// =====================================
// USER LOGOUT
// =====================================

window.logoutUser = async function () {
    try {
        await signOut(auth);

        alert("You have logged out successfully.");

        window.location.href = "index.html";

    } catch (error) {
        alert(error.message);
    }
};

console.log("DavinciJobs authentication loaded.");

// =====================================
// FORGOT PASSWORD
// =====================================

const forgotPassword = document.getElementById("forgotPassword");

if (forgotPassword) {
    forgotPassword.addEventListener("click", async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById("email");
        const email = emailInput?.value.trim();

        if (!email) {
            alert("Please enter your registered email address first.");
            emailInput?.focus();
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);

            alert("Password reset email sent! Check your inbox or spam folder.");

        } catch (error) {
            console.error("Password reset error:", error);

            alert("Unable to send reset email: " + error.message);
        }
    });
}