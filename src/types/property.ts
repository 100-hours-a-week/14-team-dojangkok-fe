// 매물 관련 타입 정의

// ===== Enums =====

export type PropertyType =
  | 'STUDIO' // 원룸
  | 'MULTI_ROOM' // 투/쓰리룸
  | 'OFFICETEL' // 오피스텔
  | 'APARTMENT' // 아파트
  | 'COMMERCIAL' // 상가/사무실
  | 'HOUSE'; // 단독주택

export type RentType =
  | 'MONTHLY' // 월세
  | 'JEONSE' // 전세
  | 'JEONSE_MONTHLY' // 반전세
  | 'SALE'; // 매매

export type PropertyPostSort = 'LATEST' | 'PRICE_ASC' | 'PRICE_DESC';

export type DealStatus = 'TRADING' | 'COMPLETED';

export type PostStatus = 'ACTIVE' | 'ARCHIVED';

// ===== DTOs =====

export interface FileAssetDto {
  file_asset_id: number;
  presigned_url: string;
}

export interface PropertyPostListItemDto {
  property_post_id: number;
  title: string;
  address_main: string;
  price_main: number; // 보증금 또는 매매가
  price_monthly: number | null; // 월세 (전세/매매 시 0 또는 null)
  rent_type: RentType;
  property_type: PropertyType;
  exclusive_area_m2: number;
  floor: number;
  maintenance_fee: number;
  deal_status: DealStatus;
  post_status: PostStatus;
  is_verified: boolean;
  is_hidden: boolean;
  created_at: string;
  thumbnail: FileAssetDto | null;
}

// ===== API Request DTOs =====

export interface PropertyPostSearchRequestDto {
  keyword?: string;
  property_type?: PropertyType[];
  rent_type?: RentType[];
  price_main_min?: number;
  price_main_max?: number;
  price_monthly_min?: number;
  price_monthly_max?: number;
  sort?: PropertyPostSort;
}

export interface PropertyVisibilityUpdateDto {
  is_hidden: boolean;
}

export interface PropertyDealStatusUpdateDto {
  deal_status: DealStatus;
}

// ===== API Response DTOs =====

export interface PropertyPostListResponseDto {
  limit: number;
  hasNext: boolean;
  next_cursor: string | null;
  property_post_items: PropertyPostListItemDto[];
}

export interface PropertyPostSearchResponseDto {
  total_count: number;
  limit: number;
  hasNext: boolean;
  next_cursor: string | null;
  items: PropertyPostListItemDto[];
}

export interface PropertyPostSearchCountResponseDto {
  count: number;
}

// ===== 프론트엔드 유틸리티 타입 =====

// PropertyType을 한글로 매핑
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  STUDIO: '원룸',
  MULTI_ROOM: '투룸 이상',
  OFFICETEL: '오피스텔',
  APARTMENT: '아파트',
  COMMERCIAL: '상가',
  HOUSE: '주택',
};

// RentType을 한글로 매핑
export const RENT_TYPE_LABELS: Record<RentType, string> = {
  MONTHLY: '월세',
  JEONSE: '전세',
  JEONSE_MONTHLY: '반전세',
  SALE: '매매',
};

// 한글 → PropertyType 역매핑
export const PROPERTY_TYPE_MAP: Record<string, PropertyType> = {
  원룸: 'STUDIO',
  '투룸 이상': 'MULTI_ROOM',
  오피스텔: 'OFFICETEL',
  아파트: 'APARTMENT',
  상가: 'COMMERCIAL',
  주택: 'HOUSE',
};

// 한글 → RentType 역매핑
export const RENT_TYPE_MAP: Record<string, RentType> = {
  월세: 'MONTHLY',
  전세: 'JEONSE',
  반전세: 'JEONSE_MONTHLY',
  매매: 'SALE',
};

// ===== 레거시 타입 (호환성 유지) =====

export interface Property {
  id: string;
  title: string;
  address: string;
  detailedAddress: string;
  priceType: '월세' | '전세' | '매매';
  deposit: number;
  monthlyRent?: number;
  propertyType: '원룸' | '투룸' | '쓰리룸' | '오피스텔' | '아파트';
  floor: number;
  area: number;
  maintenanceFee: number;
  images: string[];
  isReviewed: boolean;
  isFavorite: boolean;
  createdAt: string;
}
