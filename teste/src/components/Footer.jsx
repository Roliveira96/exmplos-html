import React from 'react';
import { Utensils, Instagram, Facebook, Twitter } from 'lucide-react';
import './styles/Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <div className="logo" style={{ color: 'white', marginBottom: '1rem' }}>
                            <Utensils size={24} />
                            <span>Gourmet da Depressão</span>
                        </div>
                        <p>A arte de cozinhar o que tem na geladeira e fingir que foi planejado.</p>
                        <div className="social-icons">
                            <a href="#" className="social-icon" aria-label="Instagram"><Instagram size={20} /></a>
                            <a href="#" className="social-icon" aria-label="Facebook"><Facebook size={20} /></a>
                            <a href="#" className="social-icon" aria-label="Twitter"><Twitter size={20} /></a>
                        </div>
                    </div>

                    <div className="footer-section">
                        <h3>Links Úteis</h3>
                        <nav className="footer-links">
                            <a href="#" className="footer-link">Receitas Rápidas</a>
                            <a href="#" className="footer-link">Sobrevivência Básica</a>
                            <a href="#" className="footer-link">Envie sua Tragédia</a>
                            <a href="#" className="footer-link">Sobre Nós</a>
                        </nav>
                    </div>

                    <div className="footer-section">
                        <h3>Contato</h3>
                        <p>Email: contato@gourmetdadepressao.com.br</p>
                        <p>Não aceitamos reclamações sobre dor de barriga.</p>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Gourmet da Depressão. Todos os direitos reservados (ou o que sobrou deles).</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
