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

function populateSurveyDetails(survey) {
    document.getElementById("surveyTitle").innerText = `${survey.course} - ${survey.semester} Semester AY:${survey.ay} Survey Details`;
    document.getElementById("courseSelect").value = survey.course;
    document.getElementById("semSelect").value = survey.semester;
    document.getElementById("aySelect").value = survey.ay;
}

function populateQuestions(questions) {
    const questionContainer = document.querySelector(".question-container");
    questionContainer.innerHTML = "";

    if (questions.length === 0) {
        const noQuestionsMessage = document.createElement('p');
        noQuestionsMessage.textContent = "No questions have been created in this survey.";
        noQuestionsMessage.style.textAlign = 'center'; 
        questionContainer.appendChild(noQuestionsMessage);
        return; 
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

function showAlert(message) {
    alert(message);
}
