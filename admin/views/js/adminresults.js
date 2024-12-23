const userId = localStorage.getItem('userId');
console.log(userId);

document.addEventListener('DOMContentLoaded', () => {
    if (!userId) {
        alert('No user ID found.');
        return;
    }

    fetch('/api/users/respondents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
            return;
        }

        const resultsContainer = document.getElementById('course-results');
        const totalUsersContainer = document.getElementById('total-users-count');
        const courses = [];
        const userCounts = [];

        console.log(data);

        data.user_counts.forEach(record => {
            const courseDiv = document.createElement('div');
            courseDiv.classList.add('course-record');
            courseDiv.innerHTML = `<strong>Course:</strong> ${record.course} | <strong>Total Students:</strong> ${record.total_users}`;
            resultsContainer.appendChild(courseDiv);

            courses.push(record.course);
            userCounts.push(record.total_users);
        });

        totalUsersContainer.textContent = data.total_users;

        const ctx = document.getElementById('barChart').getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(87, 182, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(36, 137, 255, 0.8)');  

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: courses,
                datasets: [{
                    data: userCounts,
                    backgroundColor: gradient,
                    borderColor: 'rgba(0, 53, 143, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false  
                    }
                },
                scales: {
                    x: { beginAtZero: true },
                    y: { beginAtZero: true }
                }
            }
        });
    })
    .catch(error => {
        console.error('Error fetching the data:', error);
        alert('Error fetching the data.');
    });

    fetch('/api/users/table-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            console.log(userId);
            console.log(data);
            alert(data.message);
            return;
        }

        console.log('Fetched student data:', data);

        const studentDetailsTableBody = document.querySelector('#student-details-table tbody');

        data.students.forEach(student => {
            const row = document.createElement('tr');

            let statusCellContent = student.status;
            if (student.status === 'submitted') {
                statusCellContent += `
                    <img 
                        src="../res/pictures/view1.png" 
                        alt="View" 
                        title="View"
                        class="view-button" 
                        data-id="${student.class_id}" 
                        style="cursor: pointer; width: 20px; margin-left: 10px;"
                    />
                `;
            }

            row.innerHTML = `
                <td>${student.firstname}</td>
                <td>${student.lastname}</td>
                <td><a href="mailto:${student.email}" class="email-link">${student.email}</a></td>
                <td>${student.course}</td>
                <td>${student.semester}</td>
                <td>${student.ay}</td>
                <td>${statusCellContent}</td>
            `;
            studentDetailsTableBody.appendChild(row);
        });

        document.querySelectorAll('.view-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const studentClassId = event.target.getAttribute('data-id');
                window.location.href = `../html/responses.html?studentClassId=${studentClassId}`;
            });
        });
        
    })
    .catch(error => {
        console.error('Error fetching table status:', error);
    });
    
    
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.location.href = '../html/login.html';
        });
    }
});
