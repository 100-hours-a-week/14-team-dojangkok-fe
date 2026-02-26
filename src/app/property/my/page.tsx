'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header, SegmentedControl, PropertyCard } from '@/components/common';
import { Property } from '@/types/property';
import { useToast } from '@/contexts/ToastContext';
import {
  getBookmarkedPropertyPosts,
  getTradingPropertyPosts,
  getCompletedPropertyPosts,
  getHiddenPropertyPosts,
  removeBookmark,
  updateDealStatus,
  updatePropertyVisibility,
} from '@/lib/api/property';
import { convertToPropertyList } from '@/utils/propertyAdapter';
import styles from './my.module.css';

type TabType = 'scraped' | 'ongoing' | 'completed' | 'hidden';

export default function MyPropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('scraped');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);

  const fetchProperties = useCallback(
    async (tab: TabType, cursor?: string) => {
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
        setNextCursor(response.data.next_cursor);
        setHasNext(response.data.hasNext);
      } catch {
        showError('매물을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
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
    setNextCursor(null);
    setHasNext(false);
    fetchProperties(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleBackClick = () => {
    router.back();
  };

  const handlePropertyClick = (id: string) => {
    router.push(`/property/${id}`);
  };

  const handleFavoriteClick = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await removeBookmark(Number(id));
      setProperties((prev) => prev.filter((p) => p.id !== id));
      success('스크랩이 해제되었습니다.');
    } catch {
      showError('스크랩 해제에 실패했습니다.');
    }
  };

  const handleStatusChange = async (
    id: string,
    newStatus: TabType,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    const postId = Number(id);

    const toastMessages: Partial<Record<TabType, Partial<Record<TabType, string>>>> = {
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
        if (newStatus === 'completed') await updateDealStatus(postId, 'COMPLETED');
        if (newStatus === 'hidden') await updatePropertyVisibility(postId, true);
      } else if (activeTab === 'completed') {
        if (newStatus === 'ongoing') await updateDealStatus(postId, 'TRADING');
        if (newStatus === 'hidden') await updatePropertyVisibility(postId, true);
      } else if (activeTab === 'hidden') {
        await updatePropertyVisibility(postId, false);
        if (newStatus === 'ongoing') await updateDealStatus(postId, 'TRADING');
        if (newStatus === 'completed') await updateDealStatus(postId, 'COMPLETED');
      }
      success(toastMessages[activeTab]?.[newStatus] ?? '상태가 변경되었습니다.');
      fetchProperties(activeTab);
    } catch {
      showError('상태 변경에 실패했습니다.');
    }
  };

  const handleTabChange = (value: string) => {
    const newTab = value as TabType;
    router.replace(`/property/my?tab=${newTab}`);
  };

  const handleLoadMore = () => {
    if (nextCursor && hasNext && !loading) {
      fetchProperties(activeTab, nextCursor);
    }
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
            <p className={styles.count}>총 {properties.length}건</p>
            <div className={styles.propertyList}>
              {properties.map((property) => {
                const renderStatusButtons = () => {
                  if (activeTab === 'ongoing') {
                    return (
                      <div className={styles.statusButtons}>
                        <button
                          className={styles.statusButton}
                          onClick={(e) =>
                            handleStatusChange(property.id, 'completed', e)
                          }
                        >
                          완료
                        </button>
                        <button
                          className={styles.statusButton}
                          onClick={(e) =>
                            handleStatusChange(property.id, 'hidden', e)
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
                          className={styles.statusButton}
                          onClick={(e) =>
                            handleStatusChange(property.id, 'ongoing', e)
                          }
                        >
                          진행중
                        </button>
                        <button
                          className={styles.statusButton}
                          onClick={(e) =>
                            handleStatusChange(property.id, 'hidden', e)
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
                          className={styles.statusButton}
                          onClick={(e) =>
                            handleStatusChange(property.id, 'ongoing', e)
                          }
                        >
                          진행중
                        </button>
                        <button
                          className={styles.statusButton}
                          onClick={(e) =>
                            handleStatusChange(property.id, 'completed', e)
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
                        activeTab === 'scraped' ? handleFavoriteClick : undefined
                      }
                      showDetails={activeTab === 'scraped'}
                      footer={renderStatusButtons()}
                    />
                  </div>
                );
              })}
            </div>
            {hasNext && (
              <button
                className={styles.loadMoreButton}
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? '로딩 중...' : '더보기'}
              </button>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <span className={`material-symbols-outlined ${styles.emptyIcon}`}>
              {activeTab === 'scraped' && 'bookmark'}
              {activeTab === 'ongoing' && 'schedule'}
              {activeTab === 'completed' && 'check_circle'}
              {activeTab === 'hidden' && 'visibility_off'}
            </span>
            <p className={styles.emptyText}>
              {activeTab === 'scraped' && '스크랩한 매물이 없습니다'}
              {activeTab === 'ongoing' && '진행중인 매물이 없습니다'}
              {activeTab === 'completed' && '완료된 매물이 없습니다'}
              {activeTab === 'hidden' && '숨김 처리한 매물이 없습니다'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
