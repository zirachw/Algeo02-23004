import React, { useState, useEffect } from "react";

interface ConvertFormProps {
  isOpen: boolean;
  onClose: () => void;
  onConvert: (file: File, isMonophonic: boolean) => void;
}

const ConvertForm: React.FC<ConvertFormProps> = ({
  isOpen,
  onClose,
  onConvert,
}) => {
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isMonophonic, setIsMonophonic] = useState<boolean | null>(null);

  const resetForm = () => {
    setDragging(false);
    setUploadProgress(0);
    setSelectedFile(null);
    setErrorMessage("");
    setIsMonophonic(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

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
      setErrorMessage("Please upload only one file at a time.");
      return;
    }

    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (file: File) => {
    setErrorMessage("");
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext !== "wav") {
      setErrorMessage("Invalid file format. Please upload a WAV file.");
      setSelectedFile(null);
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setErrorMessage("File size exceeds 50MB limit.");
      setSelectedFile(null);
      return;
    }

    simulateUpload(file); // Simulate file upload
  };

  const simulateUpload = (file: File) => {
    setSelectedFile(file);
    setUploadProgress(0);
    let progress = 0;

    const interval = setInterval(() => {
      progress += 10; // Increment progress by 10% every step
      setUploadProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 300); // Update progress every 300ms
  };

  const handleConfirm = () => {
    if (selectedFile && uploadProgress === 100 && isMonophonic !== null) {
      onConvert(selectedFile, isMonophonic);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-xl p-8 w-[640px] max-w-3xl shadow-md">
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
                  d="M12 5v14M5 12h14"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-medium text-black">
                Convert WAV to MIDI
              </h3>
              <p className="text-base text-gray-500">
                Upload your WAV file for conversion.
              </p>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg ${
              dragging ? "border-gray-400 bg-gray-50" : "border-gray-300"
            } transition-colors duration-200`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="px-8 py-12 text-center">
              {!selectedFile && (
                <>
                  <p className="mt-6 text-lg text-black">
                    Drag & drop or choose a WAV file
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".wav"
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

          {selectedFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-m">
                <div className="flex items-center gap-3">
                  <span className="text-black">{selectedFile.name}</span>
                  <span className="text-gray-700">{formatFileSize(selectedFile.size)}</span>
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
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <h4 className="text-lg text-center font-medium text-black">Select Type</h4>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setIsMonophonic(true)}
                  className={`px-4 py-2 rounded-md ${
                    isMonophonic === true
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-black hover:bg-gray-300"
                  }`}
                >
                  Monophonic
                </button>
                <button
                  onClick={() => setIsMonophonic(false)}
                  className={`px-4 py-2 rounded-md ${
                    isMonophonic === false
                      ? "bg-[#535353] text-white rounded-md hover:bg-[#303030] transition-colors"
                      : "bg-gray-200 text-black hover:bg-gray-300"
                  }`}
                >
                  Polyphonic
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{errorMessage}</p>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={
              !selectedFile ||
              uploadProgress < 100 ||
              errorMessage !== "" ||
              isMonophonic === null
            }
            className={`w-full py-3 ${
              selectedFile &&
              uploadProgress === 100 &&
              !errorMessage &&
              isMonophonic !== null
                ? "bg-[#535353] hover:bg-[#303030]"
                : "bg-[#DBDBCF] cursor-not-allowed"
            } text-white rounded-md`}
          >
            Convert
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConvertForm;
