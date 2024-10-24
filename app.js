document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;

    if (token) {
        fetch('/check_token', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.role === 'admin' && currentPage !== '/admin_dashboard.html') {
                window.location.href = '/admin_dashboard.html';
            } else if (data.role === 'user' && currentPage !== '/user_survey.html') {
                window.location.href = '/user_survey.html';
            }
        })
        .catch(error => {
            console.error('Ошибка при проверке токена:', error);
            localStorage.removeItem('token');
        });
    } else if (currentPage === '/user_survey.html' || currentPage === '/admin_dashboard.html') {
        console.log('Токен отсутствует, перенаправляем на страницу входа.');
        window.location.href = '/';
    }

    const loginButton = document.getElementById('showLoginForm');
    const registerButton = document.getElementById('showRegisterForm');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginButton && registerButton && loginForm && registerForm) {
        loginButton.addEventListener('click', function() {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        });

        registerButton.addEventListener('click', function() {
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
        });
    }

    const registerFormElement = document.getElementById('registerForm');
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', function (e) {
            e.preventDefault();

            const newUsername = document.getElementById('newUsername').value;
            const newPassword = document.getElementById('newPassword').value;

            const user = { username: newUsername, password: newPassword };

            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
            })
            .catch(error => console.error('Error:', error));
        });
    }

    const loginFormElement = document.getElementById('loginForm');
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', function (e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const credentials = { username: username, password: password };

            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            })
            .then(response => response.json())
            .then(data => {
                if (data.access_token) {
                    localStorage.setItem('token', data.access_token);
                    if (data.role === 'user') {
                        window.location.href = '/user_survey.html';
                    } else if (data.role === 'admin') {
                        window.location.href = '/admin_dashboard.html';
                    }
                } else {
                    alert('Ошибка входа!');
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }

    const surveyFormElement = document.getElementById('surveyForm');
    if (surveyFormElement) {
        surveyFormElement.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = document.getElementById('question1').value;
            const sports = Array.from(document.querySelectorAll('input[name="sports"]:checked')).map(el => el.value);
            const sportHours = document.querySelector('input[name="sportHours"]:checked').value;
            const birthday = document.getElementById('birthday').value;

            const surveyData = {
                name: name,
                sports: sports,
                sportHours: sportHours,
                birthday: birthday
            };

            fetch('/submit_survey', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(surveyData)
            })
            .then(response => response.json())
            .then(data => {
                console.log('Ответ сервера:', data);
                document.getElementById('responseMessage').style.display = 'block';
                document.getElementById('responseMessage').textContent = data.message;
                document.getElementById('question1').value = '';
                document.querySelectorAll('input[name="sports"]:checked').forEach(el => el.checked = false);
                document.querySelector('input[name="sportHours"]:checked').checked = false;
                document.getElementById('birthday').value = '';
            })
            .catch(error => {
                console.error('Ошибка:', error);
                document.getElementById('responseMessage').style.display = 'block';
                document.getElementById('responseMessage').textContent = 'Ошибка отправки данных';
            });
        });
    }

    if (currentPage === '/admin_dashboard.html') {
        fetch('/get_survey_results', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Полученные данные для анализа:', data);

            const sportsData = data.sports;
            const sportsChart = new Chart(document.getElementById('sportsChart'), {
                type: 'bar',
                data: {
                    labels: Object.keys(sportsData),
                    datasets: [{
                        label: 'Количество людей, выбравших вид спорта',
                        data: Object.values(sportsData),
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            const hoursData = data.sportHours;
            const hoursChart = new Chart(document.getElementById('hoursChart'), {
                type: 'pie',
                data: {
                    labels: Object.keys(hoursData),
                    datasets: [{
                        label: 'Время занятий спортом',
                        data: Object.values(hoursData),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)'
                        ],
                        borderWidth: 1
                    }]
                }
            });

            const ageData = data.ageGroups;
            const ageChart = new Chart(document.getElementById('ageChart'), {
                type: 'bar',
                data: {
                    labels: Object.keys(ageData),
                    datasets: [{
                        label: 'Количество людей по возрастным группам',
                        data: Object.values(ageData),
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Ошибка при получении данных для анализа:', error);
        });
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('token');
            window.location.href = '/';
        });
    }
});
