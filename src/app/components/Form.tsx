// Form.tsx
import React, { useState, useEffect } from "react";
import JSZip from 'jszip';

interface FormProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File, totalSize?: number) => void;
  uploadType: "mapper" | "audio" | "image" | "content";
  allowedFormats: string[];
  hasAudioZip: boolean;
  hasImageZip: boolean;
}

const Form: React.FC<FormProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  uploadType,
  allowedFormats,
  hasAudioZip,
  hasImageZip,
}) => {
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [totalZipSize, setTotalZipSize] = useState<number>(0);
  const [fileCount, setFileCount] = useState<number>(0);

  const resetForm = () => {
    setDragging(false);
    setUploadProgress(0);
    setSelectedFile(null);
    setErrorMessage("");
    setTotalZipSize(0);
    setFileCount(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, uploadType]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    setErrorMessage("");

    if (e.dataTransfer.files.length > 1) {
      setErrorMessage("Please upload only one file at a time");
      return;
    }

    handleFileSelect(e.dataTransfer.files[0]);
  };

  const simulateUpload = (file: File) => {
    setSelectedFile(file);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 100);
  };

  const getValidationRules = () => {
    switch (uploadType) {
      case 'audio':
        return {
          acceptedFormats: ['.zip'],
          validContents: ['.mid', '.midi'],
          description: 'MIDI files'
        };
      case 'image':
        return {
          acceptedFormats: ['.zip'],
          validContents: ['.jpg', '.jpeg', '.png'],
          description: 'Image files'
        };
      case 'mapper':
        return {
          acceptedFormats: ['.json'],
          description: 'JSON file'
        };
      case 'content':
        return {
          acceptedFormats: allowedFormats,
          description: 'content files'
        };
    }
  };

  const getUploadDescription = () => {
    if (uploadType === 'mapper') return 'JSON file';
    if (uploadType === 'audio') return 'ZIP file containing MIDI files';
    if (uploadType === 'image') return 'ZIP file containing images';
    if (uploadType === 'content') {
      if (hasAudioZip && hasImageZip) {
        return 'Audio files (.mid, .midi) or Image files (.jpg, .jpeg, .png)';
      }
      if (hasAudioZip) return 'Audio files (.mid, .midi)';
      if (hasImageZip) return 'Image files (.jpg, .jpeg, .png)';
      return 'No supported files';
    }
    return 'Supported files';
  };

  const handleFileSelect = async (file: File) => {
    setErrorMessage("");
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
  
    // First check if the file format is allowed
    if (!allowedFormats.includes(ext)) {
      setErrorMessage(
        `Invalid file format. Please upload ${allowedFormats
          .map((format) => format.replace(".", ""))
          .join(", ")} files only.`
      );
      setSelectedFile(null);
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setErrorMessage("File size exceeds 10MB limit");
      setSelectedFile(null);
      return;
    }
  
    // Handle ZIP validation for audio and image types
    if ((uploadType === 'audio' || uploadType === 'image') && ext === '.zip') {
      try {
        const zip = await JSZip.loadAsync(file);
        let hasValidFiles = false;
        let invalidFiles: string[] = [];
        let totalSize = 0;
        let validFileCount = 0;
  
        // Define valid extensions based on upload type
        const validExtensions = uploadType === 'audio' 
          ? ['.mid', '.midi']
          : ['.jpg', '.jpeg', '.png'];
  
        await Promise.all(
          Object.keys(zip.files).map(async (filename) => {
            const zipFile = zip.files[filename];
            if (!zipFile.dir) {
              const fileExt = "." + filename.split(".").pop()?.toLowerCase();
              if (!validExtensions.includes(fileExt)) {
                invalidFiles.push(filename);
              } else {
                const fileData = await zipFile.async('blob');
                totalSize += fileData.size;
                validFileCount++;
                hasValidFiles = true;
              }
            }
          })
        );
        
        if (invalidFiles.length > 0) {
          setErrorMessage(
            `Invalid files found in ZIP:\n${invalidFiles.slice(0, 3).join(", ")}${
              invalidFiles.length > 3 ? ` and ${invalidFiles.length - 3} more` : ""
            }\n\nPlease ensure ZIP contains only ${uploadType === 'audio' ? 'MIDI' : 'image'} files.`
          );
          setSelectedFile(null);
          return;
        }
        
        if (!hasValidFiles) {
          setErrorMessage(
            `ZIP file is empty or contains no valid ${uploadType === 'audio' ? 'MIDI' : 'image'} files.`
          );
          setSelectedFile(null);
          return;
        }
  
        setTotalZipSize(totalSize);
        setFileCount(validFileCount);
      } catch (error) {
        console.error("Error validating zip contents:", error);
        setErrorMessage("Error reading ZIP file. Please ensure it's a valid archive.");
        setSelectedFile(null);
        return;
      }
    }
  
    simulateUpload(file);
  };

  const handleConfirm = () => {
    if (selectedFile && uploadProgress === 100) {
      onFileUpload(selectedFile, totalZipSize || selectedFile.size);
      handleClose();
    }
  };

  if (!isOpen) return null;

  const rules = getValidationRules();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-xl p-8 w-[640px] max-w-3xl border-sky-100 shadow-[0_0_2px_#fff,inset_0_0_2px_#fff,0_0_5px_#fff,0_0_15px_#fff,0_0_30px_#fff]">
        <button
          onClick={handleClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M18 6L6 18M6 6l12 12"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-full">
              <svg
                className="w-8 h-8 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-medium text-black">Upload files</h3>
              <p className="text-base text-gray-500">
                Select and Upload a file
              </p>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg ${
              dragging ? "border-gray-400 bg-gray-50" : "border-[#303030]"
            } transition-colors duration-200`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="px-8 py-12 text-center">
              {!selectedFile && (
                <>
                  <svg
                    className="mx-auto h-16 w-16 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mt-6 text-lg text-black">
                    Choose a file or drag & drop it here
                  </p>
                  <p className="mt-2 text-m text-gray-700">
                    {getUploadDescription()}
                  </p>
                  <p className="mt-2 text-m text-gray-700">
                   ~ Max 10MB ~
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    accept={allowedFormats.join(",")}
                    onChange={(e) =>
                      e.target.files?.[0] && handleFileSelect(e.target.files[0])
                    }
                    id="file-upload"
                  />
                  <button
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                    className="mt-6 px-6 py-2.5 bg-[#535353] text-white rounded-md hover:bg-[#303030] transition-colors"
                  >
                    Browse File
                  </button>
                </>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 whitespace-pre-line">{errorMessage}</p>
            </div>
          )}

          {selectedFile && !errorMessage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-m">
                <div className="flex items-center gap-3">
                  <span className="text-black">{selectedFile.name}</span>
                  {selectedFile.name.endsWith('.zip') ? (
                    <div className="text-gray-700">
                      <span>{formatFileSize(totalZipSize)} total</span>
                      <span className="ml-2">({fileCount} files)</span>
                    </div>
                  ) : (
                    <span className="text-gray-700">
                      {formatFileSize(selectedFile.size)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#303030]">{uploadProgress}%</span>
                  {uploadProgress === 100 && (
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-[#303030] h-1 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={
              !selectedFile || uploadProgress !== 100 || errorMessage !== ""
            }
            className={`w-full py-3 ${
              selectedFile && uploadProgress === 100 && !errorMessage
                ? "bg-[#535353] hover:bg-[#303030]"
                : "bg-[#DBDBCF] cursor-not-allowed"
            } text-white rounded-md transition-colors text-base`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default Form;