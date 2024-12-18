document.getElementById('saveAllBtn').addEventListener('click', saveSurvey);

async function saveSurvey() {
    const surveyId = localStorage.getItem('surveyId');
    const questions = [];
    const questionElements = document.querySelectorAll('.essay-part');
    questionElements.forEach(questionElement => {
        const questionId = questionElement.dataset.questionId;
        const questionText = questionElement.querySelector('textarea[name="question_text"]').value.trim();
        const questionType = questionElement.querySelector('select[name="type"]').value;
        const category = questionElement.querySelector('select[name="cat"]').value;

        const options = [];
        const optionElements = questionElement.querySelectorAll('.options-container textarea');
        optionElements.forEach(optionElement => {
            options.push(optionElement.value.trim());
        });

        questions.push({
            question_id: questionId,
            question_text: questionText,
            question_type: questionType,
            category: category,
            options: options
        });
    });

    try {
        const response = await fetch(`/api/survey/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                survey_id: surveyId,
                questions: questions
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message || 'Survey saved successfully.');
        } else {
            alert(data.message || 'Failed to save survey.');
        }
    } catch (error) {
        console.error('Error saving survey:', error);
        alert('An error occurred while saving the survey.');
    }
}