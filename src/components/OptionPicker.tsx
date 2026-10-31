import React, { useState, useRef, useEffect } from 'react';

export interface OptionPickerProps {
  id: string;
  name: string;
  label: string;
  icon: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onAddOption?: (newOption: string) => Promise<string | void> | void;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
}

export const OptionPicker: React.FC<OptionPickerProps> = ({
  id,
  name,
  label,
  icon,
  value,
  options,
  onChange,
  onAddOption,
  placeholder = ' ',
  searchPlaceholder,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // Search field starts empty and is manually inputted (no prefill with selected value)
  const [searchTerm, setSearchTerm] = useState('');
  const [adding, setAdding] = useState(false);
  const [dropdownAlign, setDropdownAlign] = useState<'left' | 'right'>('left');
  const [maxDropdownWidth, setMaxDropdownWidth] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);

  const labelClean = label.replace(/\*/g, '').trim();

  // Smart hint text suggesting new ones can be added when onAddOption is supported
  const defaultSearchPlaceholder = onAddOption
    ? `ค้นหา หรือเพิ่ม${labelClean}ใหม่...`
    : `ค้นหา${labelClean}...`;
  const activeSearchPlaceholder = searchPlaceholder || defaultSearchPlaceholder;

  // Determine smart horizontal alignment (left or right) and max width based on boundary container
  useEffect(() => {
    if (isOpen && containerRef.current && typeof window !== 'undefined') {
      const updatePosition = () => {
        if (!containerRef.current) return;
        const inputRect = containerRef.current.getBoundingClientRect();

        // Find nearest boundary/clipping container (dialog, form, or document)
        const boundary =
          containerRef.current.closest('dialog') ||
          containerRef.current.closest('form') ||
          document.documentElement;
        const boundaryRect = boundary.getBoundingClientRect();

        // Calculate available space to the right (from input's left edge to boundary's right edge)
        const spaceOnRight = boundaryRect.right - inputRect.left;
        // Calculate available space to the left (from boundary's left edge to input's right edge)
        const spaceOnLeft = inputRect.right - boundaryRect.left;

        // If there is enough room on the right (>= 280px) or more room on the right than left, align left
        // Otherwise, align right so it opens towards the roomier left side
        const alignLeft = spaceOnRight >= 280 || spaceOnRight >= spaceOnLeft;
        setDropdownAlign(alignLeft ? 'left' : 'right');

        // Constrain max width so it NEVER exceeds the boundary container
        const availableSpace = alignLeft ? spaceOnRight : spaceOnLeft;
        const safeMax = availableSpace > 50 ? Math.max(inputRect.width, availableSpace - 12) : undefined;
        setMaxDropdownWidth(safeMax);
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [isOpen]);

  // Scroll down inside the menu to the selected chip when opened
  useEffect(() => {
    if (isOpen && !searchTerm && selectedButtonRef.current && menuRef.current) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      const scrollBehavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

      const timer = setTimeout(() => {
        if (!menuRef.current || !selectedButtonRef.current) return;
        const menu = menuRef.current;
        const target = selectedButtonRef.current;

        const menuRect = menu.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        if (menu.scrollHeight > menu.clientHeight && menu.clientHeight > 0) {
          const relativeTop = targetRect.top - menuRect.top + menu.scrollTop;
          const targetScrollTop = relativeTop - (menu.clientHeight / 2) + (targetRect.height / 2);
          if (typeof menu.scrollTo === 'function') {
            menu.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: scrollBehavior,
            });
          } else {
            menu.scrollTop = Math.max(0, targetScrollTop);
          }
        } else if (typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ block: 'nearest', behavior: scrollBehavior });
        }
      }, 40);

      return () => clearTimeout(timer);
    }
  }, [isOpen, searchTerm]);

  // Click outside to close (supporting mouse and touch events)
  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filter options: when search is empty, show all options. Otherwise filter by typed search term.
  const filteredOptions = searchTerm.trim()
    ? options.filter((opt) =>
        opt.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
    : options;

  const exactMatch = options.some(
    (opt) => opt.toLowerCase() === searchTerm.toLowerCase().trim()
  );

  const handleOpen = () => {
    setSearchTerm('');
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelect = (selected: string) => {
    onChange(selected);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleAddNew = async () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    try {
      setAdding(true);
      if (onAddOption) {
        await onAddOption(trimmed);
      }
      onChange(trimmed);
      setSearchTerm('');
      setIsOpen(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="field label border round no-margin"
      style={{ position: 'relative' }}
    >
      <input
        id={id}
        type="search"
        name={name}
        value={isOpen ? searchTerm : value}
        onChange={handleInputChange}
        onFocus={handleOpen}
        onClick={handleOpen}
        placeholder={isOpen ? activeSearchPlaceholder : placeholder}
        required={required && !value}
        autoComplete="off"
        style={{
          paddingRight: searchTerm ? '4.5rem' : '2.75rem',
        }}
      />
      <label htmlFor={id}>{label}</label>

      {/* Clear button when search term has content */}
      {searchTerm && (
        <button
          type="button"
          className="circle transparent no-margin"
          onClick={(e) => {
            e.stopPropagation();
            setSearchTerm('');
            onChange('');
          }}
          aria-label="ล้างค่า"
          style={{
            position: 'absolute',
            right: '2.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            minWidth: 32,
            minHeight: 32,
            padding: 0,
            zIndex: 2,
          }}
        >
          <i>close</i>
        </button>
      )}

      {/* Trailing trigger icon button positioned absolutely - NEVER overflows to new row */}
      <button
        type="button"
        className="circle transparent no-margin"
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) {
            setIsOpen(false);
            setSearchTerm('');
          } else {
            handleOpen();
          }
        }}
        aria-label="แสดงตัวเลือก"
        style={{
          position: 'absolute',
          right: '0.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 36,
          height: 36,
          minWidth: 36,
          minHeight: 36,
          padding: 0,
          zIndex: 2,
        }}
      >
        <i>{isOpen ? 'arrow_drop_up' : (icon || 'arrow_drop_down')}</i>
      </button>

      {/* Docked Dropdown Card (used for all screen sizes including s) with Medium Buttons */}
      {isOpen && (
        <div
          ref={menuRef}
          className="card surface-container-high round padding no-margin medium-elevate"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            ...(dropdownAlign === 'right' ? { right: 0 } : { left: 0 }),
            minWidth: '100%',
            width: 'max(100%, min(300px, 88vw))',
            maxWidth: maxDropdownWidth ? `${maxDropdownWidth}px` : '92vw',
            boxSizing: 'border-box',
            zIndex: 100,
            maxHeight: '260px',
            overflowY: 'auto',
            scrollBehavior: 'smooth',
          }}
        >
          <div className="row wrap" style={{ gap: '8px', alignItems: 'center' }}>
            {/* Add New Option Button */}
            {searchTerm.trim() && !exactMatch && onAddOption && (
              <button
                type="button"
                className="border no-margin"
                onClick={handleAddNew}
                disabled={adding}
                style={{ cursor: 'pointer' }}
              >
                <i className="primary-text">add</i>
                <span className="bold">เพิ่ม "{searchTerm.trim()}"</span>
              </button>
            )}

            {/* Medium Buttons: non-border for selected, border for unselected */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected =
                  value.trim().length > 0 &&
                  opt.toLowerCase().trim() === value.toLowerCase().trim();
                return (
                  <button
                    key={opt}
                    ref={isSelected ? selectedButtonRef : undefined}
                    type="button"
                    className={`${isSelected ? 'primary' : 'border'} no-margin`}
                    onClick={() => handleSelect(opt)}
                    style={{ cursor: 'pointer' }}
                  >
                    {isSelected && <i>check</i>}
                    <span>{opt}</span>
                  </button>
                );
              })
            ) : (
              !searchTerm.trim() && (
                <p className="no-margin secondary-text small-text center-align padding" style={{ width: '100%' }}>
                  {onAddOption ? `ยังไม่มีตัวเลือก (พิมพ์เพื่อเพิ่ม${labelClean}ใหม่)` : 'ไม่มีตัวเลือก'}
                </p>
              )
            )}
          </div>

          {filteredOptions.length === 0 && searchTerm.trim() && !exactMatch && !onAddOption && (
            <p className="no-margin secondary-text small-text center-align padding">
              ไม่พบตัวเลือก
            </p>
          )}
        </div>
      )}
    </div>
  );
};
