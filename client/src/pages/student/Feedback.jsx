import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const Feedback = () => {
  const { submissionId } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  // Fetch feedback data
  const { data: feedback, isLoading, error } = useQuery(
    ['feedback', submissionId],
    async () => {
      const response = await axios.get(`/api/students/submissions/${submissionId}/feedback`);
      return response.data;
    }
  );

  // Fetch explanation when requested
  const { data: explanation, refetch: fetchExplanation } = useQuery(
    ['explanation', submissionId],
    async () => {
      const response = await axios.get(`/api/students/submissions/${submissionId}/explain`);
      return response.data;
    },
    { enabled: false }
  );

  // Handle audio playback
  useEffect(() => {
    if (feedback?.audioFeedback) {
      const audioObj = new Audio(feedback.audioFeedback);
      setAudio(audioObj);

      audioObj.onended = () => setIsPlaying(false);

      return () => {
        audioObj.pause();
        audioObj.src = '';
      };
    }
  }, [feedback?.audioFeedback]);

  const toggleAudio = () => {
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Generate new audio feedback in selected language
  const generateAudio = async () => {
    try {
      const response = await axios.post(`/api/students/submissions/${submissionId}/audio`, {
        language: selectedLanguage
      });
      const audioObj = new Audio(response.data.audioUrl);
      setAudio(audioObj);
    } catch (error) {
      console.error('Error generating audio feedback:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          Error loading feedback: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Submission Feedback</h1>

        {/* Score and Status */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg">
            Score: <span className="font-semibold">{feedback.score}/100</span>
          </div>
          <div className={`px-3 py-1 rounded-full ${feedback.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
          </div>
        </div>

        {/* Feedback Content */}
        <div className="prose max-w-none mb-6">
          <ReactMarkdown>{feedback.feedback}</ReactMarkdown>
        </div>

        {/* Language and Audio Controls */}
        <div className="flex items-center space-x-4 mb-6">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="english">English</option>
            <option value="tamil">Tamil</option>
            <option value="hindi">Hindi</option>
            <option value="telugu">Telugu</option>
          </select>

          <button
            onClick={generateAudio}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <SpeakerWaveIcon className="h-5 w-5 mr-2" />
            Generate Audio
          </button>

          {audio && (
            <button
              onClick={toggleAudio}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              {isPlaying ? (
                <>
                  <PauseIcon className="h-5 w-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Play
                </>
              )}
            </button>
          )}
        </div>

        {/* Explanation Button */}
        <button
          onClick={() => fetchExplanation()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
          Explain This Feedback
        </button>

        {/* Explanation Content */}
        {explanation && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-md">
            <h3 className="text-lg font-medium text-yellow-900 mb-2">Explanation</h3>
            <div className="prose max-w-none text-yellow-800">
              <ReactMarkdown>{explanation.content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Code Review (if applicable) */}
      {feedback.codeReview && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Code Review</h2>
          <div className="prose max-w-none">
            <ReactMarkdown>{feedback.codeReview}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* AI Model Confidence (if available) */}
      {feedback.aiConfidence && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500">
            AI Confidence Score: {(feedback.aiConfidence * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;