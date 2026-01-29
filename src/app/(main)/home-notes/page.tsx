'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Header,
  HomeNoteCard,
  FloatingAddButton,
  Modal,
  TextFieldModal,
} from '@/components/common';
import { HomeNote } from './types';
import { getHomeNotes } from '@/lib/api/homeNote';
import { HomeNoteItem } from '@/types/homeNote';
import styles from './HomeNotes.module.css';

/**
 * API 응답을 UI 타입으로 변환
 */
function convertToHomeNote(item: HomeNoteItem): HomeNote {
  return {
    id: item.home_note_id.toString(),
    title: item.title,
    date: new Date(item.created_at).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
    images: item.preview_images.map((url, index) => ({
      id: `${item.home_note_id}-${index}`,
      url,
    })),
  };
}

export default function HomeNotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<HomeNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setHasNext] = useState(false);
  const [, setNextCursor] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadHomeNotes();
  }, []);

  const loadHomeNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getHomeNotes();
      const convertedNotes = response.data.items.map(convertToHomeNote);
      setNotes(convertedNotes);
      setHasNext(response.data.hasNext);
      setNextCursor(response.data.next_cursor);
    } catch (err) {
      console.error('집 노트 목록 조회 실패:', err);
      setError('집 노트 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoteClick = (id: string) => {
    const note = notes.find((n) => n.id === id);
    const title = note?.title || '집노트';
    router.push(`/home-notes/${id}?title=${encodeURIComponent(title)}`);
  };

  const handleAddClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleDeleteNote = (id: string) => {
    setNoteToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (noteToDelete) {
      console.log('Delete note:', noteToDelete);
      // TODO: Delete note logic
      setIsDeleteModalOpen(false);
      setNoteToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setNoteToDelete(null);
  };

  const handleCreateNote = (title: string) => {
    // TODO: API call to create note and get new ID
    const newId = Date.now().toString(); // Temporary ID
    setIsCreateModalOpen(false);
    router.push(`/home-notes/${newId}?title=${encodeURIComponent(title)}`);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <>
      <Header
        title="집노트"
        rightIcon={isEditMode ? 'check' : 'edit'}
        onRightClick={handleEditToggle}
        rightIconColor="#111418"
      />
      <main className={styles.container}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            로딩 중...
          </div>
        ) : error ? (
          <div
            style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}
          >
            {error}
          </div>
        ) : notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            아직 집노트가 없습니다.
            <br />+ 버튼을 눌러 새 집노트를 만들어보세요.
          </div>
        ) : (
          <div className={styles.grid}>
            {notes.map((note, index) => (
              <HomeNoteCard
                key={`${note.id}-${index}`}
                note={note}
                onClick={handleNoteClick}
                isEditMode={isEditMode}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>
        )}
      </main>
      {!isEditMode && <FloatingAddButton onClick={handleAddClick} />}
      <TextFieldModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateNote}
        title="새 집노트"
        placeholder="집노트 제목을 입력하세요"
        maxLength={30}
        confirmText="생성하기"
        cancelText="취소"
      />
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="집노트 삭제"
        confirmText="삭제하기"
        cancelText="취소"
        variant="destructive"
      >
        이 집노트를 삭제하시겠습니까?
      </Modal>
    </>
  );
}
