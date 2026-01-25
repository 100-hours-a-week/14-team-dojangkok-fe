'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import styles from './Checklist.module.css';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistProps {
  items: ChecklistItem[];
  onItemToggle: (id: string) => void;
  onItemAdd: (text: string) => void;
  onItemUpdate?: (id: string, text: string) => void;
}

export default function Checklist({
  items,
  onItemToggle,
  onItemAdd,
  onItemUpdate,
}: ChecklistProps) {
  const [newItemText, setNewItemText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newItemText]);

  useEffect(() => {
    if (editTextareaRef.current) {
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
      editTextareaRef.current.focus();
    }
  }, [editingId, editingText]);

  const handleAddItem = () => {
    if (newItemText.trim()) {
      onItemAdd(newItemText.trim());
      setNewItemText('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddItem();
    }
  };

  const handleTextClick = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const handleEditSave = () => {
    if (editingId && editingText.trim() && onItemUpdate) {
      onItemUpdate(editingId, editingText.trim());
    }
    setEditingId(null);
    setEditingText('');
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingText('');
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className="material-symbols-outlined">auto_awesome</span>
        <h2 className={styles.title}>나만의 체크리스트</h2>
      </div>

      <div className={styles.list}>
        {items.map((item) => (
          <div key={item.id} className={styles.item}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={item.checked}
              onChange={() => onItemToggle(item.id)}
            />
            {editingId === item.id ? (
              <textarea
                ref={editTextareaRef}
                className={styles.textarea}
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={handleEditSave}
                rows={1}
              />
            ) : (
              <span
                className={`${styles.text} ${item.checked ? styles.checked : ''}`}
                onClick={() => handleTextClick(item)}
              >
                {item.text}
              </span>
            )}
          </div>
        ))}

        <div className={styles.addItem}>
          <input
            type="checkbox"
            className={styles.checkbox}
            disabled
            style={{ opacity: 0.5, cursor: 'default' }}
          />
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder="항목 추가..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleAddItem}
            rows={1}
          />
        </div>
      </div>
    </section>
  );
}
