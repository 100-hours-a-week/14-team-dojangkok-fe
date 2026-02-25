import { useState, useEffect } from 'react';
import { PropertyFormData } from '../page';
import styles from './steps.module.css';

interface Step3Props {
  formData: PropertyFormData;
  updateFormData: (data: Partial<PropertyFormData>) => void;
}

export default function Step3Details({
  formData,
  updateFormData,
}: Step3Props) {
  // 평 ↔ m² 변환 상수
  const PYEONG_TO_M2 = 3.3058;
  const M2_TO_PYEONG = 0.3025;

  // 지상/지하 선택 (층수의 절댓값 사용)
  const [floorType, setFloorType] = useState<'ground' | 'basement'>(
    formData.floor < 0 ? 'basement' : 'ground'
  );
  const [floorNumber, setFloorNumber] = useState(Math.abs(formData.floor) || 1);

  useEffect(() => {
    // 지하일 경우 음수로, 지상일 경우 양수로 저장
    const actualFloor = floorType === 'basement' ? -floorNumber : floorNumber;
    updateFormData({ floor: actualFloor });
  }, [floorType, floorNumber]);

  const handlePyeongChange = (pyeong: number) => {
    const m2 = Math.round(pyeong * PYEONG_TO_M2 * 100) / 100;
    updateFormData({ area: m2 });
  };

  const handleM2Change = (m2: number) => {
    updateFormData({ area: m2 });
  };

  const getPyeongFromM2 = () => {
    if (!formData.area) return '';
    return Math.round(formData.area * M2_TO_PYEONG * 100) / 100;
  };
  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>매물 상세 정보를 입력해주세요</h2>

      {/* 주소 */}
      <div className={styles.section}>
        <label className={styles.label}>주소</label>
        <input
          type="text"
          className={styles.input}
          placeholder="예: 서울 강남구 역삼동"
          value={formData.address}
          onChange={(e) => updateFormData({ address: e.target.value })}
        />
      </div>

      {/* 상세 주소 */}
      <div className={styles.section}>
        <label className={styles.label}>상세 주소</label>
        <input
          type="text"
          className={styles.input}
          placeholder="예: 101동 202호"
          value={formData.detailedAddress}
          onChange={(e) =>
            updateFormData({ detailedAddress: e.target.value })
          }
        />
      </div>

      {/* 면적 */}
      <div className={styles.section}>
        <label className={styles.label}>면적</label>
        <div className={styles.areaInputs}>
          <div className={styles.inputGroup}>
            <input
              type="number"
              className={styles.input}
              placeholder="0"
              value={getPyeongFromM2()}
              onChange={(e) => handlePyeongChange(Number(e.target.value))}
            />
            <span className={styles.inputUnit}>평</span>
          </div>
          <div className={styles.inputGroup}>
            <input
              type="number"
              className={styles.input}
              placeholder="0"
              value={formData.area || ''}
              onChange={(e) => handleM2Change(Number(e.target.value))}
            />
            <span className={styles.inputUnit}>m²</span>
          </div>
        </div>
      </div>

      {/* 층수 */}
      <div className={styles.section}>
        <label className={styles.label}>층수</label>
        <div className={styles.floorInputs}>
          <div className={styles.chipGroup}>
            <button
              type="button"
              className={`${styles.chip} ${
                floorType === 'ground' ? styles.chipActive : ''
              }`}
              onClick={() => setFloorType('ground')}
            >
              지상
            </button>
            <button
              type="button"
              className={`${styles.chip} ${
                floorType === 'basement' ? styles.chipActive : ''
              }`}
              onClick={() => setFloorType('basement')}
            >
              지하
            </button>
          </div>
          <div className={styles.inputGroup}>
            <input
              type="number"
              className={styles.input}
              placeholder="1"
              min="1"
              value={floorNumber}
              onChange={(e) => setFloorNumber(Number(e.target.value) || 1)}
            />
            <span className={styles.inputUnit}>층</span>
          </div>
        </div>
      </div>
    </div>
  );
}
