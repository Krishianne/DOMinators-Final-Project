// Function to filter published surveys
function filterPublishedSurveys() {
    const surveyContainer = document.getElementById('surveyContainer');
    surveyContainer.innerHTML = ""; 

    surveyContainer.appendChild(createSurveyHeader()); 

    const publishedSurveys = allSurveys.filter(survey => survey.survey_status === 'published');

    if (publishedSurveys.length > 0) {
        publishedSurveys.forEach(survey => surveyContainer.appendChild(createSurveyCard(survey)));
    } else {
        const noPublishedMessage = document.createElement('p');
        noPublishedMessage.textContent = "No published surveys found.";
        surveyContainer.appendChild(noPublishedMessage);
    }
}


function filterUnpublishedSurveys() {
    const surveyContainer = document.getElementById('surveyContainer');
    surveyContainer.innerHTML = ""; 

    surveyContainer.appendChild(createSurveyHeader()); 

    const unpublishedSurveys = allSurveys.filter(survey => survey.survey_status == 'unpublished');

    if (unpublishedSurveys.length > 0) {
        unpublishedSurveys.forEach(survey => surveyContainer.appendChild(createSurveyCard(survey)));
    } else {
        const noUnpublishedMessage = document.createElement('p');
        noUnpublishedMessage.textContent = "No unpublished surveys found.";
        surveyContainer.appendChild(noUnpublishedMessage);
    }
}

function filterArchivedSurveys() {
    const surveyContainer = document.getElementById('surveyContainer');
    surveyContainer.innerHTML = ""; 

    surveyContainer.appendChild(createSurveyHeader()); 

    const archivedSurveys = allSurveys.filter(survey => survey.survey_status == 'archived');

    if (archivedSurveys.length > 0) {
        archivedSurveys.forEach(survey => surveyContainer.appendChild(createSurveyCard(survey)));
    } else {
        const noArchiveddMessage = document.createElement('p');
        noArchiveddMessage.textContent = "No archived surveys found.";
        surveyContainer.appendChild(noArchiveddMessage);
    }
}


function filterMixedSurveys() {
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
}


document.getElementById('publishedSurveys').addEventListener('click', (event) => {
    event.preventDefault();
    filterPublishedSurveys();
});

document.getElementById('unpublishedSurveys').addEventListener('click', (event) => {
    event.preventDefault();
    filterUnpublishedSurveys();
});

document.getElementById('archivedSurveys').addEventListener('click', (event) => {
    event.preventDefault();
    filterArchivedSurveys();
});

document.getElementById('mixedSurveys').addEventListener('click', (event) => {
    event.preventDefault();
    filterMixedSurveys();
});
