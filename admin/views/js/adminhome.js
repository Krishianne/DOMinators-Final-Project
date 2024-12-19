const userId = localStorage.getItem('userId');
const firstname = localStorage.getItem('firstname');

let allSurveys = [];

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

function createSurveyCard(survey) {
    const surveyCard = document.createElement('div');
    surveyCard.className = 'survey-card';
    surveyCard.style.position = 'relative'; 

    const icon = document.createElement('img');
    let iconSrc = ''; 

    switch (survey.course) {
        case 'BSCS':
            iconSrc = '../res/pictures/BSCS.gif'; 
            break;
        case 'BSCE':
            iconSrc = '../res/pictures/BSCE.gif'; 
            break;
        case 'BSMLS':
            iconSrc = '../res/pictures/BSMLS.gif'; 
            break;
        case 'BSIT':
            iconSrc = '../res/pictures/BSIT.gif'; 
            break;
        case 'BSTM':
            iconSrc = '../res/pictures/BSTM.gif'; 
            break;
        default:
            iconSrc = '../res/pictures/default.png'; 
            break;
    }

    icon.src = iconSrc;
    icon.alt = `${survey.course} Icon`;
    icon.className = 'survey-icon';

    const infoDiv = document.createElement('div');
    infoDiv.className = 'survey-info';

    const link = document.createElement('a');
    link.href = `viewsurvey.html?survey_id=${survey.survey_id}`;
    link.className = 'survey-link';

    const title = document.createElement('h2');
    title.textContent = `${survey.course} Learning Outcomes `;

    const statusSpan = document.createElement('span');
    statusSpan.textContent = `(${survey.survey_status})`;
    statusSpan.style.fontSize = '15px';

    switch (survey.survey_status) {
        case 'published':
            statusSpan.style.color = 'green';
            break;
        case 'unpublished':
            statusSpan.style.color = 'red';
            break;
        case 'archived':
            statusSpan.style.color = 'blue';
            break;
        default:
            statusSpan.style.color = 'black';
    }

    title.appendChild(statusSpan);

    document.body.appendChild(title); 

    const footer = document.createElement('p');
    footer.className = 'survey-footer';
    footer.textContent = `For ${survey.semester} Semester, AY ${survey.ay} Graduates`;

    const description = document.createElement('p');
    description.className = 'survey-description';
    description.textContent = getCourseDescription(survey.course);
    description.style.textAlign = 'justify';
    description.style.textIndent = '2em';

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const viewButton = document.createElement('img');
    viewButton.src = '../res/pictures/view1.png';
    viewButton.alt = 'View';
    viewButton.className = 'action-button';
    viewButton.title = 'View Survey';
    viewButton.onclick = () => {
        window.location.href = `viewsurvey.html?survey_id=${survey.survey_id}`;
    };

    viewButton.addEventListener('mouseover', () => {
        viewButton.src = '../res/pictures/view2.png'; 
    });
    viewButton.addEventListener('mouseout', () => {
        viewButton.src = '../res/pictures/view1.png';
    });

    buttonContainer.appendChild(viewButton);

    if (survey.survey_status == 'unpublished') {
        const editButton = document.createElement('img');
        editButton.src = '../res/pictures/edit1.png'; 
        editButton.alt = 'Edit';
        editButton.className = 'action-button';
        editButton.title = 'Edit Survey';
        editButton.onclick = () => {
            window.location.href = `editsurvey.html?survey_id=${survey.survey_id}`;
        };

        editButton.addEventListener('mouseover', () => {
            editButton.src = '../res/pictures/edit2.png';
        });
        editButton.addEventListener('mouseout', () => {
            editButton.src = '../res/pictures/edit1.png'; 
        });

        const deleteButton = document.createElement('img');
        deleteButton.src = '../res/pictures/delete1.png';
        deleteButton.alt = 'Delete';
        deleteButton.className = 'action-button';
        deleteButton.title = 'Delete Survey';
        deleteButton.onclick = () => {
            if (confirm('Are you sure you want to delete this survey?')) {
                deleteSurvey(survey.survey_id);
            }
        };

        deleteButton.addEventListener('mouseover', () => {
            deleteButton.src = '../res/pictures/delete2.png'; 
        });
        deleteButton.addEventListener('mouseout', () => {
            deleteButton.src = '../res/pictures/delete1.png'; 
        });

        const publishButton = document.createElement('img');
        publishButton.src = '../res/pictures/publish1.png'; 
        publishButton.alt = 'Publish';
        publishButton.className = 'action-button';
        publishButton.title = 'Publish Survey';
        publishButton.onclick = () => {
            if (confirm('Are you sure you want to publish this survey?')) {
                publishSurvey(survey.survey_id);
            }
        };

        publishButton.addEventListener('mouseover', () => {
            publishButton.src = '../res/pictures/publish2.png'; 
        });
        publishButton.addEventListener('mouseout', () => {
            publishButton.src = '../res/pictures/publish1.png';
        });

        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);
        buttonContainer.appendChild(publishButton);
    }

    if (survey.survey_status == 'published') {
        const unpublishButton = document.createElement('img');
        unpublishButton.src = '../res/pictures/publish2.png'; 
        unpublishButton.alt = 'Unpublish';
        unpublishButton.className = 'action-button';
        unpublishButton.title = 'Unpublish Survey';
        unpublishButton.onclick = () => {
            if (confirm('Are you sure you want to unpublish this survey?')) {
                unpublishSurvey(survey.survey_id);
            }
        };

        unpublishButton.addEventListener('mouseover', () => {
            unpublishButton.src = '../res/pictures/publish1.png'; 
        });
        unpublishButton.addEventListener('mouseout', () => {
            unpublishButton.src = '../res/pictures/publish2.png'; 
        });

        buttonContainer.appendChild(unpublishButton);
    }

    if (survey.survey_status == 'archived') {
        const unarchiveButton = document.createElement('img');
        unarchiveButton.src = '../res/pictures/archived2.png'; 
        unarchiveButton.alt = 'Unarchive';
        unarchiveButton.className = 'action-button';
        unarchiveButton.title = 'Unarchive Survey';
        unarchiveButton.onclick = () => {
            if (confirm('Are you sure you want to unarchive this survey?')) {
                unarchiveSurvey(survey.survey_id);
            }
        };

        unarchiveButton.addEventListener('mouseover', () => {
            unarchiveButton.src = '../res/pictures/archived1.png'; 
        });
        unarchiveButton.addEventListener('mouseout', () => {
            unarchiveButton.src = '../res/pictures/archived2.png'; 
        });

        const deleteButton = document.createElement('img');
        deleteButton.src = '../res/pictures/delete1.png';
        deleteButton.alt = 'Delete';
        deleteButton.className = 'action-button';
        deleteButton.title = 'Delete Survey';
        deleteButton.onclick = () => {
            if (confirm('Are you sure you want to delete this survey?')) {
                deleteSurvey(survey.survey_id);
            }
        };

        deleteButton.addEventListener('mouseover', () => {
            deleteButton.src = '../res/pictures/delete2.png'; 
        });
        deleteButton.addEventListener('mouseout', () => {
            deleteButton.src = '../res/pictures/delete1.png';
        });

        buttonContainer.appendChild(unarchiveButton);
        buttonContainer.appendChild(deleteButton);
    }

    if (survey.survey_status !== 'archived') {
        const archiveButton = document.createElement('img');
        archiveButton.src = '../res/pictures/archived1.png'; 
        archiveButton.alt = 'Archive';
        archiveButton.className = 'action-button';
        archiveButton.title = 'Archive Survey';
        archiveButton.onclick = () => {
            if (confirm('Are you sure you want to archive this survey?')) {
                archiveSurvey(survey.survey_id);
            }
        };

        archiveButton.addEventListener('mouseover', () => {
            archiveButton.src = '../res/pictures/archived2.png'; 
        });
        archiveButton.addEventListener('mouseout', () => {
            archiveButton.src = '../res/pictures/archived1.png'; 
        });

        buttonContainer.appendChild(archiveButton);
    }

    surveyCard.appendChild(buttonContainer);

    link.appendChild(title);
    infoDiv.appendChild(link);
    infoDiv.appendChild(description);
    infoDiv.appendChild(footer);
    surveyCard.appendChild(icon);
    surveyCard.appendChild(infoDiv);

    return surveyCard;
}

function deleteSurvey(surveyId) {
    fetch(`/api/deletesurvey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId }),
    })
        .then(response => {
            if (response.ok) {
                alert('Survey deleted successfully.');
                populateSurveys(); 
            } else {
                alert('Failed to delete the survey.');
            }
        })
        .catch(error => {
            console.error('Error deleting survey:', error);
            alert('An error occurred while deleting the survey.');
        });
}

function createSurveyHeader() {
    const header = document.createElement('h1');
    header.textContent = `${firstname}'s Survey List`;
    return header;
}

async function populateSurveys() {
    try {
        allSurveys = await fetchSurveyData(userId); 
        const surveyContainer = document.getElementById('surveyContainer');
        surveyContainer.innerHTML = ""; 

        surveyContainer.appendChild(createSurveyHeader()); 

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

function searchSurveys() {
    const query = document.getElementById('searchQuery').value.toLowerCase();
    const surveyContainer = document.getElementById('surveyContainer');
    surveyContainer.innerHTML = ""; 

    surveyContainer.appendChild(createSurveyHeader()); 

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

document.getElementById('searchQuery').addEventListener('input', searchSurveys);

document.addEventListener('DOMContentLoaded', populateSurveys);

document.querySelectorAll('.nav-link').forEach(function(link) {
    link.addEventListener('click', function() {
        document.querySelectorAll('.nav-link').forEach(function(navLink) {
            navLink.classList.remove('active');
        });
        this.classList.add('active');
    });
});

const logoutButton = document.getElementById('logoutButton');
if (logoutButton) { 
    logoutButton.addEventListener('click', () => {
        window.location.href = '../html/login.html';
    });
}