// =====================================
// DAVINCIJOBS ADMIN DASHBOARD
// =====================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// IMPORTANT: REPLACE THIS WITH YOUR FIREBASE AUTH USER UID
const ADMIN_UID = "HqMv7ppcGRhG2BmCcfjcpCoziJi2";


// PAGE ELEMENTS
const companiesTable = document.getElementById("companiesTable");
const jobsTable = document.getElementById("jobsTable");
const paymentsTable = document.getElementById("paymentsTable");
const usersTable = document.getElementById("usersTable");
const adminMessage = document.getElementById("adminMessage");

let adminReady = false;


// SAFE HTML OUTPUT
function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// SHOW MESSAGE
function showMessage(message, color = "#f5c451") {
    adminMessage.textContent = message;
    adminMessage.style.color = color;
}


// CHECK ADMIN LOGIN
onAuthStateChanged(auth, async user => {

    if (!user) {
        window.location.href = "admin-login.html";
        return;
    }

  if (!ADMIN_UID || ADMIN_UID === "PASTE_YOUR_ADMIN_UID_HERE") {
    showMessage("Admin setup required: add your Firebase User UID in js/admin.js.", "#ff7070");
    return;
}

    if (user.uid !== ADMIN_UID) {
        showMessage("Access denied. You are not an authorized administrator.", "#ff7070");
        await signOut(auth);
        return;
    }

    adminReady = true;

    showMessage("Welcome, administrator.");

    await loadDashboard();

});


// LOAD ALL DASHBOARD DATA
async function loadDashboard() {

    if (!adminReady) return;

    try {

        const [
            companiesSnapshot,
            jobsSnapshot,
            paymentsSnapshot,
            usersSnapshot
        ] = await Promise.all([

            getDocs(collection(db, "companies")),
            getDocs(collection(db, "jobs")),
            getDocs(collection(db, "payments")),
            getDocs(collection(db, "users"))

        ]);

        const companies = companiesSnapshot.docs;
        const jobs = jobsSnapshot.docs;
        const payments = paymentsSnapshot.docs;
        const users = usersSnapshot.docs;

        // UPDATE STATISTICS
        document.getElementById("totalCompanies").textContent =
            companies.length;

        document.getElementById("pendingJobs").textContent =
            jobs.filter(item => item.data().status === "pending").length;

        document.getElementById("pendingPayments").textContent =
            payments.filter(item => item.data().status === "pending").length;

        document.getElementById("totalUsers").textContent =
            users.length;


        // DISPLAY COMPANIES
        companiesTable.innerHTML = companies.length
            ? companies.map(item => {

                const company = item.data();

                return `
                    <tr>
                        <td>${escapeHTML(company.companyName)}</td>
                        <td>${escapeHTML(company.email)}</td>
                        <td>${escapeHTML(company.location)}</td>
                        <td>${escapeHTML(company.status)}</td>
                        <td>
                            <button class="admin-action approve-btn"
                                data-action="company"
                                data-id="${item.id}"
                                data-status="approved">
                                Approve
                            </button>

                            <button class="admin-action reject-btn"
                                data-action="company"
                                data-id="${item.id}"
                                data-status="rejected">
                                Reject
                            </button>
                        </td>
                    </tr>
                `;

            }).join("")
            : '<tr><td colspan="5">No companies registered yet.</td></tr>';


        // DISPLAY JOBS
        jobsTable.innerHTML = jobs.length
            ? jobs.map(item => {

                const job = item.data();

                return `
                    <tr>
                        <td>${escapeHTML(job.title)}</td>
                        <td>${escapeHTML(job.company)}</td>
                        <td>${escapeHTML(job.location)}</td>
                        <td>${escapeHTML(job.status)}</td>
                        <td>
                            <button class="admin-action approve-btn"
                                data-action="job"
                                data-id="${item.id}"
                                data-status="approved">
                                Approve
                            </button>

                            <button class="admin-action reject-btn"
                                data-action="job"
                                data-id="${item.id}"
                                data-status="rejected">
                                Reject
                            </button>
                        </td>
                    </tr>
                `;

            }).join("")
            : '<tr><td colspan="5">No jobs submitted yet.</td></tr>';


        // DISPLAY PAYMENTS
        paymentsTable.innerHTML = payments.length
            ? payments.map(item => {

                const payment = item.data();

                const receipt = payment.receiptUrl
                    ? `<a class="receipt-link"
                        href="${escapeHTML(payment.receiptUrl)}"
                        target="_blank" rel="noopener noreferrer">
                        View Receipt
                       </a>`
                    : "No receipt";

                return `
                    <tr>
                        <td>${escapeHTML(payment.payerName)}</td>
                        <td>${escapeHTML(payment.email)}</td>
                        <td>₦${Number(payment.amount || 0).toLocaleString("en-NG")}</td>
                        <td>${receipt}</td>
                        <td>${escapeHTML(payment.status)}</td>
                        <td>
                            <button class="admin-action approve-btn"
                                data-action="payment"
                                data-id="${item.id}"
                                data-status="approved"
                                data-user="${escapeHTML(payment.userId || "")}">
                                Approve
                            </button>

                            <button class="admin-action reject-btn"
                                data-action="payment"
                                data-id="${item.id}"
                                data-status="rejected">
                                Reject
                            </button>
                        </td>
                    </tr>
                `;

            }).join("")
            : '<tr><td colspan="6">No payments submitted yet.</td></tr>';


        // DISPLAY USERS
        usersTable.innerHTML = users.length
            ? users.map(item => {

                const user = item.data();

                return `
                    <tr>
                        <td>${escapeHTML(user.fullName || "Not provided")}</td>
                        <td>${escapeHTML(user.email)}</td>
                        <td>${escapeHTML(user.role || "jobseeker")}</td>
                        <td>${escapeHTML(user.subscriptionStatus || "inactive")}</td>
                    </tr>
                `;

            }).join("")
            : '<tr><td colspan="4">No users registered yet.</td></tr>';

    } catch (error) {

        console.error("Dashboard error:", error);

        showMessage(
            "Could not load dashboard. Check your Firebase permissions and connection.",
            "#ff7070"
        );

    }

}


// HANDLE APPROVAL BUTTONS
document.addEventListener("click", async event => {

    const button = event.target.closest("[data-action]");

    if (!button || !adminReady) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    const status = button.dataset.status;

    if (!id || !["approved", "rejected"].includes(status)) return;

    if (!confirm(`Are you sure you want to ${status} this ${action}?`)) {
        return;
    }

    button.disabled = true;

    try {

        if (action === "company") {

            await updateDoc(doc(db, "companies", id), {
                status,
                reviewedAt: serverTimestamp()
            });

        }

        else if (action === "job") {

            await updateDoc(doc(db, "jobs", id), {
                status: status === "approved" ? "published" : "rejected",
                reviewedAt: serverTimestamp()
            });

        }

        else if (action === "payment") {

            const paymentSnapshot = await getDocs(collection(db, "payments"));

            const paymentDocument = paymentSnapshot.docs.find(
                item => item.id === id
            );

            if (!paymentDocument) {
                throw new Error("Payment record not found.");
            }

            const payment = paymentDocument.data();

            await updateDoc(doc(db, "payments", id), {
                status,
                reviewedAt: serverTimestamp()
            });

            // ACTIVATE SUBSCRIPTION ONLY AFTER APPROVAL
            if (status === "approved") {

                if (!payment.userId) {
                    throw new Error("This payment has no associated user ID.");
                }

                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);

                await updateDoc(doc(db, "users", payment.userId), {
                    subscriptionStatus: "active",
                    subscriptionExpiresAt: Timestamp.fromDate(expiryDate)
                });

            }

        }

        showMessage(`${action} ${status} successfully.`);

        await loadDashboard();

    } catch (error) {

        console.error("Approval error:", error);

        showMessage(error.message || "Action failed.", "#ff7070");

        button.disabled = false;

    }

});


// =====================================
// ADMIN LOGOUT
// =====================================

const logoutButton = document.getElementById("adminLogout");

if (logoutButton) {

    logoutButton.addEventListener("click", async (event) => {

        event.preventDefault();

        logoutButton.disabled = true;
        logoutButton.textContent = "Logging out...";

        try {

            await signOut(auth);

            window.location.replace("admin-login.html");

        } catch (error) {

            console.error("Logout error:", error);

            alert("Logout failed. Please try again.");

            logoutButton.disabled = false;
            logoutButton.textContent = "Logout";

        }

    });

}

console.log("DavinciJobs admin dashboard loaded.");

console.log("DavinciJobs admin dashboard loaded.");