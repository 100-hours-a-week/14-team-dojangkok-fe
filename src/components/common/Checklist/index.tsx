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
  onItemDelete?: (id: string) => void;
  onEditingChange?: (isEditing: boolean, editingId: string | null) => void;
}

export default function Checklist({
  items,
  onItemToggle,
  onItemAdd,
  onItemUpdate,
  onItemDelete,
  onEditingChange,
}: ChecklistProps) {
  const [newItemText, setNewItemText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newItemText]);

  useEffect(() => {
    if (editTextareaRef.current && editingId) {
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
      // 편집 중일 때는 항상 포커스 (리렌더링 후에도 포커스 유지)
      editTextareaRef.current.focus();
      // 커서를 끝으로 이동
      const length = editTextareaRef.current.value.length;
      editTextareaRef.current.setSelectionRange(length, length);
    }
  }, [editingId, editingText, items]); // items 추가: 부모 상태 변경 시에도 포커스 복원

  const handleAddItem = () => {
    if (newItemText.trim()) {
      onItemAdd(newItemText.trim());
      setNewItemText('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleAddItem();
    }
  };

  const handleTextClick = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
    // 편집 시작을 부모에게 알림
    if (onEditingChange) {
      onEditingChange(true, item.id);
    }
  };

  const handleEditChange = (text: string) => {
    setEditingText(text);
    // 빈 문자열이 아닐 때만 부모에게 알림 (빈 문자열은 blur 시 삭제 처리)
    if (editingId && onItemUpdate && text.trim() !== '') {
      onItemUpdate(editingId, text);
    }
  };

  const handleEditFinish = () => {
    // 텍스트가 공백이면 항목 삭제
    if (editingId && editingText.trim() === '' && onItemDelete) {
      onItemDelete(editingId);
    }
    // 편집 종료를 부모에게 알림
    if (onEditingChange) {
      onEditingChange(false, null);
    }
    // 편집 모드 종료
    setEditingId(null);
    setEditingText('');
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditFinish();
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
                onChange={(e) => handleEditChange(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={handleEditFinish}
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
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={handleKeyDown}
            onBlur={handleAddItem}
            rows={1}
          />
        </div>
      </div>
    </section>
  );
}
