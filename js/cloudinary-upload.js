// CLOUDINARY CONFIGURATION
const CLOUDINARY_CLOUD_NAME = "dbglhqgr";
const CLOUDINARY_UPLOAD_PRESET = "xoiutgr7";

// UPLOAD FILE TO CLOUDINARY
async function uploadToCloudinary(file) {

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {
        throw new Error("Upload failed. Please try again.");
    }

    const data = await response.json();

    return data.secure_url;
}