// =====================================
// DAVINCIJOBS - MEMBERSHIP PROTECTED
// JOB MARKETPLACE
// =====================================

import { db, auth } from "./firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    doc,
    getDoc,
    serverTimestamp,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";


// =====================================
// CONFIGURATION
// =====================================

const MEMBERSHIP_PRICE = 2000;
const MEMBERSHIP_DAYS = 30;


// =====================================
// PAGE ELEMENTS
// =====================================

const urlParams = new URLSearchParams(window.location.search);

const keywordInput = document.getElementById("jobKeyword");
const locationInput = document.getElementById("jobLocation");
const categoryInput = document.getElementById("jobCategory");

const jobsList = document.getElementById("jobsList");
const jobsMessage = document.getElementById("jobsMessage");
const searchForm = document.getElementById("jobSearchForm");

let allJobs = [];
let currentUser = null;


// =====================================
// AUTHENTICATION
// =====================================

function waitForAuth() {
    return new Promise((resolve) => {

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });

    });
}


// =====================================
// CHECK SUBSCRIPTION
// =====================================

async function checkMembership(user) {

    if (!user) {
        return {
            active: false,
            reason: "login"
        };
    }

    try {

        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
            return {
                active: false,
                reason: "profile"
            };
        }

        const userData = userSnapshot.data();

        if (userData.subscriptionStatus !== "active") {
            return {
                active: false,
                reason: "unpaid"
            };
        }

        // The payment verifier must set this Firestore field.
        // It should be a Firestore Timestamp.

        const expiry = userData.subscriptionExpiresAt;

        if (!expiry || typeof expiry.toDate !== "function") {
            return {
                active: false,
                reason: "expiry"
            };
        }

        const expiryDate = expiry.toDate();

        if (expiryDate.getTime() <= Date.now()) {
            return {
                active: false,
                reason: "expired"
            };
        }

        return {
            active: true,
            userData: userData
        };

    } catch (error) {

        console.error("Membership verification error:", error);

        return {
            active: false,
            reason: "error"
        };

    }

}


// =====================================
// REQUIRE ACTIVE MEMBERSHIP
// =====================================

async function requireMembership() {

    const user = await waitForAuth();

    if (!user) {

        alert("Please log in before accessing job opportunities.");

        window.location.href = "login.html";

        return null;

    }

    const membership = await checkMembership(user);

    if (!membership.active) {

        if (membership.reason === "error") {

            alert("Unable to verify your membership. Please try again.");

            return null;

        }

        if (membership.reason === "profile") {

            alert("Your account profile could not be found.");

            return null;

        }

        if (membership.reason === "expiry") {

            alert("Your membership expiry date is missing. Please contact support.");

            return null;

        }

        alert(
            membership.reason === "expired"
                ? "Your membership has expired. Renew for ₦2,000 to continue."
                : "Subscribe for ₦2,000 per month to unlock job opportunities."
        );

        window.location.href = "subscription.html";

        return null;

    }

    return {
        user: user,
        userData: membership.userData
    };

}


// =====================================
// SHOW ACCESS MESSAGE
// =====================================

function showLockedMessage(message) {

    if (jobsList) {
        jobsList.innerHTML = "";
    }

    if (jobsMessage) {
        jobsMessage.textContent = message;
    }

}


// =====================================
// LOAD JOBS FROM FIREBASE
// ONLY AFTER MEMBERSHIP CHECK
// =====================================

async function loadJobs() {

    if (!jobsList) return;

    showLockedMessage("Verifying your membership...");

    const access = await requireMembership();

    if (!access) return;

    currentUser = access.user;

    try {

        showLockedMessage("Loading available opportunities...");

        const jobsQuery = query(
            collection(db, "jobs"),
            where("status", "==", "published")
        );

        const snapshot = await getDocs(jobsQuery);

        allJobs = [];

        snapshot.forEach((document) => {

            allJobs.push({
                id: document.id,
                ...document.data()
            });

        });

        displayJobs(allJobs);

    } catch (error) {

        console.error("Job loading error:", error);

        showLockedMessage(
            "Unable to load jobs. Please try again."
        );

    }

}


// =====================================
// DISPLAY JOBS
// =====================================

function displayJobs(jobs) {

    if (!jobsList) return;

    jobsList.innerHTML = "";

    if (jobs.length === 0) {

        showLockedMessage(
            "No matching jobs found. Check back later."
        );

        return;

    }

    if (jobsMessage) {
        jobsMessage.textContent =
            `${jobs.length} job opportunity(s) found.`;
    }

    jobs.forEach((job) => {

        const card = document.createElement("article");
        card.className = "job-card";

        const title = document.createElement("h3");
        title.textContent = job.title || "Untitled Job";

        const company = document.createElement("p");
        company.textContent =
            "Company: " + (job.company || "Employer");

        const location = document.createElement("p");
        location.textContent =
            "Location: " + (job.location || "Not specified");

        const category = document.createElement("p");
        category.textContent =
            "Category: " + (job.category || "General");

        const type = document.createElement("p");
        type.textContent =
            "Job Type: " + (job.type || "Not specified");

        const salary = document.createElement("p");
        salary.textContent =
            "Salary: " + (job.salary || "Negotiable");

        const description = document.createElement("p");
        description.textContent =
            job.description || "Contact the employer for details.";

        const applyButton = document.createElement("button");
        applyButton.textContent = "Apply Now";

        applyButton.addEventListener("click", () => {
            applyForJob(job.id);
        });

        card.append(
            title,
            company,
            location,
            category,
            type,
            salary,
            description,
            applyButton
        );

        jobsList.appendChild(card);

    });

}


// =====================================
// SEARCH JOBS
// =====================================

if (searchForm) {

    searchForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const access = await requireMembership();

        if (!access) return;

        const keyword = keywordInput
            ? keywordInput.value.trim().toLowerCase()
            : "";

        const location = locationInput
            ? locationInput.value.trim().toLowerCase()
            : "";

        const category = categoryInput
            ? categoryInput.value.trim().toLowerCase()
            : "";

        const filteredJobs = allJobs.filter((job) => {

            const searchableText = [
                job.title || "",
                job.company || "",
                job.description || ""
            ].join(" ").toLowerCase();

            const jobLocation =
                (job.location || "").toLowerCase();

            const jobCategory =
                (job.category || "").toLowerCase();

            return (
                (!keyword || searchableText.includes(keyword)) &&
                (!location || jobLocation.includes(location)) &&
                (
                    !category ||
                    category === "all" ||
                    jobCategory === category
                )
            );

        });

        displayJobs(filteredJobs);

    });

}


// =====================================
// APPLY FOR A JOB
// =====================================

async function applyForJob(jobId) {

    const access = await requireMembership();

    if (!access) return;

    try {

        const user = access.user;
        const userData = access.userData;

        await addDoc(collection(db, "applications"), {

            jobId: jobId,

            userId: user.uid,

            applicantName:
                userData.fullName || user.displayName || "",

            applicantEmail: user.email || "",

            status: "pending",

            appliedAt: serverTimestamp()

        });

        alert("Your application has been submitted successfully!");

    } catch (error) {

        console.error("Application error:", error);

        alert("Application failed. Please try again.");

    }

}


// =====================================
// INITIALIZE MARKETPLACE
// =====================================

async function initializeMarketplace() {

    const user = await waitForAuth();

    currentUser = user;

    // Only run marketplace loading on the jobs page.
    if (jobsList) {
        await loadJobs();
    }

    console.log("DavinciJobs marketplace initialized.");

}

initializeMarketplace();