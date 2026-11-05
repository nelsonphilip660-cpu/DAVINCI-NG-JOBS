import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import { auth, db } from "./firebase.js";

const applicationsList = document.getElementById("applicationsList");
const applicationsMessage = document.getElementById("applicationsMessage");

let currentUser = null;
const selectedJobId = new URLSearchParams(window.location.search).get("jobId");

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        applicationsMessage.innerHTML = 'Please <a href="login.html">log in</a> with your employer account to view applicants.';
        return;
    }

    currentUser = user;
    await loadApplications();
});

async function loadApplications() {
    applicationsList.innerHTML = "";
    applicationsMessage.textContent = "Loading applications...";

    try {
        const jobsQuery = query(
            collection(db, "jobs"),
            where("ownerId", "==", currentUser.uid)
        );

        const jobsSnapshot = await getDocs(jobsQuery);

        if (jobsSnapshot.empty) {
            applicationsMessage.textContent =
                "You have not posted any jobs yet.";
            return;
        }

        const ownedJobs = jobsSnapshot.docs.filter(jobDoc => !selectedJobId || jobDoc.id === selectedJobId);

        if (ownedJobs.length === 0) {
            applicationsMessage.textContent = "That listing was not found in your employer account.";
            return;
        }

        let totalApplications = 0;

        for (const jobDoc of ownedJobs) {
            const job = jobDoc.data();

            const applicationQuery = query(
                collection(db, "applications"),
                where("jobId", "==", jobDoc.id)
            );

            const applicationSnapshot = await getDocs(applicationQuery);

            if (applicationSnapshot.empty) continue;

            const heading = document.createElement("h2");
            heading.textContent = job.title || "Job vacancy";

            applicationsList.appendChild(heading);

            for (const applicationDoc of applicationSnapshot.docs) {
                const application = applicationDoc.data();
                totalApplications++;

                const card = document.createElement("div");
                card.className = "job-card";

                // Applicant name
                const name = document.createElement("h3");
                name.textContent =
                    application.applicantName || "Name not provided";

                // Applicant email
                const email = document.createElement("p");
                email.textContent =
                    "Email: " +
                    (application.applicantEmail || "Not provided");

                // Job applied for
                const appliedJob = document.createElement("p");
                appliedJob.textContent =
                    "Position: " + (job.title || "Unknown job");

                // Application date
                const date = document.createElement("p");

                if (application.appliedAt) {
                    const applicationDate =
                        application.appliedAt.toDate();

                    date.textContent =
                        "Applied: " +
                        applicationDate.toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                        });
                } else {
                    date.textContent = "Application date unavailable";
                }

                // Current status
                const statusText = document.createElement("p");
                statusText.textContent =
                    "Status: " + (application.status || "pending");

                // Status selection
                const statusSelect = document.createElement("select");

                ["pending", "shortlisted", "rejected", "hired"].forEach(status => {
                    const option = document.createElement("option");

                    option.value = status;
                    option.textContent =
                        status.charAt(0).toUpperCase() + status.slice(1);

                    if ((application.status || "pending") === status) {
                        option.selected = true;
                    }

                    statusSelect.appendChild(option);
                });

                // Update status button
                const saveButton = document.createElement("button");
                saveButton.textContent = "Update Application Status";
                saveButton.className = "btn btn-primary";

                saveButton.addEventListener("click", async () => {
                    try {
                        await updateDoc(
                            doc(db, "applications", applicationDoc.id),
                            {
                                status: statusSelect.value
                            }
                        );

                        statusText.textContent =
                            "Status: " + statusSelect.value;

                        alert("Application status updated successfully!");

                    } catch (error) {
                        alert("Update failed: " + error.message);
                    }
                });

                // Contact applicant button
                const contactButton = document.createElement("a");

                contactButton.textContent = "Contact Applicant";
                contactButton.className = "btn btn-secondary";
                contactButton.style.display = "block";
                contactButton.style.textAlign = "center";
                contactButton.style.marginTop = "12px";

                const applicantEmail = application.applicantEmail || "";

                if (applicantEmail) {
                    contactButton.href =
                        "mailto:" + applicantEmail +
                        "?subject=" +
                        encodeURIComponent("Regarding your job application");

                } else {
                    contactButton.textContent = "Email unavailable";
                    contactButton.removeAttribute("href");
                }

                card.appendChild(name);
                card.appendChild(email);
                card.appendChild(appliedJob);
                card.appendChild(date);
                card.appendChild(statusText);
                card.appendChild(statusSelect);
                card.appendChild(saveButton);
                card.appendChild(contactButton);

                applicationsList.appendChild(card);
            }
        }

        if (totalApplications === 0) {
            applicationsMessage.textContent = selectedJobId
                ? "No applications have been submitted for this listing yet."
                : "No applications have been submitted for your jobs yet.";
        } else {
            applicationsMessage.textContent =
                totalApplications + " application(s) found.";
        }

    } catch (error) {
        console.error("Applications error:", error);

        applicationsMessage.textContent =
            "Error loading applications: " + error.message;
    }
}