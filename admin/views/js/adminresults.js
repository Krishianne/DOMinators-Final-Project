const userId = localStorage.getItem('userId');
console.log(userId);

document.addEventListener('DOMContentLoaded', () => {
    if (!userId) {
        alert('No user ID found.');
        return;
    }

    // Fetch student data
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
                        display: false  // Removed the legend label
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

    // Show filter options on button click
    document.getElementById('filter-button').addEventListener('click', function () {
        const filterPopup = document.getElementById('filter-popup');
        filterPopup.style.display = filterPopup.style.display === 'block' ? 'none' : 'block';
    });
    
    // Fetch distinct filter values and populate the checklist
    fetch('/api/users/distinct-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
            return;
        }
        populateFilterOptions(data);
    })
    .catch(error => {
        console.error('Error fetching distinct filters:', error);
    });

    function populateFilterOptions(filters) {
        const filterPopup = document.getElementById('filter-popup');
        filterPopup.innerHTML = ''; // Clear any existing filters
    
        function createFilterSection(title, items, id) {
            const section = document.createElement('div');
            section.classList.add('filter-section');
            section.id = id; // Assign ID to section
    
            const heading = document.createElement('h3');
            heading.textContent = title;
            section.appendChild(heading);
    
            items.forEach(item => {
                const label = document.createElement('label');
                label.innerHTML = `<input type="checkbox" value="${item}"> ${item}`;
                section.appendChild(label);
                section.appendChild(document.createElement('br'));
            });
    
            return section;
        }
    
        // Create sections with IDs for each filter
        const courseSection = createFilterSection('Course', filters.courses, 'filter-course');
        const semesterSection = createFilterSection('Semester', filters.semesters, 'filter-semester');
        const aySection = createFilterSection('Academic Year (AY)', filters.ays, 'filter-ay');
        const statusSection = createFilterSection('Status', filters.statuses, 'filter-status');
    
        filterPopup.appendChild(courseSection);
        filterPopup.appendChild(semesterSection);
        filterPopup.appendChild(aySection);
        filterPopup.appendChild(statusSection);
    }
    

    // Apply filters to the table
    document.getElementById('apply-filters').addEventListener('click', function () {
        const filters = {
            course: getCheckedValues('filter-course'),
            semester: getCheckedValues('filter-semester'),
            ay: getCheckedValues('filter-ay'),
            status: getCheckedValues('filter-status')
        };
    
        console.log('Filters applied:', filters); // Debugging log
        filterStudents(filters);
    });
    

    function getCheckedValues(filterId) {
        const checkedValues = [];
        const checkboxes = document.querySelectorAll(`#${filterId} input:checked`);
        checkboxes.forEach(checkbox => checkedValues.push(checkbox.value));
        return checkedValues;
    }

    function filterStudents(filters) {
        const rows = document.querySelectorAll('#student-details-table tbody tr');
    
        rows.forEach(row => {
            const course = row.querySelector('td:nth-child(4)').innerText.trim().toLowerCase();
            const semester = row.querySelector('td:nth-child(5)').innerText.trim().toLowerCase();
            const ay = row.querySelector('td:nth-child(6)').innerText.trim().toLowerCase();
            const status = row.querySelector('td:nth-child(7)').innerText.trim().toLowerCase();
    
            let showRow = true;
    
            if (filters.course.length > 0 && !filters.course.some(value => course.includes(value.toLowerCase()))) {
                showRow = false;
            }
            if (filters.semester.length > 0 && !filters.semester.some(value => semester.includes(value.toLowerCase()))) {
                showRow = false;
            }
            if (filters.ay.length > 0 && !filters.ay.some(value => ay.includes(value.toLowerCase()))) {
                showRow = false;
            }
            if (filters.status.length > 0 && !filters.status.some(value => status.includes(value.toLowerCase()))) {
                showRow = false;
            }
    
            row.style.display = showRow ? '' : 'none';
        });
    }
    

    // Fetch student table status data
    fetch('/api/users/table-status', {
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

        const studentDetailsTableBody = document.querySelector('#student-details-table tbody');

        data.students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.firstname}</td>
                <td>${student.lastname}</td>
                <td><a href="mailto:${student.email}" class="email-link">${student.email}</a></td>
                <td>${student.course}</td>
                <td>${student.semester}</td>
                <td>${student.ay}</td>
                <td><button class="status-button" data-status-id="${student.status_id}">${student.status}</button></td>
            `;
            studentDetailsTableBody.appendChild(row);
        });
        

        // Add event listeners to status buttons
        document.querySelectorAll('.status-button').forEach(button => {
            button.addEventListener('click', event => {
                const statusId = event.target.dataset.statusId;
                fetchSurveyDetails(statusId);
            });
        });
    })
    .catch(error => {
        console.error('Error fetching table status:', error);
    });

    // Logout functionality
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.location.href = '../html/login.html';
        });
    }
});
