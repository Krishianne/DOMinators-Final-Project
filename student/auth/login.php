<?php
include '../core/config.php';
session_start();

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

// Initialize or reset login attempts if timeout has passed
if (isset($_SESSION['login_timeout']) && time() > $_SESSION['login_timeout']) {
    unset($_SESSION['login_attempts']);
    unset($_SESSION['login_timeout']);
    unset($_SESSION['error_message']); // Reset error message after timeout
}

// Ensure login attempts are set
if (!isset($_SESSION['login_attempts'])) {
    $_SESSION['login_attempts'] = 0;
}

$disable_form = false;
$time_remaining = 0;

// Reset the login attempt processed flag on page load
$_SESSION['login_attempt_processed'] = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit'])) {
    // Only process login attempt if it hasn't been processed yet
    if (!$_SESSION['login_attempt_processed']) {
        // Check if user is in timeout period
        if ($_SESSION['login_attempts'] >= 3) {
            $disable_form = true;
            $time_remaining = $_SESSION['login_timeout'] - time();
        } else {
            // Get the email and password from the form
            $email = mysqli_real_escape_string($conn, $_POST['email']);
            $password = mysqli_real_escape_string($conn, $_POST['password']);
            
            // Fetch user details based on email from the database
            $query = "SELECT * FROM `users` WHERE email = '$email'";
            $result = mysqli_query($conn, $query) or die('Query failed: ' . mysqli_error($conn));

            if (mysqli_num_rows($result) > 0) {
                $row = mysqli_fetch_assoc($result);
                
                
                if ($row['user_type'] === 'student') { 
                    if ($password === $row['password']) {
                        // Successful login
                        $_SESSION['user_id'] = $row['user_id'];
                        $_SESSION['user_type'] = $row['user_type'];
                        $_SESSION['firstname'] = $row['firstname'];
                        $_SESSION['lastname'] = $row['lastname'];
            
                        unset($_SESSION['login_attempts']);
                        unset($_SESSION['login_timeout']);
                        unset($_SESSION['error_message']);
            
                    
                        header('Location: ../php/home.php');
                        exit;
                    } else {
                        $_SESSION['error_message'] = 'Incorrect email or password!';
                        $_SESSION['login_attempts']++;
                    }
                } else {
                    
                    $_SESSION['error_message'] = 'Access denied for this account type!';
                    $_SESSION['login_attempts']++;
                }
            } else {
                $_SESSION['error_message'] = 'Incorrect email or password!';
                $_SESSION['login_attempts']++;
            }

            // If 3 attempts have been made, start timeout
            if ($_SESSION['login_attempts'] >= 3) {
                $_SESSION['login_timeout'] = time() + 180; // 3 minutes (180 seconds)
                $disable_form = true;
                $time_remaining = 180;
            }
        }

        // Mark that this attempt has been processed
        $_SESSION['login_attempt_processed'] = true;
    }
} else {
    // Set time remaining if in timeout period on page load
    if ($_SESSION['login_attempts'] >= 3 && isset($_SESSION['login_timeout'])) {
        $disable_form = true;
        $time_remaining = $_SESSION['login_timeout'] - time();
    }
}
?>


<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Login</title>
   <link rel="stylesheet" href="../assets/css/login.css">
</head>
<body>
<div class="background-image"></div>
<div class="loginForm">
   <div class="form login-box">
        <img class="logo" src="../assets/images/white-logo.png" alt="Logo">
        <h2>Login</h2>
        <form action="" method="post">
        <div class="input">
            <img class="icon" src="../assets/images/email.png" alt="Email logo">
            <input type="email" name="email" id="email" required <?php if ($disable_form) echo 'disabled'; ?>>
            <label>Email</label>
        </div>
        <div class="input">
            <img class="icon" src="../assets/images/lock.png" alt="lock logo">
            <input type="password" name="password" id="password" required <?php if ($disable_form) echo 'disabled'; ?>>
            <label>Password</label>
            <img class="toggle-password" src="../assets/images/watch.png" alt="eye" id="togglePasswordIcon" style="display: none;">
        </div>
        <div class="message-container">
            <?php
                if (isset($_SESSION['error_message'])) {
                    echo '<div class="message">' . $_SESSION['error_message'] . '</div>';
                }
            ?>
        </div>
        <button type="submit" name="submit" class="button" <?php if ($disable_form) echo 'disabled'; ?>>Login</button>
        <div class="remember-forgot">
            <a href="#" id="forgot-password" onclick="alert('Please remember your password.')" <?php if ($disable_form) echo 'style="pointer-events: none; color: gray;"'; ?>>Forgot Password?</a>
        </div>
    </form>
    <?php if ($disable_form): ?>
        <div class="countdown-message">
            You have been locked out.<br>
            Please wait <span id="countdown"><?php echo $time_remaining; ?></span> seconds before logging in.
        </div>
    <?php endif; ?>

   </div>
</div>

<script>
    const togglePasswordIcon = document.querySelector('#togglePasswordIcon');
    const passwordInput = document.querySelector('#password');
    const emailInput = document.querySelector('#email');
    const loginButton = document.querySelector('.button');
    const forgotPasswordLink = document.querySelector('#forgot-password');
    const countdownElement = document.getElementById('countdown');

    // Show the toggle icon only when the user starts typing
    passwordInput.addEventListener('input', function() {
        togglePasswordIcon.style.display = passwordInput.value.length > 0 ? 'inline' : 'none';
    });

    // Show/hide password on eye icon click
    togglePasswordIcon.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePasswordIcon.src = type === 'password' ? '../assets/images/watch.png' : '../assets/images/unwatch.png';
    });

    // Countdown timer for lockout period
    let timeLeft = <?php echo $time_remaining; ?>;
    if (timeLeft > 0) {
        // Disable inputs and button during countdown
        emailInput.disabled = true;
        passwordInput.disabled = true;
        loginButton.disabled = true;
        forgotPasswordLink.style.pointerEvents = 'none'; // Disable click events
        forgotPasswordLink.style.color = 'gray'; // Style as disabled

        const countdownInterval = setInterval(() => {
            timeLeft--;
            countdownElement.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                // Enable inputs, button, and forgot password link after countdown
                emailInput.disabled = false;
                passwordInput.disabled = false;
                loginButton.disabled = false;
                forgotPasswordLink.style.pointerEvents = 'auto'; // Re-enable link
                forgotPasswordLink.style.color = ''; // Restore original color
                countdownElement.parentElement.style.display = 'none';
            }
        }, 1000);
    }

</script>
</body>
</html>
