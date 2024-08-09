import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Add this to parse JSON bodies

// Serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login2.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login2.html'));
});

// Google OAuth callback route
app.get('/google-login', (req, res) => {
    const token = req.query.token;

    if (token) {
        // Set the token in a cookie
        res.cookie('jwtToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' });
        res.redirect('/onebox');
    } else {
        res.redirect('/');
    }
});

// Serve the onebox page
app.get('/onebox', (req, res) => {
    const token = req.cookies?.jwtToken;

    if (token) {
        res.sendFile(path.join(__dirname, 'views', 'onebox.html'));
    } else {
        res.redirect('/login');
    }
});

// API route to list emails
app.get('/api/onebox/list', async (req, res) => {
    const token = req.cookies?.jwtToken;
    
    if (token) {
        try {
            const response = await fetch('https://hiring.reachinbox.xyz/api/v1/onebox/list', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                res.json(data);
            } else {
                res.status(response.status).json({ error: 'Failed to fetch data from external API' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// API route to get a single email thread
app.get('/api/onebox/:threadId', async (req, res) => {
    const token = req.cookies?.jwtToken;
    const { threadId } = req.params;
     console.log(threadId);
    if (token) {
        try {
            const response = await fetch(`https://hiring.reachinbox.xyz/api/v1/onebox/messages/${threadId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                res.json(data);
            } else {
                res.status(response.status).json({ error: 'Failed to fetch data from external API' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// API route to delete an email thread
app.delete('/api/onebox/:threadId', async (req, res) => {
    const token = req.cookies?.jwtToken;
    const { threadId } = req.params;

    if (token) {
        try {
            const response = await fetch(`https://hiring.reachinbox.xyz/api/v1/onebox/messages/${threadId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                res.status(204).send();
            } else {
                res.status(response.status).json({ error: 'Failed to delete data from external API' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// API route to send a reply
app.post('/api/reply/:threadId', async (req, res) => {
    const token = req.cookies?.jwtToken;
    const { threadId } = req.params;
    const { from, to, subject, body } = req.body;

    if (token) {
        try {
            const response = await fetch(`https://hiring.reachinbox.xyz/api/v1/onebox/reply/${threadId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ from, to, subject, body })
            });

            if (response.ok) {
                const data = await response.json();
                res.json(data);
            } else {
                res.status(response.status).json({ error: 'Failed to send reply to external API' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
