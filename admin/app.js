const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const userRoutes = require('./routes/users');
const surveyRoutes = require('./routes/survey');
const path = require('path');
const respondentsRoute = require('./routes/users');
const addSurveyRoute = require('./routes/surveyadd')
const bscsRoute = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'views'))); // Serve static files
// Serve the profile images from a dedicated 'profile-images' folder
app.use('/res/profile-images', express.static(path.join(__dirname, 'res/profile-images')));
// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Register routes
app.use('/api', userRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/users', respondentsRoute);
app.use('/api/users', bscsRoute);
app.use('/api/surveyadd', addSurveyRoute);

// Route Login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/html/login.html'));
});


// HTML routes
app.get('/html/adminhome', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/html/adminhome.html'));
});

app.get('/studenthome', (req, res) => {
    res.sendFile(path.join(__dirname, 'student/php/home.php'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
