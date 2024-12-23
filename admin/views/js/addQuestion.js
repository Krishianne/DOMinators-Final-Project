document.getElementById('addQuestionBtn').addEventListener('click', addQuestion);


function addQuestion() {
    const questionContainer = document.getElementsByClassName('question-container')[0];
    if (!questionContainer) {
        console.error("Element with class 'question-container' not found.");
        return;
    }
    console.log("Adding a new question...");
    const questionHTML = `
        <div class="essay-part" data-question-id="">
            <div class="question">
                <label class="text-box" for="question_text">Question Text</label>
                <textarea name="question_text"></textarea>
            </div>
            <div class="options-part">
                <div class="drop-container">
                    <label for="type">Question Type</label>
                    <select name="type" class="drop-option2" onchange="toggleOptions(this)">
                        <option value="essay">Essay</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="rating">Rating</option>
                    </select>
                </div>
                <div class="drop-container">
                    <label for="sub">Category</label>
                    <select name="cat" class="drop-option2">
                        <option value="major">Major</option>
                        <option value="minor">Minor</option>
                    </select>
                </div>
            </div>
            <div class="options-container" style="display:none; width: 200px;">
                <label>Options</label>
            </div>
            <button type="button" class="delete-question-btn">Delete</button>
        </div>
    `;
    questionContainer.insertAdjacentHTML('beforeend', questionHTML);
     const newlyAddedQuestion = questionContainer.lastElementChild;
     const deleteButton = newlyAddedQuestion.querySelector('.delete-question-btn');
 
     deleteButton.addEventListener('click', () => {
         questionContainer.removeChild(newlyAddedQuestion);
         console.log("Question deleted.");
     });
 }
