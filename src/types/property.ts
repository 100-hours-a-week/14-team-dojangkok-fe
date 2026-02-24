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

export type PriceFilterType = 'all' | 'monthly' | 'jeonse' | 'sale';
export type PropertyTypeFilter =
  | 'all'
  | 'oneroom'
  | 'tworoom'
  | 'threeroom'
  | 'officetel'
  | 'apartment';
export type SizeFilterType = 'all' | 'small' | 'medium' | 'large';
