// CardSection.tsx
"use client";
import React, { useState } from "react";
import CardList from "./CardList";
import Pagination from "./Pagination";
import songData from "../../../test/mapper.json";

const ITEMS_PER_PAGE = 12;

interface CardSectionProps {
  currentView: "audio" | "image";
  onSwitch: (view: "audio" | "image") => void;
  uploadedFile: File | null;
  searchQuery: string;
  onPlayClick: (song: { title: string; image: string; singer: string }) => void;
  hasAudioZip: boolean;
}

const CardSection: React.FC<CardSectionProps> = ({
  currentView,
  onSwitch,
  uploadedFile,
  searchQuery,
  onPlayClick,
  hasAudioZip,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

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

  const handleCardPlay = (songData: {
    title: string;
    image: string;
    singer: string;
    genre: string;
  }) => {
    if (hasAudioZip && currentView === "audio" && songData && songData.title) {
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
          hasAudioZip={hasAudioZip}
          currentView={currentView}
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