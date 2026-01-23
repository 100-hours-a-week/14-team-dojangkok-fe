'use client';

import { useState } from 'react';
import Modal from '../Modal';
import styles from './TextFieldModal.module.css';

interface ValidationConfig {
  validate: (value: string) => boolean;
  successMessage: string;
  errorMessage: string;
}

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
  validation?: ValidationConfig;
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
  validation,
}: TextFieldModalProps) {
  const [value, setValue] = useState(initialValue);
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  // 모달이 열릴 때 값 초기화 (렌더링 중 상태 업데이트 패턴)
  if (isOpen && !prevIsOpen) {
    setValue(initialValue);
    setPrevIsOpen(true);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  // 유효성 검사 결과를 직접 계산 (파생 상태)
  const isValid = validation ? validation.validate(value) : true;
  const canSubmit = isValid && value.trim().length > 0;

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit(value);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title={title}
      confirmText={confirmText}
      cancelText={cancelText}
      confirmDisabled={!canSubmit}
    >
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
        {validation &&
          value.trim() &&
          (isValid ? validation.successMessage : validation.errorMessage) && (
            <p
              className={`${styles.message} ${isValid ? styles.messageSuccess : styles.messageError}`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 14 }}
              >
                {isValid ? 'check_circle' : 'error'}
              </span>
              {isValid ? validation.successMessage : validation.errorMessage}
            </p>
          )}
      </div>
    </Modal>
  );
}
