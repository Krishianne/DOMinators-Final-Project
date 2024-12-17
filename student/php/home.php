<?php
include '../core/config.php';
session_start();

// Redirect to login page if the user is not logged in
if (!isset($_SESSION['user_id'])) {
    header('location:../auth/login.php');
    exit;
}

// Fetch all class data for the logged-in user, ordered by year and then semester in ascending order
$user_id = $_SESSION['user_id'];
$class_query = mysqli_query($conn, "SELECT class_id, course, semester, ay FROM class WHERE user_id = '$user_id' ORDER BY ay ASC, semester ASC") or die('Class query failed');

// Fetch user details to display the first name, if needed
$select_user = mysqli_query($conn, "SELECT firstname FROM users WHERE user_id = '$user_id'") or die('User query failed');
if (mysqli_num_rows($select_user) > 0) {
    $user = mysqli_fetch_assoc($select_user);
    $firstname = $user['firstname'];
} else {
    echo "User not found!";
    exit;
}

// Prepare class data for survey cards
$class_data = [];
while ($row = mysqli_fetch_assoc($class_query)) {
    // Check if the user has already completed the survey 
    $class_id = $row['class_id'];
    $status_query = mysqli_query($conn, "SELECT answer_status FROM status WHERE /*user_id = '$user_id' AND*/ class_id = '$class_id'") or die('Status query failed');
    
    $survey_status = 'no response'; // Default status
    if (mysqli_num_rows($status_query) > 0) {
        $status = mysqli_fetch_assoc($status_query);
        $survey_status = $status['answer_status'];
    }
    $row['survey_status'] = $survey_status; // Store the status in the class data
    
    $class_data[] = $row;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Home</title>
    <link rel="stylesheet" href="../assets/css/home.css">
</head>
<body>
<header>
    <div class="logo-container">
        <img class="logo" src="../assets/images/white-logo.png" alt="logo">
        <h1>AlmaMeter</h1>
    </div>
    <nav class="nav-bar">
        <a href="home.php" class="active">Home</a>
        <a href="surveyresults.php">Survey Results</a>
        <a href="update_profile.php">Profile</a>
        <a href="../auth/logout.php" class="logout-button">Log out</a>
    </nav>
</header>

<main>
    <!-- Welcome Back Section -->
    <div class="welcome-section">
        <h1>Welcome back, <?php echo htmlspecialchars($firstname); ?>!</h1>
        <div class="ready-survey">
            <p>✅ Ready to take your survey?</p>
        </div>

        <!-- Survey Cards for each class -->
        <?php foreach ($class_data as $class): ?>
            <div class="survey-card">
                <img src="../assets/images/survey-logo.png" alt="Survey Icon" class="survey-icon">
                <div class="survey-info">
                    <?php if ($class['survey_status'] === 'submitted'): ?>
                        <p><strong>You have already completed the survey for this class.</strong></p>
                    <?php else: ?>
                        <a href="survey.php?class_id=<?php echo $class['class_id']; ?>" class="survey-link">
                            <h2><?php echo htmlspecialchars($class['course']); ?> Learning Outcomes</h2>
                            <p>This survey is designed to assess the educational progress and knowledge of students in the <?php echo htmlspecialchars($class['course']); ?> program. We aim to gather feedback on how well the program equips students with skills in areas such as programming, algorithms, data structures, software development, and problem-solving.</p>
                            <p class="survey-footer">For <?php echo htmlspecialchars($class['semester']); ?> Semester, AY <?php echo htmlspecialchars($class['ay']); ?> Graduates</p>
                        </a>
                    <?php endif; ?>
                </div>
            </div>
        <?php endforeach; ?>

    </div>
</main>
</body>
</html>
