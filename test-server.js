const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Simple test route to verify the path is working
app.post('/api/v1/auth/login', (req, res) => {
  res.json({ message: 'Login route is working!' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log('✅ Test server running on http://localhost:' + PORT);
  console.log('Testing route: POST /api/v1/auth/login');
});