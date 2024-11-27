import React from 'react';

interface CardProps {
  imgUrl: string;  
  title: string;  
}

const Card: React.FC<CardProps> = ({ imgUrl, title }) => {
  return (
    <div className="w-32 bg-white rounded-lg shadow-md overflow-hidden relative">
      {/* Bagian Gambar Album */}
      <div
        className="w-full h-32 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${imgUrl})` }}
      >
        {/* Tombol Play */}
        <button
          className="absolute bottom-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer"
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
