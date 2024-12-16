"use client";
import React, { useState } from "react";
import VoiceRecorderForm from "./RecordForm";
import ConvertForm from "./ConvertForm";

interface NavbarProps {
  uploadedFile: File | null;
  AudioZip: File | null;
  ImageZip: File | null;
  isUploadEnabled: File | null;
  lastUploadedMediaType: "audio" | "image" | null;
  onSearch?: (query: string) => void;
  canSearchByImage: boolean;
  canSearchByAudio: boolean;
  queryTime: number | null;
}

const Navbar: React.FC<NavbarProps> = ({
  AudioZip,
  lastUploadedMediaType,
  onSearch,
  canSearchByImage,
  canSearchByAudio,
  queryTime,
}) => {
  const [isRecorderOpen, setRecorderOpen] = useState(false);
  const [isConvertFormOpen, setConvertFormOpen] = useState(false);

  const handleOpenRecorder = () => setRecorderOpen(true);
  const handleCloseRecorder = () => setRecorderOpen(false);

  const handleOpenConvertForm = () => setConvertFormOpen(true);
  const handleCloseConvertForm = () => setConvertFormOpen(false);

  const handleConfirmRecording = (audioBlob: Blob) => {
    console.log("Audio recorded:", audioBlob);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(event.target.value);
  };

  const handleConvert = (wavFile: File) => {
    console.log("Converting WAV to MIDI:", wavFile);

  };

  return (
    <>
      <div className="w-full px-12 py-8 flex justify-between items-center bg-gray-100 backdrop-blur-sm">
        <div className="flex space-x-4 items-center">
          {/* Start Search by Image button */}
          <button
            className={`px-4 py-1.5 w-24 rounded-lg ring-1 ring-gray-300 transform transition-all duration-300 ease-in-out ${
              lastUploadedMediaType === "image" ? "bg-[#DBDBDB]" : "bg-white"
            } ${
              canSearchByImage
                ? "text-black hover:bg-gray-100 cursor-pointer"
                : "text-gray-400 cursor-not-allowed"
            }`}
            disabled={!canSearchByImage}
          >
            Image
          </button>

          {/* Start Search by Audio button */}
          <button
            className={`px-4 py-1.5 w-24 rounded-lg ring-1 ring-gray-300 transform transition-all duration-300 ease-in-out ${
              lastUploadedMediaType === "audio" ? "bg-[#DBDBDB]" : "bg-white"
            } ${
              canSearchByAudio
                ? "text-black hover:bg-gray-100 cursor-pointer"
                : "text-gray-400 cursor-not-allowed"
            }`}
            disabled={!canSearchByAudio}
          >
            Audio
          </button>

          {/* Convert WAV to MIDI */}
          <button
            onClick={handleOpenConvertForm}
            className={`px-4 py-1.5 w-24 rounded-lg ring-1 ring-gray-300 transform transition-all duration-300 ease-in-out ${
              AudioZip
                ? "text-black hover:bg-gray-100 cursor-pointer"
                : "text-gray-400 cursor-not-allowed"
            }`}
            disabled={!AudioZip === null}
          >
            Convert
          </button>
        </div>

        <div className="flex items-center">
          <span className="text-gray-400 mr-2">Query Time:</span>
          <span className="text-gray-400"> {queryTime ?? "-"}</span>
        </div>

        <div className="relative flex space-x-4 items-center">
          <button
            onClick={handleOpenRecorder}
            disabled={!AudioZip && lastUploadedMediaType === null}
            className={`p-2 rounded-full transition-colors duration-200 ${
              AudioZip && lastUploadedMediaType === null
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
          <div className="relative">
            <input
              type="text"
              placeholder="Search Song Name..."
              onChange={handleSearchChange}
              className="w-64 pl-10 pr-4 py-1.5 rounded-full border border-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-black"
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
      <VoiceRecorderForm
        isOpen={isRecorderOpen}
        onClose={handleCloseRecorder}
        onConfirm={handleConfirmRecording}
      />
      <ConvertForm
        isOpen={isConvertFormOpen}
        onClose={handleCloseConvertForm}
        onConvert={handleConvert}
      />
    </>
  );
};

export default Navbar;
