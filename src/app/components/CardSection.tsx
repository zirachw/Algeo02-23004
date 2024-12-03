"use client";
import React, { useState } from "react";
import CardList from "./CardList";
import Pagination from "./Pagination";
import songData from "../../../test/mapper.json";

// Define how many items we want to show per page
const ITEMS_PER_PAGE = 12; // We use 12 because it works well with our grid layout (2x2, 3x4, etc.)

// Add hasAudioZip to the interface
interface CardSectionProps {
  currentView: "audio" | "image";
  onSwitch: (view: "audio" | "image") => void;
  uploadedFile: File | null;
  searchQuery: string;
  onPlayClick: (song: { title: string; image: string; singer: string }) => void;
  hasAudioZip: boolean; // Add this prop
}

const CardSection: React.FC<CardSectionProps> = ({
  currentView,
  onSwitch,
  uploadedFile,
  searchQuery,
  onPlayClick,
  hasAudioZip, // Receive the prop
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Filter songs based on the search query
  const filteredSongs = songData.songs.filter(
    (song) =>
      song.song.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.singer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSongs.length / ITEMS_PER_PAGE);

  const currentData = filteredSongs
    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    .map((song) => ({
      title: song.song,
      image: `/images/${song.album}`,
      singer: song.singer,
      genre: song.genre,
    }));

  // Only allow play if we have audio files
  const handleCardPlay = (songData: {
    title: string;
    image: string;
    singer: string;
    genre: string;
  }) => {
    if (hasAudioZip && songData && songData.title) {
      onPlayClick({
        title: songData.title,
        image: songData.image,
        singer: songData.singer,
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col">
      <div>
        <CardList
          data={currentData}
          onPlayClick={handleCardPlay}
          hasAudioZip={hasAudioZip} // Pass to CardList
        />
      </div>
      <div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSongs.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default CardSection;
