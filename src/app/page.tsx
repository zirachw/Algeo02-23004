import React from 'react';
import Card from './components/Card'; // Sesuaikan path
import SideBar from './components/Sidebar';
import AudioPlayer from './components/AudioPlayer';
import CardListSection from './components/CardListSection';

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-row justify-left items-center min-h-screen bg-gray-100">
      <SideBar />

      <div id="rightSide" className='flex flex-col w-3/4 h-screen justify-between'>
        <div id="main">

        </div>
        <CardListSection/>
        <AudioPlayer />
      </div>
    </div>
  );
};

export default HomePage;