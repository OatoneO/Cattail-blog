'use client';

import React, { useRef, useEffect } from 'react';

const getFontSize = (count, min = 12, max = 35) => {
  return Math.min(max, Math.max(min, min + count));
};

const TagCloudComponent = ({ tags }) => {
  const containerRef = useRef(null);
  const tagRefs = useRef([]);

  useEffect(() => {
    let angle = 0;
    let frameId;
    const animate = () => {
      const N = tags.length;
      const radius = 110;
      angle += 0.01;
      tagRefs.current.forEach((tag, i) => {
        if (!tag) return;
        const theta = angle + (i * 2 * Math.PI) / N;
        const x = Math.cos(theta) * radius;
        const y = Math.sin(theta) * radius;
        tag.style.transform = `translate(-50%, -50%) translate(${150 + x}px, ${150 + y}px)`;
        tag.style.zIndex = Math.floor(100 + 50 * Math.sin(theta));
        tag.style.opacity = 0.7 + 0.3 * Math.sin(theta);
      });
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => frameId && cancelAnimationFrame(frameId);
  }, [tags]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        ref={containerRef}
        className="relative w-[300px] h-[300px]"
        style={{ minHeight: 300 }}
      >
        {tags.map((tag, i) => (
          <span
            key={tag.value}
            ref={el => (tagRefs.current[i] = el)}
            style={{
              position: 'absolute',
              left: '0%',
              top: '0%',
              fontSize: getFontSize(tag.count),
              color: `hsl(${(i * 360) / tags.length}, 70%, 70%)`,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.2s',
              willChange: 'transform, opacity, color',
              userSelect: 'none',
            }}
            onClick={() => console.log('clicking on tag:', tag)}
          >
            {tag.value}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TagCloudComponent; 