import React, { useState, useRef, useEffect } from 'react';
import { useDabberColor } from '../../contexts/DabberColorContext';
import type { DabberColor } from '../../data/dabberColors';
import styles from './DabberColorPicker.module.css';

export const DabberColorPicker: React.FC = () => {
  const { selectedColor, setSelectedColor, availableColors } = useDabberColor();
  const [isOpen, setIsOpen] = useState(false);
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

  const handleColorSelect = (color: DabberColor) => {
    setSelectedColor(color);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.colorPicker}>
      <button
        ref={buttonRef}
        className={styles.colorButton}
        onClick={toggleDropdown}
        aria-label={`Current dabber color: ${selectedColor.name}. Click to change color.`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={`Dabber Color: ${selectedColor.name}`}
      >
        <div 
          className={styles.colorCircle}
          style={{ backgroundColor: selectedColor.color }}
        />
        <span className={styles.colorName}>{selectedColor.name}</span>
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
          role="listbox"
          aria-label="Choose dabber color"
        >
          <div className={styles.dropdownHeader}>
            <h3 className={styles.dropdownTitle}>Choose Dabber Color</h3>
          </div>
          
          <div className={styles.colorGrid}>
            {availableColors.map((color) => (
              <button
                key={color.id}
                className={`${styles.colorOption} ${
                  selectedColor.id === color.id ? styles.colorOptionSelected : ''
                }`}
                onClick={() => handleColorSelect(color)}
                role="option"
                aria-selected={selectedColor.id === color.id}
                aria-label={`${color.name}${color.description ? ` - ${color.description}` : ''}`}
                title={color.description || color.name}
              >
                <div 
                  className={styles.colorSwatch}
                  style={{ backgroundColor: color.color }}
                />
                <span className={styles.colorLabel}>{color.name}</span>
                {selectedColor.id === color.id && (
                  <svg 
                    className={styles.checkmark}
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path 
                      d="M13.5 4.5L6 12l-3.5-3.5" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      fill="none"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DabberColorPicker;