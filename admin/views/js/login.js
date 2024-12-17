let lockoutEndTime = null; 
let failedAttempts = 0; 

document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');


    if (lockoutEndTime && new Date() < lockoutEndTime) {
        alert('Too many failed attempts. Please wait until the timer ends.');
        return;
    }

    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password: passwordInput.value })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => Promise.reject(data));
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            failedAttempts = 0;
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('firstname', data.firstname);
            localStorage.setItem('lastname', data.lastname);
            localStorage.setItem('email', data.email);
            localStorage.setItem('userType', data.userType);
            localStorage.setItem('password', data.password);
            localStorage.setItem('images', data.images);
            window.location.href = data.redirect; // Redirect based on user type
        })
        .catch(error => {
            if (error.message.includes('Locked out')) {
                const waitTime = parseInt(error.message.match(/\d+/)[0], 10);
                lockoutEndTime = new Date(new Date().getTime() + waitTime * 1000);
                showCountdown(waitTime);
            } else {
                failedAttempts++;
                passwordInput.value = '';

                if (failedAttempts >= 3) {
                    lockoutEndTime = new Date(new Date().getTime() + 30 * 1000); 
                    showCountdown(30);
                } else {
                    alert(error.message); 
                }
            }
        });
});

const togglePasswordIcon = document.querySelector('#togglePasswordIcon');
    const passwordInput = document.querySelector('#password');

 passwordInput.addEventListener('input', function() {
    togglePasswordIcon.style.display = passwordInput.value.length > 0 ? 'inline' : 'none';
});

togglePasswordIcon.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordIcon.src = type === 'password' ? '../res/pictures/watch.png' : '../res/pictures/unwatch.png';
});
function showCountdown(seconds) {
    const countdownContainer = document.getElementById('countdownContainer');
    const countdown = document.getElementById('countdown');
    const loginButton = document.getElementById('loginButton');

    loginButton.disabled = true;
    countdownContainer.style.display = 'block';

    const interval = setInterval(() => {
        seconds -= 1;
        countdown.textContent = seconds;

        if (seconds <= 0) {
            clearInterval(interval);
            countdownContainer.style.display = 'none';
            loginButton.disabled = false; 
            lockoutEndTime = null;
            failedAttempts = 0; 
        }
    }, 1000);

}
