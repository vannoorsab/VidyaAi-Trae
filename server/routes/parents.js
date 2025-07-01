const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define Parent Schema
const ParentSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  children: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    relation: String
  }],
  preferredLanguage: {
    type: String,
    enum: ['english', 'tamil', 'hindi', 'telugu'],
    default: 'english'
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    audioSummaries: { type: Boolean, default: true }
  }
});

const Parent = mongoose.model('Parent', ParentSchema);

// Get children's progress summary
router.get('/children/progress', async (req, res) => {
  try {
    const parent = await Parent.findOne({ userId: req.user.uid })
      .populate('children.studentId');
    
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    const childrenProgress = await Promise.all(parent.children.map(async (child) => {
      const recentSubmissions = await Submission.find({
        studentId: child.studentId._id,
        status: { $in: ['reviewed', 'approved'] }
      })
      .sort({ timestamp: -1 })
      .limit(5);

      const averageScore = recentSubmissions.reduce(
        (acc, sub) => acc + (sub.teacherReview?.score || sub.evaluation.score), 0
      ) / (recentSubmissions.length || 1);

      return {
        studentName: child.studentId.name,
        studentId: child.studentId._id,
        relation: child.relation,
        recentSubmissions,
        averageScore,
        subjects: [...new Set(recentSubmissions.map(sub => sub.subject))]
      };
    }));

    res.json(childrenProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get detailed feedback for a specific submission
router.get('/feedback/:submissionId', async (req, res) => {
  try {
    const parent = await Parent.findOne({ userId: req.user.uid });
    const submission = await Submission.findById(req.params.submissionId)
      .populate('studentId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify parent has access to this student's information
    const hasAccess = parent.children.some(child => 
      child.studentId.equals(submission.studentId._id)
    );

    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Translate feedback if needed
    let feedback = submission.teacherReview?.feedback || submission.evaluation.feedback;
    if (parent.preferredLanguage !== 'english') {
      const translationResponse = await fetch('/api/ai/translate', {
        method: 'POST',
        body: JSON.stringify({
          text: feedback,
          targetLanguage: parent.preferredLanguage
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const translation = await translationResponse.json();
      feedback = translation.translatedText;
    }

    // Generate audio version if needed
    let audioUrl = submission.audioFeedback;
    if (!audioUrl && parent.notificationPreferences.audioSummaries) {
      const audioResponse = await fetch('/api/ai/text-to-speech', {
        method: 'POST',
        body: JSON.stringify({
          text: feedback,
          language: parent.preferredLanguage
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const audioResult = await audioResponse.json();
      audioUrl = audioResult.audio_url;
    }

    res.json({
      submission: {
        ...submission.toObject(),
        translatedFeedback: feedback,
        audioFeedback: audioUrl
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update language and notification preferences
router.put('/preferences', async (req, res) => {
  try {
    const { preferredLanguage, notificationPreferences } = req.body;
    
    const parent = await Parent.findOneAndUpdate(
      { userId: req.user.uid },
      { 
        $set: { 
          preferredLanguage,
          notificationPreferences: {
            ...notificationPreferences
          }
        }
      },
      { new: true }
    );

    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    res.json(parent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get weekly summary report
router.get('/weekly-summary', async (req, res) => {
  try {
    const parent = await Parent.findOne({ userId: req.user.uid });
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const summaries = await Promise.all(parent.children.map(async (child) => {
      const weeklySubmissions = await Submission.find({
        studentId: child.studentId,
        timestamp: { $gte: oneWeekAgo },
        status: { $in: ['reviewed', 'approved'] }
      }).sort({ timestamp: -1 });

      const subjectPerformance = weeklySubmissions.reduce((acc, sub) => {
        const score = sub.teacherReview?.score || sub.evaluation.score;
        if (!acc[sub.subject]) {
          acc[sub.subject] = { total: 0, count: 0 };
        }
        acc[sub.subject].total += score;
        acc[sub.subject].count += 1;
        return acc;
      }, {});

      // Calculate averages per subject
      Object.keys(subjectPerformance).forEach(subject => {
        subjectPerformance[subject].average = 
          subjectPerformance[subject].total / subjectPerformance[subject].count;
      });

      return {
        studentName: child.studentId.name,
        submissionsCount: weeklySubmissions.length,
        subjectPerformance,
        improvement: calculateImprovement(weeklySubmissions)
      };
    }));

    // Generate summary text
    const summaryText = generateSummaryText(summaries);

    // Translate if needed
    let translatedSummary = summaryText;
    if (parent.preferredLanguage !== 'english') {
      const translationResponse = await fetch('/api/ai/translate', {
        method: 'POST',
        body: JSON.stringify({
          text: summaryText,
          targetLanguage: parent.preferredLanguage
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const translation = await translationResponse.json();
      translatedSummary = translation.translatedText;
    }

    // Generate audio version if needed
    let audioUrl;
    if (parent.notificationPreferences.audioSummaries) {
      const audioResponse = await fetch('/api/ai/text-to-speech', {
        method: 'POST',
        body: JSON.stringify({
          text: translatedSummary,
          language: parent.preferredLanguage
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const audioResult = await audioResponse.json();
      audioUrl = audioResult.audio_url;
    }

    res.json({
      summaries,
      textSummary: translatedSummary,
      audioSummary: audioUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to calculate improvement
function calculateImprovement(submissions) {
  if (submissions.length < 2) return 0;
  
  const recent = submissions.slice(0, Math.ceil(submissions.length / 2));
  const previous = submissions.slice(Math.ceil(submissions.length / 2));
  
  const recentAvg = recent.reduce((acc, sub) => 
    acc + (sub.teacherReview?.score || sub.evaluation.score), 0) / recent.length;
  
  const previousAvg = previous.reduce((acc, sub) => 
    acc + (sub.teacherReview?.score || sub.evaluation.score), 0) / previous.length;
  
  return ((recentAvg - previousAvg) / previousAvg) * 100;
}

// Helper function to generate summary text
function generateSummaryText(summaries) {
  return summaries.map(summary => {
    const improvements = summary.improvement > 0 ? 'improved' : 'maintained';
    return `${summary.studentName} has ${improvements} their performance this week ` +
           `with ${summary.submissionsCount} submissions. ` +
           Object.entries(summary.subjectPerformance)
             .map(([subject, perf]) => 
               `${subject}: ${perf.average.toFixed(1)}% average`)
             .join('. ');
  }).join('\n\n');
}

module.exports = router;