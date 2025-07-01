import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { ChartBarIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [timeframe, setTimeframe] = useState('week');

  // Fetch student's submissions and progress
  const { data: studentData, isLoading } = useQuery(
    ['studentProgress', timeframe],
    async () => {
      const response = await axios.get(`/api/students/profile?timeframe=${timeframe}`);
      return response.data;
    }
  );

  // Prepare chart data
  const chartData = {
    labels: studentData?.submissions?.map(sub => new Date(sub.timestamp).toLocaleDateString()) || [],
    datasets: [{
      label: 'Scores',
      data: studentData?.submissions?.map(sub => sub.evaluation.score) || [],
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Performance Trend'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.displayName}!
        </h1>
        <p className="mt-2 text-gray-600">
          Track your progress and submit your work for AI-powered feedback.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/student/submit"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
          <h2 className="mt-4 text-lg font-semibold">Submit Work</h2>
          <p className="mt-2 text-gray-600">Submit text, code, or handwritten work for evaluation</p>
        </Link>

        <Link
          to="/student/submissions"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <ClockIcon className="h-8 w-8 text-indigo-600" />
          <h2 className="mt-4 text-lg font-semibold">Recent Submissions</h2>
          <p className="mt-2 text-gray-600">View your submission history and feedback</p>
        </Link>

        <Link
          to="/student/feedback"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <ChartBarIcon className="h-8 w-8 text-indigo-600" />
          <h2 className="mt-4 text-lg font-semibold">Progress Report</h2>
          <p className="mt-2 text-gray-600">Track your performance and improvement</p>
        </Link>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Performance Overview</h2>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {studentData?.submissions?.slice(0, 5).map((submission) => (
            <div
              key={submission._id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div>
                <h3 className="font-medium">{submission.subject}</h3>
                <p className="text-sm text-gray-600">
                  Submitted on {new Date(submission.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                  submission.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                </span>
                <p className="mt-1 text-sm font-medium">
                  Score: {submission.evaluation.score}%
                </p>
              </div>
            </div>
          ))}
        </div>
        {studentData?.submissions?.length > 5 && (
          <Link
            to="/student/submissions"
            className="block mt-4 text-center text-indigo-600 hover:text-indigo-500"
          >
            View All Submissions
          </Link>
        )}
      </div>
    </div>
  );
};

export default Dashboard;