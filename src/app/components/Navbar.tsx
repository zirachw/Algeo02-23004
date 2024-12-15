// Navbar.tsx
"use client";
import React from "react";

// Define the properties for the Navbar component
// Includes a new optional isMicEnabled prop with a default of false
interface NavbarProps {
  currentView: "audio" | "image";
  onSwitch: (view: "audio" | "image") => void;
  uploadedFile: File | null;
  hasAudioZip: boolean;
  hasImageZip: boolean;
  isUploadEnabled: boolean;
  isMicEnabled?: boolean; // Made optional with a default of false
  lastUploadedMediaType: "audio" | "image" | null;
  onSearch?: (query: string) => void;
  canSwitchToAudio: boolean;
  canSwitchToImage: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSwitch,
  hasAudioZip,
  hasImageZip,
  isUploadEnabled,
  isMicEnabled = false, // Default to false if not provided
  lastUploadedMediaType,
  onSearch,
  canSwitchToAudio,
  canSwitchToImage,
}) => {
  // Handle search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(event.target.value);
  };

  return (
    <div className="w-full px-6 pt-8 pb-4 flex justify-between items-center bg-gray-100 backdrop-blur-sm">
      <div className="flex space-x-4 items-center">
        {/* Image view switch button */}
        <button
          onClick={() => onSwitch("image")}
          className={`px-4 py-1.5 w-24 rounded-lg ring-1 ring-gray-300 transform transition-all duration-300 ease-in-out ${
            currentView === "image" && isUploadEnabled
              ? "bg-[#DBDBDB]"
              : "bg-white"
          } ${
            canSwitchToImage
              ? "text-black hover:bg-gray-100 cursor-pointer"
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!canSwitchToImage}
        >
          Image
        </button>

        {/* Audio view switch button */}
        <button
          onClick={() => onSwitch("audio")}
          className={`px-4 py-1.5 w-24 rounded-lg ring-1 ring-gray-300 transform transition-all duration-300 ease-in-out ${
            currentView === "audio" && isUploadEnabled
              ? "bg-[#DBDBDB]"
              : "bg-white"
          } ${
            canSwitchToAudio
              ? "text-black hover:bg-gray-100 cursor-pointer"
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!canSwitchToAudio}
        >
          Audio
        </button>

        {/* Microphone button - now respects isMicEnabled */}
        <button
          disabled={!hasAudioZip || !isMicEnabled}
          className={`p-2 rounded-full transition-colors duration-200 ${
            hasAudioZip && isMicEnabled
              ? "text-black hover:bg-gray-100 cursor-pointer"
              : "text-gray-400 cursor-not-allowed"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </button>
      </div>

      {/* Query time display */}
      <div className="flex items-center">
        <span className="text-gray-700">Query Time: -</span>
      </div>

      {/* Search input */}
      <div className="relative flex items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search Song Name..."
            onChange={handleSearchChange}
            className="w-64 pl-10 pr-4 py-1.5 rounded-full border border-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;