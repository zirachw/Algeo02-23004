// CardList.tsx
import React from "react";
import Card from "./Card";

interface CardListProps {
  data: {
    title: string;
    image: string;
    singer: string;
    genre: string;
  }[];
  onPlayClick?: (song: {
    title: string;
    image: string;
    singer: string;
    genre: string;
  }) => void;
  AudioZip: File | null;
}

const CardList: React.FC<CardListProps> = ({
  data,
  onPlayClick,
  AudioZip,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-4">
      {data.map((item, index) => (
        <Card
          key={index}
          title={item.title}
          imgUrl={item.image}
          singer={item.singer}
          genre={item.genre}
          onPlayClick={() => onPlayClick?.(item)}
          AudioZip={AudioZip}
        />
      ))}
    </div>
  );
};

export default CardList;