document.addEventListener("DOMContentLoaded", async () => {
    const surveyId = localStorage.getItem('surveyId');
    console.log(surveyId);

    if (!surveyId) {
        showAlert("Survey ID not found in localStorage.");
        return;
    }

    try {
        const response = await fetch(`/api/survey/details?survey_id=${surveyId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            populateSurveyDetails(data.survey);
            populateQuestions(data.questions);
        } else {
            const data = await response.json();
            showAlert(data.message || "Failed to fetch survey details.");
        }
    } catch (error) {
        console.error("Error fetching survey details:", error);
        showAlert("An error occurred while fetching the survey details.");
    }

    // Add event listener to the update button
    document.getElementById('updateSurveyBtn').addEventListener('click', updateSurvey);
});

/**
 * Update survey data in the database.
 */
async function updateSurvey() {
    const surveyId = localStorage.getItem('surveyId');
    const questions = [];

    const questionElements = document.querySelectorAll(".essay-part");
    questionElements.forEach(questionElement => {
        const questionText = questionElement.querySelector('textarea[name="question_text"]').value;
        const questionType = questionElement.querySelector('select[name="type"]').value;
        const category = questionElement.querySelector('select[name="cat"]').value;

        const options = [];
        const optionElements = questionElement.querySelectorAll('textarea');
        optionElements.forEach(optionElement => {
            options.push(optionElement.value);
        });

        questions.push({
            question_text: questionText,
            question_type: questionType,
            category: category,
            options: options
        });
    });

    // Send the updated questions to the server
    try {
        const response = await fetch(`/api/survey/update?survey_id=${surveyId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                survey_id: surveyId,
                questions: questions
            })
        });

        if (response.ok) {
            const data = await response.json();
            showAlert(data.message || "Survey updated successfully.");
        } else {
            const data = await response.json();
            showAlert(data.message || "Failed to update survey.");
        }
    } catch (error) {
        console.error("Error updating survey:", error);
        showAlert("An error occurred while updating the survey.");
    }
}

function populateSurveyDetails(survey) {
    document.getElementById("surveyTitle").innerText = `Edit ${survey.course} - ${survey.semester} Semester AY:${survey.ay} Survey Details`;
    document.getElementById("courseSelect").value = survey.course;
    document.getElementById("semSelect").value = survey.semester;
    document.getElementById("aySelect").value = survey.ay;
}

function populateQuestions(questions) {
    const questionContainer = document.querySelector(".question-container");
    questionContainer.innerHTML = ""; // Clear existing questions

    questions.forEach((question) => {
        const questionHTML = `
            <div class="essay-part">
                <div class="question">
                    <label class="text-box" for="question_text">Question Text</label>
                    <textarea name="question_text">${question.question_text}</textarea>
                </div>
                <div class="options-part">
                    <div class="drop-container">
                        <label for="type">Question Type</label>
                        <select name="type" class="drop-option2" onchange="toggleOptions(this)">
                            <option value="essay" ${question.question_type === "essay" ? "selected" : ""}>Essay</option>
                            <option value="checkbox" ${question.question_type === "checkbox" ? "selected" : ""}>Checkbox</option>
                            <option value="rating" ${question.question_type === "rating" ? "selected" : ""}>Rating</option>
                        </select>
                    </div>
                    <div class="drop-container">
                        <label for="sub">Category</label>
                        <select name="cat" class="drop-option2">
                            <option value="major" ${question.category === "major" ? "selected" : ""}>Major</option>
                            <option value="minor" ${question.category === "minor" ? "selected" : ""}>Minor</option>
                        </select>
                    </div>
                </div>
                ${getQuestionTypeOptions(question)}
            </div>
        `;
        questionContainer.insertAdjacentHTML("beforeend", questionHTML);
    });
}

function toggleOptions(selectElement) {
    const parentDiv = selectElement.closest('.essay-part');
    const optionsContainer = parentDiv.querySelector('.options-container');

    // Clear options when changing question type
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        optionsContainer.style.display = 'none';  // Hide options if no valid type
    }

    // Show and create options based on selected question type
    if (selectElement.value === 'rating' || selectElement.value === 'checkbox') {
        if (optionsContainer) {
            optionsContainer.style.display = 'block';
            makeOptionsEditable(optionsContainer, true);
            addEmptyOptions(optionsContainer, selectElement.value);
        }
    } else if (selectElement.value === 'essay') {
        if (optionsContainer) {
            optionsContainer.style.display = 'none';
            makeOptionsEditable(optionsContainer, false);
        }
    }
}

function makeOptionsEditable(optionsContainer, editable) {
    const options = optionsContainer.querySelectorAll('textarea');
    options.forEach(option => {
        option.disabled = !editable;
    });
}

function addEmptyOptions(optionsContainer, type) {
    optionsContainer.insertAdjacentHTML('beforeend', '<label>Options</label>');

    if (type === 'rating') {
        for (let i = 0; i < 5; i++) {
            const optionHTML = `<textarea name="rate${i + 1}" style="min-height: 40px;"></textarea>`;
            optionsContainer.insertAdjacentHTML('beforeend', optionHTML);
        }
    } else if (type === 'checkbox') {
        for (let i = 0; i < 5; i++) {
            const optionHTML = `<textarea name="choice${i + 1}" style="min-height: 40px;"></textarea>`;
            optionsContainer.insertAdjacentHTML('beforeend', optionHTML);
        }
    }
}

function getQuestionTypeOptions(question) {
    let optionsHTML = `
        <div class="options-container" style="display:${question.question_type === 'rating' || question.question_type === 'checkbox' ? 'block' : 'none'}; width: 200px;">
            <label>Options</label>
    `;

    if (question.question_type === 'rating' && question.rate) {
        optionsHTML += `${Object.values(question.rate).map((rate, index) => `
            <textarea name="rate${index + 1}" style="min-height: 40px;">${rate}</textarea>
        `).join("")}`;
    } else if (question.question_type === 'checkbox' && question.checkbox) {
        optionsHTML += `${Object.values(question.checkbox).map((choice, index) => `
            <textarea name="choice${index + 1}" style="min-height: 40px;">${choice}</textarea>
        `).join("")}`;
    }

    optionsHTML += '</div>';

    return optionsHTML;
}

function showAlert(message) {
    alert(message);
}
