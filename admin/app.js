const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const userRoutes = require('./routes/users');
const surveyRoutes = require('./routes/survey');
const path = require('path');
const respondentsRoute = require('./routes/users');
const addSurveyRoute = require('./routes/surveyadd')


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


function isAuthenticated(req, res, next) {
    console.log('Checking authentication for route:', req.originalUrl);
    if (req.session.userId) {
        console.log('User is authenticated');
        return next();
    } else {
        console.log('User is not authenticated, redirecting to login');
        res.redirect('/');
    }
}

// Register routes
app.use('/api', userRoutes);
app.use('/api/survey', isAuthenticated, surveyRoutes);
app.use('/api/users', isAuthenticated, respondentsRoute);
app.use('/api/surveyadd', isAuthenticated, addSurveyRoute);

// Route Login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/html/login.html'));
});

// HTML routes
app.get('/html/adminhome', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views/html/adminhome.html'));
});


app.get('/html/addsurvey', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views/html/addsurvey.html'));
});

app.get('/html/adminresults', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views/html/adminresults.html'));
});

app.get('/html/adminprofile', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views/html/adminprofile.html'));
});

app.get('/html/editsurvey', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views/html/editsurvey.html'));
});

app.get('/html/viewsurvey', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views/html/viewsurvey.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Failed to log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});
