document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('surveyForm').addEventListener('submit', function (e) {
        e.preventDefault();  // Предотвращаем стандартную отправку формы (GET-запрос)
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

        console.log('Отправляем данные:', surveyData);  

      
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
        })
        .catch(error => {
            console.error('Ошибка:', error);  
            document.getElementById('responseMessage').style.display = 'block';
            document.getElementById('responseMessage').textContent = 'Ошибка отправки данных';
        });
    });
});
