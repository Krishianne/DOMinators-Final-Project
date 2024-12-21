const express = require('express');
const multer = require('multer');
const path = require('path');
const moment = require('moment');
const db = require('./db'); 

const router = express.Router();
const fs = require('fs');

const profileImagesDir = path.join(__dirname, '../res/profile-images');

if (!fs.existsSync(profileImagesDir)) {
    fs.mkdirSync(profileImagesDir, { recursive: true });
}

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

const upload = multer({ storage });

router.patch('/update-profile', upload.single('image'), async (req, res) => {
    const { userId, firstname, lastname, email, newPassword } = req.body;
    const image = req.file; 

    try {
        let query = 'UPDATE users SET ';
        const updates = [];
        const params = [];

        if (firstname) {
            updates.push('firstname = ?');
            params.push(firstname);
        }

        if (lastname) {
            updates.push('lastname = ?');
            params.push(lastname);
        }

        if (email) {
            updates.push('email = ?');
            params.push(email);
        }

        if (newPassword) {
            updates.push('password = ?');
            params.push(newPassword); 
        }

        if (image) {
            const imagePath = `../res/profile-images/${image.filename}`; 
            updates.push('images = ?');
            params.push(imagePath);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No changes to update' });
        }

        query += updates.join(', ') + ' WHERE user_id = ?';
        params.push(userId);

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

router.get('/check-email', async (req, res) => {
    const { email } = req.query;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (result.length > 0) {
            res.json({ isUnique: false }); 
        } else {
            res.json({ isUnique: true });
        }
    } catch (error) {
        console.error('Error checking email uniqueness:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

const loginAttempts = {};

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const now = new Date();

    if (!loginAttempts[email]) {
        loginAttempts[email] = { count: 0, lockUntil: null };
    }

    const userLoginData = loginAttempts[email];

    if (userLoginData.lockUntil && now < userLoginData.lockUntil) {
        const remainingTime = Math.ceil((userLoginData.lockUntil - now) / 1000);
        return res.status(403).json({ message: `Locked out. Try again in ${remainingTime} seconds.` });
    }

    try {
        const user = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);

        if (user.length > 0) {
            const userType = user[0].user_type; 
            const userId = user[0].user_id;
            const firstname = user[0].firstname;
            const lastname = user[0].lastname;
            const email = user[0].email;
            const password = user[0].password;
            const images = user[0].images;

            userLoginData.count = 0;
            userLoginData.lockUntil = null;

            req.session.userId = userId;
            req.session.firstname = firstname;
            req.session.lastname = lastname;
            req.session.email = email;
            req.session.userType = userType;
            req.session.password = password;
            req.session.images = images;

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
    const { userId } = req.body;

    try {
        const adminUsers = await db.query(
            "SELECT user_id, user_type FROM users WHERE user_id = ? AND user_type = 'admin'",
            [userId]
        );
    
        if (adminUsers.length === 0) {
            return res.status(404).json({ message: 'No admin users found or user is not an admin.' });
        }
    
        const adminUserId = adminUsers[0].user_id;
        console.log('Verified Admin User ID:', adminUserId);
    
        const surveyRecords = await db.query(
            "SELECT DISTINCT course FROM survey WHERE user_id = ?",
            [adminUserId]
        );
    
        if (surveyRecords.length === 0) {
            return res.status(404).json({ message: 'No courses found for the admin in the survey table.' });
        }
    
        const courses = surveyRecords.map(record => record.course);
        console.log('Courses associated with the admin:', courses);
    
        const userCounts = await db.query(
            `
            SELECT course, COUNT(DISTINCT user_id) AS total_users
            FROM class
            WHERE course IN (?)
            GROUP BY course
            `,
            [courses]
        );
    
        if (userCounts.length === 0) {
            return res.status(404).json({ message: 'No user data found for the admin\'s courses in the class table.' });
        }
    
        console.log('Total users per course:', userCounts);
    
        const totalUsers = userCounts.reduce((sum, record) => sum + record.total_users, 0);
        console.log('Total users across all courses:', totalUsers);
    
        res.json({
            admin_user_id: adminUserId,
            user_counts: userCounts,
            total_users: totalUsers
        });
    } catch (error) {
        console.error('Error calculating total users:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }  
});

router.post('/results'), async (req, res) => {
    const { userId } = req.body; 
};
    
router.post('/majorminor', async (req, res) => {
    try {
        const { userId } = req.body; 

        const surveys = await db.query(
            "SELECT survey_id FROM survey WHERE user_id = ?",
            [userId]
        );

        if (surveys.length === 0) {
            return res.status(404).json({ message: 'No surveys found for this user.' });
        }

        const surveyIds = surveys.map(survey => survey.survey_id);
        const questions = await db.query(
            "SELECT question_id, question_type FROM questions WHERE survey_id IN (?)",
            [surveyIds]
        );

        if (questions.length === 0) {
            return res.status(404).json({ message: 'No questions found for these surveys.' });
        }

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
