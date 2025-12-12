import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="text-center mt-20">
      <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
      <Link to="/" className="text-green-600 underline mt-4 block">Go back home</Link>
    </div>
  );
}

export default NotFound;