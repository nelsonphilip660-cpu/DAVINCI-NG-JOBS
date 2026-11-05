import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const message = document.getElementById("dashboardMessage");
const companyPanel = document.getElementById("companyPanel");
const statsPanel = document.getElementById("dashboardStats");
const jobsPanel = document.getElementById("employerJobs");

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const companiesQuery = query(collection(db, "companies"), where("ownerId", "==", user.uid));
    const companiesSnapshot = await getDocs(companiesQuery);

    if (companiesSnapshot.empty) {
      message.innerHTML = 'This account has no company profile yet. <a href="company.html">Register your company</a> to get started.';
      jobsPanel.innerHTML = "";
      return;
    }

    const company = companiesSnapshot.docs[0].data();
    const companyStatus = String(company.status || "pending").toLowerCase();
    companyPanel.hidden = false;
    companyPanel.className = `company-panel status-${escapeHtml(companyStatus)}`;
    companyPanel.innerHTML = `<div class="company-avatar">${escapeHtml((company.companyName || "C").slice(0, 1).toUpperCase())}</div><div><strong>${escapeHtml(company.companyName || "Your company")}</strong><p>Company profile · <span>${escapeHtml(companyStatus)}</span></p></div>`;

    const jobsQuery = query(collection(db, "jobs"), where("ownerId", "==", user.uid));
    const jobsSnapshot = await getDocs(jobsQuery);
    let totalApplicants = 0;
    const jobCards = await Promise.all(jobsSnapshot.docs.map(async jobDoc => {
      const job = jobDoc.data();
      const applicationsQuery = query(collection(db, "applications"), where("jobId", "==", jobDoc.id));
      const applicationsSnapshot = await getDocs(applicationsQuery);
      totalApplicants += applicationsSnapshot.size;
      const date = job.createdAt?.toDate ? job.createdAt.toDate().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "Recently posted";
      const status = String(job.status || "pending").toLowerCase();
      return `<article class="employer-job-card">
        <div class="job-card-top"><div><span class="job-status status-${escapeHtml(status)}">${escapeHtml(status)}</span><h3>${escapeHtml(job.title || "Untitled listing")}</h3><p>${escapeHtml(job.location || "Location not set")} · ${escapeHtml(job.type || "Job")}</p></div><span class="applicant-count">${applicationsSnapshot.size}<small> applicants</small></span></div>
        <div class="job-card-bottom"><span>Posted ${escapeHtml(date)}</span><a class="view-applicants" href="application.html?jobId=${encodeURIComponent(jobDoc.id)}">View applicants →</a></div>
      </article>`;
    }));

    statsPanel.hidden = false;
    statsPanel.innerHTML = `<article><span>Job listings</span><strong>${jobsSnapshot.size}</strong></article><article><span>Total applicants</span><strong>${totalApplicants}</strong></article><article><span>Company status</span><strong class="stat-status">${escapeHtml(companyStatus)}</strong></article>`;
    message.textContent = companyStatus === "approved" ? "Your employer workspace is ready." : `Your company profile is ${companyStatus}. You can review your dashboard while approval is pending.`;

    if (jobCards.length) {
      jobsPanel.innerHTML = jobCards.join("");
    } else {
      jobsPanel.innerHTML = '<div class="empty-listings"><h3>No listings yet</h3><p>Post your first job to start receiving applicants.</p><a class="btn primary-btn" href="post-job.html">Post a Job</a></div>';
    }
  } catch (error) {
    console.error("Employer dashboard error:", error);
    message.textContent = `Unable to load your dashboard: ${error.message}`;
  }
});

document.getElementById("logoutButton").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});