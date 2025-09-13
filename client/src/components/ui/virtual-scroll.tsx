import React, { useState, useRef } from 'react';

export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  threshold?: number;
}

interface VirtualScrollProps<T> {
  items: T[];
  config: VirtualScrollConfig;
  renderItem: React.ComponentType<{ index: number; style: React.CSSProperties; data: T[] }>;
  className?: string;
}

export function VirtualScroll<T>({
  items,
  config,
  renderItem,
  className = ""
}: VirtualScrollProps<T>) {
  const { itemHeight, containerHeight, overscan = 5, threshold = 20 } = config;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only use virtualization if we have more items than the threshold
  const shouldVirtualize = items.length > threshold;

  if (!shouldVirtualize) {
    // Render normally without virtualization for small lists
    return (
      <div className={className} style={{ height: containerHeight, overflow: 'auto' }}>
        {items.map((_, index) => {
          const ItemComponent = renderItem;
          return (
            <div key={index} style={{ height: itemHeight }}>
              <ItemComponent 
                index={index}
                style={{ height: itemHeight }} 
                data={items} 
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({
      index: i,
      style: {
        position: 'absolute' as const,
        top: i * itemHeight,
        left: 0,
        right: 0,
        height: itemHeight,
      }
    });
  }

  const totalHeight = items.length * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{ 
        height: containerHeight, 
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, style }) => {
          const ItemComponent = renderItem;
          return (
            <div key={index} style={style}>
              <ItemComponent 
                index={index}
                style={{ height: itemHeight }} 
                data={items} 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// VirtualScrollConfig is already exported above