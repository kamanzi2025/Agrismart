import { useNavigate } from 'react-router-dom';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-600">403</h1>
        <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
          Go back
        </button>
      </div>
    </div>
  );
}
