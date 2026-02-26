'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header, SegmentedControl, PropertyCard } from '@/components/common';
import { Property } from '@/types/property';
import styles from './my.module.css';

type TabType = 'scraped' | 'ongoing' | 'completed' | 'hidden';

// Mock 데이터 (추후 API 연동)
const MOCK_MY_PROPERTIES: Record<TabType, Property[]> = {
  scraped: [
    {
      id: '1',
      title: '공도읍 진사리 조용한 풀옵션 원룸',
      address: '경기 안성시 공도읍',
      detailedAddress: '경기 안성시 공도읍 진사리',
      priceType: '월세',
      deposit: 300,
      monthlyRent: 35,
      propertyType: '원룸',
      floor: 1,
      area: 23,
      maintenanceFee: 5,
      images: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC4wfKVm7MojDryiO2uc1ZYt6myT7i-r_X72pWulXWOcYcZxyHvMmyruKovCen8cZoSpVnYcDDYQZ9VyEbIkIVCl5oWglCkUkizcTAKjcSikZbRaFs7-v5KJXOS_2VNTmkyJj77DTrssBuGrX6mJ3AvNUJmVD-Ls80HtOB6lnBigk7KlfwX490ZBwAgRzGeei7lgfd23Rccs8LovX8YL1gU237RjjV7FEBAu_FrtI21wq23ESMI-ISNzEurcGcXOy31C4pkVodkcuo',
      ],
      isReviewed: true,
      isFavorite: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  ongoing: [
    {
      id: '2',
      title: '채광 좋은 신축 투룸, 즉시 입주 가능',
      address: '서울 관악구',
      detailedAddress: '서울 관악구 신림동',
      priceType: '전세',
      deposit: 5000,
      propertyType: '투룸',
      floor: 3,
      area: 45,
      maintenanceFee: 7,
      images: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA-1snA-komCYUsSqZ-4y-Ft-TVlJqdSuOAIsdOxQnpYdccLBxvIIhj7QIEVAWPYvoiYdtLahgVEWsbWllZpwxs_WF5cWzHAfI0H7O6k7SxJn38eD2gPAwgDt_a5-1iTMYtRBPhO6hkKppLkSVKrrljr8uh7RWSAgViiPRBVmQEmvbummGmJkKkDdwfQEmfUUvnC4p7lrcX7969cr05XAZgWPkrYAp4_SrMv14Xxbu7EUJ1JU_37JOu09He3h4LWYsV2fgi0RLg9bs',
      ],
      isReviewed: true,
      isFavorite: false,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ],
  completed: [
    {
      id: '3',
      title: '역세권 풀옵션 오피스텔',
      address: '서울 마포구',
      detailedAddress: '서울 마포구 공덕동',
      priceType: '월세',
      deposit: 500,
      monthlyRent: 55,
      propertyType: '오피스텔',
      floor: 8,
      area: 33,
      maintenanceFee: 10,
      images: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBdl6fSPdf1nAO8y3ZAHecxID49fwhRWwg6npOqsUUzHONoxxHaQ2OMjn8Nv6P13oJq-195UMJtRFk7GYyuCXTU4Q1nXqVNRCSkGAt_UitiezQ7V7C-EWr416x8AYu4e6oTEzh1fia2WarghYnXZQzk0J255y4jkXNxeJb3j73h-_XVhV5QQv9IKiRiedYiZOho0Y-Ms9ytWkAjnvHYTPF4UbB2tsjqDpLW70E_uXVq8UJDTRt_Ilak0lDjXzfHIeCSK_tKL2q0CL4',
      ],
      isReviewed: true,
      isFavorite: false,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  hidden: [
    {
      id: '4',
      title: '저렴한 원룸, 보증금 협의 가능',
      address: '경기 부천시',
      detailedAddress: '경기 부천시 원미구',
      priceType: '월세',
      deposit: 200,
      monthlyRent: 30,
      propertyType: '원룸',
      floor: 2,
      area: 19,
      maintenanceFee: 4,
      images: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC4wfKVm7MojDryiO2uc1ZYt6myT7i-r_X72pWulXWOcYcZxyHvMmyruKovCen8cZoSpVnYcDDYQZ9VyEbIkIVCl5oWglCkUkizcTAKjcSikZbRaFs7-v5KJXOS_2VNTmkyJj77DTrssBuGrX6mJ3AvNUJmVD-Ls80HtOB6lnBigk7KlfwX490ZBwAgRzGeei7lgfd23Rccs8LovX8YL1gU237RjjV7FEBAu_FrtI21wq23ESMI-ISNzEurcGcXOy31C4pkVodkcuo',
      ],
      isReviewed: false,
      isFavorite: false,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export default function MyPropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('scraped');

  // URL에서 탭 파라미터 읽어서 초기화
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && ['scraped', 'ongoing', 'completed', 'hidden'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleBackClick = () => {
    router.back();
  };

  const handlePropertyClick = (id: string) => {
    router.push(`/property/${id}`);
  };

  const handleFavoriteClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('Toggle favorite:', id);
    // TODO: API 호출하여 스크랩 토글
  };

  const handleStatusChange = (id: string, newStatus: TabType, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log(`Change status: ${id} to ${newStatus}`);
    // TODO: API 호출하여 상태 변경
  };

  const handleTabChange = (value: string) => {
    const newTab = value as TabType;
    setActiveTab(newTab);
    // URL 업데이트 (히스토리에 추가하지 않고 대체)
    router.replace(`/property/my?tab=${newTab}`);
  };

  const currentProperties = MOCK_MY_PROPERTIES[activeTab];

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
        {currentProperties.length > 0 ? (
          <>
            <p className={styles.count}>총 {currentProperties.length}건</p>
            <div className={styles.propertyList}>
              {currentProperties.map((property) => {
                // 상태 변경 버튼 렌더링
                const renderStatusButtons = () => {
                  if (activeTab === 'ongoing') {
                    return (
                      <div className={styles.statusButtons}>
                        <button
                          className={styles.statusButton}
                          onClick={(e) => handleStatusChange(property.id, 'completed', e)}
                        >
                          완료
                        </button>
                        <button
                          className={styles.statusButton}
                          onClick={(e) => handleStatusChange(property.id, 'hidden', e)}
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
                          onClick={(e) => handleStatusChange(property.id, 'ongoing', e)}
                        >
                          진행중
                        </button>
                        <button
                          className={styles.statusButton}
                          onClick={(e) => handleStatusChange(property.id, 'hidden', e)}
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
                          onClick={(e) => handleStatusChange(property.id, 'ongoing', e)}
                        >
                          진행중
                        </button>
                        <button
                          className={styles.statusButton}
                          onClick={(e) => handleStatusChange(property.id, 'completed', e)}
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
                      onFavoriteClick={activeTab === 'scraped' ? handleFavoriteClick : undefined}
                      showDetails={activeTab === 'scraped'}
                      footer={renderStatusButtons()}
                    />
                  </div>
                );
              })}
            </div>
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
