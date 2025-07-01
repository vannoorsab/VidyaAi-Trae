import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import {
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  MicrophoneIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const ReviewSubmissions = () => {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  // Fetch pending submissions
  const { data: submissions, isLoading } = useQuery(
    'pendingSubmissions',
    async () => {
      const response = await axios.get('/api/teachers/submissions/pending');
      return response.data;
    }
  );

  // Review mutation
  const reviewMutation = useMutation(
    async ({ submissionId, action, data }) => {
      const endpoint = `/api/teachers/submissions/${submissionId}/${action}`;
      return axios.post(endpoint, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pendingSubmissions');
        setSelectedSubmission(null);
        setFeedback('');
        setScore('');
      }
    }
  );

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);

      recorder.ondataavailable = (e) => {
        setAudioChunks(chunks => [...chunks, e.data]);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());

      // Create audio blob and send to server
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob);

      try {
        await axios.post(
          `/api/teachers/submissions/${selectedSubmission.id}/audio-feedback`,
          formData
        );
      } catch (error) {
        console.error('Error uploading audio feedback:', error);
      }
    }
  };

  const handleApprove = (submission) => {
    reviewMutation.mutate({
      submissionId: submission.id,
      action: 'approve'
    });
  };

  const handleOverride = (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    reviewMutation.mutate({
      submissionId: selectedSubmission.id,
      action: 'override',
      data: {
        feedback,
        score: parseInt(score)
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Review Submissions</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions List */}
        <div className="space-y-4">
          {submissions?.map((submission) => (
            <div
              key={submission.id}
              className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-colors ${selectedSubmission?.id === submission.id ? 'ring-2 ring-indigo-500' : 'hover:bg-gray-50'}`}
              onClick={() => setSelectedSubmission(submission)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{submission.studentName}</h3>
                  <p className="text-sm text-gray-500">{submission.subject}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{submission.aiScore}/100</div>
                  <div className="text-sm text-gray-500">{new Date(submission.submittedAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(submission);
                  }}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Approve
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSubmission(submission);
                  }}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PencilSquareIcon className="h-4 w-4 mr-1" />
                  Review
                </button>
              </div>
            </div>
          ))}

          {submissions?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No pending submissions to review
            </div>
          )}
        </div>

        {/* Review Panel */}
        {selectedSubmission && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Review Submission</h2>

            <div className="mb-6">
              <h3 className="font-medium mb-2">Student's Work</h3>
              <div className="prose max-w-none bg-gray-50 p-4 rounded-md">
                <ReactMarkdown>{selectedSubmission.content}</ReactMarkdown>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-2">AI Feedback</h3>
              <div className="prose max-w-none bg-gray-50 p-4 rounded-md">
                <ReactMarkdown>{selectedSubmission.aiFeedback}</ReactMarkdown>
              </div>
            </div>

            <form onSubmit={handleOverride} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Override Score
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Override Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>

              {/* Voice Feedback */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  <MicrophoneIcon className="h-5 w-5 mr-2" />
                  {isRecording ? 'Stop Recording' : 'Record Voice Feedback'}
                </button>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSubmissions;