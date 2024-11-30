import React from 'react';
import SideBar from './components/Sidebar';
import AudioPlayer from './components/AudioPlayer';
import CardSection from './components/CardSection';

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-row justify-left items-center min-h-screen bg-gray-100">
      <SideBar />

      <div id="rightSide" className='flex flex-col w-3/4 h-screen justify-between items-center'>
        <div id="main">

        </div>
        <CardSection />
        <AudioPlayer />
      </div>
    </div>
  );
};

export default HomePage;