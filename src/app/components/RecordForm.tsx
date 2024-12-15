// VoiceRecorderForm.tsx
import React, { useState, useEffect, useCallback } from "react";
import Recorder from "recorder-js";
import Image from "next/image";

interface VoiceRecorderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (audioBlob: Blob) => void;
}

const VoiceRecorderForm: React.FC<VoiceRecorderFormProps> = ({ isOpen, onClose, onConfirm }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recorderInstance, setRecorderInstance] = useState<Recorder | null>(null);
  const [canRecord, setCanRecord] = useState(true);

  const resetRecording = useCallback(() => {
    if (recorderInstance) {
      recorderInstance.stop();
    }
    setAudioBlob(null);
    setRecorderInstance(null);
    setIsRecording(false);
    setCanRecord(true);
  }, [recorderInstance]);

  useEffect(() => {
    if (!isOpen) {
      resetRecording();
    }
  }, [isOpen, resetRecording]);

  const startRecording = async () => {
    if (!isRecording && canRecord) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const recorder = new Recorder(audioContext);

        await recorder.init(stream);
        recorder.start();

        setRecorderInstance(recorder);
        setIsRecording(true);
        setCanRecord(false);
      } catch (error) {
        console.error("Error starting recording:", error);
        alert("Please allow microphone access to record audio.");
      }
    }
  };

  const stopRecording = async () => {
    if (isRecording && recorderInstance) {
      const { blob } = await recorderInstance.stop();
      setAudioBlob(blob); // Blob is now in WAV format
      setIsRecording(false);
    }
  };

  const handleConfirm = () => {
    if (audioBlob) {
      onConfirm(audioBlob);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-xl p-8 w-[640px] max-w-3xl border-sky-100 shadow-[0_0_2px_#fff,inset_0_0_2px_#fff,0_0_5px_#fff,0_0_15px_#fff,0_0_30px_#fff]">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div>
                <Image src="/icon-voice.svg" width={56} height={56} alt="Icon Voice" />
            </div>
            <div>
              <h3 className="text-2xl font-medium text-black">Search By Humming</h3>
              <p className="text-base text-gray-500">Record your Angel Voice</p>
            </div>
          </div>
          <div className={`border-2 border-dashed rounded-lg border-[#303030] overflow-hidden`}>
            <div className="flex flex-col items-center px-8 py-12 text-center gap-8">
              <div className={`recording-icon ${isRecording ? "active" : ""}`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="120"
                    height="120"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#000000"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`recording-svg ${isRecording ? "animate" : ""}`}
                  >
                    <rect x="2" y="6" width="2" height="12" rx="1" />
                    <rect x="6" y="4" width="2" height="16" rx="1" />
                    <rect x="10" y="7" width="2" height="10" rx="1" />
                    <rect x="14" y="5" width="2" height="14" rx="1" />
                    <rect x="18" y="8" width="2" height="8" rx="1" />
                  </svg>
              </div>

              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!canRecord}
                className={`px-6 py-2 rounded-md text-white transition-colors ${
                  isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {isRecording ? "Stop Recording" : "Start Recording"}
              </button>

              <button
                onClick={resetRecording}
                disabled={isRecording || !audioBlob}
                className="px-6 py-2 bg-gray-300 text-gray-600 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">

            {isRecording && (
              <p className="text-red-500 text-center">Recording...</p>
            )}

            {audioBlob && (
              <audio controls className="w-full mt-4">
                <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            )}
    

            <button
              onClick={handleConfirm}
              disabled={!audioBlob}
              className={`w-full py-3 text-white rounded-md transition-colors text-base ${
                audioBlob ? "bg-green-500 hover:bg-green-600" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorderForm;
