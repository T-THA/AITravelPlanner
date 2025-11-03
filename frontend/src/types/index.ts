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

// LLM 生成的完整行程数据结构
export interface GeneratedItinerary {
  trip_title: string;
  summary: string;
  highlights: string[];
  total_days: number;
  daily_itinerary: DailyItinerary[];
  accommodation: AccommodationPlan[];
  transportation: TransportationPlan;
  budget_breakdown: BudgetBreakdown;
  total_estimated_cost: number;
  packing_list: string[];
  travel_tips: string[];
  emergency_contacts: EmergencyContacts;
}

export interface DailyItinerary {
  day: number;
  date: string;
  theme: string;
  items: ItineraryItem[];
}

export interface ItineraryItem {
  time: string;
  type: 'attraction' | 'restaurant' | 'transport' | 'hotel' | 'shopping' | 'other';
  title: string;
  description: string;
  location: string;
  duration?: string;
  cost: number;
  // attraction specific
  ticket_info?: string;
  opening_hours?: string;
  tips?: string;
  // restaurant specific
  cuisine?: string;
  recommended_dishes?: string[];
}

export interface AccommodationPlan {
  day: number;
  hotel_name: string;
  location: string;
  price_range: string;
  rating: string;
  features: string[];
  booking_tips: string;
}

export interface TransportationPlan {
  to_destination: TransportDetail;
  local_transport: LocalTransportDetail;
  return: TransportDetail;
}

export interface TransportDetail {
  method: string;
  details?: string;
  estimated_cost: number;
  duration?: string;
}

export interface LocalTransportDetail {
  recommendation: string;
  daily_cost: number;
  tips: string;
}

export interface BudgetBreakdown {
  transportation: number;
  accommodation: number;
  food: number;
  tickets: number;
  shopping: number;
  other: number;
}

export interface EmergencyContacts {
  police: string;
  hospital: string;
  tourist_hotline: string;
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

// 预算分析类型
export interface BudgetAnalysis {
  total_budget: number;
  estimated_total: number;
  budget_status: 'within' | 'close' | 'exceed';  // 预算状态：在预算内/接近预算/超预算
  difference: number;  // 差额（正数表示节省，负数表示超支）
  difference_percentage: number;  // 差额百分比
  breakdown_analysis: {
    transportation: CategoryAnalysis;
    accommodation: CategoryAnalysis;
    food: CategoryAnalysis;
    tickets: CategoryAnalysis;
    shopping: CategoryAnalysis;
    other: CategoryAnalysis;
  };
  saving_suggestions: SavingSuggestion[];
  warnings: string[];
  summary: string;
}

export interface CategoryAnalysis {
  budgeted: number;
  percentage: number;  // 占总预算的百分比
  status: 'reasonable' | 'high' | 'low';  // 合理/偏高/偏低
  comment: string;  // AI评价
}

export interface SavingSuggestion {
  category: string;
  suggestion: string;
  potential_saving: number;
  priority: 'high' | 'medium' | 'low';
}

// 行程创建请求类型
export interface TripRequest {
  destination: string[];           // 目的地列表（支持多个城市）
  startDate: string;                // 出发日期 YYYY-MM-DD
  endDate: string;                  // 返程日期 YYYY-MM-DD
  budget: number;                   // 预算（人民币）
  travelersCount: number;           // 同行人数
  travelersType: string[];          // 人员构成 ['成人', '儿童', '老人']
  preferences: string[];            // 旅行偏好 ['美食', '购物', '文化', '自然', '亲子', '摄影', '历史', '休闲']
  accommodation: '经济型' | '舒适型' | '豪华型';  // 住宿偏好
  pace: '休闲' | '适中' | '紧凑';   // 行程节奏
  specialNeeds?: string;            // 特殊需求（可选）
}

// 语音解析结果类型
export interface VoiceParsedData {
  destination?: string;
  start_date?: string;      // 出发日期 YYYY-MM-DD
  end_date?: string;        // 返程日期 YYYY-MM-DD
  days?: number;
  budget?: number;
  travelers?: number;
  preferences?: string[];
  special_needs?: string;
  confidence: number;
}
