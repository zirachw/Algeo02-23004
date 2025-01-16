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

    export default function AudioPlayer({ isEnabled, currentSong }: AudioPlayerProps) {
      const [isPlaying, setIsPlaying] = useState(false);
      const [midi, setMidi] = useState<Midi | null>(null);
      const [currentTime, setCurrentTime] = useState(0);
      const [duration, setDuration] = useState(0);
      const [volume, setVolume] = useState(0.8);
      const synthsRef = useRef<Tone.PolySynth[]>([]);
      const intervalRef = useRef<NodeJS.Timeout | null>(null);
      const [isPaused, setIsPaused] = useState(false); // Track pause status
      const playedNotesRef = useRef<Set<number>>(new Set()); // Track played notes by their time

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

        // Reset player state when the song changes
        stopAllNotes();
        setIsPlaying(false);
        setCurrentTime(0);
        Tone.Transport.stop();
        Tone.Transport.cancel();

        return () => {
          if (intervalRef.current) clearInterval(intervalRef.current);
        };
      }, [currentSong]);

      const stopAllNotes = () => {
        // Hentikan semua nada
        synthsRef.current.forEach((synth) => synth.releaseAll());
        synthsRef.current.forEach((synth) => synth.dispose());
        synthsRef.current = [];
      
        // Hentikan transport dan reset jadwal
        Tone.Transport.stop();
        Tone.Transport.cancel();
      
        // Bersihkan waktu nada yang dimainkan
        playedNotesRef.current.clear();
        setCurrentTime(0);
      };

      const playMidi = async () => {
        if (!midi) return;
      
        await Tone.start(); // Ensure audio context is started
      
        if (isPaused) {
          // Continue from the current position if paused
          Tone.Transport.start();
          setIsPaused(false);
        } else {
          // If starting from the beginning, reset and schedule notes
          Tone.Transport.stop();
          Tone.Transport.cancel();
      
          // Clear previous synths
          synthsRef.current.forEach((synth) => synth.dispose());
          synthsRef.current = [];
          playedNotesRef.current.clear(); // Reset played notes
      
          midi.tracks.forEach((track) => {
            const synth = new Tone.PolySynth().toDestination();
            synth.volume.value = Tone.gainToDb(volume);
            synthsRef.current.push(synth);
      
            track.notes.forEach((note) => {
              if (!playedNotesRef.current.has(note.time)) {
                Tone.Transport.schedule((time) => {
                  synth.triggerAttackRelease(note.name, note.duration, time, note.velocity);
                  playedNotesRef.current.add(note.time); // Mark note as played
                }, note.time);
              }
            });
          });
      
          Tone.Transport.start();
        }
      
        setIsPlaying(true);
      
        // Start tracking playback time
        intervalRef.current = setInterval(() => {
          setCurrentTime(Tone.Transport.seconds);
        }, 100);
      };
      
      const pauseMidi = () => {
        Tone.Transport.pause(); // Pause transport
        setIsPlaying(false);
        setIsPaused(true); // Mark as paused
      
        // Stop all currently playing notes
        synthsRef.current.forEach((synth) => {
          synth.releaseAll();
        });
      
        // Clear progress tracking
        if (intervalRef.current) clearInterval(intervalRef.current);
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

      const handleSeek = (newTime: number) => {
        setCurrentTime(newTime);
        Tone.Transport.seconds = newTime; // Set posisi playback
      };

      const formatTime = (time: number) => {
        const clampedTime = Math.min(time, duration); // Clamp time to not exceed duration
        const minutes = Math.floor(clampedTime / 60);
        const seconds = Math.floor(clampedTime % 60).toString().padStart(2, "0");
        return `${minutes}:${seconds}`;
      };

      if (!isEnabled || !currentSong) {
        return null;
      }

      return (
        <div className="pl-10 w-full h-20 px-5 flex flex-row items-center bg-gradient-to-r from-[#303030] to-[#535353]">
          {/* Left section */}
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
                <div className="text-white/60 text-l truncate">{currentSong.singer}</div>
              )}
            </div>
          </div>

          {/* Center section */}
          <div className="flex-1 flex justify-center">
            <div className="w-[500px] flex flex-col items-center gap-y-2">
              <div className="flex gap-x-4">
                <button onClick={handlePlayPause} className="hover:opacity-80">
                  <Image src={isPlaying ? "/icon-pause.svg" : "/icon-play.svg"} width={24} height={24} alt="Play/Pause" />
                </button>
                <button onClick={() => console.log("Next track")} className="hover:opacity-80">
                  <Image src="/nextbutton.svg" width={24} height={24} alt="Next" />
                </button>
              </div>
              <div className="flex w-full gap-x-3 items-center">
                <div className="text-white text-sm flex-shrink-0">
                  {formatTime(currentTime)}
                </div>
                <div className="relative flex-1 h-1 bg-white/20 rounded-full">
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={currentTime}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="absolute w-full h-full appearance-none bg-transparent cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, white 0%, white ${(currentTime / duration) * 100}%, rgba(255, 255, 255, 0.2) ${(currentTime / duration) * 100}%, rgba(255, 255, 255, 0.2) 100%)`,
                    }}
                  />
                </div>
                <div className="text-white text-sm flex-shrink-0">
                  {formatTime(duration)}
                </div>
              </div>
            </div>
          </div>

          <div className="w-[250px] flex-shrink-0 flex justify-end items-center gap-x-3 pr-12">
            <Image src="/volume.svg" width={20} height={20} alt="Volume" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, white 0%, white ${
                  volume * 100
                }%, rgba(255, 255, 255, 0.2) ${volume * 100}%, rgba(255, 255, 255, 0.2) 100%)`,
              }}
            />
          </div>
        </div>
      );
    }
