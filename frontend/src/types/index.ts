// 用户相关类型
export interface User {
  id: string;
  email: string;
  nickname?: string;
  avatar?: string;
  createdAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  travelTypes?: string[]; // 旅行类型偏好：文化、自然、美食等
  budgetRange?: {
    min: number;
    max: number;
  };
  transportPreferences?: string[]; // 出行方式偏好：飞机、火车、自驾等
}

// 行程相关类型
export interface Trip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: 'draft' | 'generated' | 'in_progress' | 'completed';
  itinerary?: Itinerary;
  createdAt: string;
  updatedAt: string;
}

export interface Itinerary {
  days: DayPlan[];
  totalBudget: number;
  tips?: string[];
}

export interface DayPlan {
  day: number;
  date: string;
  activities: Activity[];
  estimatedCost: number;
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  location: string;
  description: string;
  duration: number; // 分钟
  cost: number;
  category: 'attraction' | 'food' | 'transport' | 'accommodation' | 'other';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// 费用记录类型
export interface Expense {
  id: string;
  tripId: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  location?: string;
  createdAt: string;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 地图相关类型
export interface MapLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
  type?: string;
}

// 语音识别结果类型
export interface VoiceRecognitionResult {
  text: string;
  confidence: number;
}
