// HomePage.tsx
"use client";
import React, { useState } from "react";
import SideBar from "./components/Sidebar";
import AudioPlayer from "./components/AudioPlayer";
import CardSection from "./components/CardSection";
import Navbar from "./components/Navbar";

const HomePage: React.FC = () => {
  // Core view and file states
  const [currentView, setCurrentView] = useState<"audio" | "image">("audio");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreviewFile, setUploadedPreviewFile] = useState<File | null>(
    null
  );

  // File presence tracking
  const [hasMapper, setHasMapper] = useState<boolean>(true);
  const [hasAudioZip, setHasAudioZip] = useState<boolean>(true);
  const [hasImageZip, setHasImageZip] = useState<boolean>(true);

  // Media and player states
  const [lastUploadedMediaType, setLastUploadedMediaType] = useState<
    "audio" | "image" | null
  >(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState<boolean>(true);
  const [currentSong, setCurrentSong] = useState<{
    title: string;
    image: string;
    singer: string;
    audio: string;
  } | null>(null);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState<string>("");

  const isContentReady = hasMapper && (hasAudioZip || hasImageZip);

  // Validate different file types
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

  // Handler for database-related file uploads
  const handleDatabaseFileUpload = (file: File) => {
    setUploadedFile(file);

    if (file.name === "mapper.json") {
      setHasMapper(true);
      setHasAudioZip(false);
      setHasImageZip(false);
      setLastUploadedMediaType(null);
      setCurrentView("audio");
      setShowAudioPlayer(false);
      setCurrentSong(null);
      return;
    }

    if (file.name === "audios.zip") {
      setHasAudioZip(true);
      setShowAudioPlayer(false);
      return;
    }

    if (file.name === "images.zip") {
      setHasImageZip(true);
      return;
    }
  };

  // Handler for content uploads via the Upload button
  const handleContentFileUpload = (file: File) => {
    setUploadedFile(file);
    setUploadedPreviewFile(file);

    if (isAudioFile(file)) {
      setLastUploadedMediaType("audio");
      setCurrentView("audio");
    } else if (isImageFile(file)) {
      setLastUploadedMediaType("image");
      setCurrentView("image");
    }
  };

  const handleSwitch = (view: "audio" | "image") => {
    if (isContentReady && lastUploadedMediaType === view) {
      setCurrentView(view);
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
        currentView={currentView}
        onDatabaseFileUpload={handleDatabaseFileUpload}
        onContentFileUpload={handleContentFileUpload}
        hasMapper={hasMapper}
        hasAudioZip={hasAudioZip}
        hasImageZip={hasImageZip}
        uploadedPreviewFile={uploadedPreviewFile}
        currentSong={currentSong}
        onPlayClick={handlePlayClick}
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          currentView={currentView}
          onSwitch={handleSwitch}
          uploadedFile={uploadedFile}
          hasAudioZip={hasAudioZip}
          hasImageZip={hasImageZip}
          isUploadEnabled={isContentReady}
          isMicEnabled={hasAudioZip && lastUploadedMediaType === "audio"}
          lastUploadedMediaType={lastUploadedMediaType}
          onSearch={handleSearch} 
        />

        {isContentReady ? (
          <>
            <div className="flex-1 flex items-center px-8">
              <div className="w-full">
                <CardSection
                  currentView={currentView}
                  onSwitch={handleSwitch}
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
            <div className="text-center text-gray-500">
              <h2 className="text-xl font-medium mb-2">
                Please upload required files
              </h2>
              <p>
                Upload mapper.json and either audios.zip or images.zip to view
                content
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
