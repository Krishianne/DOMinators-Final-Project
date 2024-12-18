const express = require('express');
const router = express.Router();
const db = require('./db');

async function generateIncrementalId(table, prefix, columnName) {
    const query = `
        SELECT ${columnName} 
        FROM ${table} 
        WHERE ${columnName} LIKE '${prefix}%' 
        ORDER BY CAST(SUBSTRING(${columnName}, LENGTH('${prefix}') + 1) AS UNSIGNED) DESC 
        LIMIT 1;
    `;

    const result = await db.query(query);
    const lastId = result[0]?.[columnName] || `${prefix}0`;
    const lastNumber = parseInt(lastId.replace(prefix, ''), 10) || 0;
    const nextNumber = lastNumber + 1;

    return `${prefix}${nextNumber}`;
}

// Route to handle survey submission
router.post('/questions', async (req, res) => {
    const { userId, course, semester, ay, questions } = req.body;

    if (!userId || !course || !semester || !ay || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Invalid input data.' });
    }

    try {
        // Generate new survey ID based on the highest existing ID, ensuring uniqueness
        const surveyId = await generateIncrementalId('survey', 'S', 'survey_id');

        // Insert survey data
        await db.query(
            `INSERT INTO survey (survey_id, user_id, course, semester, ay, survey_status) VALUES (?, ?, ?, ?, ?, ?)`,
            [surveyId, userId, course, semester, ay, 'unpublished']
        );

        // Insert questions
        for (const question of questions) {
            const questionId = await generateIncrementalId('questions', 'Q', 'question_id');
            const { question_text, question_type, category, options } = question;

            // Insert question data
            await db.query(
                `INSERT INTO questions (question_id, survey_id, category, question_text, question_type) VALUES (?, ?, ?, ?, ?)`,
                [questionId, surveyId, category, question_text, question_type]
            );

            // Insert options based on question type
            if (question_type.toLowerCase() === 'rating' && options) {
                const rateId = await generateIncrementalId('rate', 'R', 'rate_id');
                const optionValues = [
                    options.rate1 || '',
                    options.rate2 || '',
                    options.rate3 || '',
                    options.rate4 || '',
                    options.rate5 || '',
                ];
                await db.query(
                    `INSERT INTO rate (rate_id, question_id, \`1\`, \`2\`, \`3\`, \`4\`, \`5\`) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [rateId, questionId, ...optionValues]
                );
            } else if (question_type.toLowerCase() === 'checkbox' && options) {
                const checkboxId = await generateIncrementalId('checkbox', 'B', 'checkbox_id');
                const optionValues = [
                    options.choice1 || '',
                    options.choice2 || '',
                    options.choice3 || '',
                    options.choice4 || '',
                    options.choice5 || '',
                ];
                await db.query(
                    `INSERT INTO checkbox (checkbox_id, question_id, choice1, choice2, choice3, choice4, choice5) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [checkboxId, questionId, ...optionValues]
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
