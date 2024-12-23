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

router.post('/surveycards', async (req, res) => {
    const { userId } = req.body; 

    try {
        const surveys = await db.query('SELECT survey_id, course, semester, ay, survey_status FROM survey WHERE user_id = ?', [userId]);

        req.session.surveys = surveys; 

        if (surveys.length > 0) {
            res.json(surveys); 
        } else {
            res.json([]); 
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' }); // Handle errors
    }
});

router.get('/details', async (req, res) => {
    const { survey_id } = req.query;  
    console.log(survey_id);
    
    try {
        const surveyQuery = `
            SELECT survey_id, course, semester, ay, survey_status
            FROM survey
            WHERE survey_id = ?
        `;
        const [survey] = await db.query(surveyQuery, [survey_id]);

        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        const questionsQuery = `
            SELECT question_id, category, question_text, question_type
            FROM questions
            WHERE survey_id = ?
        `;
        const questions = await db.query(questionsQuery, [survey_id]);

        for (const question of questions) {
            const rateQuery = `
                SELECT \`1\`, \`2\`, \`3\`, \`4\`, \`5\`
                FROM rate
                WHERE question_id = ?
            `;
            const [rate] = await db.query(rateQuery, [question.question_id]);
            question.rate = rate || null;

            const checkboxQuery = `
                SELECT choice1, choice2, choice3, choice4, choice5
                FROM checkbox
                WHERE question_id = ?
            `;
            const [checkbox] = await db.query(checkboxQuery, [question.question_id]);
            question.checkbox = checkbox || null;
        }

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

        res.json(response);  
    } catch (error) {
        console.error('Error fetching survey details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.patch('/editdetails', async (req, res) => {
    const { survey_id } = req.query; 
    console.log('Survey ID to edit:', surveyId);

    try {
        const surveyQuery = `
            SELECT survey_id, course, semester, ay, survey_status
            FROM survey
            WHERE survey_id = ?
        `;
        const [survey] = await db.query(surveyQuery, [survey_id]);

        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        const questionsQuery = `
            SELECT question_id, category, question_text, question_type
            FROM questions
            WHERE survey_id = ?
        `;
        const questions = await db.query(questionsQuery, [survey_id]);

        for (const question of questions) {
            const rateQuery = `
                SELECT \`1\`, \`2\`, \`3\`, \`4\`, \`5\`
                FROM rate
                WHERE question_id = ?
            `;
            const [rate] = await db.query(rateQuery, [question.question_id]);
            question.rate = rate || null;

            const checkboxQuery = `
                SELECT choice1, choice2, choice3, choice4, choice5
                FROM checkbox
                WHERE question_id = ?
            `;
            const [checkbox] = await db.query(checkboxQuery, [question.question_id]);
            question.checkbox = checkbox || null;
        }

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

        res.json(response);  
    } catch (error) {
        console.error('Error fetching survey details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/getresponses', async (req, res) => {
    const { survey_id } = req.body;
    try {
        const questionIdsResult = await db.query(`SELECT question_id FROM questions WHERE survey_id = ?`, [survey_id]);
        const questionIds = questionIdsResult.map(row => row.question_id);

        // If no questions in the survey, proceed to the edit page
        if (questionIds.length === 0) {
            return res.status(200).json({ message: 'Survey has no questions, but can still be edited.' });
        }

        if (!survey_id) {
            console.error('Survey ID is missing');
            return res.status(400).json({ message: 'Invalid input data.' });
        }

        const responseCheckQueries = [
            `SELECT COUNT(*) AS count FROM rating_response WHERE question_id IN (?)`,
            `SELECT COUNT(*) AS count FROM checkbox_response WHERE question_id IN (?)`,
            `SELECT COUNT(*) AS count FROM essay_response WHERE question_id IN (?)`
        ];

        for (const query of responseCheckQueries) {
            const responseCheckResult = await db.query(query, [questionIds]);
            if (responseCheckResult[0].count > 0) {
                return res.status(400).json({ 
                    message: 'This survey cannot be edited because it has been answered by students.' 
                });
            }
        }

        res.status(200).json({ message: 'Survey can be edited.' });  // If no responses, allow editing
    } catch (error) {
        console.error('Error fetching responses:', error);
        res.status(500).json({ message: 'Error fetching responses' });
    }
});

router.post('/save', async (req, res) => {
    const { survey_id, questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Invalid input data.' });
    }

    try {
        for (const question of questions) {
            let { question_id, question_text, question_type, category, options } = question;

            if (question_id) {
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
                question_id = await generateIncrementalId('questions', 'Q', 'question_id');
                await db.query(
                    `INSERT INTO questions (question_id, survey_id, category, question_text, question_type) VALUES (?, ?, ?, ?, ?)`,
                    [question_id, survey_id, category, question_text, question_type]
                );

                if (question_type === 'rating' && options) {
                    const rateId = await generateIncrementalId('rate', 'R', 'rate_id');
                    await db.query(
                        `INSERT INTO rate (rate_id, question_id, \`1\`, \`2\`, \`3\`, \`4\`, \`5\`) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [rateId, question_id, options[0], options[1], options[2], options[3], options[4]]
                    );
                } else if (question_type === 'checkbox' && options) {
                    const checkboxId = await generateIncrementalId('checkbox', 'B', 'checkbox_id');
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

router.delete('/deletesurvey', async (req, res) => {
    const { surveyId } = req.body;
    console.log('Survey ID to delete:', surveyId);

    if (!surveyId) {
        return res.status(400).json({ message: 'Invalid input data. Survey ID is required.' });
    }

    try {
        const questionIdsResult = await db.query(`SELECT question_id FROM questions WHERE survey_id = ?`, [surveyId]);
        const questionIds = questionIdsResult.map(row => row.question_id);

        if (!surveyId) {
            console.error('Survey ID is missing');
            return res.status(400).json({ message: 'Invalid input data.' });
        }

        const responseCheckQueries = [
            `SELECT COUNT(*) AS count FROM rating_response WHERE question_id IN (?)`,
            `SELECT COUNT(*) AS count FROM checkbox_response WHERE question_id IN (?)`,
            `SELECT COUNT(*) AS count FROM essay_response WHERE question_id IN (?)`
        ];

        for (const query of responseCheckQueries) {
            const responseCheckResult = await db.query(query, [questionIds]);
            if (responseCheckResult[0].count > 0) {
                return res.status(400).json({ 
                    message: 'This survey cannot be deleted because it has been answered by students.' 
                });
            }
        }

        await db.query(`DELETE FROM rate WHERE question_id IN (?)`, [questionIds]);
        await db.query(`DELETE FROM checkbox WHERE question_id IN (?)`, [questionIds]);
        await db.query(`DELETE FROM questions WHERE survey_id = ?`, [surveyId]);
        await db.query(`DELETE FROM survey WHERE survey_id = ?`, [surveyId]);

        return res.status(200).json({ message: 'Survey and related data deleted successfully!' });
    } catch (error) {
        console.error('Error deleting survey:', error);
        return res.status(500).json({ message: 'An error occurred while deleting the survey.' });
    }
});


router.put('/publishsurvey', async (req, res) => {
    const { surveyId } = req.body; 
    console.log('Survey ID to update:', surveyId);

    if (!surveyId) {
        return res.status(400).json({ message: 'Invalid input data. Survey ID is required.' });
    }

    try {
        await db.query(
            `UPDATE survey SET survey_status = 'published' WHERE survey_id = ?`, 
            [surveyId]
        );
    /*try {
        const surveyStatusUpdate = `UPDATE survey SET survey_status = 'published' WHERE survey_id = ?`;
        await db.query(surveyStatusUpdate, [surveyId]);*/

        return res.status(200).json({ message: 'Survey status updated to "published" successfully!' });
    } catch (error) {
        console.error('Error updating survey status:', error);
        return res.status(500).json({ message: 'An error occurred while updating the survey status.' });
    }
});

router.put('/unpublishsurvey', async (req, res) => {
    const { surveyId } = req.body; 
    console.log('Survey ID to update:', surveyId);

    if (!surveyId) {
        return res.status(400).json({ message: 'Invalid input data. Survey ID is required.' });
    }

    try {
        await db.query(
            `UPDATE survey SET survey_status = 'unpublished' WHERE survey_id = ?`, 
            [surveyId]
        );

        return res.status(200).json({ message: 'Survey status updated to "unpublished" successfully!' });
    } catch (error) {
        console.error('Error updating survey status:', error);
        return res.status(500).json({ message: 'An error occurred while updating the survey status.' });
    }
});

router.put('/archivesurvey', async (req, res) => {
    const { surveyId } = req.body; 
    console.log('Survey ID to update:', surveyId);

    if (!surveyId) {
        return res.status(400).json({ message: 'Invalid input data. Survey ID is required.' });
    }

    try {
        await db.query(
            `UPDATE survey SET survey_status = 'archived' WHERE survey_id = ?`, 
            [surveyId]
        );

        return res.status(200).json({ message: 'Survey status updated to "unpublished" successfully!' });
    } catch (error) {
        console.error('Error updating survey status:', error);
        return res.status(500).json({ message: 'An error occurred while updating the survey status.' });
    }
});

router.put('/unarchivesurvey', async (req, res) => {
    const { surveyId } = req.body; 
    console.log('Survey ID to update:', surveyId);

    if (!surveyId) {
        return res.status(400).json({ message: 'Invalid input data. Survey ID is required.' });
    }

    try {
        await db.query(
            `UPDATE survey SET survey_status = 'unpublished' WHERE survey_id = ?`, 
            [surveyId]
        );

        return res.status(200).json({ message: 'Survey status updated to "unpublished" successfully!' });
    } catch (error) {
        console.error('Error updating survey status:', error);
        return res.status(500).json({ message: 'An error occurred while updating the survey status.' });
    }
});

router.delete('/deleteQuestion', async (req, res) => {
    console.log(req.body);
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
        res.status(500).json({ message: 'This question cannot be deleted because it has been answered by respondents.' });
    }
});

module.exports = router;
