'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import {
  updateNickname as updateNicknameApi,
  updateLifestyleTags as updateLifestyleTagsApi,
} from '@/lib/api/auth';
import {
  Header,
  Modal,
  TextFieldModal,
  LifestyleTagModal,
} from '@/components/common';
import { NICKNAME_MAX_LENGTH, NICKNAME_MESSAGES } from '@/constants/nickname';
import { filterNickname, validateNickname } from '@/utils/nickname';
import styles from './MyPage.module.css';

export default function MyPage() {
  const router = useRouter();
  const { user, logout, deleteAccount, updateUser } = useAuth();

  const [lifestyleTags, setLifestyleTags] = useState<string[]>([]);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [isLifestyleModalOpen, setIsLifestyleModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isWithdrawConfirmed, setIsWithdrawConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 라이프스타일 태그 로드 (추후 API 연동 시 사용)
  useEffect(() => {
    // TODO: GET /v1/lifestyles API 연동
    // 현재는 user.lifestyleTags 사용
    if (user?.lifestyleTags) {
      setLifestyleTags(user.lifestyleTags);
    }
  }, [user]);

  const handleNicknameEdit = () => {
    setIsNicknameModalOpen(true);
  };

  const handleNicknameSubmit = async (newNickname: string) => {
    // 기존 닉네임과 동일하면 API 호출 없이 모달만 닫기
    if (newNickname === user?.nickname) {
      setIsNicknameModalOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await updateNicknameApi(newNickname);
      updateUser({ nickname: newNickname });
      setIsNicknameModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('닉네임 변경에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLifestyleEdit = () => {
    setIsLifestyleModalOpen(true);
  };

  const handleLifestyleSubmit = async (newTags: string[]) => {
    // 기존 태그와 동일하면 API 호출 없이 모달만 닫기
    const isSame =
      newTags.length === lifestyleTags.length &&
      newTags.every((tag) => lifestyleTags.includes(tag));

    if (isSame) {
      setIsLifestyleModalOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await updateLifestyleTagsApi(newTags);
      setLifestyleTags(newTags);
      updateUser({ lifestyleTags: newTags });
      setIsLifestyleModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('라이프스타일 변경에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await logout();
      setIsLogoutModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('세션이 만료되었습니다. 다시 로그인해주세요.');
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      } else {
        setError('로그아웃에 실패했습니다. 다시 시도해주세요.');
      }
      setIsLoading(false);
    }
  };

  const handleWithdraw = () => {
    setIsWithdrawModalOpen(true);
    setIsWithdrawConfirmed(false);
  };

  const handleWithdrawConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await deleteAccount();
      setIsWithdrawModalOpen(false);
      setIsWithdrawConfirmed(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('세션이 만료되었습니다. 다시 로그인해주세요.');
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      } else {
        setError('회원 탈퇴에 실패했습니다. 다시 시도해주세요.');
      }
      setIsLoading(false);
    }
  };

  const handleWithdrawModalClose = () => {
    setIsWithdrawModalOpen(false);
    setIsWithdrawConfirmed(false);
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <Header title="마이페이지" />
        <main className={styles.main}>
          <p style={{ textAlign: 'center', marginTop: 40, color: '#60758a' }}>
            로딩 중...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header title="마이페이지" />

      <main className={styles.main}>
        {/* 프로필 섹션 */}
        <div className={styles.profileSection}>
          <div className={styles.profileImage}>
            <Image
              src={user.profileImageUrl || '/default-profile.png'}
              alt="프로필 이미지"
              fill
              className={styles.image}
            />
                    </div>
                    <h2 className={styles.userName}>{user.username || user.nickname}</h2>
        </div>

        {/* 닉네임 섹션 */}
        <div className={styles.section}>
          <div className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.labelValue}>
                <span className={styles.label}>닉네임</span>
                <span className={styles.value}>{user.nickname}</span>
              </div>
              <button
                className={styles.editButton}
                onClick={handleNicknameEdit}
                disabled={isLoading}
              >
                수정
              </button>
            </div>
          </div>
        </div>

        {/* 라이프스타일 섹션 */}
        <div className={styles.section}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>라이프스타일</span>
              <button
                className={styles.editButton}
                onClick={handleLifestyleEdit}
                disabled={isLoading}
              >
                수정
              </button>
            </div>
            <div className={styles.tags}>
              {lifestyleTags.length > 0 ? (
                lifestyleTags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))
              ) : (
                <p className={styles.emptyText}>
                  설정된 라이프스타일이 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 설정 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>설정</h3>
          <div className={styles.menuList}>
            <button className={styles.menuItem} onClick={handleLogout}>
              <span className={styles.menuText}>로그아웃</span>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <button
              className={styles.menuItem}
              onClick={() => router.push('/terms')}
            >
              <span className={styles.menuText}>이용약관</span>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <button
              className={styles.menuItem}
              onClick={() => router.push('/privacy')}
            >
              <span className={styles.menuText}>개인정보 처리방침</span>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <button className={styles.menuItem} onClick={handleWithdraw}>
              <span className={styles.menuTextDanger}>회원 탈퇴</span>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </main>

      {/* 닉네임 수정 모달 */}
      <TextFieldModal
        isOpen={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
        onSubmit={handleNicknameSubmit}
        title="닉네임 수정"
        initialValue={user.nickname || ''}
        placeholder="닉네임을 입력해주세요"
        maxLength={NICKNAME_MAX_LENGTH}
        confirmText={isLoading ? '저장 중...' : '완료'}
        cancelText="취소"
        filter={filterNickname}
        validation={{
          validate: validateNickname,
          successMessage: NICKNAME_MESSAGES.success,
          errorMessage: NICKNAME_MESSAGES.tooShort,
        }}
      />

      {/* 라이프스타일 수정 모달 */}
      <LifestyleTagModal
        isOpen={isLifestyleModalOpen}
        onClose={() => setIsLifestyleModalOpen(false)}
        onSubmit={handleLifestyleSubmit}
        initialTags={lifestyleTags}
      />

      {/* 로그아웃 확인 모달 */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="로그아웃"
        confirmText={isLoading ? '처리 중...' : '로그아웃'}
        cancelText="취소"
        confirmDisabled={isLoading}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#60758a', lineHeight: 1.6 }}>
            정말 로그아웃 하시겠어요?
          </p>
          {error && (
            <p style={{ color: '#ef4444', fontSize: 14, marginTop: 8 }}>
              {error}
            </p>
          )}
        </div>
      </Modal>

      {/* 회원 탈퇴 확인 모달 */}
      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={handleWithdrawModalClose}
        onConfirm={handleWithdrawConfirm}
        title="회원 탈퇴"
        confirmText={isLoading ? '처리 중...' : '탈퇴하기'}
        cancelText="취소"
        confirmDisabled={!isWithdrawConfirmed || isLoading}
        variant="destructive"
      >
        <div className={styles.withdrawContent}>
          <p className={styles.withdrawWarning}>
            모든 데이터가 삭제되며 복구할 수 없습니다.
          </p>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isWithdrawConfirmed}
              onChange={(e) => setIsWithdrawConfirmed(e.target.checked)}
              className={styles.checkbox}
            />
            <span>안내 사항을 확인했습니다.</span>
          </label>
          {error && (
            <p
              style={{
                color: '#ef4444',
                fontSize: 14,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
