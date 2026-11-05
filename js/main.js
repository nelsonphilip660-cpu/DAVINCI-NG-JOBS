// =====================================
// DAVINCIJOBS MAIN JAVASCRIPT
// =====================================


// PAGE LOADER
window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    if (loader) {
        setTimeout(() => {
            loader.style.opacity = "0";

            setTimeout(() => {
                loader.style.display = "none";
            }, 400);

        }, 800);
    }

});


// MOBILE NAVIGATION
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {

    menuToggle.addEventListener("click", () => {

        navLinks.classList.toggle("active");

        menuToggle.classList.toggle("active");
        const isExpanded = navLinks.classList.contains("active");
        menuToggle.setAttribute("aria-expanded", String(isExpanded));
        menuToggle.setAttribute("aria-label", isExpanded ? "Close navigation menu" : "Open navigation menu");

    });

    // CLOSE MENU AFTER CLICKING A LINK
    navLinks.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            navLinks.classList.remove("active");

            menuToggle.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");

        });

    });

}


// SCROLL REVEAL ANIMATIONS
const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

                observer.unobserve(entry.target);

            }

        });

    }, {
        threshold: 0.15
    });

    revealElements.forEach(element => {
        observer.observe(element);
    });

} else {

    revealElements.forEach(element => {
        element.classList.add("visible");
    });

}


// HOMEPAGE JOB SEARCH
function searchHomeJobs() {

    const keyword = document.getElementById("homeSearch")?.value.trim() || "";

    const location = document.getElementById("homeLocation")?.value.trim() || "";

    const params = new URLSearchParams();

    if (keyword) {
        params.set("keyword", keyword);
    }

    if (location) {
        params.set("location", location);
    }

    window.location.href = "jobs.html?" + params.toString();

}


// MAKE SEARCH FUNCTION AVAILABLE TO HTML
window.searchHomeJobs = searchHomeJobs;


// SEARCH USING ENTER KEY
const homeSearch = document.getElementById("homeSearch");
const homeLocation = document.getElementById("homeLocation");

[homeSearch, homeLocation].forEach(input => {

    if (input) {

        input.addEventListener("keydown", event => {

            if (event.key === "Enter") {

                event.preventDefault();

                searchHomeJobs();

            }

        });

    }

});


// FOOTER CURRENT YEAR
const footerYear = document.getElementById("footerYear");

if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
}


console.log("DavinciJobs main JavaScript loaded successfully.");