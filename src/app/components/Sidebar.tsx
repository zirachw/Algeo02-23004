import Image from "next/image";
import Card from "./Card";
export default function SideBar() {
  const dataButtons = ["Audio", "Image", "Mapper"];
  return (
    <div className="w-1/4 h-screen py-6 bg-gradient-to-b from-[#535353] to-[#303030] flex flex-col gap-y-4 items-center justify-center">
        <div id="header" className="relative right-20">
          <h1 className="text-white text-3xl">Hummify.</h1>
        </div>

        <div id="card">
          <Card
            imgUrl="https://via.placeholder.com/300x300.png?text=Album+Cover"
            title="Mind Games"  // Nama album atau lagu
          />
        </div>


        <div className="w-full flex justify-center" id="upload">
          <button className="w-56  text-black bg-[#DBDBDB] rounded-md">Upload MIDI (.mid)</button>
        </div>



        <div id="record" className="w-56 h-48 border-y-[1px] py-4 border-white flex flex-col gap-y-4 items-center justify-center">
          <div id="circle" className="w-24 h-24 bg-white rounded-full"></div>
          <div><p className="text-sm">Recording: </p></div>
        </div>


        <div id="datasets" className="w-56 flex flex-row place-content-between">
            <div id="button" className="flex flex-col">
                {dataButtons.map((button) => (
                  <button key={button} className="w-20 bg-[#DBDBDB] text-black rounded-lg mx-2 my-3 h-7">
                    {button}
                  </button>
                ))}
            </div>

            <div id="data" className="flex flex-col">
                {dataButtons.map((button) => (
                  <p key={button} className="text-sm mx-2 my-3 h-7 flex items-center">
                    {button}: Anjay.zip
                  </p>
                ))}

            </div>
        </div>
    </div>
  );
}
