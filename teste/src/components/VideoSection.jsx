import React from 'react';
import { Play } from 'lucide-react';
import './styles/VideoSection.css';

const videos = [
    {
        id: 1,
        title: "Como queimar água (Tutorial Completo)",
        thumbnail: "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?q=80&w=1000&auto=format&fit=crop",
        duration: "10:01",
        views: "1.2M visualizações",
        link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // Rick Roll (ou qualquer link)
    },
    {
        id: 2,
        title: "Miojo Gourmet em 3 etapas simples",
        thumbnail: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=1000&auto=format&fit=crop",
        duration: "03:45",
        views: "850K visualizações",
        link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
        id: 3,
        title: "O segredo do Ovo Frito perfeito (quebrou a gema)",
        thumbnail: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?q=80&w=1000&auto=format&fit=crop",
        duration: "05:20",
        views: "500K visualizações",
        link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
];

const VideoSection = () => {
    return (
        <section className="video-section">
            <div className="container">
                <h2 className="section-title">Aulas de "Culminária"</h2>
                <div className="video-grid">
                    {videos.map((video) => (
                        <a href={video.link} target="_blank" rel="noopener noreferrer" key={video.id} className="video-card">
                            <div className="video-thumbnail-container">
                                <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
                                <div className="play-button">
                                    <Play size={24} fill="white" />
                                </div>
                            </div>
                            <div className="video-info">
                                <h3 className="video-title">{video.title}</h3>
                                <div className="video-meta">
                                    <span>{video.views}</span>
                                    <span>{video.duration}</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default VideoSection;
