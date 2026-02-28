'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Header,
  SegmentedControl,
  PropertyCard,
  Modal,
  ActionSheet,
} from '@/components/common';
import { Property } from '@/types/property';
import { useToast } from '@/contexts/ToastContext';
import {
  getBookmarkedPropertyPosts,
  getTradingPropertyPosts,
  getCompletedPropertyPosts,
  getHiddenPropertyPosts,
  deletePropertyPost,
  updateDealStatus,
  updatePropertyVisibility,
} from '@/lib/api/property';
import { usePropertyBookmark } from '@/hooks/usePropertyBookmark';
import { convertToPropertyList } from '@/utils/propertyAdapter';
import styles from './my.module.css';

type TabType = 'scraped' | 'ongoing' | 'completed' | 'hidden';

export default function MyPropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('scraped');
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<number | null>(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, right: 0 });
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const { toggleBookmark } = usePropertyBookmark({
    onOptimisticUpdate: (id, nextState) => {
      setProperties((prev) =>
        prev.map((p) =>
          Number(p.id) === id ? { ...p, isFavorite: nextState } : p
        )
      );
    },
    onRollback: (id, prevState) => {
      setProperties((prev) =>
        prev.map((p) =>
          Number(p.id) === id ? { ...p, isFavorite: prevState } : p
        )
      );
    },
  });

  const fetchProperties = useCallback(
    async (tab: TabType, cursor?: string) => {
      if (loadingRef.current && cursor) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        let response;
        switch (tab) {
          case 'scraped':
            response = await getBookmarkedPropertyPosts(cursor);
            break;
          case 'ongoing':
            response = await getTradingPropertyPosts(cursor);
            break;
          case 'completed':
            response = await getCompletedPropertyPosts(cursor);
            break;
          case 'hidden':
            response = await getHiddenPropertyPosts(cursor);
            break;
        }
        const items = convertToPropertyList(response.data.property_post_items);
        setProperties((prev) => (cursor ? [...prev, ...items] : items));
        if (!cursor) {
          setTotalCount(response.data.total_count);
        }
        setNextCursor(response.data.next_cursor);
        setHasNext(response.data.hasNext);
      } catch {
        showError('매물을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [showError]
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    const tab =
      tabFromUrl &&
      ['scraped', 'ongoing', 'completed', 'hidden'].includes(tabFromUrl)
        ? tabFromUrl
        : 'scraped';
    setActiveTab(tab);
    setProperties([]);
    setTotalCount(0);
    setNextCursor(null);
    setHasNext(false);
    fetchProperties(tab);
  }, [searchParams, fetchProperties]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !loadingRef.current) {
          fetchProperties(activeTab, nextCursor ?? undefined);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, hasNext, nextCursor, fetchProperties]);

  const handleBackClick = () => {
    router.back();
  };

  const handlePropertyClick = (id: string) => {
    router.push(`/property/${id}`);
  };

  const handleFavoriteClick = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const target = properties.find((p) => p.id === id);
    if (!target) return;
    await toggleBookmark(Number(id), target.isFavorite);
  };

  const handleOptionClick = (
    property: Property,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setPopoverPosition({
      top: rect.bottom + window.scrollY + 8,
      right: window.innerWidth - rect.right,
    });
    setSelectedProperty(property);
    setIsActionSheetOpen(true);
  };

  const handleEditClick = (id: string) => {
    setIsActionSheetOpen(false);
    router.push(`/property/create?edit=${id}`);
  };

  const handleDeleteClick = (id: string) => {
    setPropertyToDelete(Number(id));
    setIsActionSheetOpen(false);
    setTimeout(() => setIsDeleteModalOpen(true), 50);
  };

  const handleConfirmDelete = async () => {
    if (propertyToDelete === null) return;
    try {
      await deletePropertyPost(propertyToDelete);
      success('매물이 삭제되었습니다.');
      setProperties((prev) =>
        prev.filter((p) => Number(p.id) !== propertyToDelete)
      );
      setTotalCount((prev) => prev - 1);
    } catch {
      showError('매물 삭제에 실패했습니다.');
    } finally {
      setIsDeleteModalOpen(false);
      setPropertyToDelete(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: TabType) => {
    setIsActionSheetOpen(false);
    const postId = Number(id);
    const toastMessages: Partial<
      Record<TabType, Partial<Record<TabType, string>>>
    > = {
      ongoing: {
        completed: '거래가 완료 처리되었습니다.',
        hidden: '매물이 숨김 처리되었습니다.',
      },
      completed: {
        ongoing: '매물이 진행중으로 변경되었습니다.',
        hidden: '매물이 숨김 처리되었습니다.',
      },
      hidden: {
        ongoing: '매물이 진행중으로 복귀되었습니다.',
        completed: '매물이 완료 처리되었습니다.',
      },
    };
    try {
      if (activeTab === 'ongoing') {
        if (newStatus === 'completed')
          await updateDealStatus(postId, 'COMPLETED');
        if (newStatus === 'hidden')
          await updatePropertyVisibility(postId, true);
      } else if (activeTab === 'completed') {
        if (newStatus === 'ongoing') await updateDealStatus(postId, 'TRADING');
        if (newStatus === 'hidden')
          await updatePropertyVisibility(postId, true);
      } else if (activeTab === 'hidden') {
        await updatePropertyVisibility(postId, false);
        if (newStatus === 'ongoing') await updateDealStatus(postId, 'TRADING');
        if (newStatus === 'completed')
          await updateDealStatus(postId, 'COMPLETED');
      }
      success(
        toastMessages[activeTab]?.[newStatus] ?? '상태가 변경되었습니다.'
      );
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setTotalCount((prev) => prev - 1);
    } catch {
      showError('상태 변경에 실패했습니다.');
    }
  };

  const handleTabChange = (value: string) => {
    const newTab = value as TabType;
    router.replace(`/property/my?tab=${newTab}`);
  };

  return (
    <div className={styles.page}>
      <Header
        title="내 매물 관리"
        showBackButton
        onBackClick={handleBackClick}
      />
      <div className={styles.tabSection}>
        <SegmentedControl
          options={[
            { value: 'scraped', label: '스크랩' },
            { value: 'ongoing', label: '진행중' },
            { value: 'completed', label: '완료' },
            { value: 'hidden', label: '숨김' },
          ]}
          value={activeTab}
          onChange={handleTabChange}
        />
      </div>

      <main className={styles.main}>
        {loading && properties.length === 0 ? (
          <div className={styles.loadingState}>
            <p>매물을 불러오는 중...</p>
          </div>
        ) : properties.length > 0 ? (
          <>
            <p className={styles.count}>총 {totalCount}건</p>
            <div className={styles.propertyList}>
              {properties.map((property) => {
                const renderStatusButtons = () => {
                  if (activeTab === 'ongoing') {
                    return (
                      <div className={styles.statusButtons}>
                        <button
                          className={`${styles.statusButton} ${styles.primary}`}
                          onClick={() =>
                            handleStatusChange(property.id, 'completed')
                          }
                        >
                          완료
                        </button>
                        <button
                          className={styles.statusButton}
                          onClick={() =>
                            handleStatusChange(property.id, 'hidden')
                          }
                        >
                          숨김
                        </button>
                      </div>
                    );
                  }
                  if (activeTab === 'completed') {
                    return (
                      <div className={styles.statusButtons}>
                        <button
                          className={`${styles.statusButton} ${styles.primary}`}
                          onClick={() =>
                            handleStatusChange(property.id, 'ongoing')
                          }
                        >
                          진행중
                        </button>
                        <button
                          className={styles.statusButton}
                          onClick={() =>
                            handleStatusChange(property.id, 'hidden')
                          }
                        >
                          숨김
                        </button>
                      </div>
                    );
                  }
                  if (activeTab === 'hidden') {
                    return (
                      <div className={styles.statusButtons}>
                        <button
                          className={`${styles.statusButton} ${styles.primary}`}
                          onClick={() =>
                            handleStatusChange(property.id, 'ongoing')
                          }
                        >
                          진행중
                        </button>
                        <button
                          className={styles.statusButton}
                          onClick={() =>
                            handleStatusChange(property.id, 'completed')
                          }
                        >
                          완료
                        </button>
                      </div>
                    );
                  }
                  return null;
                };

                return (
                  <div key={property.id} className={styles.propertyCardWrapper}>
                    <PropertyCard
                      property={property}
                      onClick={handlePropertyClick}
                      onFavoriteClick={
                        activeTab === 'scraped'
                          ? handleFavoriteClick
                          : undefined
                      }
                      onOptionClick={
                        activeTab !== 'scraped'
                          ? (p, e) => handleOptionClick(p, e)
                          : undefined
                      }
                      showDetails={activeTab === 'scraped'}
                      footer={renderStatusButtons()}
                    />
                  </div>
                );
              })}
            </div>
            {hasNext && <div ref={sentinelRef} style={{ height: 1 }} />}
          </>
        ) : (
          <div className={styles.emptyState}>
            <span className={`material-symbols-outlined ${styles.emptyIcon}`}>
              {activeTab === 'scraped' && 'bookmark_border'}
              {activeTab === 'ongoing' && 'home'}
              {activeTab === 'completed' && 'check_circle'}
              {activeTab === 'hidden' && 'visibility_off'}
            </span>
            <p className={styles.emptyText}>
              {activeTab === 'scraped' && '스크랩한 매물이 없어요'}
              {activeTab === 'ongoing' && '진행 중인 매물이 없어요'}
              {activeTab === 'completed' && '완료된 매물이 없어요'}
              {activeTab === 'hidden' && '숨김 처리한 매물이 없어요'}
            </p>
          </div>
        )}
      </main>

      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        position={popoverPosition}
        options={[
          {
            label: '수정',
            onClick: () => {
              if (selectedProperty) handleEditClick(selectedProperty.id);
            },
          },
          {
            label: '삭제',
            onClick: () => {
              if (selectedProperty) handleDeleteClick(selectedProperty.id);
            },
            destructive: true,
          },
        ]}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="매물을 삭제할까요?"
        confirmText="삭제"
        cancelText="취소"
        variant="destructive"
      >
        <p>삭제된 매물은 복구할 수 없습니다.</p>
      </Modal>
    </div>
  );
}
