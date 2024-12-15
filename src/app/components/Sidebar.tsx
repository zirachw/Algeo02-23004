// Sidebar.tsx
"use client";
import React, { useState } from "react";
import Form from "./Form";

interface SideBarProps {
  onDatabaseFileUpload: (file: File, type: "mapper" | "audio" | "image") => void;
  onContentFileUpload: (file: File) => void;
  Mapper: File | null;
  AudioZip: File | null;
  ImageZip: File | null;
  uploadedPreviewFile: File | null;
  currentSong: { title: string; image: string; singer: string } | null;
  onPlayClick?: (song: {
    title: string;
    image: string;
    singer: string;
    audio: string;
  }) => void;
}

const SideBar: React.FC<SideBarProps> = ({
  onDatabaseFileUpload,
  onContentFileUpload,
  Mapper,
  AudioZip,
  ImageZip,
  uploadedPreviewFile,
  onPlayClick,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [uploadType, setUploadType] = useState<"mapper" | "audio" | "image" | "content">("mapper");
  const [audioSize, setAudioSize] = useState<string>("0");
  const [imageSize, setImageSize] = useState<string>("0");
  const [mapperFilename, setMapperFilename] = useState<string>("");
  const [audioFilename, setAudioFilename] = useState<string>("");
  const [imageFilename, setImageFilename] = useState<string>("");

  const isAudioFile = (file: File): boolean => {
    const fileExt = file.name.toLowerCase().split(".").pop() || "";
    return ["mid", "midi", "mp3", "wav", "ogg", "m4a"].includes(fileExt);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDatabaseUpload = (file: File, totalSize?: number) => {
    if (uploadType === 'mapper') {
      setMapperFilename(file.name);
      onDatabaseFileUpload(file, "mapper");
      
    } else if (uploadType === 'audio') {
      setAudioFilename(file.name);
      setAudioSize(formatFileSize(totalSize || file.size));
      onDatabaseFileUpload(file, "audio");
    } else if (uploadType === 'image') {
      setImageFilename(file.name);
      setImageSize(formatFileSize(totalSize || file.size));
      onDatabaseFileUpload(file, "image");
    }
  };

  const handleUploadClick = () => {
    if (!Mapper) {
      alert("Please upload mapper.json first using the Mapper button below");
      return;
    }
    if (!AudioZip && !ImageZip) {
      alert("Please upload either an audio ZIP or image ZIP file first");
      return;
    }
    setUploadType("content");
    setShowForm(true);
  };

  const handleDatabaseClick = (type: "mapper" | "audio" | "image") => {
    if (type === "mapper") {
      setUploadType(type);
      setShowForm(true);
      return;
    }

    if (!Mapper) {
      alert("Please upload mapper.json first");
      return;
    }

    setUploadType(type);
    setShowForm(true);
  };

  const allowedFormats = {
    mapper: [".json"],
    audio: [".zip"],
    image: [".zip"],
    content: {
      audio: [".mid", ".midi"],
      image: [".jpg", ".jpeg", ".png"]
    }
  };

  const getCurrentAllowedFormats = () => {
    if (uploadType === "content") {
      if (AudioZip && ImageZip) {
        return [...allowedFormats.content.audio, ...allowedFormats.content.image];
      }
      if (AudioZip) return allowedFormats.content.audio;
      if (ImageZip) return allowedFormats.content.image;
      return [];
    }
    return allowedFormats[uploadType];
  };

  return (
    <div className="w-1/5 bg-gradient-to-b from-[#535353] to-[#303030] flex flex-col">

      <div className="flex-1 flex flex-col justify-normal items-center px-8 space-y-8">
        <h1 className="text-4xl text-[#DBDBDB]">Melodia.</h1>
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
                            audio: "audio/temp.mid"
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

        <div className="flex justify-center border-b border-[#DBDBDB]/20 pb-6">
          <button
            onClick={handleUploadClick}
            disabled={!Mapper || (!AudioZip && !ImageZip)}
            className={`w-[200px] h-[40px] ${
              Mapper && (AudioZip || ImageZip)
                ? "bg-[#DBDBDB] hover:bg-gray-300"
                : "bg-gray-500 cursor-not-allowed"
            } text-black rounded-lg text-sm transition-colors`}
          >
            Upload
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-[28px] text-[#DBDBDB] font-light">
            Information:
          </h2>
          <div className="space-y-2 text-[#DBDBDB]/80 text-sm pl-2">
            <p>Total Songs: {audioFilename ? "100" : "-"}</p>
            <p>Images Size: {imageFilename ? imageSize : "-"}</p>
            <p>Audios Size: {audioFilename ? audioSize : "-"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[28px] text-[#DBDBDB] font-light">Database:</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleDatabaseClick("mapper")}
                className="w-20 h-8 bg-[#DBDBDB] hover:bg-gray-300 text-black rounded-lg text-sm"
              >
                Mapper
              </button>
              <span className="text-[#DBDBDB]/80 text-sm">
                Mapper: {mapperFilename || "-"}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => handleDatabaseClick("image")}
                disabled={!Mapper}
                className={`w-20 h-8 ${
                  Mapper
                    ? "bg-[#DBDBDB] hover:bg-gray-300"
                    : "bg-gray-500 cursor-not-allowed"
                } text-black rounded-lg text-sm`}
              >
                Image
              </button>
              <span className="text-[#DBDBDB]/80 text-sm">
                Image: {imageFilename || "-"}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => handleDatabaseClick("audio")}
                disabled={!Mapper}
                className={`w-20 h-8 ${
                  Mapper
                    ? "bg-[#DBDBDB] hover:bg-gray-300"
                    : "bg-gray-500 cursor-not-allowed"
                } text-black rounded-lg text-sm`}
              >
                Audio
              </button>
              <span className="text-[#DBDBDB]/80 text-sm">
                Audio: {audioFilename || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Form
        AudioZip={AudioZip}
        ImageZip={ImageZip}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onFileUpload={uploadType === "content" ? onContentFileUpload : handleDatabaseUpload}
        uploadType={uploadType}
        allowedFormats={getCurrentAllowedFormats()}
      />
    </div>
  );
};

export default SideBar;