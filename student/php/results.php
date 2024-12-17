<?php
include 'config.php';
session_start();

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}


$user_id = $_SESSION['user_id'];
$class_id = $_SESSION['class_id'] ?? null;
$survey_id = $_SESSION['survey_id'] ?? null;

// Merge all responses for this user and survey
$merged_responses = $_SESSION['survey_responses'][$user_id][$survey_id] ?? [];

// Fetch saved responses from session and merge with incoming ones
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['responses'])) {
    foreach ($_POST['responses'] as $question_id => $answer) {
        $merged_responses[$question_id] = $answer;
    }
    $_SESSION['survey_responses'][$user_id][$survey_id] = $merged_responses;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit'])) {
    if (isset($_SESSION['survey_responses'][$user_id][$survey_id])) {
        $responses = $_SESSION['survey_responses'][$user_id][$survey_id];
        
        foreach ($responses as $question_id => $answer) {
            // Fetch question type and ratings for each question
            $query = "SELECT question_type, r.1 AS option1, r.2 AS option2, r.3 AS option3, r.4 AS option4, r.5 AS option5 
                      FROM questions q 
                      LEFT JOIN rate r ON q.question_id = r.question_id 
                      WHERE q.question_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('s', $question_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $question = $result->fetch_assoc();
            $stmt->close();

            if ($question) {
                $question_type = $question['question_type'];

                // Generate the next ID dynamically
                if ($question_type === 'rating') {
                    // Fetch the next rating_response_id
                    $idQuery = "SELECT MAX(CAST(SUBSTRING(rating_response_id, 3) AS UNSIGNED)) AS max_id FROM rating_response";
                    $idResult = $conn->query($idQuery);
                    $maxId = $idResult->fetch_assoc()['max_id'] ?? 0;
                    $nextId = 'RR' . ($maxId + 1);

                    // Map numeric answer to actual rating value
                    $ratingOptions = [
                        $question['option1'],
                        $question['option2'],
                        $question['option3'],
                        $question['option4'],
                        $question['option5']
                    ];
                    $actualAnswer = $ratingOptions[$answer - 1] ?? $answer;

                    // Save to rating_response table
                    $query = "INSERT INTO rating_response (rating_response_id, class_id, question_id, answer) VALUES (?, ?, ?, ?)";
                    $stmt = $conn->prepare($query);
                    $stmt->bind_param('ssss', $nextId, $class_id, $question_id, $actualAnswer);
                    $stmt->execute();
                    $stmt->close();
                } elseif ($question_type === 'checkbox') {
                    // Fetch the next checkbox_response_id
                    $idQuery = "SELECT MAX(CAST(SUBSTRING(checkbox_response_id, 3) AS UNSIGNED)) AS max_id FROM checkbox_response";
                    $idResult = $conn->query($idQuery);
                    $maxId = $idResult->fetch_assoc()['max_id'] ?? 0;
                    $nextId = 'CR' . ($maxId + 1);

                    // Format the answer
                    $answerFormatted = is_array($answer) ? implode(", ", $answer) : $answer;

                    // Save to checkbox_response table
                    $query = "INSERT INTO checkbox_response (checkbox_response_id, class_id, question_id, answer) VALUES (?, ?, ?, ?)";
                    $stmt = $conn->prepare($query);
                    $stmt->bind_param('ssss', $nextId, $class_id, $question_id, $answerFormatted);
                    $stmt->execute();
                    $stmt->close();
                } elseif ($question_type === 'essay') {
                    // Fetch the next essay_response_id
                    $idQuery = "SELECT MAX(CAST(SUBSTRING(essay_response_id, 3) AS UNSIGNED)) AS max_id FROM essay_response";
                    $idResult = $conn->query($idQuery);
                    $maxId = $idResult->fetch_assoc()['max_id'] ?? 0;
                    $nextId = 'ER' . ($maxId + 1);

                    // Save to essay_response table
                    $query = "INSERT INTO essay_response (essay_response_id, class_id, question_id, answer) VALUES (?, ?, ?, ?)";
                    $stmt = $conn->prepare($query);
                    $stmt->bind_param('ssss', $nextId, $class_id, $question_id, $answer);
                    $stmt->execute();
                    $stmt->close();
                }
            }
        }
        // Update or insert into status table
        $statusQuery = "SELECT * FROM status WHERE class_id = ? ";
        $statusStmt = $conn->prepare($statusQuery);
        $statusStmt->bind_param('s', $class_id );
        $statusStmt->execute();
        $statusResult = $statusStmt->get_result();
        
        if ($statusResult->num_rows > 0) {
            // Update the status if it already exists
            $updateQuery = "UPDATE status SET answer_status = 'submitted', date_submitted = NOW() WHERE class_id = ? ";
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->bind_param('s', $class_id );
            $updateStmt->execute();
        } else {
            // Insert a new record in the status table
            $insertQuery = "INSERT INTO status (class_id, answer_status, date_submitted) VALUES (?, 'submitted', NOW())";
            $insertStmt = $conn->prepare($insertQuery);
            $insertStmt->bind_param('s', $class_id );
            $insertStmt->execute();
        }

        // Clear the session data after saving
        unset($_SESSION['survey_responses'][$user_id][$survey_id]);
        header('Location: surveyresults.php');
        exit;
    }
}

// dsiplay responses
$saved_responses = $_SESSION['survey_responses'][$user_id][$survey_id] ?? null;
// Fetch questions 
$questions = [];
if ($survey_id) {
    $query = "SELECT q.question_id, q.question_text, q.question_type, r.1, r.2, r.3, r.4, r.5 
              FROM questions q 
              LEFT JOIN rate r ON q.question_id = r.question_id 
              WHERE q.survey_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $survey_id);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $questions[$row['question_id']] = [
            'text' => $row['question_text'],
            'type' => $row['question_type'],
            'ratings' => array_filter([
                $row['1'],
                $row['2'],
                $row['3'],
                $row['4'],
                $row['5']
            ])
        ];
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
        <a href="home.php" >Home</a>
        <a href="surveyresults.php">Survey Results</a>
        <a href="update_profile.php">Profile</a>
        <a href="logout.php" class="logout-button">Log out</a>
    </nav>
</header>
<div class="prompt-section">
        <h1>SURVEY RESULTS</h1>
    </div>
<main>
    <div class="results-container">
        <?php if (!empty($saved_responses) && !empty($questions)): ?>
            <?php foreach ($saved_responses as $question_id => $answer): ?>
                <?php if (isset($questions[$question_id])): ?>
                    <div class="result-entry">
                        <h3><?php echo htmlspecialchars($questions[$question_id]['text']); ?></h3>
                        <p><strong>Type:</strong> <?php echo htmlspecialchars($questions[$question_id]['type']); ?></p>
                        <p><strong>Response:</strong> <?php 
                            if ($questions[$question_id]['type'] === 'rating' && !empty($questions[$question_id]['ratings'])) {
                                $response_index = (int)$answer - 1; 
                                if (isset($questions[$question_id]['ratings'][$response_index])) {
                                    echo htmlspecialchars($questions[$question_id]['ratings'][$response_index]);
                                } else {
                                    echo htmlspecialchars($answer); 
                                }
                            } else {
                                echo is_array($answer) ? htmlspecialchars(implode(", ", $answer)) : htmlspecialchars($answer);
                            }
                        ?></p>
                    </div>
                <?php else: ?>
                    <div class="result-entry">
                        <h3>Unknown Question ID: <?php echo htmlspecialchars($question_id); ?></h3>
                        <p>Response: <?php echo htmlspecialchars($answer); ?></p>
                    </div>
                <?php endif; ?>
            <?php endforeach; ?>
        <?php else: ?>
            <p>No responses found for this survey.</p>
        <?php endif; ?>
    </div>
    <form method="POST" class="navigation">
        <button type="submit" formaction="survey6.php" class="nav-button prev-button">Previous</button>
        <button type="submit" name="submit" class="nav-button submit-button">Submit</button>
    </form>
</main>


</body>
</html>
