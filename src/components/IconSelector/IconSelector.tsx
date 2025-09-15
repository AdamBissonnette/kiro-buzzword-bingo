import React, { useState, useCallback, useMemo } from 'react';
import { defaultIcons } from './constants';
import styles from './IconSelector.module.css';

interface IconSelectorProps {
  selectedIcon?: string;
  onIconSelect: (iconId: string) => void;
  className?: string;
}

export const IconSelector: React.FC<IconSelectorProps> = React.memo(({
  selectedIcon = 'star',
  onIconSelect,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Memoize selected icon data to prevent repeated lookups
  const selectedIconData = useMemo(() => {
    return defaultIcons.find(icon => icon.id === selectedIcon) || defaultIcons[0];
  }, [selectedIcon]);

  const handleIconSelect = useCallback((iconId: string) => {
    onIconSelect(iconId);
    setIsOpen(false);
  }, [onIconSelect]);

  const handleToggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className={`${styles.iconSelector} ${className}`}>
      <label className={styles.label}>Free Space Icon:</label>
      
      <div className={styles.dropdown}>
        <button
          type="button"
          className={styles.trigger}
          onClick={handleToggleOpen}
          aria-expanded={isOpen}
        >
          <span className={styles.selectedIcon}>{selectedIconData.icon}</span>
          <span className={styles.selectedName}>{selectedIconData.name}</span>
          <span className={styles.arrow}>▼</span>
        </button>

        {isOpen && (
          <div className={styles.menu}>
            {defaultIcons.map((icon) => (
              <button
                key={icon.id}
                type="button"
                className={`${styles.option} ${icon.id === selectedIcon ? styles.selected : ''}`}
                onClick={() => handleIconSelect(icon.id)}
              >
                <span className={styles.optionIcon}>{icon.icon}</span>
                <div className={styles.optionText}>
                  <span className={styles.optionName}>{icon.name}</span>
                  <span className={styles.optionDescription}>{icon.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <div 
          className={styles.overlay} 
          onClick={handleClose}
        />
      )}
    </div>
  );
});

IconSelector.displayName = 'IconSelector';

export default IconSelector;