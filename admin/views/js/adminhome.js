// Retrieve user ID and firstname from local storage
const userId = localStorage.getItem('userId');
const firstname = localStorage.getItem('firstname');

// Global variable to store surveys
let allSurveys = [];

// Function to fetch survey data based on user ID
function fetchSurveyData(userId) {
    return fetch(`/api/survey/surveycards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
    })
        .then(response => response.json())
        .then(data => {
            console.log("Response data:", data);
            return data.length > 0 ? data : [];
        })
        .catch(error => {
            console.error('Error:', error);
            return [];
        });
}

// Function to get the course description
function getCourseDescription(course) {
    switch (course) {
        case 'BSCS':
            return "This survey is designed to assess the educational progress and knowledge of students in the Bachelor of Science in Computer Science program. We aim to gather feedback on how well the program equips students with skills in areas such as programming, algorithms, data structures, software development, and problem-solving.";
        case 'BSIT':
            return "This survey is designed to assess the educational progress and knowledge of students in the Bachelor of Science in Information Technology program. We aim to gather feedback on how well the program prepares students with skills in areas such as programming, networking, database management, cybersecurity, and IT support and administration.";
        case 'BSTM':
            return "This survey is designed to assess the educational progress and knowledge of students in the Bachelor of Science in Tourism Management program. We aim to gather feedback on how well the program equips students with skills in areas such as hospitality, tourism planning, event management, sustainable tourism, and customer service.";
        case 'BSMLS':
            return "This survey is designed to assess the educational progress and knowledge of students in the Bachelor of Science in Medical Laboratory Science program. We aim to gather feedback on how well the program equips students with skills in areas such as laboratory techniques, medical diagnostics, microbiology, clinical chemistry, and health and safety practices.";
        case 'BSCE':
            return "This survey is designed to assess the educational progress and knowledge of students in the Bachelor of Science in Civil Engineering program. We aim to gather feedback on how well the program prepares students with skills in areas such as structural analysis, material science, construction management, environmental engineering, and project design.";
        default:
            return "No specific description for this survey.";
    }
}

// Function to create a survey card
function createSurveyCard(survey) {
    const surveyCard = document.createElement('div');
    surveyCard.className = 'survey-card';
    surveyCard.style.position = 'relative'; // Ensure relative positioning for child elements

    // Survey icon - set dynamically based on course
    const icon = document.createElement('img');
    let iconSrc = ''; // Default icon path

    // Set the icon source based on the course
    switch (survey.course) {
        case 'BSCS':
            iconSrc = '../res/pictures/BSCS.gif'; // BSCS icon
            break;
        case 'BSCE':
            iconSrc = '../res/pictures/BSCE.gif'; // BSCE icon
            break;
        case 'BSMLS':
            iconSrc = '../res/pictures/BSMLS.gif'; // BSMLS icon
            break;
        case 'BSIT':
            iconSrc = '../res/pictures/BSIT.gif'; // BSIT icon
            break;
        case 'BSTM':
            iconSrc = '../res/pictures/BSTM.gif'; // BSTM icon
            break;
        default:
            iconSrc = '../res/pictures/default.png'; // Default icon if no match
            break;
    }

    icon.src = iconSrc;
    icon.alt = `${survey.course} Icon`;
    icon.className = 'survey-icon';

    // Survey info container
    const infoDiv = document.createElement('div');
    infoDiv.className = 'survey-info';

    // Survey title link
    const link = document.createElement('a');
    link.href = `viewsurvey.html?survey_id=${survey.survey_id}`;
    link.className = 'survey-link';

    const title = document.createElement('h2');
    title.textContent = `${survey.course} Learning Outcomes`;

    // Footer and description
    const footer = document.createElement('p');
    footer.className = 'survey-footer';
    footer.textContent = `For ${survey.semester} Semester, AY ${survey.ay} Graduates`;

    const description = document.createElement('p');
    description.className = 'survey-description';
    description.textContent = getCourseDescription(survey.course);
    description.style.textAlign = 'justify';
    description.style.textIndent = '2em';

    // Add button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    // View button
    const viewButton = document.createElement('img');
    viewButton.src = '../res/pictures/view1.png'; // Default view icon
    viewButton.alt = 'View';
    viewButton.className = 'action-button';
    viewButton.onclick = () => {
       

        // Redirect to the view survey page
        window.location.href = `viewsurvey.html?survey_id=${survey.survey_id}`;
    };

    // Hover and click effects for View button
    viewButton.addEventListener('mouseover', () => {
        viewButton.src = '../res/pictures/view2.png'; // Hover state
    });
    viewButton.addEventListener('mouseout', () => {
        viewButton.src = '../res/pictures/view1.png'; // Reset to default
    });


    // Hover and click effect for View button
    viewButton.addEventListener('mouseover', () => {
        viewButton.src = '../res/pictures/view2.png'; // Hover state
    });
    viewButton.addEventListener('mouseout', () => {
        viewButton.src = '../res/pictures/view1.png'; // Reset to default
    });

    buttonContainer.appendChild(viewButton);

    // Add Edit and Delete buttons if the survey is unpublished
    if (survey.survey_status !== 'published') {
        // Edit button
        const editButton = document.createElement('img');
        editButton.src = '../res/pictures/edit1.png'; // Default edit icon
        editButton.alt = 'Edit';
        editButton.className = 'action-button';
        editButton.onclick = () => {
            window.location.href = `editsurvey.html?survey_id=${survey.survey_id}`;
        };

        // Hover and click effect for Edit button
        editButton.addEventListener('mouseover', () => {
            editButton.src = '../res/pictures/edit2.png'; // Hover state
        });
        editButton.addEventListener('mouseout', () => {
            editButton.src = '../res/pictures/edit1.png'; // Reset to default
        });

        // Delete button
        const deleteButton = document.createElement('img');
        deleteButton.src = '../res/pictures/delete1.png'; // Default delete icon
        deleteButton.alt = 'Delete';
        deleteButton.className = 'action-button';
        deleteButton.onclick = () => {
            if (confirm('Are you sure you want to delete this survey?')) {
                deleteSurvey(survey.survey_id);
            }
        };

        // Hover and click effect for Delete button
        deleteButton.addEventListener('mouseover', () => {
            deleteButton.src = '../res/pictures/delete2.png'; // Hover state
        });
        deleteButton.addEventListener('mouseout', () => {
            deleteButton.src = '../res/pictures/delete1.png'; // Reset to default
        });

        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);
    }

    surveyCard.appendChild(buttonContainer);

    // Assemble survey card
    link.appendChild(title);
    infoDiv.appendChild(link);
    infoDiv.appendChild(description);
    infoDiv.appendChild(footer);
    surveyCard.appendChild(icon);
    surveyCard.appendChild(infoDiv);

    return surveyCard;
}




// Function to delete a survey
function deleteSurvey(surveyId) {
    fetch(`/api/deletesurvey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId }),
    })
        .then(response => {
            if (response.ok) {
                alert('Survey deleted successfully.');
                populateSurveys(); // Refresh the survey list
            } else {
                alert('Failed to delete the survey.');
            }
        })
        .catch(error => {
            console.error('Error deleting survey:', error);
            alert('An error occurred while deleting the survey.');
        });
}


// Function to create the header
function createSurveyHeader() {
    const header = document.createElement('h1');
    header.textContent = `${firstname}'s Survey List`;
    return header;
}

// Function to populate surveys
async function populateSurveys() {
    try {
        allSurveys = await fetchSurveyData(userId); // Fetch surveys
        const surveyContainer = document.getElementById('surveyContainer');
        surveyContainer.innerHTML = ""; // Clear container

        surveyContainer.appendChild(createSurveyHeader()); // Add header

        if (allSurveys.length > 0) {
            allSurveys.forEach(survey => surveyContainer.appendChild(createSurveyCard(survey)));
        } else {
            const noSurveysMessage = document.createElement('p');
            noSurveysMessage.textContent = "No surveys found.";
            surveyContainer.appendChild(noSurveysMessage);
        }
    } catch (error) {
        console.error(error.message);
    }
}

// Function to search surveys
function searchSurveys() {
    const query = document.getElementById('searchQuery').value.toLowerCase();
    const surveyContainer = document.getElementById('surveyContainer');
    surveyContainer.innerHTML = ""; // Clear the container

    surveyContainer.appendChild(createSurveyHeader()); // Add header

    const filteredSurveys = allSurveys.filter(survey => {
        const title = `${survey.course} Learning Outcomes`.toLowerCase();
        const description = getCourseDescription(survey.course).toLowerCase();
        const footer = `For ${survey.semester} Semester, AY ${survey.ay} Graduates`.toLowerCase();
        return title.includes(query) || description.includes(query) || footer.includes(query);
    });

    if (filteredSurveys.length > 0) {
        filteredSurveys.forEach(survey => surveyContainer.appendChild(createSurveyCard(survey)));
    } else {
        const noResultsMessage = document.createElement('p');
        noResultsMessage.textContent = "No surveys match your search.";
        surveyContainer.appendChild(noResultsMessage);
    }
}

// Event listener for search input
document.getElementById('searchQuery').addEventListener('input', searchSurveys);

// Populate surveys on page load
document.addEventListener('DOMContentLoaded', populateSurveys);

// Example for dynamically adding the active class
document.querySelectorAll('.nav-link').forEach(function(link) {
    link.addEventListener('click', function() {
        // Remove the active class from all links
        document.querySelectorAll('.nav-link').forEach(function(navLink) {
            navLink.classList.remove('active');
        });
        // Add the active class to the clicked link
        this.classList.add('active');
    });
});

const logoutButton = document.getElementById('logoutButton');
if (logoutButton) { // Ensure the button exists
    logoutButton.addEventListener('click', () => {
        window.location.href = '../html/login.html';
    });
}