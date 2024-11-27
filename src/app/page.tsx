import React from 'react';
import Card from './components/Card'; // Sesuaikan path

const HomePage: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card
        imgUrl="https://via.placeholder.com/300x300.png?text=Album+Cover"
        title="Mind Games"  // Nama album atau lagu
      />
    </div>
  );
};

export default HomePage;