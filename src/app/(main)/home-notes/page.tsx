'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Header,
  HomeNoteCard,
  FloatingAddButton,
  Modal,
  TextFieldModal,
} from '@/components/common';
import { HomeNote } from './types';
import styles from './HomeNotes.module.css';

const mockNotes: HomeNote[] = [
  {
    id: '1',
    title: '역삼동 햇살 가득한 원룸',
    date: '2023.10.28',
    images: [
      { id: '1-1', url: 'https://picsum.photos/seed/1-1/400/400' },
      { id: '1-2', url: 'https://picsum.photos/seed/1-2/400/400' },
      { id: '1-3', url: 'https://picsum.photos/seed/1-3/400/400' },
      { id: '1-4', url: 'https://picsum.photos/seed/1-4/400/400' },
      { id: '1-5', url: 'https://picsum.photos/seed/1-5/400/400' },
      { id: '1-6', url: 'https://picsum.photos/seed/1-6/400/400' },
    ],
  },
  {
    id: '2',
    title: '논현동 복층 오피스텔',
    date: '2023.10.15',
    images: [{ id: '2-1', url: 'https://picsum.photos/seed/2-1/400/400' }],
  },
  {
    id: '3',
    title: '서초동 신축 빌라',
    date: '2023.09.20',
    images: [
      { id: '3-1', url: 'https://picsum.photos/seed/3-1/400/400' },
      { id: '3-2', url: 'https://picsum.photos/seed/3-2/400/400' },
      { id: '3-3', url: 'https://picsum.photos/seed/3-3/400/400' },
      { id: '3-4', url: 'https://picsum.photos/seed/3-4/400/400' },
      { id: '3-5', url: 'https://picsum.photos/seed/3-5/400/400' },
      { id: '3-6', url: 'https://picsum.photos/seed/3-6/400/400' },
      { id: '3-7', url: 'https://picsum.photos/seed/3-7/400/400' },
      { id: '3-8', url: 'https://picsum.photos/seed/3-8/400/400' },
    ],
  },
  {
    id: '3',
    title: '서초동 신축 빌라',
    date: '2023.09.20',
    images: [
      { id: '3-1', url: 'https://picsum.photos/seed/3-1/400/400' },
      { id: '3-2', url: 'https://picsum.photos/seed/3-2/400/400' },
      { id: '3-3', url: 'https://picsum.photos/seed/3-3/400/400' },
      { id: '3-4', url: 'https://picsum.photos/seed/3-4/400/400' },
      { id: '3-5', url: 'https://picsum.photos/seed/3-5/400/400' },
      { id: '3-6', url: 'https://picsum.photos/seed/3-6/400/400' },
      { id: '3-7', url: 'https://picsum.photos/seed/3-7/400/400' },
      { id: '3-8', url: 'https://picsum.photos/seed/3-8/400/400' },
    ],
  },
  {
    id: '3',
    title: '서초동 신축 빌라',
    date: '2023.09.20',
    images: [
      { id: '3-1', url: 'https://picsum.photos/seed/3-1/400/400' },
      { id: '3-2', url: 'https://picsum.photos/seed/3-2/400/400' },
    ],
  },
  {
    id: '3',
    title: '서초동 신축 빌라',
    date: '2023.09.20',
    images: [
      { id: '3-1', url: 'https://picsum.photos/seed/3-1/400/400' },
      { id: '3-2', url: 'https://picsum.photos/seed/3-2/400/400' },
      { id: '3-3', url: 'https://picsum.photos/seed/3-3/400/400' },
      { id: '3-4', url: 'https://picsum.photos/seed/3-4/400/400' },
      { id: '3-5', url: 'https://picsum.photos/seed/3-5/400/400' },
      { id: '3-6', url: 'https://picsum.photos/seed/3-6/400/400' },
      { id: '3-7', url: 'https://picsum.photos/seed/3-7/400/400' },
      { id: '3-8', url: 'https://picsum.photos/seed/3-8/400/400' },
    ],
  },
  {
    id: '3',
    title: '서초동 신축 빌라',
    date: '2023.09.20',
    images: [
      { id: '3-1', url: 'https://picsum.photos/seed/3-1/400/400' },
      { id: '3-2', url: 'https://picsum.photos/seed/3-2/400/400' },
      { id: '3-3', url: 'https://picsum.photos/seed/3-3/400/400' },
      { id: '3-4', url: 'https://picsum.photos/seed/3-4/400/400' },
      { id: '3-5', url: 'https://picsum.photos/seed/3-5/400/400' },
      { id: '3-6', url: 'https://picsum.photos/seed/3-6/400/400' },
      { id: '3-7', url: 'https://picsum.photos/seed/3-7/400/400' },
      { id: '3-8', url: 'https://picsum.photos/seed/3-8/400/400' },
    ],
  },
  {
    id: '3',
    title: '서초동 신축 빌라',
    date: '2023.09.20',
    images: [],
  },
];

export default function HomeNotesPage() {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleNoteClick = (id: string) => {
    const note = mockNotes.find((n) => n.id === id);
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
        <div className={styles.grid}>
          {mockNotes.map((note, index) => (
            <HomeNoteCard
              key={`${note.id}-${index}`}
              note={note}
              onClick={handleNoteClick}
              isEditMode={isEditMode}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
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
