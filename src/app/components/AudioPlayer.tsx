// AudioPlayer.tsx
import Image from "next/image";

interface AudioPlayerProps {
  isEnabled: boolean;
  currentSong: {
    title: string;
    image: string;
    singer: string;
  };
}

export default function AudioPlayer({
  isEnabled,
  currentSong,
}: AudioPlayerProps) {
  const imgButtons = ["/prevbutton.svg", "/pausebutton.svg", "/nextbutton.svg"];

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
              src={currentSong.image}
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
          <div className="flex gap-x-4">
            {imgButtons.map((src) => (
              <button key={src} className="hover:opacity-80 transition-opacity">
                <Image
                  src={src}
                  width={24}
                  height={24}
                  alt="control"
                  className="brightness-200"
                />
              </button>
            ))}
          </div>
          <div className="flex w-full gap-x-3 items-center">
            <div className="text-white text-sm flex-shrink-0">0:00</div>
            <div className="relative flex-1 h-1 bg-white/20 rounded-full">
              <div
                className="absolute left-0 top-0 h-full w-0 bg-white rounded-full"
                style={{ transition: "width 0.1s ease-in-out" }}
              ></div>
            </div>
            <div className="text-white text-sm flex-shrink-0">0:00</div>
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
        <div className="relative w-24 h-1 bg-white/20 rounded-full">
          <div
            className="absolute left-0 top-0 h-full w-4/5 bg-white rounded-full"
            style={{ transition: "width 0.1s ease-in-out" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
