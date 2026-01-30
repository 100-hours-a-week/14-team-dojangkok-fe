'use client';

import { use, useState, useEffect, useRef } from 'react';
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
import {
  getHomeNoteDetail,
  updateHomeNoteTitle,
  deleteHomeNote,
  uploadHomeNotePhotos,
  getChecklist,
  updateChecklist,
  updateChecklistItemStatus,
  deleteHomeNoteFile,
} from '@/lib/api/homeNote';

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
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 디바운스 타이머 및 플래그
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const skipDebounceRef = useRef(false);

  // 집 노트 상세 정보 로드
  useEffect(() => {
    const loadHomeNoteDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await getHomeNoteDetail(Number(id));
        const { home_note, files } = response.data;

        // 제목 업데이트
        setTitle(home_note.title);

        // 파일 목록을 이미지로 변환
        const loadedImages: ImageItem[] = files.map((file) => ({
          id: file.file_asset_id.toString(),
          url: file.presigned_url,
        }));
        setImages(loadedImages);

        // 체크리스트 로드
        const checklistResponse = await getChecklist(Number(id));
        const loadedChecklist: ChecklistItem[] =
          checklistResponse.data.checklist_items.map((item) => ({
            id: item.checklist_item_id.toString(),
            text: item.content,
            checked: item.is_completed,
          }));
        setChecklistItems(loadedChecklist);
      } catch (err) {
        console.error('집 노트 상세 조회 실패:', err);
        setError('집 노트를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeNoteDetail();
  }, [id]);

  // 체크리스트 내용 변경 시 디바운스로 자동 저장 (체크박스 토글 제외)
  useEffect(() => {
    // 초기 로드 시에는 API 호출하지 않음
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    // 체크박스 토글로 인한 변경은 스킵 (PATCH API로 이미 처리됨)
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      return;
    }

    // 빈 체크리스트는 저장하지 않음
    if (checklistItems.length === 0) {
      return;
    }

    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 500ms 후 API 호출 (내용 변경, 항목 추가 등)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // UI 타입을 API 타입으로 변환
        const checklistsData = checklistItems.map((item) => ({
          checklist_item_id: Number(item.id),
          content: item.text,
          isCompleted: item.checked,
        }));

        const response = await updateChecklist(Number(id), checklistsData);
        console.log('체크리스트 자동 저장 완료');

        // 응답에서 ID 업데이트 (백엔드에서 ID가 재할당될 수 있음)
        skipDebounceRef.current = true; // 상태 업데이트 시 디바운스 방지

        // API 응답으로 상태 업데이트 (ID 동기화)
        const updatedChecklist: ChecklistItem[] =
          response.data.checklist_items.map((apiItem) => ({
            id: apiItem.checklist_item_id.toString(),
            text: apiItem.content,
            checked: apiItem.is_completed,
          }));

        setChecklistItems(updatedChecklist);
      } catch (err) {
        console.error('체크리스트 저장 실패:', err);
        // 사용자에게 에러를 보여주지 않고 조용히 실패 처리
      }
    }, 500);

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [checklistItems, id]);

  const handleBack = () => {
    router.back();
  };

  const handleUpload = async (files: FileList) => {
    if (isUploading) return;

    try {
      setIsUploading(true);

      // 임시 미리보기용 이미지 추가
      const tempImages: ImageItem[] = Array.from(files).map((file) => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
      }));
      setImages((prev) => [...prev, ...tempImages]);

      // API 호출하여 S3 업로드 및 집 노트에 첨부
      const response = await uploadHomeNotePhotos(
        Number(id),
        Array.from(files)
      );

      // 임시 이미지 제거하고 실제 업로드된 이미지로 교체
      // (필요시 presigned URL을 받아서 표시할 수도 있음)
      console.log('업로드 완료:', response.data.file_items);

      // 성공 알림 (선택사항)
      // alert('사진이 업로드되었습니다.');
    } catch (err) {
      console.error('사진 업로드 실패:', err);
      alert('사진 업로드에 실패했습니다.');

      // 실패 시 임시 이미지 제거
      setImages((prev) => prev.filter((img) => !img.id.startsWith('temp-')));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      // API 호출하여 파일 삭제
      await deleteHomeNoteFile(Number(id), Number(imageId));

      // 로컬 상태에서 제거
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      console.error('파일 삭제 실패:', err);
      alert('파일 삭제에 실패했습니다.');
    }
  };

  const handleChecklistToggle = async (itemId: string) => {
    // 낙관적 UI 업데이트
    const updatedItem = checklistItems.find((item) => item.id === itemId);
    if (!updatedItem) return;

    const newCheckedState = !updatedItem.checked;

    // 스킵 플래그 설정 (디바운스 useEffect 방지)
    skipDebounceRef.current = true;

    // UI 즉시 업데이트
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: newCheckedState } : item
      )
    );

    // PATCH API 즉시 호출
    try {
      await updateChecklistItemStatus(
        Number(id),
        Number(itemId),
        newCheckedState
      );
    } catch (err) {
      console.error('체크리스트 항목 상태 변경 실패:', err);
      // 실패 시 원래 상태로 롤백
      skipDebounceRef.current = true;
      setChecklistItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, checked: !newCheckedState } : item
        )
      );
    }
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

  const handleChecklistDelete = (id: string) => {
    setChecklistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleOptionsClick = () => {
    setIsActionSheetOpen(true);
  };

  const handleEditTitle = () => {
    setIsEditModalOpen(true);
  };

  const handleTitleUpdate = async (newTitle: string) => {
    try {
      // API 호출하여 제목 수정
      await updateHomeNoteTitle(Number(id), newTitle);

      // 로컬 상태 업데이트
      setTitle(newTitle);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('제목 수정 실패:', err);
      alert('제목 수정에 실패했습니다.');
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // API 호출하여 집 노트 삭제
      await deleteHomeNote(Number(id));

      setIsDeleteModalOpen(false);

      // 목록 페이지로 이동
      router.push('/home-notes');
    } catch (err) {
      console.error('집 노트 삭제 실패:', err);
      alert('집 노트 삭제에 실패했습니다.');
    }
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

  if (isLoading) {
    return (
      <>
        <Header title="집노트" showBackButton onBackClick={handleBack} />
        <main className={styles.container}>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            로딩 중...
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="집노트" showBackButton onBackClick={handleBack} />
        <main className={styles.container}>
          <div
            style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}
          >
            {error}
          </div>
        </main>
      </>
    );
  }

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
                mainText="파일 추가하기"
                subText="JPG, PNG, PDF 지원"
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
                onItemDelete={handleChecklistDelete}
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
