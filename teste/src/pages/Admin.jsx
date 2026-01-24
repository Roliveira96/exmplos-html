import React, { useState } from 'react';
import { useRecipes } from '../context/RecipeContext';
import '../components/styles/Admin.css';

const Admin = () => {
    const { addRecipe } = useRecipes();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: '',
        prepTime: '',
        difficulty: '',
        funnyQuote: '',
        ingredients: '' // We'll parse this to array
    });
    const [status, setStatus] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('enviando');

        const recipeToSend = {
            ...formData,
            ingredients: formData.ingredients.split(',').map(i => i.trim()),
            likes: 0
        };

        const success = await addRecipe(recipeToSend);
        if (success) {
            setStatus('sucesso');
            setFormData({
                title: '', description: '', image: '', prepTime: '', difficulty: '', funnyQuote: '', ingredients: ''
            });
        } else {
            setStatus('erro');
        }
    };

    return (
        <main className="admin-section">
            <h1 className="admin-title">Adicionar Nova "Iguaria"</h1>

            <form className="admin-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nome do Prato</label>
                    <input required name="title" value={formData.title} onChange={handleChange} placeholder="Ex: Risoto de Restodontê" />
                </div>

                <div className="form-group">
                    <label>Descrição Dramática</label>
                    <textarea required name="description" value={formData.description} onChange={handleChange} placeholder="Descreva a tragédia culinária..." />
                </div>

                <div className="form-group">
                    <label>URL da Imagem</label>
                    <input required name="image" value={formData.image} onChange={handleChange} placeholder="https://..." />
                </div>

                <div className="form-group">
                    <label>Tempo de Preparo</label>
                    <input required name="prepTime" value={formData.prepTime} onChange={handleChange} placeholder="Ex: 10 min (ou até o microondas apitar)" />
                </div>

                <div className="form-group">
                    <label>Dificuldade</label>
                    <input required name="difficulty" value={formData.difficulty} onChange={handleChange} placeholder="Ex: Só precisa saber abrir embalagem" />
                </div>

                <div className="form-group">
                    <label>Frase de Efeito (Humor)</label>
                    <input name="funnyQuote" value={formData.funnyQuote} onChange={handleChange} placeholder="Uma piadinha sobre o prato" />
                </div>

                <div className="form-group">
                    <label>Ingredientes (separados por vírgula)</label>
                    <textarea required name="ingredients" value={formData.ingredients} onChange={handleChange} placeholder="Arroz, Feijão, Vontade de chorar..." />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    {status === 'enviando' ? 'Enviando...' : 'Adicionar Receita'}
                </button>

                {status === 'sucesso' && <p style={{ color: 'green', marginTop: '1rem', textAlign: 'center' }}>Receita adicionada com sucesso!</p>}
                {status === 'erro' && <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>Erro ao adicionar. Verifique o console.</p>}
            </form>
        </main>
    );
};

export default Admin;
