import React from 'react';

interface CardProps {
  imgUrl: string;  
  title: string;  
}

const Card: React.FC<CardProps> = ({ imgUrl, title }) => {
  return (
    <div className="w-32 bg-white rounded-b-lg shadow-[0px_4px_8px_rgba(0,0,0,0.2)] overflow-hidden relative group transform transition-transform duration-300 ease-in-out hover:scale-105">
      {/* Bagian Gambar Album */}
      <div
        className="w-full h-32 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${imgUrl})` }}
      >
        {/* Tombol Play */}
        <button
          className="absolute bottom-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 ease-in-out"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-black"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" /> {/* Ikon Play */}
          </svg>
        </button>
      </div>

      {/* Nama Audio */}
      <div className="p-2 text-center">
        <h3 className="text-black text-sm font-medium">{title}</h3>
      </div>
    </div>
  );
};

export default Card;
