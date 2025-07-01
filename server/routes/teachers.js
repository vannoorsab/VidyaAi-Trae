const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define Teacher Schema
const TeacherSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  subjects: [String],
  classes: [String],
  reviewedSubmissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  }]
});

const Teacher = mongoose.model('Teacher', TeacherSchema);

// Get pending submissions for review
router.get('/pending-submissions', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.uid });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const { subject, class: className, page = 1, limit = 10 } = req.query;
    
    const query = {
      status: 'evaluated',
      subject: { $in: teacher.subjects },
      class: { $in: teacher.classes }
    };
    if (subject) query.subject = subject;
    if (className) query.class = className;

    const submissions = await Submission.find(query)
      .populate('studentId', 'name class')
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

// Review and override AI evaluation
router.put('/submissions/:id/review', async (req, res) => {
  try {
    const { score, feedback, status } = req.body;
    const submission = await Submission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const teacher = await Teacher.findOne({ userId: req.user.uid });
    if (!teacher.subjects.includes(submission.subject)) {
      return res.status(403).json({ message: 'Unauthorized to review this submission' });
    }

    // Update submission with teacher's review
    submission.teacherReview = {
      score: score || submission.evaluation.score,
      feedback: feedback || submission.evaluation.feedback,
      reviewedBy: req.user.uid,
      reviewedAt: new Date()
    };
    submission.status = status || 'reviewed';
    await submission.save();

    // Add to teacher's reviewed submissions
    await Teacher.findOneAndUpdate(
      { userId: req.user.uid },
      { $addToSet: { reviewedSubmissions: submission._id } }
    );

    // If feedback is modified, generate audio version
    if (feedback) {
      const audioResponse = await fetch('/api/ai/text-to-speech', {
        method: 'POST',
        body: JSON.stringify({
          text: feedback,
          language: 'en-US'
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const audioFeedback = await audioResponse.json();
      submission.audioFeedback = audioFeedback.audio_url;
      await submission.save();
    }

    res.json({
      message: 'Review submitted successfully',
      submission: submission
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get review statistics
router.get('/statistics', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.uid });
    const { startDate, endDate } = req.query;

    const query = {
      'teacherReview.reviewedBy': req.user.uid,
      subject: { $in: teacher.subjects }
    };

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Submission.aggregate([
      { $match: query },
      { $group: {
        _id: '$subject',
        totalReviewed: { $sum: 1 },
        averageScore: { $avg: '$teacherReview.score' },
        aiAgreementRate: {
          $avg: {
            $cond: [
              { $eq: ['$evaluation.score', '$teacherReview.score'] },
              1,
              0
            ]
          }
        }
      }}
    ]);

    res.json({
      reviewStats: stats,
      totalSubmissions: await Submission.countDocuments(query)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk approve AI evaluations
router.post('/bulk-approve', async (req, res) => {
  try {
    const { submissionIds } = req.body;
    const teacher = await Teacher.findOne({ userId: req.user.uid });

    const submissions = await Submission.find({
      _id: { $in: submissionIds },
      subject: { $in: teacher.subjects },
      status: 'evaluated'
    });

    const updatePromises = submissions.map(submission => {
      submission.status = 'approved';
      submission.teacherReview = {
        score: submission.evaluation.score,
        feedback: submission.evaluation.feedback,
        reviewedBy: req.user.uid,
        reviewedAt: new Date()
      };
      return submission.save();
    });

    await Promise.all(updatePromises);

    // Update teacher's reviewed submissions
    await Teacher.findOneAndUpdate(
      { userId: req.user.uid },
      { $addToSet: { reviewedSubmissions: { $each: submissionIds } } }
    );

    res.json({
      message: 'Bulk approval successful',
      approvedCount: submissions.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;