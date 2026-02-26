// API 응답을 프론트엔드 Property 타입으로 변환

import type {
  PropertyPostListItemDto,
  RentType,
  PropertyType,
} from '@/types/property';
import type { Property } from '@/types/property';
import {
  RENT_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
} from '@/types/property';

/**
 * API 응답(PropertyPostListItemDto)을 레거시 Property 타입으로 변환
 */
export function convertToProperty(dto: PropertyPostListItemDto): Property {
  const { rent_type, property_type, thumbnail, price_main, price_monthly } = dto;

  // RentType을 한글로 변환
  const priceType = RENT_TYPE_LABELS[rent_type] as '월세' | '전세' | '매매';

  // PropertyType을 한글로 변환
  const propertyTypeLabel = PROPERTY_TYPE_LABELS[property_type] as
    | '원룸'
    | '투룸'
    | '쓰리룸'
    | '오피스텔'
    | '아파트';

  // 썸네일 이미지 URL (없으면 빈 배열)
  const images = thumbnail ? [thumbnail.presigned_url] : [];

  return {
    id: dto.property_post_id.toString(),
    title: dto.title,
    address: dto.address_main,
    detailedAddress: dto.address_main,
    priceType,
    deposit: price_main,
    monthlyRent: price_monthly ?? undefined,
    propertyType: propertyTypeLabel,
    floor: dto.floor,
    area: Math.round(dto.exclusive_area_m2), // m²를 정수로 반올림
    maintenanceFee: dto.maintenance_fee,
    images,
    isReviewed: dto.is_verified,
    isFavorite: false, // 초기값 (필요 시 별도 API로 관리)
    createdAt: dto.created_at,
  };
}

/**
 * 여러 PropertyPostListItemDto를 Property[]로 변환
 */
export function convertToPropertyList(
  dtoList: PropertyPostListItemDto[]
): Property[] {
  return dtoList.map(convertToProperty);
}
