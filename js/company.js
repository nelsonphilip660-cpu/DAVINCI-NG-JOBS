// =====================================
// DAVINCIJOBS COMPANY REGISTRATION
// =====================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const companyForm = document.getElementById("companyForm");
const companyMessage = document.getElementById("companyMessage");
const companySubmit = document.getElementById("companySubmit");

let currentUser = null;

onAuthStateChanged(auth, user => {
    currentUser = user;
});

companyForm.addEventListener("submit", async event => {

    event.preventDefault();

    if (!currentUser) {
        companyMessage.textContent = "Please login before registering your company.";
        companyMessage.style.color = "#ff7070";
        return;
    }

    const companyData = {
        ownerId: currentUser.uid,
        companyName: document.getElementById("companyName").value.trim(),
        email: document.getElementById("companyEmail").value.trim(),
        phone: document.getElementById("companyPhone").value.trim(),
        location: document.getElementById("companyLocation").value.trim(),
        industry: document.getElementById("companyIndustry").value,
        website: document.getElementById("companyWebsite").value.trim(),
        description: document.getElementById("companyDescription").value.trim(),
        status: "pending",
        createdAt: serverTimestamp()
    };

    try {

        companySubmit.disabled = true;
        companySubmit.textContent = "Registering...";

        await addDoc(collection(db, "companies"), companyData);

        companyMessage.innerHTML =
            'Company registered successfully! Awaiting approval. <a href="employer-dashboard.html">Open employer dashboard</a>.';

        companyMessage.style.color = "#f5c451";

        companyForm.reset();

        companySubmit.textContent = "Registration Submitted";

    } catch (error) {

        console.error("Company registration error:", error);

        companyMessage.textContent =
            "Registration failed: " + error.message;

        companyMessage.style.color = "#ff7070";

        companySubmit.disabled = false;
        companySubmit.textContent = "Register Company";

    }

});

console.log("DavinciJobs company registration loaded.");