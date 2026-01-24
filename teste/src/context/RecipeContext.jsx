import { createContext, useState, useEffect, useContext } from 'react';

const RecipeContext = createContext();

// Detect context to determine API URL
const isDev = import.meta.env.DEV;
const API_URL = isDev
    ? 'http://localhost:8000/recipes.php' // Local PHP server
    : '/api/recipes.php'; // Production relative path

export const RecipeProvider = ({ children }) => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRecipes = async () => {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            setRecipes(data);
        } catch (error) {
            console.error('Erro ao buscar receitas:', error);
            // Fallback data could go here if needed, but let's assume API works
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, []);

    const addLike = (id) => {
        setRecipes(prev => prev.map(recipe =>
            recipe.id === id ? { ...recipe, likes: recipe.likes + 1 } : recipe
        ));
        // In a real app, we would PUT/PATCH this to the server
    };

    const addRecipe = async (newRecipe) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newRecipe),
            });

            if (response.ok) {
                const result = await response.json();
                setRecipes(prev => [...prev, result.recipe]);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao adicionar receita:', error);
            return false;
        }
    };

    return (
        <RecipeContext.Provider value={{ recipes, loading, addLike, addRecipe }}>
            {children}
        </RecipeContext.Provider>
    );
};

export const useRecipes = () => useContext(RecipeContext);
