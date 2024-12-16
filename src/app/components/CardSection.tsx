// CardSection.tsx
"use client";
import React, { useState } from "react";
import CardList from "./CardList";
import Pagination from "./Pagination";
import songData from "../../../test/mapper.json";

const ITEMS_PER_PAGE = 12;
interface Song {
  song: string;
  singer: string;
  album: string;
  genre: string;
  audio: string;
}

// Define the interface for the similarData prop
interface SimilarData {
  matching_results: Song[];
}

interface CardSectionProps {
  similarData: SimilarData | null;
  uploadedFile: File | null;
  searchQuery: string;
  onPlayClick: (song: {
    title: string;
    image: string;
    singer: string;
    audio: string;
  }) => void;
  AudioZip: File | null;
  ImageZip: File | null;
  Mapper: File | null;
}

const CardSection: React.FC<CardSectionProps> = ({
  similarData,
  searchQuery,
  onPlayClick,
  AudioZip,
  ImageZip,
  Mapper,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const Songs = similarData ? similarData.matching_results : songData.songs;
  if (similarData)
    console.log(
      "this is similarData.matching_results: ",
      similarData.matching_results
    );
  const filteredSongs = Songs.filter(
    (song) =>
      song.song.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.singer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSongs.length / ITEMS_PER_PAGE);

  const currentData = filteredSongs
    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    .map((song) => ({
      title: song.song,
      image: `${song.album}`,
      singer: song.singer,
      genre: song.genre,
      audio: `${song.audio}`,
    }));

  const handleCardPlay = (songData: {
    title: string;
    image: string;
    singer: string;
    genre: string;
    audio: string;
  }) => {
    if (AudioZip && songData && songData.title) {
      onPlayClick({
        title: songData.title,
        image: songData.image,
        singer: songData.singer,
        audio: songData.audio,
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full flex flex-col h-full px-12">
      {filteredSongs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-black">
            <h2 className="text-4xl font-medium mb-2">No results found</h2>
            <p>Try searching for something else or upload a new file</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-grow overflow-y-auto">
            <CardList
              data={currentData}
              onPlayClick={handleCardPlay}
              AudioZip={AudioZip}
              ImageZip={ImageZip}
              Mapper={Mapper}
            />
          </div>
          <div className="py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSongs.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CardSection;
