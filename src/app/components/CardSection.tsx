"use client";
import React, { useState } from 'react';
import CardList from './CardList';
import Switch from './Switch';
import Pagination from './Pagination';

interface CardSectionProps {
  currentView: "audio" | "image";
  onSwitch: (view: "audio" | "image") => void;
}

// Data dummy untuk Audio dan Image
const audioData = Array.from({ length: 100 }, (_, i) => ({
  title: `Audio ${i + 1}`,
  image: 'https://via.placeholder.com/300x300.png?text=Album+Cover',
}));

const ITEMS_PER_PAGE = 10;

const CardSection: React.FC<CardSectionProps> = ({ currentView, onSwitch }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(audioData.length / ITEMS_PER_PAGE);

  const currentData = audioData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  return (
    <section className="px-4 xl:px-16">
      {/* Navigasi Switch */}
      <Switch currentView={currentView} onSwitch={onSwitch} />

      {/* Grid Card */}
      <CardList data={currentData} />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={audioData.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={handlePageChange}
      />
    </section>
  );
};

export default CardSection;
