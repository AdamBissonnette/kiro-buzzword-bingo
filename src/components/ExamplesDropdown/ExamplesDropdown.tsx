import React, { useState, useRef, useEffect } from 'react';
import { exampleCards } from '../../data/exampleCards';
import type { ExampleCard, ExampleCardCategory } from '../../data/exampleCards';
import styles from './ExamplesDropdown.module.css';

export const ExamplesDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, ] = useState<ExampleCardCategory>('All');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleExampleSelect = (example: ExampleCard) => {
    setIsOpen(false);
    // Navigate to the share URL
    window.location.href = example.shareUrl;
  };

  const filteredExamples = selectedCategory === 'All' 
    ? exampleCards 
    : exampleCards.filter(card => card.category === selectedCategory);

  return (
    <div className={styles.examplesDropdown}>
      <button
        ref={buttonRef}
        className={styles.examplesButton}
        onClick={toggleDropdown}
        aria-label="View example bingo cards"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title="Browse example bingo cards"
      >
        <svg 
          className={styles.examplesIcon}
          width="16" 
          height="16" 
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path 
            d="M2 3h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm0 1v8h12V4H2zm2 2h8v1H4V6zm0 2h6v1H4V8z" 
            fill="currentColor"
          />
        </svg>
        <span className={styles.examplesText}>Examples</span>
        <svg 
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <path 
            d="M2 4l4 4 4-4" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            fill="none"
          />
        </svg>
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className={styles.dropdown}
          role="menu"
          aria-label="Example bingo cards"
        >
          <div className={styles.dropdownHeader}>
            <h3 className={styles.dropdownTitle}>Example Bingo Cards</h3>
            <p className={styles.dropdownSubtitle}>
              Try these pre-made cards to get started
            </p>
          </div>

          {/* Category Filter */}
          {/* <div className={styles.categoryFilter}>
            <div className={styles.categoryTabs}>
              {exampleCardCategories.map((category) => (
                <button
                  key={category}
                  className={`${styles.categoryTab} ${
                    selectedCategory === category ? styles.categoryTabActive : ''
                  }`}
                  onClick={() => setSelectedCategory(category)}
                  role="tab"
                  aria-selected={selectedCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>
          </div> */}
          
          {/* Examples List */}
          <div className={styles.examplesList}>
            {filteredExamples.length > 0 ? (
              filteredExamples.map((example) => (
                <button
                  key={example.id}
                  className={styles.exampleItem}
                  onClick={() => handleExampleSelect(example)}
                  role="menuitem"
                  aria-label={`Load ${example.title}${example.description ? ` - ${example.description}` : ''}`}
                >
                  <div className={styles.exampleContent}>
                    <div className={styles.exampleTitle}>{example.title}</div>
                    {example.description && (
                      <div className={styles.exampleDescription}>
                        {example.description}
                      </div>
                    )}
                    {example.category && (
                      <div className={styles.exampleCategory}>
                        {example.category}
                      </div>
                    )}
                  </div>
                  <svg 
                    className={styles.exampleArrow}
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path 
                      d="M6 4l4 4-4 4" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      fill="none"
                    />
                  </svg>
                </button>
              ))
            ) : (
              <div className={styles.noExamples}>
                No examples found in this category.
              </div>
            )}
          </div>

          <div className={styles.dropdownFooter}>
            <p className={styles.footerText}>
              Want to add your own? Create a card and use the share link!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamplesDropdown;