"use client";
import React, { useState } from 'react';
import SideBar from './components/Sidebar';
import AudioPlayer from './components/AudioPlayer';
import CardSection from './components/CardSection';

const HomePage: React.FC = () => {
  const [currentView, setCurrentView] = useState<"audio" | "image">("audio");

  const handleSwitch = (view: "audio" | "image") => {
    setCurrentView(view);
  };

  return (
    <div className="flex flex-row justify-left items-center min-h-screen bg-gray-100">
      <SideBar currentView={currentView} />

      <div id="rightSide" className='flex flex-col w-3/4 h-screen justify-between items-center'>
        <div id="main">

        </div>
        <CardSection currentView={currentView} onSwitch={handleSwitch} />
        <AudioPlayer />
      </div>
    </div>
  );
};

export default HomePage;