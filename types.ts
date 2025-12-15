
export enum ViewState {
  LOGIN = 'LOGIN',
  APP = 'APP',
}

export enum PageView {
  LANDING = 'LANDING',
  NAVER_SEARCH = 'NAVER_SEARCH',
  NAVER_GFA = 'NAVER_GFA',
  META = 'META',
  GOOGLE = 'GOOGLE',
  COUPANG = 'COUPANG',
}

export interface UploadedFiles {
  campaign?: File;
  device?: File;
  keywords?: File;
  // GFA specific mappings (reusing keys conceptually or adding new ones if strictly needed, 
  // but for simplicity in UI, we can stick to a generic map or specific props)
  gfaCampaign?: File;
  gfaCreative?: File;
  gfaAudience?: File;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  cost?: number;
  roas?: number;
}

export interface ExecutiveSummary {
  totalCost: string;
  totalRevenue: string;
  totalRoas: string;
  totalConversions: string;
  roasChange: string; // e.g. "+15%"
  costChange: string;
}

export interface InsightItem {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

// --- SEARCH ADS INTERFACES ---
export interface WeeklyStat {
  date: string;
  cost: number;
  revenue: number;
  roas: number;
  clicks: number;
  conversions: number;
}

export interface CampaignStat {
  name: string;
  cost: number;
  revenue: number;
  roas: number;
  clicks: number;
}

export interface DeviceStat {
  device: string; // PC / Mobile
  placement: string; // Search / Content
  cost: number;
  revenue: number;
  roas: number;
  clicks: number;
}

export interface KeywordStat {
  keyword: string;
  cost: number;
  revenue: number;
  roas: number;
  clicks: number;
  conversions: number;
}

// --- GFA SPECIFIC INTERFACES ---
export interface GFACreativeStat {
  creativeName: string;
  cost: number;
  revenue: number;
  roas: number;
  clicks: number;
  ctr: number;
  conversions: number;
  reach: number;
  frequency: number;
}

export interface GFAAudienceStat {
  segment: string; // e.g., "30-34 Female"
  cost: number;
  revenue: number;
  roas: number;
  clicks: number;
}

export interface AnalysisResult {
  summary: ExecutiveSummary;
  criticalIssues: string[];
  actionItems: string[];
  insights: InsightItem[];
  trendData: ChartDataPoint[]; // For Line Chart
  
  // Search Ads
  performanceByDevice?: ChartDataPoint[]; 
  keywordOpportunities?: string[];
  negativeKeywords?: string[];
  weeklyStats?: WeeklyStat[];
  campaignStats?: CampaignStat[];
  deviceStats?: DeviceStat[];
  topKeywords?: KeywordStat[];

  // GFA Ads
  funnelAnalysis?: {
    cpm: number;
    ctr: number;
    cpc: number;
    cvr: number;
    roas: number;
    diagnosis: string;
  };
  creativeStats?: GFACreativeStat[];
  audienceAgeStats?: GFAAudienceStat[]; // New: Age breakdown
  audienceMediaStats?: GFAAudienceStat[]; // New: Media/Platform breakdown
}
