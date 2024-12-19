function populateQuestions(questions) {
    const questionContainer = document.querySelector(".question-container");
    questionContainer.innerHTML = ""; 

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

document.addEventListener("DOMContentLoaded", () => {
    const typeDropdownButton = document.querySelector(".dropdown-button1");
    const typeDropdownMenu = typeDropdownButton.nextElementSibling;

    const categoryDropdownButton = document.querySelector(".dropdown-button");
    const categoryDropdownMenu = categoryDropdownButton.nextElementSibling;

    let selectedType = "all";
    let selectedCategory = "all";

    // Add event listeners for question type dropdown
    typeDropdownMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            selectedType = link.dataset.value;
            typeDropdownButton.textContent = link.textContent;
            filterQuestions();
        });
    });

    // Add event listeners for category dropdown
    categoryDropdownMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            selectedCategory = link.dataset.value;
            categoryDropdownButton.textContent = link.textContent;
            filterQuestions();
        });
    });

    // Filtering logic
    function filterQuestions() {
        const questions = document.querySelectorAll(".essay-part");

        questions.forEach((question) => {
            const questionType = question.querySelector("select[name='type']").value;
            const questionCategory = question.querySelector("select[name='cat']").value;

            const typeMatch = selectedType === "all" || questionType === selectedType;
            const categoryMatch = selectedCategory === "all" || questionCategory === selectedCategory;

            question.style.display = typeMatch && categoryMatch ? "block" : "none";
        });
    }

    // Initial filter to display all questions
    filterQuestions();
});
