document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const studentClassId = urlParams.get('studentClassId'); 

    if (studentClassId) {
        console.log('Student Class ID:', studentClassId);

        fetch(`/api/users/student-response`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentClassId })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Fetched student details:', data);

            const container = document.createElement('div');
            container.id = 'response-container';
            container.style.marginTop = '30px';
            container.style.padding = '20px';
            container.style.backgroundColor = 'white';
            container.style.borderRadius = '10px';
            container.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
            container.style.textAlign = 'center';

            const title = document.createElement('h1');
            title.textContent = `${data.firstname}'s Responses on ${data.course} ${data.semester} Semester AY:${data.ay} Survey`;
            title.style.marginBottom = '20px';
            title.style.color = '#E8AF30';
            container.appendChild(title);

            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.marginTop = '20px';
            table.style.borderCollapse = 'collapse';
            table.style.textAlign = 'left';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            ['Question Text', 'Category', 'Question Type', 'Answer'].forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                th.style.padding = '10px';
                th.style.borderBottom = '2px solid #ddd';
                th.style.fontWeight = 'bold';
                th.style.backgroundColor = '#f9f9f9';
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            data.responses.forEach(response => {
                const row = document.createElement('tr');

                [response.question_text, response.category, response.question_type].forEach(cellData => {
                    const td = document.createElement('td');
                    td.textContent = cellData;
                    td.style.padding = '10px';
                    td.style.borderBottom = '1px solid #ddd';
                    row.appendChild(td);
                });

                const answerTd = document.createElement('td');
                answerTd.style.padding = '10px';
                answerTd.style.borderBottom = '1px solid #ddd';
                
                if (response.question_type === 'checkbox' && response.answer) {
                    const answers = response.answer.split(',').map(answer => answer.trim().replace(/^"|"$/g, ''));
                    answerTd.innerHTML = answers.join('<br>');
                } else {
                    answerTd.textContent = response.answer || 'N/A';
                }

                row.appendChild(answerTd);
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            container.appendChild(table);

            document.querySelector('#responsesContainer').appendChild(container);

        })
        .catch(error => {
            console.error('Error fetching student details:', error);
        });
    } else {
        console.error('No studentClassId found in URL.');
    }
});
