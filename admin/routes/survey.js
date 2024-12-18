const express = require('express');
const router = express.Router();
const db = require('./db'); // Assuming db.js handles database connections
const { v4: uuidv4 } = require('uuid');

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

router.post('/save', async (req, res) => {
    const { survey_id, questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Invalid input data.' });
    }

    try {
        // Process each question
        for (const question of questions) {
            let { question_id, question_text, question_type, category, options } = question;

            if (question_id) {
                // Update existing question
                await db.query(
                    `UPDATE questions SET question_text = ?, question_type = ?, category = ? WHERE question_id = ? AND survey_id = ?`,
                    [question_text, question_type, category, question_id, survey_id]
                );

                if (question_type === 'rating' && options) {
                    await db.query(
                        `UPDATE rate SET \`1\` = ?, \`2\` = ?, \`3\` = ?, \`4\` = ?, \`5\` = ? WHERE question_id = ?`,
                        [options[0], options[1], options[2], options[3], options[4], question_id]
                    );
                } else if (question_type === 'checkbox' && options) {
                    await db.query(
                        `UPDATE checkbox SET choice1 = ?, choice2 = ?, choice3 = ?, choice4 = ?, choice5 = ? WHERE question_id = ?`,
                        [options[0], options[1], options[2], options[3], options[4], question_id]
                    );
                }
            } else {
                question_id = uuidv4();
                await db.query(
                    `INSERT INTO questions (question_id, survey_id, category, question_text, question_type) VALUES (?, ?, ?, ?, ?)`,
                    [question_id, survey_id, category, question_text, question_type]
                );

                if (question_type === 'rating' && options) {
                   const rateId = uuidv4();
                    await db.query(
                        `INSERT INTO rate (rate_id, question_id, \`1\`, \`2\`, \`3\`, \`4\`, \`5\`) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [rateId, question_id, options[0], options[1], options[2], options[3], options[4]]
                    );
                } else if (question_type === 'checkbox' && options) {
                    const checkboxId = uuidv4();
                    await db.query(
                        `INSERT INTO checkbox (checkbox_id, question_id, choice1, choice2, choice3, choice4, choice5) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [checkboxId, question_id, options[0], options[1], options[2], options[3], options[4]]
                    );
                }
            }
        }

        res.status(200).json({ message: 'Survey saved successfully!' });
    } catch (error) {
        console.error('Error saving survey:', error);
        res.status(500).json({ message: 'An error occurred while saving the survey.' });
    }
});

router.delete('/deleteQuestion', async (req, res) => {
    const { question_id } = req.body;

    if (!question_id) {
        return res.status(400).json({ message: 'Invalid input data.' });
    }

    try {
        await db.query(`DELETE FROM questions WHERE question_id = ?`, [question_id]);
        await db.query(`DELETE FROM rate WHERE question_id = ?`, [question_id]);
        await db.query(`DELETE FROM checkbox WHERE question_id = ?`, [question_id]);
        res.status(200).json({ message: 'Question deleted successfully!' });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ message: 'An error occurred while deleting the question.' });
    }
});

module.exports = router;
