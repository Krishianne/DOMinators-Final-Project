const userId = localStorage.getItem('userId');

document.addEventListener('DOMContentLoaded', async () => {

    try {
        const response = await fetch('/api/users/respondents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        const data = await response.json();

        if (response.ok) {
            // Populate the data in the HTML
            document.getElementById('adminUserId').innerText = data.admin_user_id;
            document.getElementById('coursesList').innerText = data.courses.join(', ') || 'No courses available';
            document.getElementById('totalUsers').innerText = data.total_users || 0;
        } else {
            // Handle errors (e.g., no admin users, no courses)
            document.getElementById('adminInfo').innerHTML = `<p>Error: ${data.message}</p>`;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('adminInfo').innerHTML = '<p>Error fetching data. Please try again later.</p>';
    }
});


const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.location.href = '../html/login.html';
        });
    }