const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define Student Schema
const StudentSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  grade: { type: String, required: true },
  subjects: [String],
  submissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  }]
});

const Student = mongoose.model('Student', StudentSchema);

// Get student profile
router.get('/profile', async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.uid })
      .populate('submissions');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit new work
router.post('/submit', async (req, res) => {
  try {
    const { type, content, subject, topic } = req.body;
    
    // Create submission record
    const submission = new Submission({
      studentId: req.user.uid,
      type,
      content,
      subject,
      topic,
      status: 'pending',
      timestamp: new Date()
    });
    
    await submission.save();
    
    // Update student's submissions array
    await Student.findOneAndUpdate(
      { userId: req.user.uid },
      { $push: { submissions: submission._id } }
    );

    // Route to appropriate AI service based on submission type
    let aiResponse;
    switch(type) {
      case 'text':
        aiResponse = await fetch('/api/ai/evaluate/text', {
          method: 'POST',
          body: JSON.stringify({ text: content, subject }),
          headers: { 'Content-Type': 'application/json' }
        });
        break;
      case 'code':
        aiResponse = await fetch('/api/ai/evaluate/code', {
          method: 'POST',
          body: JSON.stringify({ code: content, language: subject }),
          headers: { 'Content-Type': 'application/json' }
        });
        break;
      // Add other submission types here
    }

    const evaluation = await aiResponse.json();
    
    // Update submission with AI evaluation
    submission.evaluation = evaluation;
    submission.status = 'evaluated';
    await submission.save();

    res.status(201).json({
      message: 'Submission successful',
      submission: submission
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get submission history
router.get('/submissions', async (req, res) => {
  try {
    const { subject, status, page = 1, limit = 10 } = req.query;
    
    const query = { studentId: req.user.uid };
    if (subject) query.subject = subject;
    if (status) query.status = status;
    
    const submissions = await Submission.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await Submission.countDocuments(query);
    
    res.json({
      submissions,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get feedback for a specific submission
router.get('/submissions/:id/feedback', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    if (submission.studentId !== req.user.uid) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    res.json(submission.evaluation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request explanation for feedback
router.post('/submissions/:id/explain', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    const explanation = await fetch('/api/ai/explain', {
      method: 'POST',
      body: JSON.stringify({
        evaluation_id: submission.evaluation._id,
        method: req.body.method || 'SHAP'
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await explanation.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;