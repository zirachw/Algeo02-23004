import React from 'react';
import Card from './Card';

interface ProjectData {
    image: string;
    title: string;
}

const projectData: ProjectData[] = [
  {
    title: "audio1",
    image: "https://via.placeholder.com/300x300.png?text=Album+Cover",
  },
  {
    title: "audio2",
    image: "https://via.placeholder.com/300x300.png?text=Album+Cover",
  },
  {
    title: "audio3",
    image: "https://via.placeholder.com/300x300.png?text=Album+Cover",
  },
  {
    title: "audio4",
    image: "https://via.placeholder.com/300x300.png?text=Album+Cover",
  },
  {
    title: "audio5",
    image: "https://via.placeholder.com/300x300.png?text=Album+Cover",
  },
  {
    title: "audio6",
    image: "https://via.placeholder.com/300x300.png?text=Album+Cover",
  },
  {
    title: "audio7",
    image: "https://via.placeholder.com/300x300.png?text=Album+Cover",
  },
  {
    title: "audio8",
    image: "https://via.placeholder.com/300x300.png?text=Album+Cover",
  },
  {
    title: "audio9",
    image: "https://via.placeholder.com/300x300.png?text=Album+Cover",
  },
  {
    title: "audio10",
    image: "https://via.placeholder.com/300x300.png?text=Album+Cover",
  },
];

const CardSection: React.FC = () => {
  return (
    <section id="projects" className='px-4 xl:gap-8 xl:px-16 items-center'>
      <div className='grid md:grid-cols-5 gap-8 md:gap-12'>
        {projectData.map((project) => (
          <Card
            title={project.title} 
            imgUrl={project.image} 
          />
        ))}
      </div>
    </section>
  );
};

export default CardSection;
