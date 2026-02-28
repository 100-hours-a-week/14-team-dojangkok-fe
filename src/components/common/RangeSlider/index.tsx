'use client';

import { useEffect, useRef, useCallback } from 'react';
import styles from './RangeSlider.module.css';

interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel?: (value: number) => string;
}

export default function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  formatLabel,
}: RangeSliderProps) {
  const minVal = value[0];
  const maxVal = value[1];
  const range = useRef<HTMLDivElement>(null);

  // Convert to percentage
  const getPercent = useCallback(
    (val: number) => Math.round(((val - min) / (max - min)) * 100),
    [min, max]
  );

  useEffect(() => {
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, maxVal, getPercent]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={(event) => {
            const val = Math.min(Number(event.target.value), maxVal - step);
            onChange([val, maxVal]);
          }}
          className={`${styles.thumb} ${styles.thumbLeft}`}
          style={{ zIndex: minVal > max - 100 ? '5' : '3' }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={(event) => {
            const val = Math.max(Number(event.target.value), minVal + step);
            onChange([minVal, val]);
          }}
          className={`${styles.thumb} ${styles.thumbRight}`}
        />

        <div className={styles.slider}>
          <div className={styles.sliderTrack} />
          <div ref={range} className={styles.sliderRange} />
        </div>
      </div>
      {formatLabel && (
        <div className={styles.labels}>
          <span>{formatLabel(minVal)}</span>
          <span>{formatLabel(maxVal)}</span>
        </div>
      )}
    </div>
  );
}
