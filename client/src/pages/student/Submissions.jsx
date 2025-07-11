import { useQuery } from 'react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Submissions = () => {
  const { data, isLoading, error } = useQuery('studentSubmissions', async () => {
    const response = await axios.get('/api/students/submissions');
    return response.data;
  });

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
          Error loading submissions: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Submissions</h1>
      <div className="space-y-4">
        {data?.submissions?.map((submission) => (
          <Link
            key={submission._id}
            to={`/student/feedback/${submission._id}`}
            className="block bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{submission.subject}</div>
                <div className="text-sm text-gray-500">
                  {new Date(submission.timestamp).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                  submission.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                </span>
                <div className="mt-1 text-sm font-medium">
                  Score: {submission.evaluation?.score ?? '--'}%
                </div>
              </div>
            </div>
          </Link>
        ))}
        {(!data?.submissions || data.submissions.length === 0) && (
          <div className="text-center text-gray-500 py-8">
            No submissions found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Submissions;