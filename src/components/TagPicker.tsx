import React, { useState, useRef, useEffect } from 'react';

export interface TagPickerProps {
  id: string;
  selectedTags: string[];
  availableTags: string[];
  onChange: (tags: string[]) => void;
  onAddTag?: (newTag: string) => Promise<string | void> | void;
  label?: string;
  placeholder?: string;
}

export const TagPicker: React.FC<TagPickerProps> = ({
  id,
  selectedTags,
  availableTags,
  onChange,
  onAddTag,
  label = '+ เพิ่มแท็ก',
  placeholder = ' ',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [adding, setAdding] = useState(false);
  const [dropdownAlign, setDropdownAlign] = useState<'left' | 'right'>('left');
  const [maxDropdownWidth, setMaxDropdownWidth] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Smart horizontal alignment based on boundary container
  useEffect(() => {
    if (isOpen && containerRef.current && typeof window !== 'undefined') {
      const updatePosition = () => {
        if (!containerRef.current) return;
        const inputRect = containerRef.current.getBoundingClientRect();

        const boundary =
          containerRef.current.closest('dialog') ||
          containerRef.current.closest('form') ||
          document.documentElement;
        const boundaryRect = boundary.getBoundingClientRect();

        const spaceOnRight = boundaryRect.right - inputRect.left;
        const spaceOnLeft = inputRect.right - boundaryRect.left;

        const alignLeft = spaceOnRight >= 280 || spaceOnRight >= spaceOnLeft;
        setDropdownAlign(alignLeft ? 'left' : 'right');

        const availableSpace = alignLeft ? spaceOnRight : spaceOnLeft;
        const safeMax = availableSpace > 50 ? Math.max(inputRect.width, availableSpace - 12) : undefined;
        setMaxDropdownWidth(safeMax);
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [isOpen]);

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

  // Filter out any already added tags from the available tags list
  const unselectedTags = availableTags.filter((t) => !selectedTags.includes(t));

  // Filter unselected tags by search term
  const filteredTags = searchTerm.trim()
    ? unselectedTags.filter((t) =>
        t.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
    : unselectedTags;

  // Exact match check across all available tags
  const exactMatchInAvailable = availableTags.some(
    (t) => t.toLowerCase() === searchTerm.toLowerCase().trim()
  );
  const isAlreadySelected = selectedTags.some(
    (t) => t.toLowerCase() === searchTerm.toLowerCase().trim()
  );

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleAddTag = async (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (!selectedTags.includes(trimmed)) {
      onChange([...selectedTags, trimmed]);
    }
    if (onAddTag && !availableTags.includes(trimmed)) {
      try {
        setAdding(true);
        await onAddTag(trimmed);
      } finally {
        setAdding(false);
      }
    }
    setSearchTerm('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(selectedTags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = searchTerm.trim();
      if (!trimmed) return;

      // If exact match in unselected tags, pick that
      const matchedTag = unselectedTags.find(
        (t) => t.toLowerCase() === trimmed.toLowerCase()
      );
      if (matchedTag) {
        void handleAddTag(matchedTag);
      } else if (!isAlreadySelected) {
        void handleAddTag(trimmed);
      }
    }
  };

  return (
    <div className="round secondary-container medium-padding">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: selectedTags.length > 0 ? '16px' : '20px',
        }}
      >
        <i>tag</i>
        <label
          className="bold small-text"
          style={{ color: 'inherit' }}
        >
          แท็ก / หมวดหมู่ (Tags)
        </label>
      </div>

      {/* Selected tags chip list */}
      {selectedTags.length > 0 && (
        <div className="row wrap no-margin" style={{ gap: '8px', marginBottom: '20px' }}>
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="chip medium primary small-elevate no-margin"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span>{tag}</span>
              <button
                type="button"
                className="circle transparent no-margin"
                onClick={() => handleRemoveTag(tag)}
                aria-label={`ลบแท็ก ${tag}`}
                style={{ width: 22, height: 22, minWidth: 22, minHeight: 22, padding: 0, color: 'inherit' }}
              >
                <i className="tiny" style={{ color: 'inherit' }}>close</i>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Docked Search Field Container */}
      <div
        ref={containerRef}
        className="field small label border round no-margin surface"
        style={{ position: 'relative' }}
      >
        <input
          id={id}
          type="search"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={handleOpen}
          onClick={handleOpen}
          onKeyDown={handleKeyDown}
          placeholder={isOpen ? 'ค้นหา หรือพิมพ์เพิ่มแท็กใหม่...' : placeholder}
          autoComplete="off"
          style={{
            paddingRight: searchTerm ? '4.25rem' : '2.5rem',
          }}
        />
        <label htmlFor={id}>{label}</label>

        {/* Clear search button */}
        {searchTerm && (
          <button
            type="button"
            className="circle transparent no-margin"
            onClick={(e) => {
              e.stopPropagation();
              setSearchTerm('');
            }}
            aria-label="ล้างค่า"
            style={{
              position: 'absolute',
              right: '2.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 28,
              height: 28,
              minWidth: 28,
              minHeight: 28,
              padding: 0,
              zIndex: 2,
            }}
          >
            <i className="small">close</i>
          </button>
        )}

        {/* Trailing button with hashtag icon or drop arrow */}
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
          aria-label="แสดงรายการแท็ก"
          style={{
            position: 'absolute',
            right: '0.35rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 28,
            height: 28,
            minWidth: 28,
            minHeight: 28,
            padding: 0,
            zIndex: 2,
          }}
        >
          <i className="small">{isOpen ? 'arrow_drop_up' : 'tag'}</i>
        </button>

        {/* Docked Dropdown Card */}
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
              {/* Add New Tag Option Button */}
              {searchTerm.trim() && !exactMatchInAvailable && !isAlreadySelected && onAddTag && (
                <button
                  type="button"
                  className="border no-margin"
                  onClick={() => handleAddTag(searchTerm.trim())}
                  disabled={adding}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="primary-text">add</i>
                  <span className="bold">เพิ่ม "{searchTerm.trim()}"</span>
                </button>
              )}

              {/* Tag already selected indicator */}
              {searchTerm.trim() && isAlreadySelected && (
                <p className="no-margin secondary-text small-text center-align padding" style={{ width: '100%' }}>
                  แท็ก "{searchTerm.trim()}" ถูกเลือกไว้แล้ว
                </p>
              )}

              {/* Unselected Available Tags as Medium Buttons with border */}
              {filteredTags.length > 0 ? (
                filteredTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="border no-margin"
                    onClick={() => handleAddTag(tag)}
                    style={{ cursor: 'pointer' }}
                  >
                    <i>add</i>
                    <span>{tag}</span>
                  </button>
                ))
              ) : (
                !searchTerm.trim() && (
                  <p className="no-margin secondary-text small-text center-align padding" style={{ width: '100%' }}>
                    {unselectedTags.length === 0
                      ? 'เลือกแท็กครบทั้งหมดแล้ว (พิมพ์เพื่อเพิ่มแท็กใหม่)'
                      : 'ไม่มีแท็กที่เลือกได้'}
                  </p>
                )
              )}
            </div>

            {filteredTags.length === 0 &&
              searchTerm.trim() &&
              !exactMatchInAvailable &&
              !isAlreadySelected &&
              !onAddTag && (
                <p className="no-margin secondary-text small-text center-align padding">
                  ไม่พบแท็ก
                </p>
              )}
          </div>
        )}
      </div>
    </div>
  );
};
