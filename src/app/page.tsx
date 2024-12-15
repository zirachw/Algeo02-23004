// page.tsx
"use client";
import React, { useState } from "react";
import SideBar from "./components/Sidebar";
import AudioPlayer from "./components/AudioPlayer";
import CardSection from "./components/CardSection";
import Navbar from "./components/Navbar";
interface Song {
  song: string;
  singer: string;
  album: string;
  genre: string;
  audio: string;
}

// Define the interface for the similarData prop
interface SimilarData {
  matching_results: Song[];
}

const HomePage: React.FC = () => {
  // Core view and file states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreviewFile, setUploadedPreviewFile] = useState<File | null>(null);

  // File presence tracking
  const [Mapper, setMapper] = useState<File | null>(null);
  const [AudioZip, setAudioZip] = useState<File | null>(null);
  const [ImageZip, setImageZip] = useState<File | null>(null);

  const [similarData, setSimilarData] = useState<SimilarData | null>(null);

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

  const isContentReady = Mapper && (AudioZip || ImageZip);

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

  const handleDatabaseFileUpload = async (file: File, type: "mapper" | "audio" | "image") => {
    setUploadedFile(file);
    const fileExt = file.name.toLowerCase().split(".").pop() || "";
  
    if (type === "mapper" && fileExt === "json") {
      setMapper(file);
      setAudioZip(null);
      setImageZip(null);
      setLastUploadedMediaType(null);
      setUploadedPreviewFile(null);
      setShowAudioPlayer(false);
      setCurrentSong(null);
      setUploadedFromUploadButton(false);
      return;
    }
  
    if (type === "audio" && fileExt === "zip") {
      setAudioZip(file);
      setShowAudioPlayer(false);
      return;
    }
  
    if (type === "image" && fileExt === "zip") {
      try {
        // Create a FormData object for the file
        const formData = new FormData();
        if (Mapper)  {formData.append("mapper_file", Mapper)}
        if (file) {formData.append("file", file)}
        
        console.log(Mapper); // Should show File object with name, size, and type
        console.log(file); // Should show File object with name, size, and type

        // Send POST request to the /upload-dataset endpoint
        const response = await fetch("http://127.0.0.1:8000/upload-dataset", {
          method: "POST",
          body: formData,
          headers: {
            "enctype": "multipart/form-data",
          }
        });
  
        if (response.ok) {
          const result = await response.json();
          console.log("Dataset uploaded successfully:", result);
          setImageZip(file);
        } else {
          const error = await response.json();
          console.error("Error uploading dataset:", error);
        }
      } catch (error) {
        console.error("Failed to upload dataset:", error);
      }
      return;
    }
  };  

  const handleContentFileUpload = async (file: File) => {
    
    setUploadedFromUploadButton(true);

    if (isAudioFile(file)) {
      setLastUploadedMediaType("audio");
    } else if (isImageFile(file)) {
      setLastUploadedMediaType("image");
      try {
        // Create a FormData object for the file
        const formData = new FormData();
        
        if (file) {
          formData.append("file", file);
        }

        console.log("anjay", file); // Should show File object with name, size, and type

        // Send POST request to the /upload-dataset endpoint
        const response = await fetch("http://127.0.0.1:8000/search", {
          method: "POST",
          body: formData,
          // headers: {
          //   "enctype": "multipart/form-data",
          // }
        });
  
        if (response.ok) {
          const result = await response.json();
          console.log("Dataset queried successfully:", result);
          setSimilarData(result);
          setUploadedFile(file);
          setUploadedPreviewFile(file);
        } else {
          const error = await response.json();
          console.error("Error uploading dataset:", error);
        }
      } catch (error) {
        console.error("Failed to upload dataset:", error);
      }
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
        Mapper={Mapper}
        AudioZip={AudioZip}
        ImageZip={ImageZip}
        uploadedPreviewFile={uploadedPreviewFile}
        currentSong={currentSong}
        onPlayClick={handlePlayClick}
        isUploaded={uploadedFromUploadButton}
      />

      <div className="w-4/5 flex flex-col">
        <Navbar
          uploadedFile={uploadedFile}
          AudioZip={AudioZip}
          ImageZip={ImageZip}
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
                  similarData={similarData}
                  uploadedFile={uploadedFile}
                  searchQuery={searchQuery}
                  onPlayClick={handlePlayClick}
                  AudioZip={AudioZip}
                />
              </div>
            </div>

            {showAudioPlayer && currentSong && (
              <div className="bg-[#303030]">
                <AudioPlayer
                  isEnabled={AudioZip}
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