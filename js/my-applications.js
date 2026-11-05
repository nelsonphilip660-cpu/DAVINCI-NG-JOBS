import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import { auth, db } from "./firebase.js";

const applicationsList =
    document.getElementById("myApplicationsList");

const applicationsMessage =
    document.getElementById("myApplicationsMessage");

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        applicationsMessage.textContent =
            "Please log in to view your applications.";

        return;
    }

    await loadMyApplications(user);
});

async function loadMyApplications(user) {

    applicationsList.innerHTML = "";

    applicationsMessage.textContent =
        "Loading your applications...";

    try {

        const applicationsQuery = query(
            collection(db, "applications"),
            where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(applicationsQuery);

        if (snapshot.empty) {

            applicationsMessage.textContent =
                "You have not applied for any jobs yet.";

            return;
        }

        let total = 0;

        for (const applicationDoc of snapshot.docs) {

            const application = applicationDoc.data();

            let jobTitle = "Job details unavailable";
            let companyName = "Company unavailable";

            if (application.jobId) {

                const jobRef = doc(
                    db,
                    "jobs",
                    application.jobId
                );

                const jobSnapshot = await getDoc(jobRef);

                if (jobSnapshot.exists()) {

                    const job = jobSnapshot.data();

                    jobTitle = job.title || jobTitle;

                    companyName =
                        job.company || companyName;
                }
            }

            const card = document.createElement("div");

            card.className = "application-card";

            const title = document.createElement("h3");
            title.textContent = jobTitle;

            const company = document.createElement("p");
            company.textContent =
                "Company: " + companyName;

            const date = document.createElement("p");

            if (application.appliedAt) {

                date.textContent =
                    "Applied: " +
                    application.appliedAt
                        .toDate()
                        .toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                        });

            } else {

                date.textContent = "Application date unavailable";
            }

            const status = document.createElement("div");

            status.className =
                "application-status " +
                (application.status || "pending").toLowerCase();

            status.textContent =
                "Status: " +
                (application.status || "Pending");

            card.appendChild(title);
            card.appendChild(company);
            card.appendChild(date);
            card.appendChild(status);

            applicationsList.appendChild(card);

            total++;
        }

        applicationsMessage.textContent =
            "You have submitted " + total +
            " application(s).";

    } catch (error) {

        console.error("My applications error:", error);

        applicationsMessage.textContent =
            "Unable to load applications: " +
            error.message;
    }
}