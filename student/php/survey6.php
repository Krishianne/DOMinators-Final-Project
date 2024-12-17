<?php
include 'config.php';
session_start();

if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
    header('Location: login.php');
    exit; 
}

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
// Check if survey_id is already set in the session (from Page 1)
if (!isset($_SESSION['survey_id'])) {
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

    // Fetch the survey_id based on the course if not already set in session
    $survey_query = mysqli_query($conn, "SELECT survey_id FROM survey WHERE course = '$course' AND survey_status = 'published' ORDER BY survey_id DESC LIMIT 1");
    if ($survey_data = mysqli_fetch_assoc($survey_query)) {
        $_SESSION['survey_id'] = $survey_data['survey_id'];
    } else {
        echo "<p>No surveys available.</p>";
        exit;
    }
}
$survey_id = $_SESSION['survey_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['responses'])) {
        // Ensure the session array exists
        if (!isset($_SESSION['survey_responses'])) {
            $_SESSION['survey_responses'] = [];
        }

        $survey_id = $_SESSION['survey_id'];
        $user_id = $_SESSION['user_id'];

        // Initialize an array for the current survey if needed
        if (!isset($_SESSION['survey_responses'][$user_id][$survey_id])) {
            $_SESSION['survey_responses'][$user_id][$survey_id] = [];
        }

        // Loop through each response to handle arrays and convert them to strings
        foreach ($_POST['responses'] as $question_id => $response) {
            if (is_array($response)) {
                // Convert array to string for multi-select responses
                $response = implode(", ", $response);
            }
            // Save each response as a string
            $_SESSION['survey_responses'][$user_id][$survey_id][$question_id] = $response;
        }
        // Merge new responses with existing ones
        $_SESSION['survey_responses'][$user_id][$survey_id] = array_merge(
            $_SESSION['survey_responses'][$user_id][$survey_id],
            $_POST['responses']
        );
    }
}



// Fetch essay type questions 
$question_query = mysqli_query($conn, "SELECT * FROM questions WHERE survey_id = '$survey_id' AND question_type = 'essay' AND category = 'minor'") or die('Question query failed');
$questions = [];

while ($question = mysqli_fetch_assoc($question_query)) {
    $questions[] = [
        'question_id' => $question['question_id'],
        'question_text' => $question['question_text']
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
    <title>Essay Questions</title>
    <link rel="stylesheet" href="styles/survey.css">
</head>
<body>
<header>
    <div class="logo-container">
        <img class="logo" src="pictures/white-logo.png" alt="logo">
        <h1>AlmaMeter</h1>
    </div>
    <nav class="nav-bar">
        <a href="home.php" >Home</a>
        <a href="surveyresults.php" >Survey Results</a>
        <a href="update_profile.php">Profile</a>
        <a href="logout.php" class="logout-button">Log out</a>
    </nav>
</header>
<main>
<div class="prompt-section">
    <h1>SURVEY ONGOING - Page 6/6</h1>
</div>
<div class="container">
    <form id="surveyForm" action="results.php" method="POST"> 
        <?php foreach ($questions as $question): ?>
            <div class="question-section">
                <div class="question-text">
                    <?php echo htmlspecialchars($question['question_text']); ?>
                </div>
                <div class="essay-answer">
                <textarea name="responses[<?php echo $question['question_id']; ?>]" rows="5" cols="177" placeholder="Type your answer here..." required ><?php
                            if (isset($_SESSION['survey_responses'][$user_id][$survey_id][$question['question_id']])) {
                                echo htmlspecialchars($_SESSION['survey_responses'][$user_id][$survey_id][$question['question_id']]);
                            }
                        ?></textarea>
                    </div>
                </div>
                <div class="line-separator"></div>
        <?php endforeach; ?>

        <div class="navigation">
            <button type="submit" formaction="survey5.php" class="nav-button prev-button">Previous</button>
            <button type="submit" name="submit_survey" value="1" class="nav-button submit-button">Review Survey</button>
        </div>
    </form>
</div>
</main>

<script>
    document.getElementById('surveyForm').addEventListener('submit', function (e) {
        const textareas = document.querySelectorAll('textarea[name^="responses"]');
        for (let textarea of textareas) {
            if (textarea.value.trim() === '') {
                alert("Please fill out all questions with meaningful responses.");
                textarea.focus(); 
                e.preventDefault(); 
                return;
            }
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
