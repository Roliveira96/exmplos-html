import React from 'react';
import { Heart, Clock, AlertTriangle } from 'lucide-react';
import { useRecipes } from '../context/RecipeContext';
import './styles/RecipeCard.css';

const RecipeCard = ({ recipe }) => {
    const { addLike } = useRecipes();

    return (
        <div className="recipe-card">
            <div className="recipe-image-container">
                <img src={recipe.image} alt={recipe.title} className="recipe-image" />
            </div>
            <div className="recipe-content">
                <div className="recipe-tags">
                    <span className="tag flex-center"><Clock size={12} style={{ marginRight: 4 }} />{recipe.prepTime}</span>
                    <span className="tag flex-center"><AlertTriangle size={12} style={{ marginRight: 4 }} />{recipe.difficulty}</span>
                </div>
                <h3 className="recipe-title">{recipe.title}</h3>
                <p className="recipe-description">{recipe.description}</p>

                {recipe.funnyQuote && (
                    <div className="recipe-quote">"{recipe.funnyQuote}"</div>
                )}

                <div className="recipe-footer">
                    <button className="like-btn" onClick={() => addLike(recipe.id)}>
                        <Heart size={20} fill={recipe.likes > 0 ? "#e63946" : "none"} color={recipe.likes > 0 ? "#e63946" : "currentColor"} />
                        <span>{recipe.likes} Sobreviventes</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeCard;
