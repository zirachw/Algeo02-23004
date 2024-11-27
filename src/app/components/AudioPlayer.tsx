import Image from "next/image";
export default function AudioPlayer() {
  const imgButtons = ["/prevbutton.svg", "/pausebutton.svg","/nextbutton.svg"];
  return (
    <div className="w-full h-20 px-5 gap-x-5 flex flex-row items-center justify-between bg-gradient-to-r from-[#303030] to-[#535353]">
        <div id="song" className="flex gap-x-5">
            <div id="songpicture" className="w-10 h-10 bg-white"></div>
            <div id="songname" className="my-auto">Audio.mid</div>
        </div>
        <div id="mainplayer" className="flex flex-col w-1/2 items-center">
            <div id="buttons" className="flex">
                {imgButtons.map((src) => (
                    <button>
                        <Image src={src} width={30} height={30} alt="prev"/>
                    </button>
                ))}
            </div>
            <div id="track" className="flex w-full gap-x-3">
                <div id="start">2:39</div>
                <div id="tracekr" className="w-full h-1 bg-white rounded-lg my-auto"></div>
                <div id="end">4:22</div>
            </div>
        </div>
        <div id="volume" className="flex">
            <Image src="/volume.svg" width={25} height={25} alt="prev"/>
            <div id="volumevalue" className="w-20 h-1 bg-white rounded-lg my-auto"></div>
        </div>
    </div>
  );
}
