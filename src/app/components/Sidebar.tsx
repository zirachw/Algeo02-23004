import Image from "next/image";

export default function SideBar() {
  const dataButtons = ["Audio", "Image", "Mapper"];
  return (
    <div className="w-1/4 h-screen py-6 bg-gradient-to-b from-[#535353] to-[#303030] flex flex-col gap-y-4 items-center justify-center">
        <div id="header" className="relative right-20">
          <h1 className="text-white text-3xl">Hummify.</h1>
        </div>

        <div id="card">
          <div className="w-48 h-48 bg-white">

          </div>
        </div>

        <div className="w-full flex justify-center" id="upload">
          <button className="w-[60%]  text-black bg-[#DBDBDB] rounded-md">Upload MIDI</button>
        </div>

        <div id="record" className="w-48 h-48 border-y-2 border-white flex flex-col gap-y-4 items-center justify-center">
          <div id="circle" className="w-[60%] h-[60%] bg-white rounded-full"></div>
          <div><p>Recording: </p></div>
        </div>
        <div id="datasets" className="flex flex-row place-content-between">
            <div id="button" className="flex flex-col">
                {dataButtons.map((button) => (
                  <button key={button} className="w-28 bg-[#DBDBDB] text-black rounded-sm mx-2 my-3">
                    {button}
                  </button>
                ))}
            </div>

            <div id="data" className="flex flex-col">
                {dataButtons.map((button) => (
                  <p key={button} className="mx-2 my-3">
                    {button}: Anjay.zip
                  </p>
                ))}

            </div>
        </div>
    </div>
  );
}
