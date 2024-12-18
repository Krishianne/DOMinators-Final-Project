// JavaScript for handling question addition and display
const userId = localStorage.getItem('userId');
const firstname = localStorage.getItem('firstname');


document.addEventListener('DOMContentLoaded', () => {
    const startYearDropdown = document.getElementById('start-year');
    const endYearDropdown = document.getElementById('end-year');

    const validateAcademicYear = () => {
        const startYear = parseInt(startYearDropdown.value, 10);
        const endYear = parseInt(endYearDropdown.value, 10);

        if (isNaN(startYear) || isNaN(endYear)) {
            return; 
        }

        if (endYear !== startYear + 1) {
            alert('Academic year must have a one-year gap (e.g., 2021-2022).');
            endYearDropdown.value = ''; 
        }
    };

    startYearDropdown.addEventListener('change', () => {
        validateAcademicYear();
    });

    endYearDropdown.addEventListener('change', () => {
        validateAcademicYear();
    });
}); 

function updatePlaceholders(container, inputClass, placeholderText) {
    const inputs = container.getElementsByClassName(inputClass);
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].querySelector('input').setAttribute('placeholder', `${placeholderText} ${i + 1}`);
        inputs[i].querySelector('input').setAttribute('name', `${placeholderText.toLowerCase()}${i + 1}`);
    }
}

function addRatingOption() {
    const container = document.getElementById("rating-options-list");


    const newOption = document.createElement("div");
    newOption.classList.add("rate-input");
    newOption.innerHTML = `
        <input type="text" placeholder="Rate ${container.children.length + 1}">
        <button type="button" class="remove-btn" onclick="removeOption(this, 'rate-input', 'Rate')">Remove</button>
    `;
    container.appendChild(newOption);



    updatePlaceholders(container, 'rate-input', 'Rate');
}

function addCheckboxOption() {
    const container = document.getElementById("checkbox-options-list");
    const newOption = document.createElement("div");
    newOption.classList.add("checkbox-input");
    newOption.innerHTML = `
        <input type="text" placeholder="Choice ${container.children.length + 1}">
        <button type="button" class="remove-btn" onclick="removeOption(this, 'checkbox-input', 'Choice')">Remove</button>
    `;
    container.appendChild(newOption);
    updatePlaceholders(container, 'checkbox-input', 'Choice');
}

function removeOption(button, inputClass, placeholderText) {
    const container = button.parentElement.parentElement;
    button.parentElement.remove();
    updatePlaceholders(container, inputClass, placeholderText);
}
document.addEventListener('DOMContentLoaded', () => {


    const questionTypeDropdown = document.querySelector('#questionType');
    const categoryDropdown = document.querySelector('select[name="cat"]');
    const optionsContainer = document.getElementById('options-container');
    const ratingOptionsContainer = document.getElementById('rating-options');
    const checkboxOptionsContainer = document.getElementById('checkbox-options');


    const ratingContainer = document.createElement('div');
    const checkboxContainer = document.createElement('div');
    const essayContainer = document.createElement('div');


    ratingContainer.classList.add('question-list-container', 'rating-container');
    checkboxContainer.classList.add('question-list-container', 'checkbox-container');
    essayContainer.classList.add('question-list-container', 'essay-container');


    ratingContainer.classList.add('hidden');
    checkboxContainer.classList.add('hidden');
    essayContainer.classList.add('hidden');

    document.querySelector('.survey-container').appendChild(ratingContainer);
    document.querySelector('.survey-container').appendChild(checkboxContainer);
    document.querySelector('.survey-container').appendChild(essayContainer);


    const resetOptions = () => {
        optionsContainer.style.display = 'none';
        ratingOptionsContainer.style.display = 'none';
        checkboxOptionsContainer.style.display = 'none';
        const inputs = optionsContainer.querySelectorAll('input');
        inputs.forEach(input => input.value = '');
    };


    questionTypeDropdown.addEventListener('change', () => {
        const selectedType = questionTypeDropdown.value;
        resetOptions();
        if (selectedType === 'Rating') {
            optionsContainer.style.display = 'block';
            ratingOptionsContainer.style.display = 'block';
        } else if (selectedType === 'Checkbox') {
            optionsContainer.style.display = 'block';
            checkboxOptionsContainer.style.display = 'block';
        }
    });



    const questions = [];


    const addQuestionBtn = document.querySelector('.save-btn');
    addQuestionBtn.addEventListener('click', () => {
        const questionText = document.querySelector('#question_text').value.trim();
        const questionType = questionTypeDropdown.value;
        const category = categoryDropdown.value;


        if (!questionText || !questionType || !category) {
            alert('Please fill out the question text, select a type, and choose a category.');
            return;
        }


        if (questionType === 'Rating') {
            ratingContainer.classList.remove('hidden');
        } else if (questionType === 'Checkbox') {
            checkboxContainer.classList.remove('hidden');
        } else if (questionType === 'Essay') {
            essayContainer.classList.remove('hidden');
        }


        const question = {
            question_text: questionText,
            question_type: questionType,
            category,
            options: {}
        };


        if (questionType === 'Rating') {
            const rateInputs = ratingOptionsContainer.querySelectorAll('input');
            rateInputs.forEach((input, index) => {
                if (input.value.trim()) {
                    question.options[`rate${index + 1}`] = input.value;
                }
            });
        } else if (questionType === 'Checkbox') {
            const checkboxInputs = checkboxOptionsContainer.querySelectorAll('input');
            checkboxInputs.forEach((input, index) => {
                if (input.value.trim()) {
                    question.options[`choice${index + 1}`] = input.value;
                }
            });
        }



        if (Object.keys(question.options).length === 0 && questionType !== 'Essay') {
            alert('Please fill out the options for the selected question type.');
            return;
        }


        questions.push(question);


        const questionItem = document.createElement('div');
        questionItem.classList.add('question-item');
        questionItem.innerHTML = `
            <p><strong>Question:</strong> ${questionText}</p>
            <p><strong>Type:</strong> ${questionType}</p>
            <p><strong>Category:</strong> ${question.category}</p>
            ${
            Object.keys(question.options).length > 0
                ? `<p><strong>Options:</strong> ${Object.values(question.options).join(', ')}</p>`
                : ''
        }
        `;


        if (questionType === 'Rating') {
            ratingContainer.appendChild(questionItem);
        } else if (questionType === 'Checkbox') {
            checkboxContainer.appendChild(questionItem);
        } else if (questionType === 'Essay') {
            essayContainer.appendChild(questionItem);
        }


        alert('Question added successfully.');


        // Reset form fields
        document.querySelector('#question_text').value = '';
        questionTypeDropdown.value = '';
        categoryDropdown.value = '';
        resetOptions();
    });


    // Handle form submission with Save Button
    const saveSurveyBtn = document.querySelector('.add-btn');
    saveSurveyBtn.addEventListener('click', async () => {
        const course = document.querySelector('select[name="course"]').value.trim();
        const semester = document.querySelector('select[name="sem"]').value.trim();
        const ay = document.querySelector('select[name="ay"]').value.trim();


        if (!course || !semester || !ay || questions.length === 0) {
            alert('Please fill out all fields and add at least one question.');
            return;
        }


        const data = { course, semester, ay, questions };


        try {
            const response = await fetch('/api/surveyadd/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });


            const result = await response.json();
            if (response.ok) {
                alert('Survey added successfully!');
                location.reload();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error submitting survey:', error);
            alert('An error occurred while submitting the survey.');
        }
    });


    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.location.href = '../html/login.html';
        });
    }
});
