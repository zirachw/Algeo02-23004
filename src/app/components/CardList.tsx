import React from 'react';
import Card from './Card'; // Menggunakan komponen Card yang telah dibuat sebelumnya

interface CardListProps {
  data: { title: string; image: string }[];
}

const CardList: React.FC<CardListProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-5 gap-6">
      {data.map((item, index) => (
        <Card key={index} title={item.title} imgUrl={item.image} />
      ))}
    </div>
  );
};

export default CardList;
