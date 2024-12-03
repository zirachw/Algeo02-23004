// Form.tsx
import React, { useState, useEffect } from "react";

interface FormProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
  uploadType: "mapper" | "audio" | "image" | "content";
  allowedFormats: string[];
}

const Form: React.FC<FormProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  uploadType,
  allowedFormats,
}) => {
  // State management for form interactions and visual feedback
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Reset all form states to their initial values
  const resetForm = () => {
    setDragging(false);
    setUploadProgress(0);
    setSelectedFile(null);
    setErrorMessage("");
  };

  // Properly handle form closure with cleanup
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Reset form when it opens or upload type changes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, uploadType]);

  // Handle drag over event for visual feedback
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  // Reset drag state when leaving the drop zone
  const handleDragLeave = () => {
    setDragging(false);
  };

  // Handle file drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    setErrorMessage(""); // Clear any previous error

    if (e.dataTransfer.files.length > 1) {
      setErrorMessage("Please upload only one file at a time");
      return;
    }

    handleFileSelect(e.dataTransfer.files[0]);
  };

  // Simulate file upload with progress
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

  // Process file selection and validate format
  const handleFileSelect = (file: File) => {
    setErrorMessage(""); // Clear any previous error
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (allowedFormats.includes(ext)) {
      simulateUpload(file);
    } else {
      setErrorMessage(
        `Invalid file format. Allowed formats: ${allowedFormats
          .map((format) => format.replace(".", ""))
          .join(", ")}`
      );
      setSelectedFile(null);
    }
  };

  // Handle final confirmation of upload
  const handleConfirm = () => {
    if (selectedFile && uploadProgress === 100) {
      onFileUpload(selectedFile);
      handleClose();
    }
  };

  // Don't render anything if form is not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-white rounded-xl p-8 w-[640px] max-w-3xl border-sky-100 shadow-[0_0_2px_#fff,inset_0_0_2px_#fff,0_0_5px_#fff,0_0_15px_#fff,0_0_30px_#fff]">
        {/* Close button */}
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
          {/* Header */}
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

          {/* Drop zone */}
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
                    {allowedFormats
                      .map((format) => format.replace(".", ""))
                      .join(", ")}{" "}
                    formats. Up to 10MB
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

          {/* Error Message */}
          {errorMessage && (
            <p className="text-red-500 text-center">{errorMessage}</p>
          )}

          {/* Upload Progress */}
          {selectedFile && !errorMessage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-m">
                <div className="flex items-center gap-3">
                  <span className="text-black">{selectedFile.name}</span>
                  <span className="text-gray-700">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
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

          {/* Confirm button */}
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
