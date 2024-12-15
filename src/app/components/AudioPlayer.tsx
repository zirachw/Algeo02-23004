import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";

interface AudioPlayerProps {
  isEnabled: File | null;
  currentSong: {
    title: string;
    image: string;
    singer: string;
    audio: string;
  };
}

export default function AudioPlayer({
  isEnabled,
  currentSong,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [midi, setMidi] = useState<Midi | null>(null);
  const [currentTime, setCurrentTime] = useState(0); 
  const [duration, setDuration] = useState(0); 
  const [volume, setVolume] = useState(0.8);
  const synthsRef = useRef<Tone.PolySynth[]>([]);

  useEffect(() => {
    if (currentSong?.audio) {
      // Load MIDI file
      fetch(currentSong.audio)
        .then((response) => response.arrayBuffer())
        .then((data) => {
          const midiData = new Midi(data);
          setMidi(midiData);

          const maxDuration = midiData.tracks.reduce(
            (max, track) =>
              Math.max(max, ...track.notes.map((note) => note.time + note.duration)),
            0
          );
          setDuration(maxDuration);
        })
        .catch((err) => console.error("Error loading MIDI file:", err));
    }
  }, [currentSong]);

  const playMidi = async () => {
    if (!midi) return;

    await Tone.start();
    Tone.Transport.stop();
    Tone.Transport.cancel();

    // Clear previous synths
    synthsRef.current.forEach((synth) => synth.dispose());
    synthsRef.current = [];

    // Schedule notes for each track
    midi.tracks.forEach((track) => {
      const synth = new Tone.PolySynth().toDestination();
      synth.volume.value = Tone.gainToDb(volume);
      synthsRef.current.push(synth);

      track.notes.forEach((note) => {
        Tone.Transport.schedule((time) => {
          synth.triggerAttackRelease(note.name, note.duration, time, note.velocity);
        }, note.time);
      });
    });

    Tone.Transport.start();
    setIsPlaying(true);

    // Start tracking playback time
    const interval = setInterval(() => {
      setCurrentTime(Tone.Transport.seconds);
    }, 100);
    return () => clearInterval(interval);
  };

  const pauseMidi = () => {
    Tone.Transport.pause();
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseMidi();
    } else {
      playMidi();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    synthsRef.current.forEach((synth) => {
      synth.volume.value = Tone.gainToDb(newVolume);
    });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  if (!isEnabled || !currentSong) {
    return null;
  }

  return (
    <div className="pl-10 w-full h-20 px-5 flex flex-row items-center bg-gradient-to-r from-[#303030] to-[#535353]">
      {/* Left section with fixed width */}
      <div className="w-[250px] flex-shrink-0 flex gap-x-5 items-center">
        <div className="w-10 h-10 bg-gray-200 flex-shrink-0">
          {currentSong.image && (
            <img
              src={`/temp_extracted/images/${currentSong.image}`}
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="text-white text-ml truncate">{currentSong.title}</div>
          {currentSong.singer && (
            <div className="text-white/60 text-l truncate">
              {currentSong.singer}
            </div>
          )}
        </div>
      </div>

      {/* Center section - Main player */}
      <div className="flex-1 flex justify-center">
        <div className="w-[500px] flex flex-col items-center gap-y-2">
          {/* Control buttons */}
          <div className="flex gap-x-4">
            {/* Previous button */}
            <button
              onClick={() => console.log("Previous track")}
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                src="/prevbutton.svg"
                width={24}
                height={24}
                alt="Previous"
                className="brightness-200"
              />
            </button>

            {/* Play/Pause button */}
            <button
              onClick={handlePlayPause}
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                src={isPlaying ? "/pausebutton.svg" : "/pausebutton.svg"}
                width={24}
                height={24}
                alt={isPlaying ? "Pause" : "Play"}
                className="brightness-200"
              />
            </button>

            {/* Next button */}
            <button
              onClick={() => console.log("Next track")}
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                src="/nextbutton.svg"
                width={24}
                height={24}
                alt="Next"
                className="brightness-200"
              />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex w-full gap-x-3 items-center">
            <div className="text-white text-sm flex-shrink-0">
              {formatTime(currentTime)}
            </div>
            <div className="relative flex-1 h-1 bg-white/20 rounded-full">
              <div
                className="absolute left-0 top-0 h-full bg-white rounded-full"
                style={{
                  width: `${(currentTime / duration) * 100}%`,
                  transition: "width 0.1s ease-in-out",
                }}
              ></div>
            </div>
            <div className="text-white text-sm flex-shrink-0">
              {formatTime(duration)}
            </div>
          </div>
        </div>
      </div>

      {/* Right section with fixed width */}
      <div className="w-[250px] flex-shrink-0 flex justify-end items-center gap-x-3 pr-12">
        <Image
          src="/volume.svg"
          width={20}
          height={20}
          alt="volume"
          className="brightness-200"
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 h-1 bg-white/20 rounded-full appearance-none"
        />
      </div>
    </div>
  );
}
