import { useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import {
  DocumentTextIcon,
  CodeBracketIcon,
  PencilIcon,
  MicrophoneIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

const SubmitWork = () => {
  const navigate = useNavigate();
  const [submissionType, setSubmissionType] = useState('text');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  // File upload handling
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        submitMutation.mutate({ type: 'handwritten', content: formData });
      }
    }
  });

  // Submit mutation
  const submitMutation = useMutation(
    async ({ type, content }) => {
      let endpoint = '';
      const formData = new FormData();

      switch (type) {
        case 'text':
          endpoint = '/api/ai/evaluate/text';
          return axios.post(endpoint, { text: content, subject });

        case 'code':
          endpoint = '/api/ai/evaluate/code';
          return axios.post(endpoint, { code: content, language: subject });

        case 'handwritten':
          endpoint = '/api/ai/evaluate/handwritten';
          return axios.post(endpoint, content);

        case 'voice':
          endpoint = '/api/ai/transcribe';
          formData.append('audio', new Blob(audioChunks, { type: 'audio/webm' }));
          return axios.post(endpoint, formData);

        default:
          throw new Error('Invalid submission type');
      }
    },
    {
      onSuccess: (data) => {
        navigate('/student/feedback/' + data.data.submissionId);
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

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      // Stop all audio tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate({ type: submissionType, content });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Submit Your Work</h1>

      {/* Submission Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setSubmissionType('text')}
          className={`p-4 rounded-lg flex flex-col items-center ${submissionType === 'text' ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-white border'}`}
        >
          <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
          <span className="mt-2">Text</span>
        </button>

        <button
          onClick={() => setSubmissionType('code')}
          className={`p-4 rounded-lg flex flex-col items-center ${submissionType === 'code' ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-white border'}`}
        >
          <CodeBracketIcon className="h-8 w-8 text-indigo-600" />
          <span className="mt-2">Code</span>
        </button>

        <button
          onClick={() => setSubmissionType('handwritten')}
          className={`p-4 rounded-lg flex flex-col items-center ${submissionType === 'handwritten' ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-white border'}`}
        >
          <PencilIcon className="h-8 w-8 text-indigo-600" />
          <span className="mt-2">Handwritten</span>
        </button>

        <button
          onClick={() => setSubmissionType('voice')}
          className={`p-4 rounded-lg flex flex-col items-center ${submissionType === 'voice' ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-white border'}`}
        >
          <MicrophoneIcon className="h-8 w-8 text-indigo-600" />
          <span className="mt-2">Voice</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject/Language
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          >
            <option value="">Select a subject</option>
            {submissionType === 'code' ? (
              // Programming languages
              ['python', 'javascript', 'java', 'cpp'].map(lang => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))
            ) : (
              // Academic subjects
              ['mathematics', 'science', 'english', 'history'].map(subj => (
                <option key={subj} value={subj}>
                  {subj.charAt(0).toUpperCase() + subj.slice(1)}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Content Input based on type */}
        <div>
          {submissionType === 'text' && (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter your text here..."
              required
            />
          )}

          {submissionType === 'code' && (
            <Editor
              height="400px"
              language={subject}
              value={content}
              onChange={setContent}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14
              }}
            />
          )}

          {submissionType === 'handwritten' && (
            <div
              {...getRootProps()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500"
            >
              <input {...getInputProps()} />
              <ArrowUpTrayIcon className="h-12 w-12 mx-auto text-gray-400" />
              {isDragActive ? (
                <p className="mt-2">Drop your image here...</p>
              ) : (
                <p className="mt-2">Drag & drop an image, or click to select</p>
              )}
            </div>
          )}

          {submissionType === 'voice' && (
            <div className="text-center">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-4 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'} text-white`}
              >
                <MicrophoneIcon className="h-8 w-8" />
              </button>
              <p className="mt-2">
                {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitMutation.isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitMutation.isLoading ? 'Submitting...' : 'Submit Work'}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {submitMutation.isError && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
          {submitMutation.error.message}
        </div>
      )}
    </div>
  );
};

export default SubmitWork;