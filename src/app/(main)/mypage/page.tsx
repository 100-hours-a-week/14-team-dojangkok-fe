'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
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
  const { logout, deleteAccount } = useAuth();

  // TODO: 실제로는 API에서 사용자 정보를 가져와야 함
  const [userInfo, setUserInfo] = useState({
    name: '김민수',
    email: 'minsu.kim@kakao.com',
    nickname: '똑똑한 자취생',
    profileImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAsyFVKfgu0WJNKVYNf7zOVeFk7PYSwolyA_7jpHwciJ7S_16kjIdFlHtda_9Dv4NkGAJ-Yb8xypsePb5WzToSRvklY0n7tb0NixmzMfvcCE664bTV59R6lImYyU8MTFEXFTtUZWFUyF95SWQKwhHyMTdGE16PijSDuhh6b-ki583Nd-Ol27mQSbLGvVhip-k8RspMfyFFjl05ywvSguMBEN86tDr8gaNy49yB388ckzMGmZmtlTDj9-_u-kbDs-GIyJp4pqlbjP9M',
    lifestyleTags: ['역세권', '신축', '남향', '풀옵션', '반려동물 가능'],
  });

  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [isLifestyleModalOpen, setIsLifestyleModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isWithdrawConfirmed, setIsWithdrawConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNicknameEdit = () => {
    setIsNicknameModalOpen(true);
  };

  const handleNicknameSubmit = (newNickname: string) => {
    setUserInfo((prev) => ({ ...prev, nickname: newNickname }));
    setIsNicknameModalOpen(false);
  };

  const handleLifestyleEdit = () => {
    setIsLifestyleModalOpen(true);
  };

  const handleLifestyleSubmit = (newTags: string[]) => {
    setUserInfo((prev) => ({ ...prev, lifestyleTags: newTags }));
    setIsLifestyleModalOpen(false);
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

  return (
    <div className={styles.container}>
      <Header title="마이페이지" />

      <main className={styles.main}>
        {/* 프로필 섹션 */}
        <div className={styles.profileSection}>
          <div className={styles.profileImage}>
            <Image
              src={userInfo.profileImage}
              alt="프로필 이미지"
              fill
              className={styles.image}
            />
          </div>
          <h2 className={styles.userName}>{userInfo.name}</h2>
        </div>

        {/* 닉네임 섹션 */}
        <div className={styles.section}>
          <div className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.labelValue}>
                <span className={styles.label}>닉네임</span>
                <span className={styles.value}>{userInfo.nickname}</span>
              </div>
              <button
                className={styles.editButton}
                onClick={handleNicknameEdit}
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
              >
                수정
              </button>
            </div>
            <div className={styles.tags}>
              {userInfo.lifestyleTags.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  {tag}
                </span>
              ))}
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
        initialValue={userInfo.nickname}
        placeholder="닉네임을 입력해주세요"
        maxLength={NICKNAME_MAX_LENGTH}
        confirmText="완료"
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
        initialTags={userInfo.lifestyleTags}
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
