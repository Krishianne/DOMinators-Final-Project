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


});


function populateSurveyDetails(survey) {
    document.getElementById("surveyTitle").innerText = `Edit ${survey.course} - ${survey.semester} Semester AY:${survey.ay} Survey Details`;
    document.getElementById("courseSelect").value = survey.course;
    document.getElementById("semSelect").value = survey.semester;
    document.getElementById("aySelect").value = survey.ay;
}

function populateQuestions(questions) {
    const questionContainer = document.querySelector(".question-container");
    questionContainer.innerHTML = ""; 

    questions.forEach((question) => {
        const questionHTML = `
            <div class="essay-part" data-question-id="${question.question_id}">
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
                <button type="button" class="delete-question-btn" onclick="deleteQuestion('${question.question_id}')">Delete</button>
            </div>
        `;
        questionContainer.insertAdjacentHTML("beforeend", questionHTML);
    });
}

function toggleOptions(selectElement) {
    const parentDiv = selectElement.closest('.essay-part');
    const optionsContainer = parentDiv.querySelector('.options-container');

    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        optionsContainer.style.display = 'none';  
    }

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

async function deleteQuestion(questionId) {
    if (!confirm("Are you sure you want to delete this question?")) {
        return;
    }

    try {
        const response = await fetch(`/api/survey/deleteQuestion`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question_id: questionId })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message || 'Question deleted successfully.');
            location.reload(); 
        } else {
            alert(data.message || 'Failed to delete question.');
        }
    } catch (error) {
        console.error('Error deleting question:', error);
        alert('An error occurred while deleting the question.');
    }
}
