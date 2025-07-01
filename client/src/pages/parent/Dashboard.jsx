import { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {
  AcademicCapIcon,
  ChartBarIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ParentDashboard = () => {
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);

  // Fetch children data
  const { data: children } = useQuery('children', async () => {
    const response = await axios.get('/api/parents/children');
    return response.data;
  });

  // Fetch selected child's progress
  const { data: childProgress } = useQuery(
    ['childProgress', selectedChild],
    async () => {
      const response = await axios.get(`/api/parents/children/${selectedChild}/progress`);
      return response.data;
    },
    { enabled: !!selectedChild }
  );

  // Fetch weekly summary
  const { data: weeklySummary } = useQuery(
    ['weeklySummary', selectedChild],
    async () => {
      const response = await axios.get(`/api/parents/children/${selectedChild}/weekly-summary`);
      return response.data;
    },
    { enabled: !!selectedChild }
  );

  // Generate audio summary
  const generateAudioSummary = async () => {
    try {
      const response = await axios.post(
        `/api/parents/children/${selectedChild}/audio-summary`,
        { language: selectedLanguage }
      );
      const audioObj = new Audio(response.data.audioUrl);
      setAudio(audioObj);

      audioObj.onended = () => setIsPlaying(false);
    } catch (error) {
      console.error('Error generating audio summary:', error);
    }
  };

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

  // Prepare chart data
  const chartData = childProgress ? {
    labels: childProgress.dates,
    datasets: [
      {
        label: 'Average Score',
        data: childProgress.scores,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.4
      }
    ]
  } : null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>

        {/* Child Selection */}
        <select
          value={selectedChild || ''}
          onChange={(e) => setSelectedChild(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        >
          <option value="">Select a child</option>
          {children?.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))}
        </select>
      </div>

      {selectedChild && childProgress && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Overall Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Overall Performance</h2>
              <AcademicCapIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {childProgress.averageScore.toFixed(1)}%
            </div>
            <p className="text-gray-500">Average score across all subjects</p>
          </div>

          {/* Submissions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Total Submissions</h2>
              <DocumentTextIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {childProgress.totalSubmissions}
            </div>
            <p className="text-gray-500">Assignments completed</p>
          </div>

          {/* Improvement */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Progress Trend</h2>
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {childProgress.improvementRate > 0 ? '+' : ''}
              {childProgress.improvementRate.toFixed(1)}%
            </div>
            <p className="text-gray-500">Improvement over last month</p>
          </div>
        </div>
      )}

      {/* Progress Chart */}
      {chartData && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Progress Over Time</h2>
          <div className="h-64">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Weekly Summary */}
      {weeklySummary && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Weekly Summary</h2>

            <div className="flex items-center space-x-4">
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
                onClick={generateAudioSummary}
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
          </div>

          <div className="prose max-w-none">
            <h3>Strengths</h3>
            <ul>
              {weeklySummary.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>

            <h3>Areas for Improvement</h3>
            <ul>
              {weeklySummary.improvements.map((improvement, index) => (
                <li key={index}>{improvement}</li>
              ))}
            </ul>

            <h3>Recommendations</h3>
            <ul>
              {weeklySummary.recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;