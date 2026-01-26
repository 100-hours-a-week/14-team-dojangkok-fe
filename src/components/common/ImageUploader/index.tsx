'use client';

import { useRef } from 'react';
import styles from './ImageUploader.module.css';

interface ImageUploaderProps {
  onUpload: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  mainText?: string;
  subText?: string;
}

export default function ImageUploader({
  onUpload,
  accept = 'image/*,.pdf',
  multiple = true,
  mainText = '터치해서 파일 첨부하기',
  subText = 'JPG, PNG, PDF 지원',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files);
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.uploadButton} onClick={handleClick}>
        <div className={styles.iconWrapper}>
          <span className={`material-symbols-outlined ${styles.icon}`}>
            add_a_photo
          </span>
        </div>
        <div className={styles.textWrapper}>
          <span className={styles.mainText}>{mainText}</span>
          <span className={styles.subText}>{subText}</span>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className={styles.hiddenInput}
      />
    </div>
  );
}
