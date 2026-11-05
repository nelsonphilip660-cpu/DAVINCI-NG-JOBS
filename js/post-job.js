// =====================================
// DAVINCIJOBS JOB POSTING SYSTEM
// =====================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const postJobForm = document.getElementById("postJobForm");
const jobMessage = document.getElementById("jobMessage");
const postJobButton = document.getElementById("postJobButton");

let currentUser = null;
let authReady = false;

// WAIT FOR FIREBASE LOGIN STATUS
onAuthStateChanged(auth, user => {
    currentUser = user;
    authReady = true;
});

function waitForAuth() {
    return new Promise(resolve => {
        if (authReady) {
            resolve(currentUser);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, user => {
            unsubscribe();
            currentUser = user;
            authReady = true;
            resolve(user);
        });
    });
}


// SUBMIT JOB
postJobForm.addEventListener("submit", async event => {

    event.preventDefault();

    postJobButton.disabled = true;
    postJobButton.textContent = "Checking account...";

    try {

        const user = await waitForAuth();

        if (!user) {
            jobMessage.textContent = "Please login before posting a job.";
            jobMessage.style.color = "#ff7070";
            window.location.href = "login.html";
            return;
        }

        // CHECK WHETHER EMPLOYER HAS AN APPROVED COMPANY
        const companyQuery = query(
            collection(db, "companies"),
            where("ownerId", "==", user.uid),
            where("status", "==", "approved")
        );

        const companySnapshot = await getDocs(companyQuery);

        if (companySnapshot.empty) {

            jobMessage.textContent =
                "Your company must be approved before you can post jobs.";

            jobMessage.style.color = "#ff7070";

            postJobButton.disabled = false;
            postJobButton.textContent = "Submit Job for Approval";

            return;
        }

        const companyDocument = companySnapshot.docs[0];
        const companyData = companyDocument.data();

        // COLLECT JOB DETAILS
        const jobData = {

            ownerId: user.uid,

            companyId: companyDocument.id,

            title: document.getElementById("jobTitle").value.trim(),

            company: companyData.companyName,

            location: document.getElementById("jobLocation").value.trim(),

            category: document.getElementById("jobCategory").value,

            type: document.getElementById("jobType").value,

            salary: document.getElementById("jobSalary").value.trim(),

            description: document.getElementById("jobDescription").value.trim(),

            requirements: document.getElementById("jobRequirements").value.trim(),

            deadline: document.getElementById("jobDeadline").value,

            status: "pending",

            createdAt: serverTimestamp()

        };

        // SAVE JOB TO FIRESTORE
        postJobButton.textContent = "Submitting job...";

        await addDoc(collection(db, "jobs"), jobData);

        jobMessage.textContent =
            "Job submitted successfully! Awaiting admin approval.";

        jobMessage.style.color = "#f5c451";

        postJobForm.reset();

        postJobButton.textContent = "Job Submitted";

    } catch (error) {

        console.error("Job posting error:", error);

        jobMessage.textContent =
            "Unable to submit job: " + error.message;

        jobMessage.style.color = "#ff7070";

        postJobButton.disabled = false;
        postJobButton.textContent = "Submit Job for Approval";

    }

});

console.log("DavinciJobs job posting system loaded.");