const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Fallback for manual env loading if dotenv fails
if (!process.env.PORT && fs.existsSync(path.resolve(__dirname, '.env'))) {
  const envFile = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8');
  const envLines = envFile.split('\n');
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

console.log('Environment variables loaded:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);

const connectDB = require('./config/database');

if (!process.env.JWT_SECRET) {
  console.log('JWT_SECRET not found in environment, using default for development only');
  process.env.JWT_SECRET = process.env.NODE_ENV === 'production' 
    ? null 
    : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30";
  
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET must be set in production environment!');
    process.exit(1);
  }
}

// Connect to database
connectDB();

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://catering-cl43.vercel.app'] 
    : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: false, limit: '50mb' })); // Limit URL-encoded body size

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/caterer', require('./routes/caterer'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/customer', require('./routes/customer'));
app.use('/api/timeline', require('./routes/timeline'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
