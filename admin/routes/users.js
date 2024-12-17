const express = require('express');
const multer = require('multer');
const path = require('path');
const moment = require('moment');
const db = require('./db'); // Replace with your database connection logic

const router = express.Router();
const fs = require('fs');

// Correct the target directory
const profileImagesDir = path.join(__dirname, '../res/profile-images');

// Ensure the directory exists before saving files
if (!fs.existsSync(profileImagesDir)) {
    fs.mkdirSync(profileImagesDir, { recursive: true });
}

// Use this directory when configuring multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profileImagesDir);
    },
    filename: (req, file, cb) => {
        const dateTime = moment().format('YYYYMMDDHHmmss');
        const firstname = req.body.firstname || 'default';
        const extension = path.extname(file.originalname);
        cb(null, `${dateTime}${firstname}${extension}`);
    }
});

// Initialize multer with custom storage settings
const upload = multer({ storage });

// Update user profile endpoint
router.patch('/update-profile', upload.single('image'), async (req, res) => {
    const { userId, firstname, lastname, email, newPassword } = req.body;
    const image = req.file; // File uploaded by user

    try {
        // Build the SQL update query dynamically
        let query = 'UPDATE users SET ';
        const updates = [];
        const params = [];

        // Update firstname if provided
        if (firstname) {
            updates.push('firstname = ?');
            params.push(firstname);
        }

        // Update lastname if provided
        if (lastname) {
            updates.push('lastname = ?');
            params.push(lastname);
        }

        // Update email if provided
        if (email) {
            updates.push('email = ?');
            params.push(email);
        }

        // Update password if provided
        if (newPassword) {
            updates.push('password = ?');
            params.push(newPassword); // Consider hashing the password for security
        }

        // Update image if provided
        if (image) {
            const imagePath = `../res/profile-images/${image.filename}`; // Relative path to the profile images folder
            updates.push('images = ?');
            params.push(imagePath);
        }

        // If no updates are provided, return a message
        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No changes to update' });
        }

        // Add userId to the query for WHERE condition
        query += updates.join(', ') + ' WHERE user_id = ?';
        params.push(userId);

        // Execute the query with the parameters
        await db.execute(query, params);

        res.json({
            success: true,
            newImagePath: image ? `../res/profile-images/${image.filename}` : null,
            message: 'Profile updated successfully!',
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Express API route to check if the email is unique
router.get('/check-email', async (req, res) => {
    const { email } = req.query;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (result.length > 0) {
            res.json({ isUnique: false }); // Email already exists
        } else {
            res.json({ isUnique: true }); // Email is unique
        }
    } catch (error) {
        console.error('Error checking email uniqueness:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login functionality with rate limiting (Unchanged)
const loginAttempts = {};

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const now = new Date();

    if (!loginAttempts[email]) {
        loginAttempts[email] = { count: 0, lockUntil: null };
    }

    const userLoginData = loginAttempts[email];

    // Check if the user is locked out due to failed login attempts
    if (userLoginData.lockUntil && now < userLoginData.lockUntil) {
        const remainingTime = Math.ceil((userLoginData.lockUntil - now) / 1000);
        return res.status(403).json({ message: `Locked out. Try again in ${remainingTime} seconds.` });
    }

    try {
        const user = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);

        if (user.length > 0) {
            const userType = user[0].user_type; // Assuming user_type is a column in your users table
            const userId = user[0].user_id; // Assuming id is the column for user ID
            const firstname = user[0].firstname;
            const lastname = user[0].lastname;
            const email = user[0].email;
            const password = user[0].password;
            const images = user[0].images;

            // Reset login attempt data after successful login
            userLoginData.count = 0;
            userLoginData.lockUntil = null;

            // Set session data
            req.session.userId = userId;
            req.session.firstname = firstname;
            req.session.lastname = lastname;
            req.session.email = email;
            req.session.userType = userType;
            req.session.password = password;
            req.session.images = images;

            // Redirect based on user type
            if (userType === 'admin') {
                res.json({
                    redirect: '/html/adminhome',
                    userId: userId,
                    firstname: firstname,
                    lastname: lastname,
                    email: email,
                    userType: userType,
                    password: password,
                    images: images,
                });
            } else if (userType === 'student') {
                return res.json({ redirect: '../student/php/home.php', userId });
            } else {
                return res.status(400).json({ message: 'User type not recognized.' });
            }
        } else {
            // Handle failed login attempts
            userLoginData.count += 1;

            if (userLoginData.count >= 3) {
                userLoginData.lockUntil = new Date(now.getTime() + 30 * 1000); // Lock for 30 seconds
                userLoginData.count = 0;
                return res.status(403).json({ message: 'Too many failed attempts. Locked out for 30 seconds.' });
            }

            return res.status(401).json({ message: 'Incorrect email or password' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

router.post('/respondents', async (req, res) => {
    try {
        // Step 1: Get user_ids of students
        const students = await db.query(
            "SELECT DISTINCT user_id FROM users WHERE user_type = 'student'"
        );

        if (students.length === 0) {
            return res.status(404).json({ message: 'No students found.' });
        }

        // Extract user_ids
        const userIds = students.map(student => student.user_id);

        // Step 2: Get class_ids and courses linked to these user_ids
        const classes = await db.query(
            "SELECT DISTINCT class_id, course FROM class WHERE user_id IN (?)",
            [userIds]
        );

        if (classes.length === 0) {
            return res.status(404).json({ message: 'No classes found for the students.' });
        }

        // Step 3: Count the total number of submitted statuses per class_id
        const classIds = classes.map(cls => cls.class_id);
        const statusCounts = await db.query(
            "SELECT class_id, COUNT(*) AS submitted_count FROM status WHERE answer_status = 'submitted' AND class_id IN (?) GROUP BY class_id",
            [classIds]
        );

        // Step 4: Map the results to their corresponding courses
        const results = classes.map(cls => {
            const submittedCount = statusCounts.find(status => status.class_id === cls.class_id)?.submitted_count || 0;
            return {
                class_id: cls.class_id,
                course: cls.course,
                submitted_count: submittedCount,
            };
        });

        // Step 5: Return the results
        res.json({ data: results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

router.post('/respondents', async (req, res) => {
    try {
        const course = req.body.course;  // Get the course from the request
        const sqlQuery = `
            SELECT user_id, firstname, lastname, email 
            FROM USERS
            JOIN CLASS ON USERS.user_id = CLASS.user_id
            WHERE CLASS.course = $1
        `;

        const result = await db.query(sqlQuery, [course]);

        const data = result.rows;
        res.json({ data });
    } catch (err) {
        console.error('Error fetching respondents data:', err);
        res.status(500).send('Internal server error');
    }
});

router.post('/majorminor', async (req, res) => {
    try {
        const { userId } = req.body; // Get userId from the request

        // Step 1: Get all surveys associated with this user
        const surveys = await db.query(
            "SELECT survey_id FROM survey WHERE user_id = ?",
            [userId]
        );

        if (surveys.length === 0) {
            return res.status(404).json({ message: 'No surveys found for this user.' });
        }

        // Step 2: Get all questions associated with these surveys
        const surveyIds = surveys.map(survey => survey.survey_id);
        const questions = await db.query(
            "SELECT question_id, question_type FROM questions WHERE survey_id IN (?)",
            [surveyIds]
        );

        if (questions.length === 0) {
            return res.status(404).json({ message: 'No questions found for these surveys.' });
        }

        // Step 3: Get the responses for each question
        const questionIds = questions.map(question => question.question_id);
        const ratingResponses = await db.query(
            "SELECT question_id, AVG(rating) AS average_rating FROM rating_response WHERE question_id IN (?) GROUP BY question_id",
            [questionIds]
        );

        const essayResponses = await db.query(
            "SELECT question_id, COUNT(*) AS essay_count FROM essay_response WHERE question_id IN (?) GROUP BY question_id",
            [questionIds]
        );

        const checkboxResponses = await db.query(
            "SELECT question_id, COUNT(*) AS checkbox_count FROM checkbox_response WHERE question_id IN (?) GROUP BY question_id",
            [questionIds]
        );

        // Step 4: Organize responses by question type (Major vs Minor)
        const majorData = [];
        const minorData = [];

        questions.forEach(question => {
            const { question_id, question_type } = question;
            const rating = ratingResponses.find(res => res.question_id === question_id);
            const essay = essayResponses.find(res => res.question_id === question_id);
            const checkbox = checkboxResponses.find(res => res.question_id === question_id);

            const data = {
                question_id,
                rating: rating ? rating.average_rating : 0,
                essay_count: essay ? essay.essay_count : 0,
                checkbox_count: checkbox ? checkbox.checkbox_count : 0,
            };

            if (question_type === 'Major') {
                majorData.push(data);
            } else {
                minorData.push(data);
            }
        });

        // Step 5: Return data for both Major and Minor questions
        res.json({
            majorData,
            minorData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;
