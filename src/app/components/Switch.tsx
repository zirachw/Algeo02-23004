import React from "react";

interface SwitchProps {
    currentView: 'audio' | 'image';
    onSwitch: (view: 'audio' | 'image') => void;
}

const Switch: React.FC<SwitchProps> = ({ currentView, onSwitch }) => {
    return (
        <div className="flex space-x-4 my-12">
        {/* Tombol Switch ke Audio */}
        <button
          onClick={() => onSwitch('audio')}
          className={`px-4 py-1 w-24 text-black rounded-lg ring-1 ring-gray-300 shadow-[0px_4px_8px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-in-out ${
            currentView === 'audio' ? 'bg-[#DBDBDB] text-black' : 'bg-white'
          } hover:scale-105`}
        >
          Audio
        </button>
  
        {/* Tombol Switch ke Image */}
        <button
          onClick={() => onSwitch('image')}
          className={`px-4 py-1 w-24 text-black rounded-lg ring-1 ring-gray-300 shadow-[0px_4px_8px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-in-out ${
            currentView === 'image' ? 'bg-[#DBDBDB] text-black' : 'bg-white'
          } hover:scale-105`}
        >
          Image
        </button>
      </div>
    );
}

export default Switch;