import React from 'react';
import { Utensils, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './styles/Header.css';

const Header = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="header">
            <div className="container header-content">
                <a href="/" className="logo">
                    <Utensils size={28} />
                    <span>Gourmet da Depressão</span>
                </a>

                <nav className="nav-links">
                    <a href="#" className="nav-link">Receitas</a>
                    <a href="#" className="nav-link">Piores do Ano</a>
                    <a href="#" className="nav-link">Sobre</a>
                </nav>

                <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
        </header>
    );
};

export default Header;
