'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './search.module.css';

interface RecentSearch {
  query: string;
  date: string;
}

export default function PropertySearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('keyword') || ''
  );
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('recentPropertySearches');
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleBackClick = () => {
    const params = searchParams.toString();
    router.replace(`/property${params ? `?${params}` : ''}`);
  };

  const navigateToResults = (query: string) => {
    const trimmed = query.trim();
    const params = new URLSearchParams(searchParams.toString());

    if (trimmed) {
      // 최근 검색어 저장
      const newSearch: RecentSearch = {
        query: trimmed,
        date: new Date().toISOString(),
      };
      const updated = [
        newSearch,
        ...recentSearches.filter((s) => s.query !== trimmed),
      ].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem('recentPropertySearches', JSON.stringify(updated));
      params.set('keyword', trimmed);
    } else {
      params.delete('keyword');
    }

    router.replace(`/property${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSearch = () => {
    navigateToResults(searchQuery);
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    navigateToResults(query);
  };

  const handleDeleteSearch = (query: string) => {
    const updated = recentSearches.filter((s) => s.query !== query);
    setRecentSearches(updated);
    localStorage.setItem('recentPropertySearches', JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentPropertySearches');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const highlightQuery = (text: string) => {
    if (!searchQuery) return text;

    const index = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <span className={styles.highlight}>
          {text.slice(index, index + searchQuery.length)}
        </span>
        {text.slice(index + searchQuery.length)}
      </>
    );
  };

  const filteredRecentSearches = searchQuery
    ? recentSearches.filter((search) =>
        search.query.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentSearches;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.searchContainer}>
          <button className={styles.backButton} onClick={handleBackClick}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="어떤 집을 찾으시나요?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
          />
          {searchQuery && (
            <button
              className={styles.clearButton}
              onClick={() => setSearchQuery('')}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
          <button className={styles.searchButton} onClick={handleSearch}>
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {filteredRecentSearches.length > 0 && (
          <section className={styles.recentSection}>
            <div className={styles.recentHeader}>
              <h2 className={styles.recentTitle}>
                {searchQuery ? '검색 결과' : '최근 검색어'}
              </h2>
              {!searchQuery && (
                <button className={styles.clearAllButton} onClick={handleClearAll}>
                  전체 삭제
                </button>
              )}
            </div>
            <div className={styles.recentList}>
              {filteredRecentSearches.map((search, index) => (
                <div key={index} className={styles.recentItem}>
                  <button
                    className={styles.recentItemButton}
                    onClick={() => handleRecentSearchClick(search.query)}
                  >
                    <div className={styles.iconWrapper}>
                      <span className="material-symbols-outlined">history</span>
                    </div>
                    <div className={styles.recentContent}>
                      <div className={styles.recentQuery}>
                        {highlightQuery(search.query)}
                      </div>
                      <div className={styles.recentDate}>
                        {formatDate(search.date)}
                      </div>
                    </div>
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteSearch(search.query)}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
