'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Header,
  FloatingAddButton,
  Modal,
  TextFieldModal,
} from '@/components/common';
import { HomeNote } from './types';
import {
  getHomeNotes,
  createHomeNote,
  deleteHomeNote,
} from '@/lib/api/homeNote';
import { HomeNoteItem } from '@/types/homeNote';
import styles from './HomeNotes.module.css';

// HomeNoteCard는 react-pdf를 사용하므로 SSR 방지를 위해 dynamic import 사용
const HomeNoteCard = dynamic(() => import('@/components/common/HomeNoteCard'), {
  ssr: false,
});

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
    images: (item.preview_images || []).map((previewImage) => ({
      id: previewImage.file_asset_id.toString(),
      url: previewImage.presigned_url,
    })),
    totalFileCount: item.file_count,
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

  const handleConfirmDelete = async () => {
    if (noteToDelete) {
      try {
        // API 호출하여 집 노트 삭제
        await deleteHomeNote(Number(noteToDelete));

        // 로컬 상태에서 삭제
        setNotes((prev) => prev.filter((note) => note.id !== noteToDelete));

        setIsDeleteModalOpen(false);
        setNoteToDelete(null);
        setIsEditMode(false);
      } catch (err) {
        console.error('집 노트 삭제 실패:', err);
        alert('집 노트 삭제에 실패했습니다.');
      }
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setNoteToDelete(null);
  };

  const handleCreateNote = async (title: string) => {
    try {
      // API 호출하여 집 노트 생성
      const response = await createHomeNote(title);
      const newId = response.data.home_note_id;

      setIsCreateModalOpen(false);

      // 생성된 집 노트 상세 페이지로 이동
      router.push(`/home-notes/${newId}?title=${encodeURIComponent(title)}`);
    } catch (err) {
      console.error('집 노트 생성 실패:', err);
      alert('집 노트 생성에 실패했습니다.');
    }
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
