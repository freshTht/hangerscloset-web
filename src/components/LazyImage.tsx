import React, { useState, useEffect, useRef } from 'react';
import { Skeleton } from './Skeleton';
import './LazyImage.css';

export interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  rootMargin?: string;
  threshold?: number;
  fallbackIcon?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// In-memory set of URLs that have already successfully loaded in this session
const loadedImageUrls = new Set<string>();

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  containerStyle,
  style,
  rootMargin = '200px 0px',
  threshold = 0.01,
  fallbackIcon = 'checkroom',
  onLoad,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isCached = loadedImageUrls.has(src);

  const [isInView, setIsInView] = useState<boolean>(() => {
    if (isCached) return true;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return true;
    return false;
  });

  const [isLoaded, setIsLoaded] = useState<boolean>(isCached);
  const [hasError, setHasError] = useState<boolean>(false);

  // Sync state if src changes
  useEffect(() => {
    const cached = loadedImageUrls.has(src);
    setIsLoaded(cached);
    setHasError(false);
    if (cached) {
      setIsInView(true);
    }
  }, [src]);

  useEffect(() => {
    if (isInView || loadedImageUrls.has(src)) return;

    const element = containerRef.current;
    if (!element) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
            break;
          }
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [src, isInView, rootMargin, threshold]);

  const handleImageLoad = () => {
    loadedImageUrls.add(src);
    setIsLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div
      ref={containerRef}
      className={`lazy-image-container hc-lazy-image-container ${containerClassName} ${className}`.trim()}
      style={containerStyle}
    >
      {/* Shimmer hc-skeleton placeholder while loading */}
      {!isLoaded && !hasError && (
        <Skeleton className="hc-lazy-image-skeleton" aria-hidden={true} />
      )}

      {/* Fallback view when image fails to load */}
      {hasError && (
        <div
          className="center-align middle-align surface-container-high hc-lazy-image-fallback"
          aria-label={alt}
        >
          <i className="secondary-text">{fallbackIcon}</i>
          <span className="hc-micro-text secondary-text">ไม่มีรูปภาพ</span>
        </div>
      )}

      {/* Actual img element only mounted once near/in viewport */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className="hc-lazy-image-img"
          style={{
            opacity: isLoaded ? 1 : 0,
            ...style,
          }}
        />
      )}
    </div>
  );
};
