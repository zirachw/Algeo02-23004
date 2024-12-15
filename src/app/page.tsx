// page.tsx
"use client";
import React, { useState } from "react";
import SideBar from "./components/Sidebar";
import AudioPlayer from "./components/AudioPlayer";
import CardSection from "./components/CardSection";
import Navbar from "./components/Navbar";

const HomePage: React.FC = () => {
  // Core view and file states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreviewFile, setUploadedPreviewFile] = useState<File | null>(null);

  // File presence tracking
  const [hasMapper, setHasMapper] = useState<boolean>(false);
  const [hasAudioZip, setHasAudioZip] = useState<boolean>(false);
  const [hasImageZip, setHasImageZip] = useState<boolean>(false);

  // Upload button and navigation states
  const [uploadedFromUploadButton, setUploadedFromUploadButton] = useState<boolean>(false);
  const [lastUploadedMediaType, setLastUploadedMediaType] = useState<"audio" | "image" | null>(null);

  // Media and player states
  const [showAudioPlayer, setShowAudioPlayer] = useState<boolean>(false);
  const [currentSong, setCurrentSong] = useState<{
    title: string;
    image: string;
    singer: string;
    audio: string;
  } | null>(null);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState<string>("");

  const isContentReady = hasMapper && (hasAudioZip || hasImageZip);

  const isAudioFile = (file: File): boolean => {
    const fileType = file.type.toLowerCase();
    const fileExt = file.name.toLowerCase().split(".").pop() || "";
    return (
      fileType.startsWith("audio/") ||
      fileType.startsWith("video/") ||
      ["mid", "midi"].includes(fileExt)
    );
  };

  const isImageFile = (file: File): boolean => {
    const fileType = file.type.toLowerCase();
    const fileExt = file.name.toLowerCase().split(".").pop() || "";
    return (
      fileType.startsWith("image/") ||
      ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(fileExt)
    );
  };

  const handleDatabaseFileUpload = (file: File, type: "mapper" | "audio" | "image") => {
    setUploadedFile(file);
    const fileExt = file.name.toLowerCase().split(".").pop() || "";

    if (type === "mapper" && fileExt === "json") {
      setHasMapper(true);
      setHasAudioZip(false);
      setHasImageZip(false);
      setLastUploadedMediaType(null);
      setUploadedPreviewFile(null);
      setShowAudioPlayer(false);
      setCurrentSong(null);
      setUploadedFromUploadButton(false);
      return;
    }

    if (type === "audio" && fileExt === "zip") {
      setHasAudioZip(true);
      setShowAudioPlayer(false);
      return;
    }

    if (type === "image" && fileExt === "zip") {
      setHasImageZip(true);
      return;
    }
  };

  const handleContentFileUpload = (file: File) => {
    setUploadedFile(file);
    setUploadedPreviewFile(file);
    setUploadedFromUploadButton(true);

    if (isAudioFile(file)) {
      setLastUploadedMediaType("audio");
    } else if (isImageFile(file)) {
      setLastUploadedMediaType("image");
    }
  };

  const handlePlayClick = (song: {
    title: string;
    image: string;
    singer: string;
    audio: string;
  }) => {
    setCurrentSong(song);
    setShowAudioPlayer(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };


  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideBar
        onDatabaseFileUpload={handleDatabaseFileUpload}
        onContentFileUpload={handleContentFileUpload}
        hasMapper={hasMapper}
        hasAudioZip={hasAudioZip}
        hasImageZip={hasImageZip}
        uploadedPreviewFile={uploadedPreviewFile}
        currentSong={currentSong}
        onPlayClick={handlePlayClick}
      />

      <div className="w-4/5 flex flex-col">
        <Navbar
          uploadedFile={uploadedFile}
          hasAudioZip={hasAudioZip}
          hasImageZip={hasImageZip}
          isUploadEnabled={isContentReady}
          lastUploadedMediaType={lastUploadedMediaType}
          onSearch={handleSearch}
          canSearchByImage={lastUploadedMediaType === "image"}
          canSearchByAudio={lastUploadedMediaType === "audio"}
        />

        {isContentReady ? (
          <>
            <div className="flex-1 flex items-center px-8">
              <div className="w-full">
                <CardSection
                  uploadedFile={uploadedFile}
                  searchQuery={searchQuery}
                  onPlayClick={handlePlayClick}
                  hasAudioZip={hasAudioZip}
                />
              </div>
            </div>

            {showAudioPlayer && currentSong && (
              <div className="bg-[#303030]">
                <AudioPlayer
                  isEnabled={hasAudioZip}
                  currentSong={currentSong}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-black">
              <h2 className="text-4xl font-medium mb-2">
                Please upload required files
              </h2>
              <p>
                Upload mapper.json and either an audio ZIP or image ZIP file to view content
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;