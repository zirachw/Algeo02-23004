// Card.tsx
import React from "react";

interface CardProps {
  imgUrl: string;
  title: string;
  singer: string;
  genre: string;
  onPlayClick?: () => void;
  hasAudioZip: boolean;
  currentView: "audio" | "image";
}

const Card: React.FC<CardProps> = ({
  imgUrl,
  title,
  singer,
  genre,
  onPlayClick,
  hasAudioZip,
  currentView,
}) => {
  const showPlayButton = hasAudioZip && currentView === "audio";

  return (
    <div className="w-full max-w-[210px] mx-auto bg-white rounded-lg shadow-md overflow-hidden relative group transform transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
      <div
        className="aspect-square w-full bg-cover bg-center relative"
        style={{ backgroundImage: `url(${imgUrl})` }}
      >
        {showPlayButton && (
          <button
            onClick={onPlayClick}
            className="absolute bottom-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-black"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-2">
        <h3 className="text-gray-900 text-[20px] pl-1">{title}</h3>
        <p className="text-gray-600 text-[15px] pl-1">{singer}</p>
        <p className="text-gray-500 text-[12px] mt-1 pl-1">{genre}</p>
      </div>
    </div>
  );
};

export default Card;