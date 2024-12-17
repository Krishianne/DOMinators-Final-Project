<?php
include '../core/config.php';
session_start();

// Ensure the user is logged in
if (!isset($_SESSION['user_id'])) {
    header('location:../auth/login.php');
    exit;
}

$user_id = $_SESSION['user_id'];

// Fetch user data from the database
$select = mysqli_query($conn, "SELECT * FROM `users` WHERE user_id = '$user_id'") or die('Query failed');

// Check if any data was fetched
if (mysqli_num_rows($select) > 0) {
    $fetch = mysqli_fetch_assoc($select); // Fetch the user data
} else {
    $fetch = null;  // Set fetch to null if no data is returned
}

// Now, check if the update form was submitted
if (isset($_POST['update_profile'])) {

    // Initialize success flag
    $update_success = false;

    $update_firstname = mysqli_real_escape_string($conn, $_POST['update_firstname']);
    $update_lastname = mysqli_real_escape_string($conn, $_POST['update_lastname']);
    $update_email = mysqli_real_escape_string($conn, $_POST['update_email']);

    // Validate input lengths (max 20 characters for first name, last name, and email)
    if (strlen($update_firstname) > 20) {
        $message[] = 'First name must not exceed 20 characters.';
    }

    if (strlen($update_lastname) > 20) {
        $message[] = 'Last name must not exceed 20 characters.';
    }

    if (strlen($update_email) > 20) {
        $message[] = 'Email must not exceed 20 characters.';
    }

    // Validate Email
    if (!filter_var($update_email, FILTER_VALIDATE_EMAIL)) {
        $message[] = 'Please enter a valid email address.';
    } else {
        // Check if the new email is unique
        $email_check = mysqli_query($conn, "SELECT * FROM `users` WHERE email = '$update_email' AND user_id != '$user_id'") or die('Query failed');
        if (mysqli_num_rows($email_check) > 0) {
            $message[] = 'This email is already taken. Please input a different one.';
        }
    }

    // Update first name, last name, and email if no errors
    if (!isset($message)) {
        if ($fetch['firstname'] !== $update_firstname || $fetch['lastname'] !== $update_lastname || $fetch['email'] !== $update_email) {
            mysqli_query($conn, "UPDATE `users` SET firstname = '$update_firstname', lastname = '$update_lastname', email = '$update_email' WHERE user_id = '$user_id'") or die('Query failed');
            $message[] = '<span class="success-message">Profile updated successfully!</span>';
            $update_success = true; // Flag to indicate update was successful
        }
    }

    // Handle password update
    if ($fetch !== null) {
        $old_pass = $fetch['password']; // existing password in the database
        $new_pass = mysqli_real_escape_string($conn, $_POST['new_pass']); // new password
        $confirm_pass = mysqli_real_escape_string($conn, $_POST['confirm_pass']); // confirm new password

        if (!empty($new_pass) || !empty($confirm_pass)) {
            // Password validation (must be alphanumeric, with upper, lower case, and numbers, 8-12 characters)
            if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,12}$/', $new_pass)) {
                $message[] = nl2br('Password must be 8-12 characters long, 
                and contain at least one uppercase letter, 
                one lowercase letter, and one number.');
            } elseif ($new_pass != $confirm_pass) {
                $message[] = 'New password and confirmation do not match!';
            } elseif (empty($new_pass)) {
                $message[] = 'New password cannot be empty!';
            } else {
                // Update password (in plain text)
                mysqli_query($conn, "UPDATE `users` SET password = '$new_pass' WHERE user_id = '$user_id'") or die('Query failed');
                $message[] = '<div class="success-message">Password updated successfully!';
                $update_success = true; // Flag to indicate update was successful
            }
        }
    }

    // Handle image update
    $update_image = $_FILES['update_image']['name'];
    $update_image_size = $_FILES['update_image']['size'];
    $update_image_tmp_name = $_FILES['update_image']['tmp_name'];
    $update_image_folder = '../profile-images/' . $update_image;

    if (!empty($update_image)) {
        if ($update_image_size > 2000000) {
            $message[] = 'Image size is too large!';
        } else {
            $image_update_query = mysqli_query($conn, "UPDATE `users` SET images = '$update_image' WHERE user_id = '$user_id'") or die('Query failed');
            if ($image_update_query) {
                move_uploaded_file($update_image_tmp_name, $update_image_folder);
                $message[] = '<div class="success-message">Image updated successfully!';
                $update_success = true; // Flag to indicate update was successful
            }
        }
    }
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta http-equiv="X-UA-Compatible" content="IE=edge">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Update Profile</title>
   <link rel="stylesheet" href="../assets/css/update_profile.css">
</head>
<body>
<header>
    <div class="logo-container">
        <img class="logo" src="../assets/images/white-logo.png" alt="logo">
        <h1>AlmaMeter</h1>
    </div>
    <nav class="nav-bar">
        <a href="home.php">Home</a>
        <a href="surveyresults.php">Survey Results</a>
        <a href="update_profile.php" class="active">Profile</a>
        <a href="../auth/logout.php" class="logout-button">Log out</a>
    </nav>
</header>

<div class="update-profile">
   <form action="" method="post" enctype="multipart/form-data">
      <?php
         // Handle image display
         if ($fetch !== null) {
             if ($fetch['images'] == '') {
                echo '<img src="profile-images/default-avatar.jpg">';
             } else {
                echo '<img src="profile-images/' . $fetch['images'] . '">';
             }
         } else {
             echo '<img src="profile-images/default-avatar.jpg">';  // Fallback to default image
         }

         // Show success or error messages
         if (isset($message)) {
             foreach ($message as $msg) {
                 echo '<div class="message">' . $msg . '</div>';
             }
         }
      ?>

      <div class="flex">
         <div class="inputBox">
            <span>First Name:</span>
            <input type="text" name="update_firstname" value="<?php echo $fetch !== null ? $fetch['firstname'] : ''; ?>" class="box">
            <span>Last Name:</span>
            <input type="text" name="update_lastname" value="<?php echo $fetch !== null ? $fetch['lastname'] : ''; ?>" class="box">
            <span>Email:</span>
            <input type="email" name="update_email" value="<?php echo $fetch !== null ? $fetch['email'] : ''; ?>" class="box">
            <span>Update Your Pic:</span>
            <input type="file" name="update_image" accept="image/jpg, image/jpeg, image/png" class="box">
         </div>

         <div class="inputBox">
            <span>Current Password:</span>
            <input type="password" value="**********" readonly class="box"> <!-- Current password displayed as dots -->
            <span>New Password:</span>
            <input type="password" name="new_pass" placeholder="Enter new password" class="box">
            <span>Confirm Password:</span>
            <input type="password" name="confirm_pass" placeholder="Confirm new password" class="box">
         </div>
      </div>

      <input type="submit" value="Update Profile" name="update_profile" class="btn">
      <button type="button" class="refresh-btn" onclick="window.location.reload();">Refresh</button>
   </form>
</div>

<script>
   // Ensure the refresh button works properly
   const refreshBackButton = document.querySelector('.refresh-btn');
   refreshBackButton.addEventListener('click', function() {
       window.location.reload(); // Reloads the page when clicked
   });
</script>

</body>
</html>