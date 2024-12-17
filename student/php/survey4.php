<?php
session_start();
include '../core/config.php';

// Check if the user is logged in and if `user_id` is set in the session
if (!isset($_SESSION['user_id'])) {
    // Redirect to login if not logged in
    header("Location: ../auth/login.php");
    exit;
}
// Fetch the user ID from the session
$user_id = $_SESSION['user_id'];

if (isset($_GET['class_id'])) {
    $_SESSION['class_id'] = $_GET['class_id'];
}
$class_id = $_SESSION['class_id'] ?? null;

if (!$class_id) {
    echo "<p>Class not selected.</p>";
    exit;
}
if (!isset($_SESSION['submission_tag'])) {
    $_SESSION['submission_tag'] = session_id();
}

if (!isset($_SESSION['survey_id'])) {
// Fetch the selected class details (course, ay, semester) for the given class_id
$class_query = mysqli_query($conn, "SELECT course, ay, semester FROM class WHERE class_id = '$class_id' AND user_id = '$user_id'") or die('Class query failed');

if (mysqli_num_rows($class_query) > 0) {
    $class_data = mysqli_fetch_assoc($class_query);
    $course = $class_data['course'];
    $ay = $class_data['ay'];
    $semester = $class_data['semester'];
} else {
    echo "<p>Class information not found for this user.</p>";
    exit;
}

// Fetch the survey_id from the survey table based on course, ay, and semester
$survey_query = mysqli_query($conn, "SELECT survey_id FROM survey WHERE course = '$course' AND ay = '$ay' AND semester = '$semester' AND survey_status = 'published' ORDER BY survey_id DESC LIMIT 1");

if ($survey_data = mysqli_fetch_assoc($survey_query)) {
    $survey_id = $survey_data['survey_id'];
    // Store survey_id in the session
    $_SESSION['survey_id'] = $survey_id;
} else {    
    echo "<p>No surveys available for this course, academic year, and semester.</p>";
    exit;
}
}
$survey_id = $_SESSION['survey_id'];
// Store the responses from the current page in the session
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['responses'])) {
        if (!isset($_SESSION['survey_responses'][$user_id][$survey_id])) {
            $_SESSION['survey_responses'][$user_id][$survey_id] = [];
        }
        // Merge new responses with existing ones
        $_SESSION['survey_responses'][$user_id][$survey_id] = array_merge(
            $_SESSION['survey_responses'][$user_id][$survey_id],
            $_POST['responses']
        );
    }
}

// Fetch only `minor` category questions for the selected survey
$question_query = mysqli_query($conn, "SELECT * FROM questions WHERE survey_id = '$survey_id' AND category = 'minor' and question_type = 'rating'") or die('Question query failed');
$questions = [];

while ($question = mysqli_fetch_assoc($question_query)) {
    $question_id = $question['question_id'];
    $question_text = $question['question_text'];
    $options = [];

    // Fetch rating options
    $rate_query = mysqli_query($conn, "SELECT * FROM rate WHERE question_id = '$question_id'");
    $rate_data = mysqli_fetch_assoc($rate_query);

    if ($rate_data) {
        // Collect ratings in an array if data is found
        for ($i = 1; $i <= 5; $i++) {
            if (isset($rate_data[(string)$i])) { // Check if the offset exists
                $options[] = $rate_data[(string)$i]; // Assuming columns are named as '1', '2', '3', etc.
            }
        }
    } else {
        echo "<p>Warning: No rating options found for question ID $question_id.</p>";
    }

    $questions[] = [
        'question_id' => $question_id,
        'question_text' => $question_text,
        'options' => $options
    ];
}
/*
echo '<pre>';
print_r($_SESSION);
print_r($survey_id);
echo '</pre>';*/
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Survey</title>
    <link rel="stylesheet" href="../assets/css/survey.css">
</head>
<body>

<header>
    <div class="logo-container">
        <img class="logo" src="../assets/images/white-logo.png" alt="logo">
        <h1>AlmaMeter</h1>
    </div>
    <nav class="nav-bar">
        <a href="home.php" >Home</a>
        <a href="surveyresults.php" >Survey Results</a>
        <a href="update_profile.php">Profile</a>
        <a href="../auth/logout.php" class="logout-button">Log out</a>
    </nav>
</header>

<main>
<div class="prompt-section">
    <h1>SURVEY ONGOING -Page 4/6</h1>
</div>
<div class="container">
    <form action="survey5.php" method="POST">
        <?php foreach ($questions as $question): ?>
            <div class="question-section" id="question-<?php echo $question['question_id']; ?>">
                <div class="question-text">
                    <?php echo htmlspecialchars($question['question_text']); ?>
                </div>
                <div class="rating-options">
                <?php foreach ($question['options'] as $index => $option): ?>
                            <label class="rating-option">
                            <input type="radio" name="responses[<?php echo $question['question_id']; ?>]"
                                value="<?php echo $index + 1; ?> "
                               <?php if (isset($_SESSION['survey_responses'][$user_id][$survey_id][$question['question_id']]) && $_SESSION['survey_responses'][$user_id][$survey_id][$question['question_id']] == $index + 1) {
                                    echo 'checked';
                                } ?>>
                                <span><?php echo htmlspecialchars($option); ?></span>
                            </label>
                        <?php endforeach; ?>
                    </div>
                </div>
            <div class="line-separator"></div>
        <?php endforeach; ?>

        <div class="navigation">
        <button type="submit" formaction="survey3.php" class="nav-button prev-button">Previous</button>
        <button type="submit" formaction="survey5.php" class="nav-button next-button">Next</button>
        </div>
    </form>
</div>
</main>

<script>
     document.querySelector('form').addEventListener('submit', function (event) {
        const questions = document.querySelectorAll('.question-section');
        let allAnswered = true;

       
        questions.forEach(question => {
            const questionId = question.id.split('-')[1];
            const options = question.querySelectorAll(`input[name="responses[${questionId}]"]`);
            let answered = false;

            options.forEach(option => {
                if (option.checked) {
                    answered = true;
                }
            });

            if (!answered) {
                allAnswered = false;
                question.classList.add('unanswered'); 
            } else {
                question.classList.remove('unanswered');
            }
        });

        if (!allAnswered) {
            alert('Please answer all the questions before proceeding.');
            event.preventDefault(); 
        }
    });
    const logoutButton = document.querySelector('.logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            const confirmLogout = confirm("Survey Ongoing. Your answers may not be saved! Are you sure you want to log out?");
            if (confirmLogout) {
                window.location.href = 'login.php'; // Redirect to login page
            }
        });
    }
</script>
</body>
</html>
