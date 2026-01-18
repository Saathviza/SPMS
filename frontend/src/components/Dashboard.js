import React from 'react';

function Dashboard() {
  const token = localStorage.getItem('token');
  if (!token) {
    return <p>You are not logged in. Please login first.</p>;
  }

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome to your dashboard!</p>
    </div>
  );
}

export default Dashboard;

