'use client';

import { useRef, useState } from 'react';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  showAttachment?: boolean;
  onAttach?: (files: File[]) => void;
  placeholder?: string;
}

export default function MessageInput({
  onSend,
  disabled = false,
  showAttachment = false,
  onAttach,
  placeholder = '메시지를 입력하세요',
}: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0 && onAttach) {
      onAttach(files);
    }
    e.target.value = '';
  };

  return (
    <div className={styles.container}>
      {showAttachment && (
        <>
          <button
            className={styles.attachButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            aria-label="파일 첨부"
          >
            <span className="material-symbols-outlined">attach_file</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className={styles.hiddenInput}
            onChange={handleFileChange}
          />
        </>
      )}
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
      />
      <button
        className={styles.sendButton}
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        aria-label="전송"
      >
        <span className="material-symbols-outlined">send</span>
      </button>
    </div>
  );
}
