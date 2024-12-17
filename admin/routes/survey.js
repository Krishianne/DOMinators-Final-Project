const express = require('express');
const router = express.Router();
const db = require('./db'); // Assuming db.js handles database connections

// Route to get surveys based on userId (POST method)
router.post('/surveycards', async (req, res) => {
    const { userId } = req.body; // Retrieve userId from the request body

    try {
        // Adjust this query according to your database schema
        const surveys = await db.query('SELECT survey_id, course, semester, ay, survey_status FROM survey WHERE user_id = ?', [userId]);

        req.session.surveys = surveys; // Optionally store surveys in session

        if (surveys.length > 0) {
            res.json(surveys); // Return surveys as JSON if they exist
        } else {
            res.json([]); // Return empty array if no surveys are found
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' }); // Handle errors
    }
});

// Backend (Express.js) - Fetch survey details
router.get('/details', async (req, res) => {
    const { survey_id } = req.query;  // Get the survey_id from query parameters

    try {
        // Step 1: Fetch survey details
        const surveyQuery = `
            SELECT survey_id, course, semester, ay, survey_status
            FROM survey
            WHERE survey_id = ?
        `;
        const [survey] = await db.query(surveyQuery, [survey_id]);

        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        // Step 2: Fetch all questions related to the survey
        const questionsQuery = `
            SELECT question_id, category, question_text, question_type
            FROM questions
            WHERE survey_id = ?
        `;
        const questions = await db.query(questionsQuery, [survey_id]);

        // Step 3: Fetch RATE and CHECKBOX options for each question
        for (const question of questions) {
            // Fetch rating options for the question
            const rateQuery = `
                SELECT \`1\`, \`2\`, \`3\`, \`4\`, \`5\`
                FROM rate
                WHERE question_id = ?
            `;
            const [rate] = await db.query(rateQuery, [question.question_id]);
            question.rate = rate || null;

            // Fetch checkbox options for the question
            const checkboxQuery = `
                SELECT choice1, choice2, choice3, choice4, choice5
                FROM checkbox
                WHERE question_id = ?
            `;
            const [checkbox] = await db.query(checkboxQuery, [question.question_id]);
            question.checkbox = checkbox || null;
        }

        // Step 4: Structure the response for the frontend
        const response = {
            survey: {
                survey_id: survey.survey_id,
                course: survey.course,
                semester: survey.semester,
                ay: survey.ay,
                survey_status: survey.survey_status,
            },
            questions,
        };

        res.json(response);  // Send the response
    } catch (error) {
        console.error('Error fetching survey details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Backend (Express.js) - Fetch survey details
router.patch('/editdetails', async (req, res) => {
    const { survey_id } = req.query;  // Get the survey_id from query parameters

    try {
        // Step 1: Fetch survey details
        const surveyQuery = `
            SELECT survey_id, course, semester, ay, survey_status
            FROM survey
            WHERE survey_id = ?
        `;
        const [survey] = await db.query(surveyQuery, [survey_id]);

        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        // Step 2: Fetch all questions related to the survey
        const questionsQuery = `
            SELECT question_id, category, question_text, question_type
            FROM questions
            WHERE survey_id = ?
        `;
        const questions = await db.query(questionsQuery, [survey_id]);

        // Step 3: Fetch RATE and CHECKBOX options for each question
        for (const question of questions) {
            // Fetch rating options for the question
            const rateQuery = `
                SELECT \`1\`, \`2\`, \`3\`, \`4\`, \`5\`
                FROM rate
                WHERE question_id = ?
            `;
            const [rate] = await db.query(rateQuery, [question.question_id]);
            question.rate = rate || null;

            // Fetch checkbox options for the question
            const checkboxQuery = `
                SELECT choice1, choice2, choice3, choice4, choice5
                FROM checkbox
                WHERE question_id = ?
            `;
            const [checkbox] = await db.query(checkboxQuery, [question.question_id]);
            question.checkbox = checkbox || null;
        }

        // Step 4: Structure the response for the frontend
        const response = {
            survey: {
                survey_id: survey.survey_id,
                course: survey.course,
                semester: survey.semester,
                ay: survey.ay,
                survey_status: survey.survey_status,
            },
            questions,
        };

        res.json(response);  // Send the response
    } catch (error) {
        console.error('Error fetching survey details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;
