import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/hooks';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  showSidebar?: boolean;
  onRemixCard?: () => void;
  showRemixButton?: boolean;
  isPlayMode?: boolean;
  onCreateNew?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  sidebar, 
  showSidebar = false,
  onRemixCard,
  showRemixButton = false,
  isPlayMode = false,
  onCreateNew
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={styles.layout}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            {showSidebar && (
              <button 
                className={styles.menuButton}
                onClick={toggleSidebar}
                aria-label="Toggle menu"
              >
                <span className={styles.hamburger}></span>
                <span className={styles.hamburger}></span>
                <span className={styles.hamburger}></span>
              </button>
            )}
            <h1 className={styles.title}>
              <Link to="/" className={styles.titleLink}>
                Buzzword Bingo Generator
              </Link>
            </h1>
          </div>
          
          <nav className={styles.nav}>
            {isPlayMode && onCreateNew && (
              <button
                onClick={onCreateNew}
                className={styles.remixButton}
              >
                Create New Card
              </button>
            )}
            {!isPlayMode && showRemixButton && onRemixCard && (
              <button
                onClick={onRemixCard}
                className={styles.remixButton}
              >
                🔄 Remix This Card
              </button>
            )}
            <button
              onClick={toggleTheme}
              className={styles.themeToggle}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className={styles.main}>
        {/* Sidebar */}
        {!isPlayMode && showSidebar && sidebar && (
          <>
            <div 
              className={`${styles.sidebarOverlay} ${isSidebarOpen ? styles.sidebarOverlayOpen : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
              <div className={styles.sidebarContent}>
                {sidebar}
              </div>
            </aside>
          </>
        )}

        {/* Content Area */}
        <main className={`${styles.content} ${!isPlayMode && showSidebar ? styles.contentWithSidebar : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;