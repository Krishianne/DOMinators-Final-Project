const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('./db');


// Route to handle survey submission
router.post('/surveyadd/questions', async (req, res) => {
    const { course, semester, ay, questions } = req.body;
    const userId = req.userId;



    if (!userId || !course || !semester || !ay || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Invalid input data.' });
    }


    try {

        const surveyId = uuidv4();



        await db.query(
            `INSERT INTO surveys (survey_id, user_id, course, semester, ay) VALUES (?, ?, ?, ?, ?)`,
            [surveyId, userId, course, semester, ay]
        );


        // Insert questions
        for (const question of questions) {
            const questionId = uuidv4();
            const { question_text, question_type, category, options } = question;


            // Insert question data
            await db.query(
                `INSERT INTO questions (question_id, survey_id, category, question_text, question_type) VALUES (?, ?, ?, ?, ?)`,
                [questionId, surveyId, category, question_text, question_type]
            );


            // Insert options based on question type
            if (question_type === 'Rating' && options) {
                const optionValues = [options.rate1, options.rate2, options.rate3, options.rate4, options.rate5];
                await db.query(
                    `INSERT INTO rate (question_id, 1, 2, 3, 4, 5) VALUES (?, ?, ?, ?, ?, ?)`,
                    [questionId, ...optionValues]
                );
            } else if (question_type === 'Checkbox' && options) {
                const optionValues = [options.choice1, options.choice2, options.choice3, options.choice4, options.choice5];
                await db.query(
                    `INSERT INTO checkbox (question_id, choice1, choice2, choice3, choice4, choice5) VALUES (?, ?, ?, ?, ?, ?)`,
                    [questionId, ...optionValues]
                );
            }
        }


        res.status(201).json({ message: 'Survey added successfully!' });
    } catch (error) {
        console.error('Error adding survey:', error);
        res.status(500).json({ message: 'An error occurred while adding the survey.' });
    }
});


module.exports = router;
