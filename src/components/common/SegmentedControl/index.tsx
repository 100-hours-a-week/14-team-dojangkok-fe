'use client';

import styles from './SegmentedControl.module.css';

export interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
}: SegmentedControlProps) {
  return (
    <div className={styles.container}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`${styles.segment} ${
            value === option.value ? styles.segmentActive : ''
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
