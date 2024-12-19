document.addEventListener("DOMContentLoaded", async () => {
    
    const urlParams = new URLSearchParams(window.location.search);
    const surveyId = urlParams.get('survey_id');
    console.log(surveyId);  


    if (!surveyId) {
        showAlert("Survey ID not found in localStorage.");
        return;  
    }

    try {
        const response = await fetch(`/api/survey/details?survey_id=${surveyId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    
        
        if (response.ok) {
            const data = await response.json(); 
            populateSurveyDetails(data.survey);
            populateQuestions(data.questions);
            console.log(data); 
        } else {
            const data = await response.json(); 
            showAlert(data.message || "Failed to fetch survey details.");
        }
    } catch (error) {
        console.error("Error fetching survey details:", error);
        showAlert("An error occurred while fetching the survey details.");
    }
    
});

/**
 * Populates the survey header details.
 * @param {Object} survey - The survey details object.
 */
function populateSurveyDetails(survey) {
    document.getElementById("surveyTitle").innerText = `${survey.course} - ${survey.semester} Semester AY:${survey.ay} Survey Details`;
    document.getElementById("courseSelect").value = survey.course;
    document.getElementById("semSelect").value = survey.semester;
    document.getElementById("aySelect").value = survey.ay;
}

/**
 * Dynamically populates questions in the question container.
 * @param {Array} questions - The array of question objects.
 */
function populateQuestions(questions) {
    const questionContainer = document.querySelector(".question-container");
    questionContainer.innerHTML = ""; // Clear existing questions

    if (questions.length === 0) {
        // No questions found, display a message
        const noQuestionsMessage = document.createElement('p');
        noQuestionsMessage.textContent = "No questions have been created in this survey.";
        noQuestionsMessage.style.textAlign = 'center'; // Optional: center the message
        questionContainer.appendChild(noQuestionsMessage);
        return; // Exit the function early as there are no questions
    }
    
    questions.forEach((question) => {
        const questionHTML = `
            <div class="essay-part">
                <div class="question">
                    <label class="text-box" for="question_text">Question Text</label>
                    <textarea name="question_text" readonly>${question.question_text}</textarea>
                </div>
                <div class="options-part">
                    <div class="drop-container">
                        <label for="type">Question Type</label>
                        <input type="text" name="type" class="drop-option2" readonly value="${question.question_type}">
                    </div>
                    <div class="drop-container">
                        <label for="sub">Category</label>
                        <input type="text" name="cat" class="drop-option2" readonly value="${question.category}">
                    </div>
                </div>
                ${getQuestionTypeOptions(question)}
            </div>
        `;
        questionContainer.insertAdjacentHTML("beforeend", questionHTML);
    });
}

/**
 * Generates additional HTML based on the question type.
 * @param {Object} question - The question object.
 * @returns {string} - The HTML string for additional options.
 */
function getQuestionTypeOptions(question) {
    if (question.rate) {
        return `
            <div id="rating-options">
                <label>Rating Options</label>
                ${Object.values(question.rate).map((rate, index) => `<textarea name="rate${index + 1}" readonly>${rate}</textarea>`).join("")}
            </div>
        `;
    } else if (question.checkbox) {
        return `
            <div id="checkbox-options">
                <label>Checkbox Options</label>
                ${Object.values(question.checkbox).map((choice, index) => `<textarea name="choice${index + 1}" readonly>${choice}</textarea>`).join("")}
            </div>
        `;
    }
    return "";
}

/**
 * Displays an alert message to the user.
 * @param {string} message - The alert message to display.
 */
function showAlert(message) {
    alert(message);
}
