'use client';

import { useState, useEffect } from 'react';
import styles from './TextFieldModal.module.css';

interface TextFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  initialValue?: string;
  placeholder?: string;
  maxLength?: number;
  confirmText?: string;
  cancelText?: string;
  successMessage?: string;
  errorMessage?: string;
  validate?: (value: string) => boolean;
}

export default function TextFieldModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialValue = '',
  placeholder = '',
  maxLength = 10,
  confirmText = '저장하기',
  cancelText = '취소',
  successMessage,
  errorMessage,
  validate,
}: TextFieldModalProps) {
  const [value, setValue] = useState(initialValue);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setIsValid(true);
    }
  }, [isOpen, initialValue]);

  useEffect(() => {
    if (validate) {
      setIsValid(validate(value));
    }
  }, [value, validate]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (isValid && value.trim()) {
      onSubmit(value);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.inputWrapper}>
          <div className={styles.inputContainer}>
            <input
              type="text"
              className={styles.input}
              value={value}
              onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
              placeholder={placeholder}
            />
            <span className={styles.charCount}>
              {value.length}/{maxLength}
            </span>
          </div>
          {(successMessage || errorMessage) && value.trim() && (
            <p
              className={`${styles.message} ${isValid ? styles.messageSuccess : styles.messageError}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                {isValid ? 'check_circle' : 'error'}
              </span>
              {isValid ? successMessage : errorMessage}
            </p>
          )}
        </div>
        <div className={styles.footer}>
          <button
            className={styles.confirmButton}
            onClick={handleSubmit}
            disabled={!isValid || !value.trim()}
          >
            {confirmText}
          </button>
          <button className={styles.cancelButton} onClick={onClose}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
