import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import './styles/BannerCarousel.css';

const slides = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop',
        title: 'Gourmet da Depressão',
        subtitle: 'Onde a tristeza vira tempero (e piada)'
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop',
        title: 'Pizza de Ontem',
        subtitle: 'Mais fria que o coração da/do ex'
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1780&auto=format&fit=crop',
        title: 'Salada "Detox"',
        subtitle: 'Pra compensar as 15 fatias de bacon'
    }
];

const BannerCarousel = () => {
    return (
        <div className="banner-carousel">
            <Swiper
                modules={[Navigation, Pagination, Autoplay, EffectFade]}
                effect="fade"
                spaceBetween={0}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                loop={true}
                className="mySwiper"
            >
                {slides.map((slide) => (
                    <SwiperSlide key={slide.id}>
                        <div
                            className="swiper-slide-content"
                            style={{
                                backgroundImage: `url(${slide.image})`,
                                width: '100%',
                                height: '100%',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            <div className="banner-overlay"></div>
                            <div className="banner-content container">
                                <h2 className="banner-title">{slide.title}</h2>
                                <p className="banner-subtitle">{slide.subtitle}</p>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default BannerCarousel;
