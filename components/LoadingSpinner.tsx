import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-dark">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-600 border-t-primary rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;
