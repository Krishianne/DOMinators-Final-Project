<?php
include 'config.php';
session_start();

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

$user_id = $_SESSION['user_id'];

// Fetch the user's class ID so that it will be determined which class the user is in
$class_query = "SELECT class_id FROM class WHERE user_id = ?";
$stmt = $conn->prepare($class_query);
$stmt->bind_param('s', $user_id);
$stmt->execute();
$class_result = $stmt->get_result();
$class_data = $class_result->fetch_assoc();
$class_id = $class_data['class_id'] ?? null;
$stmt->close();

if (!$class_id) {
    die("No class found for this user.");
}

// Fetch the survey ID related to the user's class so that it will be determined which survey is taken
$survey_query = "SELECT survey_id FROM survey WHERE course = (
                    SELECT course FROM class WHERE class_id = ?
                 ) AND semester = (
                    SELECT semester FROM class WHERE class_id = ?
                 ) AND ay = (
                    SELECT ay FROM class WHERE class_id = ?
                 ) AND survey_status = 'published'";
$stmt = $conn->prepare($survey_query);
$stmt->bind_param('sss', $class_id, $class_id, $class_id);
$stmt->execute();
$survey_result = $stmt->get_result();
$survey_data = $survey_result->fetch_assoc();
$survey_id = $survey_data['survey_id'] ?? null;
$stmt->close();

if (!$survey_id) {
    die("No survey found for this user's class.");
}


$questions = [];
if ($survey_id) {
    $query = "SELECT q.question_id, q.question_text, q.question_type, 
                     r.1 AS option1, r.2 AS option2, r.3 AS option3, 
                     r.4 AS option4, r.5 AS option5
              FROM questions q
              LEFT JOIN rate r ON q.question_id = r.question_id
              WHERE q.survey_id = ?
              ORDER BY q.question_id"; 
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $survey_id);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $questions[$row['question_id']] = [
            'text' => $row['question_text'],
            'type' => $row['question_type'],
            'ratings' => array_filter([
                $row['option1'],
                $row['option2'],
                $row['option3'],
                $row['option4'],
                $row['option5']
            ])
        ];
    }
    $stmt->close();
}

// Fetch responses from the database
$responses = [];
if ($class_id) {
    // Fetch rating responses
    $query = "SELECT question_id, answer FROM rating_response 
              WHERE class_id = ? AND question_id IN 
              (SELECT question_id FROM questions WHERE survey_id = ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ss', $class_id, $survey_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $responses[$row['question_id']] = $row['answer'];
    }
    $stmt->close();

    // Fetch checkbox responses
    $query = "SELECT question_id, answer FROM checkbox_response 
              WHERE class_id = ? AND question_id IN 
              (SELECT question_id FROM questions WHERE survey_id = ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ss', $class_id, $survey_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $responses[$row['question_id']] = explode(", ", $row['answer']);
    }
    $stmt->close();

    // Fetch essay responses
    $query = "SELECT question_id, answer FROM essay_response 
              WHERE class_id = ? AND question_id IN 
              (SELECT question_id FROM questions WHERE survey_id = ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ss', $class_id, $survey_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $responses[$row['question_id']] = $row['answer'];
    }
    $stmt->close();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Survey Results</title>
    <link rel="stylesheet" href="styles/results.css">
</head>
<body>
<header>
    <div class="logo-container">
        <img class="logo" src="pictures/white-logo.png" alt="logo">
        <h1>AlmaMeter</h1>
    </div>
    <nav class="nav-bar">
        <a href="home.php">Home</a>
        <a href="surveyresults.php" class="active">Survey Results</a>
        <a href="update_profile.php">Profile</a>
        <a href="logout.php" class="logout-button">Log out</a>
    </nav>
</header>
<div class="prompt-section">
    <h1>SURVEY RESULTS</h1>
</div>
<main>
    <div class="results-container">
        <?php if (!empty($questions)): ?>
            <?php foreach ($questions as $question_id => $question): ?>
                <div class="result-entry">
                    <h3><?php echo htmlspecialchars($question['text']); ?></h3>
                    <p><strong>Type:</strong> <?php echo htmlspecialchars($question['type']); ?></p>
                    <p><strong>Response:</strong> 
                        <?php 
                        if (isset($responses[$question_id])) {
                            if ($question['type'] === 'rating' && isset($question['ratings'])) {
                                $response_index = is_numeric($responses[$question_id]) ? (int)$responses[$question_id] - 1 : -1; 
                                echo htmlspecialchars($question['ratings'][$response_index] ?? $responses[$question_id]);
                            } elseif ($question['type'] === 'checkbox') {
                                echo htmlspecialchars(implode(", ", $responses[$question_id]));
                            } else {
                                echo htmlspecialchars($responses[$question_id]);
                            }
                        } else {
                            echo "No response";
                        }
                        ?>
                    </p>
                </div>
            <?php endforeach; ?>
        <?php else: ?>
            <p>No results found for this survey.</p>
        <?php endif; ?>
    </div>
</main>
</body>
</html>
