"use client";
import React, { useState } from 'react';
import CardList from './CardList';
import Switch from './Switch';
import Pagination from './Pagination';

// Data dummy untuk Audio dan Image
const audioData = Array.from({ length: 100 }, (_, i) => ({
  title: `Audio ${i + 1}`,
  image: 'https://via.placeholder.com/300x300.png?text=Album+Cover',
}));

const imageData = Array.from({ length: 30 }, (_, i) => ({
  title: `Image ${i + 1}`,
  image: 'https://via.placeholder.com/300x300.png?text=Image+Gallery',
}));

const ITEMS_PER_PAGE = 10;

const CardSection: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentView, setCurrentView] = useState<'audio' | 'image'>('audio');

  const totalPages = Math.ceil(
    (currentView === 'audio' ? audioData : imageData).length / ITEMS_PER_PAGE
  );

  // Menentukan data yang akan ditampilkan berdasarkan switch
  const currentData = (currentView === 'audio' ? audioData : imageData).slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSwitch = (view: 'audio' | 'image') => {
    setCurrentView(view);
    setCurrentPage(1); // Reset halaman ke 1 saat berpindah view
  };

  return (
    <section className="px-4 xl:px-16">
      {/* Navigasi Switch */}
      <Switch currentView={currentView} onSwitch={handleSwitch} />

      {/* Grid Card */}
      <CardList data={currentData} />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={currentView === 'audio' ? audioData.length : imageData.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={handlePageChange}
      />
    </section>
  );
};

export default CardSection;
