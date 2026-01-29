'use client';

import { use, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Header,
  ImageUploader,
  SegmentedControl,
  Checklist,
  ActionSheet,
  TextFieldModal,
  Modal,
} from '@/components/common';

const ImageGrid = dynamic(() => import('@/components/common/ImageGrid'), {
  ssr: false,
});
import type { ChecklistItem } from '@/components/common/Checklist';
import type { ActionSheetOption } from '@/components/common/ActionSheet';
import styles from './HomeNoteDetail.module.css';

const SEGMENT_OPTIONS = [
  { value: 'photos', label: '사진' },
  { value: 'checklist', label: '체크리스트' },
];

interface ImageItem {
  id: string;
  url: string;
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: '1', text: '채광이 잘 드는가?', checked: false },
  { id: '2', text: '수압이 강한가?', checked: false },
  { id: '3', text: '벽지에 곰팡이가 없는가?', checked: false },
];

export default function HomeNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTitle = searchParams.get('title') || '집노트';
  const [title, setTitle] = useState(initialTitle);
  const [activeTab, setActiveTab] = useState('photos');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [checklistItems, setChecklistItems] =
    useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleUpload = (files: FileList) => {
    const newImages: ImageItem[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleDeleteImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleChecklistToggle = (id: string) => {
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleChecklistAdd = (text: string) => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text,
      checked: false,
    };
    setChecklistItems((prev) => [...prev, newItem]);
  };

  const handleChecklistUpdate = (id: string, text: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  const handleOptionsClick = () => {
    setIsActionSheetOpen(true);
  };

  const handleEditTitle = () => {
    setIsEditModalOpen(true);
  };

  const handleTitleUpdate = (newTitle: string) => {
    setTitle(newTitle);
    setIsEditModalOpen(false);
    // TODO: API call to update title
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    console.log('Delete note:', id);
    // TODO: API call to delete note
    setIsDeleteModalOpen(false);
    router.push('/home-notes');
  };

  const actionSheetOptions: ActionSheetOption[] = [
    { label: '제목 수정', onClick: handleEditTitle, icon: 'edit' },
    {
      label: '삭제하기',
      onClick: handleDeleteClick,
      destructive: true,
      icon: 'delete',
    },
  ];

  return (
    <>
      <Header
        title={title}
        showBackButton
        onBackClick={handleBack}
        rightIcon="more_horiz"
        onRightClick={handleOptionsClick}
        rightIconColor="#111418"
      />
      <main className={styles.container}>
        <div className={styles.content}>
          <div className={styles.segmentWrapper}>
            <SegmentedControl
              options={SEGMENT_OPTIONS}
              value={activeTab}
              onChange={setActiveTab}
            />
          </div>

          {activeTab === 'photos' && (
            <div className={styles.section}>
              <ImageUploader
                onUpload={handleUpload}
                mainText="사진 추가하기"
                subText="JPG, PNG 지원"
              />
              <div className={styles.imageGridWrapper}>
                <ImageGrid
                  images={images}
                  onDelete={handleDeleteImage}
                  title="첨부된 사진"
                  emptyText="집노트에 추가할 사진을 업로드해주세요"
                />
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className={styles.section}>
              <Checklist
                items={checklistItems}
                onItemToggle={handleChecklistToggle}
                onItemAdd={handleChecklistAdd}
                onItemUpdate={handleChecklistUpdate}
              />
            </div>
          )}
        </div>
      </main>

      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        options={actionSheetOptions}
      />

      <TextFieldModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleTitleUpdate}
        title="제목 수정"
        initialValue={title}
        placeholder="집노트 제목을 입력하세요"
        maxLength={30}
        confirmText="수정하기"
        cancelText="취소"
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
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
