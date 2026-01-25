'use client';

import { useRouter } from 'next/navigation';
import styles from './Login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const handleKakaoLogin = () => {
    // TODO: 카카오 로그인 API 연동
    console.log('카카오 로그인');
    router.push('/nickname');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <div className={styles.logoIcon}>
            <span className="material-symbols-outlined">approval</span>
          </div>
        </div>

        <div className={styles.textCenter}>
          <h1 className={styles.title}>도장콕</h1>
          <p className={styles.subtitle}>
            자취방 계약, 불안하다면?
            <br />
            똑똑한 계약서 분석 서비스
          </p>
        </div>

        <div className={styles.imageWrapper}>
          <div className={styles.imageOverlay} />
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDarbVr0ke52TveIrgoKxPDAOhbRDIGfDcCsaIO6pvlA7m8OBZK-xHL3CUyPecnIdFXcNpAeYUYBgmsT2h0vlEbVpWohMRdd08XLE3k0N8hINqojjWnMKtZ2QkLaCosQoiIHvU_W_HtlhiTlMdzZRaUSqTgWGDTPI3ZUZf50UA9fPQxDvPrENZwpUOh-xF5lZexVNkh2I8pmHvSCWRyWaMD81Dp2rLDhSdFhYlfLhqXVN2VqtLmd3WYtJKhsqhjZUTy8e0PIl2f-AI"
            alt="도장콕 서비스 일러스트"
            className={styles.image}
          />
        </div>
      </div>

      <div className={styles.bottomSection}>
        <button className={styles.kakaoButton} onClick={handleKakaoLogin}>
          <img
            src="/kakao_login_large_wide.png"
            alt="카카오로 시작하기"
            className={styles.kakaoButtonImage}
          />
        </button>

        {/* <div className={styles.links}>
          <a href="#">매물 둘러보기</a>
        </div> */}

        <div className={styles.terms}>
          계속 진행함으로써 도장콕의 <a href="#">서비스 이용약관</a> 및{' '}
          <a href="#">개인정보 처리방침</a>에 동의하게 됩니다.
        </div>
      </div>
    </div>
  );
}
