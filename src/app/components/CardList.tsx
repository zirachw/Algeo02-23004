// CardList.tsx
import React from "react";
import Card from "./Card";

interface CardListProps {
  data: {
    title: string;
    image: string;
    singer: string;
    similarity_percentage: number;
    audio: string;
  }[];
  onPlayClick?: (song: {
    title: string;
    image: string;
    singer: string;
    similarity_percentage: number;
    audio: string;
  }) => void;
  AudioZip: File | null;
  ImageZip: File | null;
  Mapper: File | null;
}

const CardList: React.FC<CardListProps> = ({
  data,
  onPlayClick,
  AudioZip,
  ImageZip,
  Mapper,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {data.map((item, index) => (
        <Card
          key={index}
          title={item.title}
          imgUrl={item.image}
          singer={item.singer}
          similarity_percentage={item.similarity_percentage}
          onPlayClick={() => onPlayClick?.(item)}
          AudioZip={AudioZip}
          ImageZip={ImageZip}
          Mapper={Mapper}
        />
      ))}
    </div>
  );
};

export default CardList;
