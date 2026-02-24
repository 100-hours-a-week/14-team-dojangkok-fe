'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Header,
  FloatingAddButton,
  SearchBar,
  FilterChip,
  PropertyCard,
  StampBadge,
} from '@/components/common';
import { Property } from '@/types/property';
import styles from './property.module.css';

const MOCK_PROPERTIES: Property[] = [
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
    isFavorite: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
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
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC4wfKVm7MojDryiO2uc1ZYt6myT7i-r_X72pWulXWOcYcZxyHvMmyruKovCen8cZoSpVnYcDDYQZ9VyEbIkIVCl5oWglCkUkizcTAKjcSikZbRaFs7-v5KJXOS_2VNTmkyJj77DTrssBuGrX6mJ3AvNUJmVD-Ls80HtOB6lnBigk7KlfwX490ZBwAgRzGeei7lgfd23Rccs8LovX8YL1gU237RjjV7FEBAu_FrtI21wq23ESMI-ISNzEurcGcXOy31C4pkVodkcuo',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdl6fSPdf1nAO8y3ZAHecxID49fwhRWwg6npOqsUUzHONoxxHaQ2OMjn8Nv6P13oJq-195UMJtRFk7GYyuCXTU4Q1nXqVNRCSkGAt_UitiezQ7V7C-EWr416x8AYu4e6oTEzh1fia2WarghYnXZQzk0J255y4jkXNxeJb3j73h-_XVhV5QQv9IKiRiedYiZOho0Y-Ms9ytWkAjnvHYTPF4UbB2tsjqDpLW70E_uXVq8UJDTRt_Ilak0lDjXzfHIeCSK_tKL2q0CL4',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-1snA-komCYUsSqZ-4y-Ft-TVlJqdSuOAIsdOxQnpYdccLBxvIIhj7QIEVAWPYvoiYdtLahgVEWsbWllZpwxs_WF5cWzHAfI0H7O6k7SxJn38eD2gPAwgDt_a5-1iTMYtRBPhO6hkKppLkSVKrrljr8uh7RWSAgViiPRBVmQEmvbummGmJkKkDdwfQEmfUUvnC4p7lrcX7969cr05XAZgWPkrYAp4_SrMv14Xxbu7EUJ1JU_37JOu09He3h4LWYsV2fgi0RLg9bs',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC4wfKVm7MojDryiO2uc1ZYt6myT7i-r_X72pWulXWOcYcZxyHvMmyruKovCen8cZoSpVnYcDDYQZ9VyEbIkIVCl5oWglCkUkizcTAKjcSikZbRaFs7-v5KJXOS_2VNTmkyJj77DTrssBuGrX6mJ3AvNUJmVD-Ls80HtOB6lnBigk7KlfwX490ZBwAgRzGeei7lgfd23Rccs8LovX8YL1gU237RjjV7FEBAu_FrtI21wq23ESMI-ISNzEurcGcXOy31C4pkVodkcuo',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdl6fSPdf1nAO8y3ZAHecxID49fwhRWwg6npOqsUUzHONoxxHaQ2OMjn8Nv6P13oJq-195UMJtRFk7GYyuCXTU4Q1nXqVNRCSkGAt_UitiezQ7V7C-EWr416x8AYu4e6oTEzh1fia2WarghYnXZQzk0J255y4jkXNxeJb3j73h-_XVhV5QQv9IKiRiedYiZOho0Y-Ms9ytWkAjnvHYTPF4UbB2tsjqDpLW70E_uXVq8UJDTRt_Ilak0lDjXzfHIeCSK_tKL2q0CL4',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-1snA-komCYUsSqZ-4y-Ft-TVlJqdSuOAIsdOxQnpYdccLBxvIIhj7QIEVAWPYvoiYdtLahgVEWsbWllZpwxs_WF5cWzHAfI0H7O6k7SxJn38eD2gPAwgDt_a5-1iTMYtRBPhO6hkKppLkSVKrrljr8uh7RWSAgViiPRBVmQEmvbummGmJkKkDdwfQEmfUUvnC4p7lrcX7969cr05XAZgWPkrYAp4_SrMv14Xxbu7EUJ1JU_37JOu09He3h4LWYsV2fgi0RLg9bs',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC4wfKVm7MojDryiO2uc1ZYt6myT7i-r_X72pWulXWOcYcZxyHvMmyruKovCen8cZoSpVnYcDDYQZ9VyEbIkIVCl5oWglCkUkizcTAKjcSikZbRaFs7-v5KJXOS_2VNTmkyJj77DTrssBuGrX6mJ3AvNUJmVD-Ls80HtOB6lnBigk7KlfwX490ZBwAgRzGeei7lgfd23Rccs8LovX8YL1gU237RjjV7FEBAu_FrtI21wq23ESMI-ISNzEurcGcXOy31C4pkVodkcuo',
    ],
    isReviewed: true,
    isFavorite: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: '대학가 근처 깔끔한 오피스텔',
    address: '서울 서대문구',
    detailedAddress: '서울 서대문구 창천동',
    priceType: '월세',
    deposit: 500,
    monthlyRent: 45,
    propertyType: '오피스텔',
    floor: 5,
    area: 28,
    maintenanceFee: 8,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdl6fSPdf1nAO8y3ZAHecxID49fwhRWwg6npOqsUUzHONoxxHaQ2OMjn8Nv6P13oJq-195UMJtRFk7GYyuCXTU4Q1nXqVNRCSkGAt_UitiezQ7V7C-EWr416x8AYu4e6oTEzh1fia2WarghYnXZQzk0J255y4jkXNxeJb3j73h-_XVhV5QQv9IKiRiedYiZOho0Y-Ms9ytWkAjnvHYTPF4UbB2tsjqDpLW70E_uXVq8UJDTRt_Ilak0lDjXzfHIeCSK_tKL2q0CL4',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-1snA-komCYUsSqZ-4y-Ft-TVlJqdSuOAIsdOxQnpYdccLBxvIIhj7QIEVAWPYvoiYdtLahgVEWsbWllZpwxs_WF5cWzHAfI0H7O6k7SxJn38eD2gPAwgDt_a5-1iTMYtRBPhO6hkKppLkSVKrrljr8uh7RWSAgViiPRBVmQEmvbummGmJkKkDdwfQEmfUUvnC4p7lrcX7969cr05XAZgWPkrYAp4_SrMv14Xxbu7EUJ1JU_37JOu09He3h4LWYsV2fgi0RLg9bs',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC4wfKVm7MojDryiO2uc1ZYt6myT7i-r_X72pWulXWOcYcZxyHvMmyruKovCen8cZoSpVnYcDDYQZ9VyEbIkIVCl5oWglCkUkizcTAKjcSikZbRaFs7-v5KJXOS_2VNTmkyJj77DTrssBuGrX6mJ3AvNUJmVD-Ls80HtOB6lnBigk7KlfwX490ZBwAgRzGeei7lgfd23Rccs8LovX8YL1gU237RjjV7FEBAu_FrtI21wq23ESMI-ISNzEurcGcXOy31C4pkVodkcuo',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdl6fSPdf1nAO8y3ZAHecxID49fwhRWwg6npOqsUUzHONoxxHaQ2OMjn8Nv6P13oJq-195UMJtRFk7GYyuCXTU4Q1nXqVNRCSkGAt_UitiezQ7V7C-EWr416x8AYu4e6oTEzh1fia2WarghYnXZQzk0J255y4jkXNxeJb3j73h-_XVhV5QQv9IKiRiedYiZOho0Y-Ms9ytWkAjnvHYTPF4UbB2tsjqDpLW70E_uXVq8UJDTRt_Ilak0lDjXzfHIeCSK_tKL2q0CL4',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-1snA-komCYUsSqZ-4y-Ft-TVlJqdSuOAIsdOxQnpYdccLBxvIIhj7QIEVAWPYvoiYdtLahgVEWsbWllZpwxs_WF5cWzHAfI0H7O6k7SxJn38eD2gPAwgDt_a5-1iTMYtRBPhO6hkKppLkSVKrrljr8uh7RWSAgViiPRBVmQEmvbummGmJkKkDdwfQEmfUUvnC4p7lrcX7969cr05XAZgWPkrYAp4_SrMv14Xxbu7EUJ1JU_37JOu09He3h4LWYsV2fgi0RLg9bs',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC4wfKVm7MojDryiO2uc1ZYt6myT7i-r_X72pWulXWOcYcZxyHvMmyruKovCen8cZoSpVnYcDDYQZ9VyEbIkIVCl5oWglCkUkizcTAKjcSikZbRaFs7-v5KJXOS_2VNTmkyJj77DTrssBuGrX6mJ3AvNUJmVD-Ls80HtOB6lnBigk7KlfwX490ZBwAgRzGeei7lgfd23Rccs8LovX8YL1gU237RjjV7FEBAu_FrtI21wq23ESMI-ISNzEurcGcXOy31C4pkVodkcuo',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdl6fSPdf1nAO8y3ZAHecxID49fwhRWwg6npOqsUUzHONoxxHaQ2OMjn8Nv6P13oJq-195UMJtRFk7GYyuCXTU4Q1nXqVNRCSkGAt_UitiezQ7V7C-EWr416x8AYu4e6oTEzh1fia2WarghYnXZQzk0J255y4jkXNxeJb3j73h-_XVhV5QQv9IKiRiedYiZOho0Y-Ms9ytWkAjnvHYTPF4UbB2tsjqDpLW70E_uXVq8UJDTRt_Ilak0lDjXzfHIeCSK_tKL2q0CL4',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-1snA-komCYUsSqZ-4y-Ft-TVlJqdSuOAIsdOxQnpYdccLBxvIIhj7QIEVAWPYvoiYdtLahgVEWsbWllZpwxs_WF5cWzHAfI0H7O6k7SxJn38eD2gPAwgDt_a5-1iTMYtRBPhO6hkKppLkSVKrrljr8uh7RWSAgViiPRBVmQEmvbummGmJkKkDdwfQEmfUUvnC4p7lrcX7969cr05XAZgWPkrYAp4_SrMv14Xxbu7EUJ1JU_37JOu09He3h4LWYsV2fgi0RLg9bs',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC4wfKVm7MojDryiO2uc1ZYt6myT7i-r_X72pWulXWOcYcZxyHvMmyruKovCen8cZoSpVnYcDDYQZ9VyEbIkIVCl5oWglCkUkizcTAKjcSikZbRaFs7-v5KJXOS_2VNTmkyJj77DTrssBuGrX6mJ3AvNUJmVD-Ls80HtOB6lnBigk7KlfwX490ZBwAgRzGeei7lgfd23Rccs8LovX8YL1gU237RjjV7FEBAu_FrtI21wq23ESMI-ISNzEurcGcXOy31C4pkVodkcuo',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdl6fSPdf1nAO8y3ZAHecxID49fwhRWwg6npOqsUUzHONoxxHaQ2OMjn8Nv6P13oJq-195UMJtRFk7GYyuCXTU4Q1nXqVNRCSkGAt_UitiezQ7V7C-EWr416x8AYu4e6oTEzh1fia2WarghYnXZQzk0J255y4jkXNxeJb3j73h-_XVhV5QQv9IKiRiedYiZOho0Y-Ms9ytWkAjnvHYTPF4UbB2tsjqDpLW70E_uXVq8UJDTRt_Ilak0lDjXzfHIeCSK_tKL2q0CL4',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-1snA-komCYUsSqZ-4y-Ft-TVlJqdSuOAIsdOxQnpYdccLBxvIIhj7QIEVAWPYvoiYdtLahgVEWsbWllZpwxs_WF5cWzHAfI0H7O6k7SxJn38eD2gPAwgDt_a5-1iTMYtRBPhO6hkKppLkSVKrrljr8uh7RWSAgViiPRBVmQEmvbummGmJkKkDdwfQEmfUUvnC4p7lrcX7969cr05XAZgWPkrYAp4_SrMv14Xxbu7EUJ1JU_37JOu09He3h4LWYsV2fgi0RLg9bs',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC4wfKVm7MojDryiO2uc1ZYt6myT7i-r_X72pWulXWOcYcZxyHvMmyruKovCen8cZoSpVnYcDDYQZ9VyEbIkIVCl5oWglCkUkizcTAKjcSikZbRaFs7-v5KJXOS_2VNTmkyJj77DTrssBuGrX6mJ3AvNUJmVD-Ls80HtOB6lnBigk7KlfwX490ZBwAgRzGeei7lgfd23Rccs8LovX8YL1gU237RjjV7FEBAu_FrtI21wq23ESMI-ISNzEurcGcXOy31C4pkVodkcuo',
    ],
    isReviewed: true,
    isFavorite: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function PropertyPage() {
  const router = useRouter();
  const [showReviewedOnly, setShowReviewedOnly] = useState(true);
  const [properties, setProperties] = useState(MOCK_PROPERTIES);

  const handlePropertyClick = (id: string) => {
    console.log('Property clicked:', id);
  };

  const handleFavoriteClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  };

  const handleAddClick = () => {
    console.log('Add property clicked');
  };

  const handleBackClick = () => {
    router.back();
  };

  const handleMyClick = () => {
    router.push('/property/my');
  };

  const handleSearchClick = () => {
    router.push('/property/search');
  };

  const filteredProperties = showReviewedOnly
    ? properties.filter((property) => property.isReviewed)
    : properties;

  return (
    <div className={styles.page}>
      <Header
        title="매물"
        showBackButton
        onBackClick={handleBackClick}
        rightText="MY"
        onRightClick={handleMyClick}
      />

      <div className={styles.searchSection}>
        <SearchBar
          placeholder="어떤 집을 찾으시나요?"
          onClick={handleSearchClick}
        />
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterChips}>
          <FilterChip
            active={showReviewedOnly}
            onClick={() => setShowReviewedOnly(!showReviewedOnly)}
            badge={<StampBadge size="small" />}
          >
            검토 완료
          </FilterChip>
          <FilterChip showDropdown>거래유형</FilterChip>
          <FilterChip showDropdown>가격</FilterChip>
          <FilterChip showDropdown>매물유형</FilterChip>
          <FilterChip showDropdown>방크기</FilterChip>
        </div>
      </div>

      <main className={styles.main}>
        {filteredProperties.length > 0 ? (
          filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onClick={handlePropertyClick}
              onFavoriteClick={handleFavoriteClick}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <p>매물이 없습니다</p>
          </div>
        )}
      </main>

      <FloatingAddButton onClick={handleAddClick} />
    </div>
  );
}
