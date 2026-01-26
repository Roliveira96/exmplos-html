import React from 'react';
import { useRecipes } from '../context/RecipeContext';
import RecipeCard from '../components/RecipeCard';
import BannerCarousel from '../components/BannerCarousel';
import VideoSection from '../components/VideoSection';
import '../components/styles/Home.css';

const Home = () => {
    const { recipes } = useRecipes();

    return (
        <main>
            <BannerCarousel />

            <section className="container" style={{ padding: '4rem 1rem' }}>
                <h2 className="section-title">Receitas Trágicas</h2>
                <div className="recipes-grid">
                    {recipes.map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                </div>
            </section>

            <VideoSection />
        </main>
    );
};

export default Home;
