document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const surveyId = urlParams.get('survey_id');

    if (!surveyId) {
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
        }
    } catch (error) {
        console.error("Error fetching survey details:", error);
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
    questionContainer.innerHTML = ""; // Clear existing questions

    questions.forEach((question) => {
        const questionHTML = `
            <div class="essay-part" data-question-id="${question.question_id}">
                <div class="question">
                    <label class="text-box" for="question_text">Question Text</label>
                    <textarea name="question_text" readonly>${question.question_text}</textarea>
                </div>
                <div class="options-part">
                    <div class="drop-container">
                        <label for="type">Question Type</label>
                        <select name="type" class="drop-option2" disabled>
                            <option value="essay" ${question.question_type === "essay" ? "selected" : ""}>Essay</option>
                            <option value="checkbox" ${question.question_type === "checkbox" ? "selected" : ""}>Checkbox</option>
                            <option value="rating" ${question.question_type === "rating" ? "selected" : ""}>Rating</option>
                        </select>
                    </div>
                    <div class="drop-container">
                        <label for="sub">Category</label>
                        <select name="cat" class="drop-option2" disabled>
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

function getQuestionTypeOptions(question) {
    let optionsHTML = `
        <div class="options-container" style="display:${question.question_type === 'rating' || question.question_type === 'checkbox' ? 'block' : 'none'}; width: 200px;">
            <label>Options</label>
    `;

    if (question.question_type === 'rating' && question.rate) {
        optionsHTML += `${Object.values(question.rate).map((rate, index) => `
            <textarea name="rate${index + 1}" style="min-height: 40px;" readonly>${rate}</textarea>
        `).join("")}`;
    } else if (question.question_type === 'checkbox' && question.checkbox) {
        optionsHTML += `${Object.values(question.checkbox).map((choice, index) => `
            <textarea name="choice${index + 1}" style="min-height: 40px;" readonly>${choice}</textarea>
        `).join("")}`;
    }

    optionsHTML += '</div>';

    return optionsHTML;
}
