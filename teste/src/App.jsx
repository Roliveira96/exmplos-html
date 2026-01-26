import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Admin from './pages/Admin';
import { ThemeProvider } from './context/ThemeContext';
import { RecipeProvider } from './context/RecipeContext';

function App() {
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Simple Router
  const Page = route === '/admin' ? Admin : Home;

  return (
    <ThemeProvider>
      <RecipeProvider>
        <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <Page />
          <Footer />
        </div>
      </RecipeProvider>
    </ThemeProvider>
  );
}

export default App;
