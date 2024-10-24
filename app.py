from flask import Flask, jsonify, request, send_from_directory
import mysql.connector
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)

app.config['JWT_SECRET_KEY'] = 'super-secret-key'
jwt = JWTManager(app)

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="case4"
)
cursor = db.cursor()

cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(10) DEFAULT 'user'
    )
''')
db.commit()

@app.route('/')
def index():
    return send_from_directory(os.getcwd(), 'index.html')

@app.route('/user_survey.html')
def user_survey():
    return send_from_directory(os.getcwd(), 'user_survey.html')

@app.route('/app.js')
def app_js():
    return send_from_directory(os.getcwd(), 'app.js')

@app.route('/admin_dashboard.html')
def admin_dashboard():
    return send_from_directory(os.getcwd(), 'admin_dashboard.html')

@app.route('/styles.css')
def styles_css():
    return send_from_directory(os.getcwd(), 'styles.css')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.getcwd(), 'favicon.ico')

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    hashed_password = generate_password_hash(password)

    cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed_password))
    db.commit()

    return jsonify({"message": "User registered successfully!"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()

    if user and check_password_hash(user[2], password):
        access_token = create_access_token(identity=user[0])
        return jsonify(access_token=access_token, role=user[3]), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401

def get_user_role_from_db(user_id):
    cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        return None

@app.route('/check_token', methods=['GET'])
@jwt_required()
def check_token():
    current_user_id = get_jwt_identity()
    user_role = get_user_role_from_db(current_user_id)
    
    if user_role:
        return jsonify(role=user_role), 200
    else:
        return jsonify({"error": "User not found"}), 404

@app.route('/get_survey_results', methods=['GET'])
@jwt_required()
def get_survey_results():
    current_user_id = get_jwt_identity()

    cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
    user = cursor.fetchone()
    if user[0] != 'admin':
        return jsonify({"error": "Unauthorized access"}), 403

    cursor.execute("SELECT sports, sport_hours, birthday FROM survey_responses")
    survey_responses = cursor.fetchall()

    sports_count = {}
    sport_hours_count = {'Менее 1 часа': 0, '1-3 часа': 0, 'Более 3 часов': 0}
    age_groups = {'<18': 0, '18-30': 0, '31-45': 0, '>45': 0}

    from datetime import date
    for response in survey_responses:
        sports, sport_hours, birthday = response

        for sport in sports.split(','):
            if sport in sports_count:
                sports_count[sport] += 1
            else:
                sports_count[sport] = 1

        if sport_hours in sport_hours_count:
            sport_hours_count[sport_hours] += 1

        birth_year = birthday.year
        age = date.today().year - birth_year
        if age < 18:
            age_groups['<18'] += 1
        elif age <= 30:
            age_groups['18-30'] += 1
        elif age <= 45:
            age_groups['31-45'] += 1
        else:
            age_groups['>45'] += 1

    return jsonify({
        'sports': sports_count,
        'sportHours': sport_hours_count,
        'ageGroups': age_groups
    })

@app.route('/submit_survey', methods=['POST'])
@jwt_required()
def submit_survey():
    data = request.json
    user_id = get_jwt_identity()

    name = data.get('name')
    sports = data.get('sports')
    sport_hours = data.get('sportHours')
    birthday = data.get('birthday')

    cursor.execute('''
        INSERT INTO survey_responses (user_id, name, sports, sport_hours, birthday)
        VALUES (%s, %s, %s, %s, %s)
    ''', (user_id, name, ','.join(sports), sport_hours, birthday))
    db.commit()

    return jsonify({"message": "Survey submitted successfully!"}), 200

cursor.execute('''
    CREATE TABLE IF NOT EXISTS survey_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        sports TEXT,
        sport_hours VARCHAR(255),
        birthday DATE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
''')
db.commit()

if __name__ == '__main__':
    app.run(debug=True)
