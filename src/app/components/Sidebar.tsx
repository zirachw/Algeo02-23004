// Sidebar.tsx
"use client";
import React, { useState, useEffect } from "react";
import Form from "./Form";

// Define our component's props interface with clear separation of file handling responsibilities
interface SideBarProps {
  currentView: "audio" | "image";
  onDatabaseFileUpload: (file: File) => void; // For system files like mapper.json and zip files
  onContentFileUpload: (file: File) => void; // For user content files (images, audio)
  hasMapper: boolean;
  hasAudioZip: boolean;
  hasImageZip: boolean;
  uploadedPreviewFile: File | null;
  currentSong: { title: string; image: string; singer: string } | null;
  onPlayClick?: (song: {
    title: string;
    image: string;
    singer: string;
  }) => void;
}

const SideBar: React.FC<SideBarProps> = ({
  currentView,
  onDatabaseFileUpload,
  onContentFileUpload,
  hasMapper,
  hasAudioZip,
  hasImageZip,
  uploadedPreviewFile,
  currentSong,
  onPlayClick,
}) => {
  // Core UI state
  const [showForm, setShowForm] = useState(false);
  const [uploadType, setUploadType] = useState<
    "mapper" | "audio" | "image" | "content"
  >("mapper");

  // File size tracking state
  const [audioSize, setAudioSize] = useState<string>("0");
  const [imageSize, setImageSize] = useState<string>("0");

  // Track database files separately from preview files
  const [databaseFiles, setDatabaseFiles] = useState<{
    audio?: File;
    image?: File;
  }>({});

  // Helper function to identify audio files by type or extension
  const isAudioFile = (file: File): boolean => {
    const fileType = file.type.toLowerCase();
    const fileExt = file.name.toLowerCase().split(".").pop() || "";
    return (
      fileType.startsWith("audio/") ||
      fileType.startsWith("video/") ||
      ["mid", "midi", "mp3", "wav", "ogg", "m4a"].includes(fileExt)
    );
  };

  // Formats file sizes into human-readable strings with appropriate units
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Update size displays whenever database files change
  useEffect(() => {
    if (databaseFiles.audio) {
      setAudioSize(formatFileSize(databaseFiles.audio.size));
    }
    if (databaseFiles.image) {
      setImageSize(formatFileSize(databaseFiles.image.size));
    }
  }, [databaseFiles]);

  // Wrapper for database file uploads to track sizes
  const handleDatabaseUpload = (file: File) => {
    if (file.name === "audios.zip") {
      setDatabaseFiles((prev) => ({ ...prev, audio: file }));
    } else if (file.name === "images.zip") {
      setDatabaseFiles((prev) => ({ ...prev, image: file }));
    }
    onDatabaseFileUpload(file);
  };

  // Handle the main upload button click with proper validation
  const handleUploadClick = () => {
    if (!hasMapper) {
      alert("Please upload mapper.json first using the Mapper button below");
      return;
    }
    if (!hasAudioZip && !hasImageZip) {
      alert("Please upload either audios.zip or images.zip first");
      return;
    }
    setUploadType("content");
    setShowForm(true);
  };

  // Handle clicks on database section buttons with proper validation
  const handleDatabaseClick = (type: "mapper" | "audio" | "image") => {
    if (type === "mapper") {
      setUploadType(type);
      setShowForm(true);
      return;
    }

    if (!hasMapper) {
      alert("Please upload mapper.json first");
      return;
    }

    setUploadType(type);
    setShowForm(true);
  };

  // Define allowed formats for different file types
  const allowedFormats = {
    mapper: [".json", ".txt"],
    audio: [".zip"],
    image: [".zip"],
    content: {
      audio: [".mp3", ".wav", ".ogg", ".m4a", ".mid", ".midi"],
      image: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
    },
  };

  // Get current allowed formats based on context
  const getCurrentAllowedFormats = () => {
    if (uploadType === "content") {
      if (hasAudioZip && hasImageZip) {
        return [
          ...allowedFormats.content.audio,
          ...allowedFormats.content.image,
        ];
      }
      if (hasAudioZip) return allowedFormats.content.audio;
      if (hasImageZip) return allowedFormats.content.image;
      return [];
    }
    return allowedFormats[uploadType];
  };

  return (
    <div className="w-80 bg-gradient-to-b from-[#535353] to-[#303030] flex flex-col">

      <div className="flex-1 flex flex-col justify-center px-8 space-y-8">
        <h1 className="pl-10 pt-5 text-4xl text-[#DBDBDB]">Melodia.</h1>
        {/* Preview Card - Shows currently uploaded content file */}
        <div className="flex justify-center">
          <div className="w-[200px] h-[240px] bg-[#DBDBDB] rounded-lg overflow-hidden">
            {uploadedPreviewFile ? (
              <>
                <div className="h-[200px] bg-gray-300 flex items-center justify-center">
                  {uploadedPreviewFile.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(uploadedPreviewFile)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : isAudioFile(uploadedPreviewFile) ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-500">
                        {uploadedPreviewFile.name}
                      </span>
                      <button
                        className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          onPlayClick?.({
                            title: uploadedPreviewFile.name,
                            image: "/default-audio-image.jpg",
                            singer: "Unknown Artist",
                          });
                        }}
                      >
                        <svg
                          className="w-6 h-6"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-500">Unsupported file type</span>
                  )}
                </div>
                <div className="h-[40px] flex items-center justify-center">
                  <span className="text-black truncate px-2">
                    {uploadedPreviewFile.name}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="h-[200px] bg-gray-300 flex items-center justify-center text-gray-500">
                  No file
                </div>
                <div className="h-[40px] flex items-center justify-center">
                  <span className="text-black">Upload a file</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Upload Button Section */}
        <div className="flex justify-center border-b border-[#DBDBDB]/20 pb-6">
          <button
            onClick={handleUploadClick}
            disabled={!hasMapper || (!hasAudioZip && !hasImageZip)}
            className={`w-[200px] h-[40px] ${
              hasMapper && (hasAudioZip || hasImageZip)
                ? "bg-[#DBDBDB] hover:bg-gray-300"
                : "bg-gray-500 cursor-not-allowed"
            } text-black rounded-lg text-sm transition-colors`}
          >
            Upload
          </button>
        </div>

        {/* Information Section - Displays file statistics */}
        <div className="space-y-3">
          <h2 className="text-[28px] text-[#DBDBDB] font-light">
            Information:
          </h2>
          <div className="space-y-2 text-[#DBDBDB]/80 text-sm pl-2">
            <p>Total Songs: {hasAudioZip ? "100" : "-"}</p>
            <p>Images Size: {hasImageZip ? imageSize : "-"}</p>
            <p>Audios Size: {hasAudioZip ? audioSize : "-"}</p>
          </div>
        </div>

        {/* Database Section - System file management */}
        <div className="space-y-4">
          <h2 className="text-[28px] text-[#DBDBDB] font-light">Database:</h2>
          <div className="space-y-4">
            {/* Mapper Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleDatabaseClick("mapper")}
                className="w-20 h-8 bg-[#DBDBDB] hover:bg-gray-300 text-black rounded-lg text-sm"
              >
                Mapper
              </button>
              <span className="text-[#DBDBDB]/80 text-sm">
                Mapper: {hasMapper ? "mapper.json" : "-"}
              </span>
            </div>

            {/* Image Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleDatabaseClick("image")}
                disabled={!hasMapper}
                className={`w-20 h-8 ${
                  hasMapper
                    ? "bg-[#DBDBDB] hover:bg-gray-300"
                    : "bg-gray-500 cursor-not-allowed"
                } text-black rounded-lg text-sm`}
              >
                Image
              </button>
              <span className="text-[#DBDBDB]/80 text-sm">
                Image: {hasImageZip ? "images.zip" : "-"}
              </span>
            </div>

            {/* Audio Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleDatabaseClick("audio")}
                disabled={!hasMapper}
                className={`w-20 h-8 ${
                  hasMapper
                    ? "bg-[#DBDBDB] hover:bg-gray-300"
                    : "bg-gray-500 cursor-not-allowed"
                } text-black rounded-lg text-sm`}
              >
                Audio
              </button>
              <span className="text-[#DBDBDB]/80 text-sm">
                Audio: {hasAudioZip ? "audios.zip" : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Form Modal */}
      <Form
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onFileUpload={
          uploadType === "content" ? onContentFileUpload : handleDatabaseUpload
        }
        uploadType={uploadType}
        allowedFormats={getCurrentAllowedFormats()}
      />
    </div>
  );
};

export default SideBar;
