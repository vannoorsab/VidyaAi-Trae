const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { check, validationResult } = require('express-validator');

// Initialize Firebase Admin
// TODO: Replace with your Firebase service account credentials
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Register new user
router.post('/register', [
  check('email').isEmail(),
  check('password').isLength({ min: 6 }),
  check('role').isIn(['student', 'teacher', 'parent'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, role, name } = req.body;
    
    // Create user in Firebase
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Set custom claims based on role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login user
router.post('/login', [
  check('email').isEmail(),
  check('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Note: Actual authentication is handled by Firebase client SDK
  res.status(200).json({ message: 'Login route - handled by Firebase client' });
});

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userRecord = await admin.auth().getUser(req.user.uid);
    res.json(userRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { displayName, phoneNumber } = req.body;
    const userRecord = await admin.auth().updateUser(req.user.uid, {
      displayName,
      phoneNumber
    });
    res.json(userRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;