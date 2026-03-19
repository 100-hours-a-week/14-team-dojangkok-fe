// REST API 응답 타입

export type ContentType = 'TEXT' | 'IMAGE' | 'VIDEO';

export interface TextContent {
  text: string;
}

export interface ImageContent {
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  size: number;
}

export interface VideoContent {
  url: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  size: number;
}

export interface ChatRoomProperty {
  propertyId: string;
  title: string;
  imageUrl: string | null;
  priceMain?: number;
  priceMonthly?: number | null;
  rentType?: string;
  dealStatus?: string;
}

export interface ChatRoom {
  roomId: string;
  type: 'DIRECT';
  partnerInfo: {
    userId: string;
    nickname: string;
    profileImageUrl: string | null;
  };
  property: ChatRoomProperty | null;
  lastMessage: {
    content: string;
    contentType: ContentType;
    senderId: string;
    mine: boolean;
    createdAt: string;
  } | null;
  unreadCount: number;
  partnerLastReadAt?: string;
  createdAt: string;
}

export interface ChatMessage {
  messageId: string;
  roomId: string;
  senderId: string;
  mine: boolean;
  contentType: ContentType;
  content: TextContent | ImageContent | VideoContent;
  groupId: string | null;
  createdAt: string;
  // 프론트엔드 전용 (낙관적 업데이트용)
  localId?: string;
  isFailed?: boolean;
  isRead?: boolean;
}

// STOMP WebSocket 이벤트
export interface StompMessageEvent {
  type: 'MESSAGE';
  messageId: string;
  roomId: string;
  senderId: string;
  contentType: ContentType;
  content: TextContent | ImageContent | VideoContent;
  groupId: string | null;
  createdAt: string;
  targetUserId: string;
}

export interface StompReadEvent {
  type: 'READ';
  roomId: string;
  userId: string;
  lastReadMessageId: string;
  lastReadAt: string;
  targetUserId: string;
}

export type StompEvent = StompMessageEvent | StompReadEvent;

// API 응답 래퍼
export interface ChatRoomsResponse {
  totalCount: number;
  rooms: ChatRoom[];
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  hasNext: boolean;
  nextCursor: string | null;
}

// 미디어 업로드 관련
export interface FileItem {
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface PresignedUrlItem {
  fileAssetId: string;
  presignedUrl: string;
  fileName: string;
}

export interface PresignedResponse {
  files: PresignedUrlItem[];
}

export interface CompleteResponse {
  fileAssets: { fileAssetId: string; url: string }[];
}
