const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use the provided MongoDB URI
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI environment variable is not set!');
    }
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Updated connection options
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 50 // Maintain up to 50 socket connections
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) { 
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB; 
