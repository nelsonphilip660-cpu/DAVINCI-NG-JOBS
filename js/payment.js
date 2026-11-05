// =====================================
// DAVINCIJOBS PAYMENT SYSTEM
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


// CLOUDINARY CONFIGURATION
const CLOUDINARY_CLOUD_NAME = "dbglhqgr";
const CLOUDINARY_UPLOAD_PRESET = "xoiutgr7";

const SUBSCRIPTION_AMOUNT = 2000;


// PAGE ELEMENTS
const paymentForm = document.getElementById("paymentForm");
const receiptFile = document.getElementById("receiptFile");
const receiptPreview = document.getElementById("receiptPreview");
const paymentMessage = document.getElementById("paymentMessage");
const submitButton = document.getElementById("submitPayment");

let currentUser = null;


// CHECK LOGIN STATUS
onAuthStateChanged(auth, user => {
    currentUser = user;
});


// RECEIPT PREVIEW
if (receiptFile) {

    receiptFile.addEventListener("change", () => {

        const file = receiptFile.files[0];

        if (!file) return;

        if (file.type.startsWith("image/")) {

            receiptPreview.src = URL.createObjectURL(file);
            receiptPreview.style.display = "block";

        } else {

            receiptPreview.style.display = "none";

        }

    });

}


// UPLOAD RECEIPT TO CLOUDINARY
async function uploadReceipt(file) {

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );

    formData.append("folder", "davincijobs/receipts");

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error?.message || "Receipt upload failed."
        );
    }

    return result;
}


// SUBMIT PAYMENT
if (paymentForm) {

    paymentForm.addEventListener("submit", async event => {

        event.preventDefault();

        if (!currentUser) {

            alert("Please login before submitting payment.");

            window.location.href = "login.html";

            return;

        }

        const payerName =
            document.getElementById("payerName").value.trim();

        const file = receiptFile.files[0];

        if (!payerName || !file) {

            alert("Please enter your name and upload your receipt.");

            return;

        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf"
        ];

        if (!allowedTypes.includes(file.type)) {

            alert("Upload a JPG, PNG, WEBP or PDF receipt.");

            return;

        }

        if (file.size > 5 * 1024 * 1024) {

            alert("Receipt must not exceed 5MB.");

            return;

        }

        try {

            submitButton.disabled = true;

            submitButton.textContent = "Uploading receipt...";

            paymentMessage.textContent =
                "Please wait while we upload your receipt.";

            // UPLOAD TO CLOUDINARY
            const uploadedFile = await uploadReceipt(file);

            paymentMessage.textContent =
                "Saving payment information...";

            // SAVE PAYMENT TO FIRESTORE
            await addDoc(collection(db, "payments"), {

                userId: currentUser.uid,

                email: currentUser.email,

                payerName: payerName,

                amount: SUBSCRIPTION_AMOUNT,

                currency: "NGN",

                receiptUrl: uploadedFile.secure_url,

                receiptPublicId: uploadedFile.public_id,

                receiptFormat: uploadedFile.format,

                status: "pending",

                subscriptionStatus: "inactive",

                createdAt: serverTimestamp()

            });

            paymentMessage.textContent =
                "Payment submitted successfully! Awaiting admin verification.";

            paymentMessage.style.color = "#f5c451";

            paymentForm.reset();

            receiptPreview.style.display = "none";

            submitButton.textContent = "Payment Submitted";

        } catch (error) {

            console.error("Payment error:", error);

            paymentMessage.textContent =
                error.message || "Something went wrong. Try again.";

            paymentMessage.style.color = "#ff7070";

            submitButton.disabled = false;

            submitButton.textContent =
                "Submit Payment for Verification";

        }

    });

}

console.log("DavinciJobs payment system loaded.");