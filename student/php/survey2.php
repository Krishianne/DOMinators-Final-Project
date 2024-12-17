<?php
session_start();
include '../core/config.php';

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: ../auth/login.php");
    exit;
}
// Get the user ID from the session
$user_id = $_SESSION['user_id'];
if (isset($_GET['class_id'])) {
    $_SESSION['class_id'] = $_GET['class_id'];
}
$class_id = $_SESSION['class_id'] ?? null;

if (!$class_id) {
    echo "<p>Class not selected.</p>";
    exit;
}

// Check if survey_id is set in the POST data (from previous page)
if (isset($_POST['survey_id']) && !isset($_SESSION['survey_id'])) {
    $_SESSION['survey_id'] = $_POST['survey_id'];
}

$survey_id = $_SESSION['survey_id'] ?? null;

if (!$survey_id) {
    echo "<p>Survey ID not found. Please start the survey again.</p>";
    exit;
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

// Store the responses from the current page (checkbox) in the session
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['responses'])) {
        // Initialize the survey_responses array if it doesn't exist
        if (!isset($_SESSION['survey_responses'][$user_id][$survey_id])) {
            $_SESSION['survey_responses'][$user_id][$survey_id] = [];
        }
        // Loop through each question response
        foreach ($_POST['responses'] as $question_id => $response) {
            // Convert the response array to a comma-separated string
            if (is_array($response)) {
                $response_string = implode(", ", $response);
            } else {
                $response_string = $response; // Handle cases where response is not an array (should not happen with checkboxes)
            }
            // Update the session with the new response
            $_SESSION['survey_responses'][$user_id][$survey_id][$question_id] = $response_string;
        }
        } else {
            // If no responses are sent, clear the specific page responses in the session
            foreach ($questions as $question) {
                $question_id = $question['question_id'];
                if (isset($_SESSION['survey_responses'][$user_id][$survey_id][$question_id])) {
                    $_SESSION['survey_responses'][$user_id][$survey_id][$question_id] = "";
                }
            }
        // Merge new responses with existing ones
        $_SESSION['survey_responses'][$user_id][$survey_id] = array_merge(
            $_SESSION['survey_responses'][$user_id][$survey_id],
            $_POST['responses']
        );
    
    }
}
$questions = [];
// Fetch checkbox questions for the specific survey with 'major' category
$question_query = mysqli_query($conn, "SELECT * FROM questions WHERE survey_id = '$survey_id' AND question_type = 'checkbox' AND category = 'major'") or die('Question query failed');

if (mysqli_num_rows($question_query) > 0) {
    while ($question = mysqli_fetch_assoc($question_query)) {
        $question_id = $question['question_id'];
        $question_text = $question['question_text'];
        $options = [];

        // Fetch checkbox options
        $checkbox_query = mysqli_query($conn, "SELECT * FROM checkbox WHERE question_id = '$question_id'") or die('Checkbox query failed');
        $checkbox_data = mysqli_fetch_assoc($checkbox_query);

        if ($checkbox_data) {
            for ($i = 1; $i <= 5; $i++) {
                $choice = $checkbox_data['choice' . $i];
                if (!empty($choice)) {
                    $options[] = $choice;
                }
            }
        }

        $questions[] = [
            'question_id' => $question_id,
            'question_text' => $question_text,
            'options' => $options
        ];
    }
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
    <title>Survey - Page 2/6</title>
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
        <a href="surveyresults.php">Survey Results</a>
        <a href="update_profile.php">Profile</a>
        <a href="../auth/logout.php" class="logout-button">Log out</a>
    </nav>
</header>
<main>
    <div class="prompt-section">
        <h1>SURVEY ONGOING - Page 2/6</h1>
    </div>
    <div class="container">
        <form action="survey3.php" method="POST">
        <?php foreach ($questions as $question): ?>
    <div class="question-section">
        <div class="question-text">
            <?php echo htmlspecialchars($question['question_text']); ?>
        </div>
        <div class="answer">
            <?php foreach ($question['options'] as $option): ?>
                <label class="checkbox-option">
                    <input type="checkbox" name="responses[<?php echo $question['question_id']; ?>][]" 
                        value="<?php echo htmlspecialchars($option); ?>"
                        <?php 
                        if (isset($_SESSION['survey_responses'][$user_id][$survey_id][$question['question_id']])) {
                            $saved_response = $_SESSION['survey_responses'][$user_id][$survey_id][$question['question_id']];
                            if (is_array($saved_response)) {
                                $saved_responses_array = $saved_response;
                            } else {
                                $saved_responses_array = explode(", ", $saved_response);
                            }
                            if (in_array($option, $saved_responses_array)) {
                                echo 'checked';
                            }
                        }
                        ?>>
                    <span><?php echo htmlspecialchars($option); ?></span>
                </label>
            <?php endforeach; ?>
        </div>
    </div>
    <div class="line-separator"></div>
<?php endforeach; ?>

            <div class="navigation">
                <button type="submit" formaction="survey.php" class="nav-button prev-button">Previous</button>
                <button type="submit" formaction="survey3.php" class="nav-button next-button">Next</button>
            </div>
        </form>
    </div>
</main>

<script>
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