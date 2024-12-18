document.addEventListener("DOMContentLoaded", () => {
    const questionTypeDropdown = document.getElementById("questionTypeDropdown");
    const categoryDropdown = document.getElementById("categoryDropdown");

    questionTypeDropdown.addEventListener("change", filterQuestions);
    categoryDropdown.addEventListener("change", filterQuestions);

    function filterQuestions() {
        const selectedType = questionTypeDropdown.value;
        const selectedCategory = categoryDropdown.value;
        const questions = document.querySelectorAll(".essay-part");

        questions.forEach((question) => {
            const questionType = question.querySelector("select[name='type']").value;
            const questionCategory = question.querySelector("select[name='cat']").value;

            const typeMatch = selectedType === "all" || questionType === selectedType;
            const categoryMatch = selectedCategory === "all" || questionCategory === selectedCategory;

            if (typeMatch && categoryMatch) {
                question.style.display = "block";
            } else {
                question.style.display = "none";
            }
        });
    }

   
    filterQuestions();
});
