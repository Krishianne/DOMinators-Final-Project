// Get user information from localStorage
const userId = localStorage.getItem('userId');
const firstname = localStorage.getItem('firstname');
const lastname = localStorage.getItem('lastname');
const email = localStorage.getItem('email');
const userType = localStorage.getItem('userType');
const password = localStorage.getItem('password'); // Avoid storing passwords here for security reasons
const images = localStorage.getItem('images');

// Log current user data for debugging
console.log(userId, firstname, lastname, email, userType, images);

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById('update-profile-form');
    const messageContainer = document.getElementById('message-container');
    const userImage = document.getElementById('user-image');
    const imageInput = document.getElementById('update_image');
    const updateButton = document.getElementById('update-button');
    const userImagePath = localStorage.getItem('images'); 

    const firstNameInput = document.getElementById('update_firstname');
    const lastNameInput = document.getElementById('update_lastname');
    const emailInput = document.getElementById('update_email');
    const newPasswordInput = document.getElementById('new_pass');
    const confirmPasswordInput = document.getElementById('confirm_pass');

    firstNameInput.value = localStorage.getItem('firstname');
    lastNameInput.value = localStorage.getItem('lastname');
    emailInput.value = localStorage.getItem('email');

    if (userImagePath && userImagePath.trim() !== '') {
        userImage.src = userImagePath;  // Set the user's profile image from localStorage
    } else {
        userImage.src = '../res/profile-images/default-avatar.jpg';  // Set the default profile image if none is found
    }
    imageInput.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                userImage.src = e.target.result;
                checkChanges();
            };
            reader.readAsDataURL(file);
        }
    });

    function checkChanges() {
        const hasChanges =
            firstNameInput.value.trim() !== localStorage.getItem('firstname') ||
            lastNameInput.value.trim() !== localStorage.getItem('lastname') ||
            emailInput.value.trim() !== localStorage.getItem('email') ||
            imageInput.files.length > 0 ||
            newPasswordInput.value.trim() !== '' ||
            confirmPasswordInput.value.trim() !== '';
        
        updateButton.disabled = !hasChanges;
    }

    [firstNameInput, lastNameInput, emailInput, newPasswordInput, confirmPasswordInput].forEach(input => {
        input.addEventListener('input', checkChanges);
    });

    function validateForm() {
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        // Check password strength: 8-12 characters, alphanumeric, at least one uppercase letter
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,12}$/;

        if ((newPassword && !confirmPassword) || (!newPassword && confirmPassword)) {
            showMessage("Please fill in both password fields.", "error");
            return false;
        }

        if (newPassword && newPassword !== confirmPassword) {
            showMessage("Passwords do not match.", "error");
            return false;
        }

        // Validate password format
        if (newPassword && !passwordRegex.test(newPassword)) {
            showMessage("Password must be between 8-12 characters, contain at least one uppercase letter, and be alphanumeric.", "error");
            return false;
        }

        if (newPassword && newPassword === localStorage.getItem('password')) {
            showMessage("New password cannot be the same as the old password.", "error");
            return false;
        }

        clearMessage();
        return true;
    }

    function showMessage(message, type) {
        messageContainer.textContent = message;
        messageContainer.className = type;
        messageContainer.style.display = "block";
    }

    function clearMessage() {
        messageContainer.textContent = "";
        messageContainer.className = "";
        messageContainer.style.display = "none";
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        const newEmail = emailInput.value.trim();
        const oldEmail = localStorage.getItem('email');

        if (newEmail !== oldEmail) {
            checkEmailUniqueness(newEmail, function(isUnique) {
                if (!isUnique) {
                    showMessage("Email is already in use. Please choose a different email.", "error");
                } else {
                    updateProfile();
                }
            });
        } else {
            updateProfile();
        }
    });

    function updateProfile() {
        const formData = new FormData();
        formData.append('userId', localStorage.getItem('userId'));
        formData.append('firstname', firstNameInput.value.trim());
        formData.append('lastname', lastNameInput.value.trim());
        formData.append('email', emailInput.value.trim());
        if (newPasswordInput.value.trim()) {
            formData.append('newPassword', newPasswordInput.value.trim());
        }
        if (imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }

        fetch('/api/update-profile', {
            method: 'PATCH',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage("Profile updated successfully!", "success");
                localStorage.setItem('firstname', firstNameInput.value.trim());
                localStorage.setItem('lastname', lastNameInput.value.trim());
                localStorage.setItem('email', emailInput.value.trim());
                if (data.newImagePath) {
                    localStorage.setItem('images', data.newImagePath);
                }
        
                // Update the image with the new image path from the server
                userImage.src = data.newImagePath || '../res/profile-images/default-avatar.jpg';
                
                form.reset();
                updateButton.disabled = true;
            } else {
                showMessage(data.message || "Failed to update profile.", "error");
            }
        })
        
        .catch(error => {
            console.error('Error updating profile:', error);
            showMessage("An error occurred while updating your profile.", "error");
        });
    }

    [newPasswordInput, confirmPasswordInput].forEach(input => {
        input.addEventListener('input', validateForm);
    });
});

function checkEmailUniqueness(email, callback) {
    fetch(`/api/check-email?email=${email}`)
        .then(response => response.json())
        .then(data => {
            callback(data.isUnique);
        })
        .catch(error => {
            console.error('Error checking email uniqueness:', error);
            callback(false);
        });
}

const logoutButton = document.getElementById('logoutButton');
if (logoutButton) { // Ensure the button exists
    logoutButton.addEventListener('click', () => {
        window.location.href = '../html/login.html';
    });
}
