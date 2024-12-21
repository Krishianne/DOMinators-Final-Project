document.addEventListener("DOMContentLoaded", () => {
    const typeDropdownButton = document.querySelector(".dropdown-button1");
    const typeDropdownMenu = typeDropdownButton.nextElementSibling;

    const categoryDropdownButton = document.querySelector(".dropdown-button");
    const categoryDropdownMenu = categoryDropdownButton.nextElementSibling;

    let selectedType = "all";
    let selectedCategory = "all";

   
    typeDropdownMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            selectedType = link.dataset.value;
            typeDropdownButton.textContent = link.textContent;
            filterQuestions();
        });
    });

    
    categoryDropdownMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            selectedCategory = link.dataset.value;
            categoryDropdownButton.textContent = link.textContent;
            filterQuestions();
        });
    });

    function filterQuestions() {
        const questions = document.querySelectorAll(".essay-part");

        questions.forEach((question) => {
            const questionType = question.querySelector("select[name='type']").value;
            const questionCategory = question.querySelector("select[name='cat']").value;

            const typeMatch = selectedType === "all" || questionType === selectedType;
            const categoryMatch = selectedCategory === "all" || questionCategory === selectedCategory;

            if (typeMatch && categoryMatch) {
                question.style.display = "flex";
            } else {
                question.style.display = "none";
            }
        });
    }

 
    filterQuestions();
});
