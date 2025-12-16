import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AnalysisResult } from "../types";

// --- ROBUST CSV PARSING UTILS ---

const cleanCSVText = (text: string): string => {
  return text.replace(/^\ufeff/, '').trim();
};

const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const parseNumber = (str: string | undefined): number => {
  if (!str) return 0;
  return parseFloat(str.replace(/["',]/g, '')) || 0;
};

// --- SMART DATA FILTERING (Sort by Cost -> Top N) ---
// 비용 절감을 위해 모든 행을 보내지 않고, 비용이 높은 순서대로 정렬하여 상위 N개만 추출합니다.
const filterCsvByHighCost = (csvText: string, limit: number): string => {
  const cleanText = cleanCSVText(csvText);
  const lines = cleanText.split('\n').filter(l => l.trim() !== '');
  
  if (lines.length < 2) return csvText; // Too short to filter

  // 1. Find Header
  let headerIndex = -1;
  let headers: string[] = [];
  
  // Search first 20 lines for header
  for(let i=0; i<Math.min(lines.length, 20); i++) {
    const line = lines[i];
    // Naver Report common cost column names
    if (line.includes('총비용') || line.includes('Cost') || line.includes('비용')) {
      headerIndex = i;
      headers = parseCSVLine(line);
      break;
    }
  }

  if (headerIndex === -1) return lines.slice(0, limit).join('\n'); // Fallback: just slice if no header found

  // 2. Identify Cost Column
  const costIdx = headers.findIndex(h => h.includes('총비용') || h.includes('Cost') || h.includes('비용'));
  
  // Cost 컬럼을 못 찾으면 그냥 앞부분만 자름
  if (costIdx === -1) return lines.slice(0, limit).join('\n'); 

  // 3. Parse Rows & Sort
  const parsedRows = [];
  for(let i = headerIndex + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    // Skip summary rows (Habgye/Total) to avoid double counting or sorting issues
    if (row[0] && (row[0].includes('합계') || row[0].includes('Total'))) continue;

    if (row.length < headers.length) continue;
    
    parsedRows.push({
      originalLine: lines[i],
      cost: parseNumber(row[costIdx])
    });
  }

  // Sort descending by Cost (비용 높은 순 정렬)
  parsedRows.sort((a, b) => b.cost - a.cost);

  // 4. Take Top N and reconstruct CSV string
  const topRows = parsedRows.slice(0, limit).map(item => item.originalLine);
  
  return [lines[headerIndex], ...topRows].join('\n');
};

// --- RETRY LOGIC FOR 503 OVERLOADED ---
const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isOverloaded = 
        error.status === 503 || 
        error.code === 503 ||
        (error.message && error.message.includes('overloaded')) ||
        (error.message && error.message.includes('503'));

    if (retries > 0 && isOverloaded) {
      console.warn(`Model overloaded. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const calculateSummaryStats = (csvText: string) => {
  const cleanText = cleanCSVText(csvText);
  const lines = cleanText.split('\n');
  
  let totalCost = 0;
  let totalRevenue = 0;
  let totalConversions = 0;
  let totalClicks = 0;
  
  let headerIndex = -1;
  let headers: string[] = [];

  for(let i=0; i<Math.min(lines.length, 50); i++) {
    if(lines[i].includes('총비용') || lines[i].includes('Cost')) {
      headerIndex = i;
      headers = parseCSVLine(lines[i]);
      break;
    }
  }

  if (headerIndex === -1) return null;

  const costIdx = headers.findIndex(h => h.includes('총비용') || h.includes('Cost'));
  const revIdx = headers.findIndex(h => h.includes('전환매출액') || h.includes('매출') || h.includes('Revenue'));
  const convIdx = headers.findIndex(h => h.includes('전환수') || h.includes('Conversions'));
  const clickIdx = headers.findIndex(h => h.includes('클릭수') || h.includes('Clicks'));

  for(let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const row = parseCSVLine(line);
    if (row[0] && row[0].includes('합계')) continue;
    if (row.length < headers.length) continue;

    if (costIdx !== -1) totalCost += parseNumber(row[costIdx]);
    if (revIdx !== -1) totalRevenue += parseNumber(row[revIdx]);
    if (convIdx !== -1) totalConversions += parseNumber(row[convIdx]);
    if (clickIdx !== -1) totalClicks += parseNumber(row[clickIdx]);
  }

  const totalRoas = totalCost > 0 ? (totalRevenue / totalCost) * 100 : 0;

  return {
    totalCost,
    totalRevenue,
    totalConversions,
    totalClicks,
    totalRoas
  };
};

const cleanJson = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const analyzeNaverSearchData = async (
  campaignData: string,
  deviceData: string,
  keywordData: string
): Promise<AnalysisResult> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  // 1. Calculate Real Totals (Uses Full Data for accuracy)
  const realStats = calculateSummaryStats(campaignData);
  
  // 2. Smart Pre-processing (Filter by Cost to reduce token usage)
  // [COST OPTIMIZATION]
  // - Campaign: Top 30 campaigns (Significant enough for trend)
  // - Device: Top 20 rows (Usually only has 4-10 rows anyway)
  // - Keywords: Top 100 keywords by spend. (This drastically cuts costs. The 'long tail' is ignored by AI but captured in realStats totals)
  const filteredCampaignData = filterCsvByHighCost(campaignData, 30);
  const filteredDeviceData = filterCsvByHighCost(deviceData, 20);
  const filteredKeywordData = filterCsvByHighCost(keywordData, 100);

  const statsPrompt = realStats ? `
    **MANDATORY: USE THESE PRE-CALCULATED TOTALS.**
    - Total Cost: ${new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(realStats.totalCost)}
    - Total Revenue: ${new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(realStats.totalRevenue)}
    - Total Conversions: ${realStats.totalConversions}
    - Total Clicks: ${realStats.totalClicks}
    - Total ROAS: ${realStats.totalRoas.toFixed(2)}%
  ` : '';

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are AdAiAn, a high-end Advertising AI Analyst expert in Naver Search Ads.
    Analyze the provided data and provide a PROFESSIONAL, IN-DEPTH Report.
    
    IMPORTANT: ALL OUTPUT MUST BE IN KOREAN.

    ${statsPrompt}

    DATASETS (Top spenders only):
    1. **CAMPAIGN (Weekly/Daily)**:
    ${filteredCampaignData}

    2. **DEVICE/PLACEMENT**:
    ${filteredDeviceData}

    3. **TOP KEYWORDS (By Cost)**:
    ${filteredKeywordData} 

    --- ANALYSIS INSTRUCTIONS (STRICTLY FOLLOW) ---

    1. **Summary**: Use the provided totals.
    
    2. **Trend Data**:
       - The 'name' field MUST be the Date/Week string from Campaign Data.
       - Even if data is not sorted by date, try to organize the 'trendData' array chronologically if possible.
    
    3. **Device Performance**:
       - Calculate **PC** ROAS and **Mobile** ROAS based on the aggregated data provided.

    4. **Deep Insights & Critical Issues (LONG FORM)**:
       - The user wants DETAILED analysis. Do not be brief.
       - Focus on high-spending keywords that have 0 conversions.
       - Compare Mobile vs PC efficiency.

    5. **Top Keywords**:
       - Return the list of top keywords provided.

    RETURN JSON ONLY matching this schema:
    {
      "summary": {
        "totalCost": "string",
        "totalRevenue": "string",
        "totalRoas": "string",
        "totalConversions": "string",
        "roasChange": "string",
        "costChange": "string"
      },
      "weeklyStats": [
        { "date": "string", "cost": number, "revenue": number, "roas": number, "clicks": number, "conversions": number }
      ],
      "campaignStats": [
        { "name": "string", "cost": number, "revenue": number, "roas": number, "clicks": number }
      ],
      "deviceStats": [
        { "device": "string", "placement": "string", "cost": number, "revenue": number, "roas": number, "clicks": number }
      ],
      "topKeywords": [
        { "keyword": "string", "cost": number, "revenue": number, "roas": number, "clicks": number, "conversions": number }
      ],
      "criticalIssues": ["string (Long detailed paragraph)", ...],
      "actionItems": ["string (Long detailed paragraph)", ...],
      "insights": [
        { "title": "string", "description": "string (Long detailed paragraph)", "severity": "high" | "medium" | "low" }
      ],
      "trendData": [
        { "name": "string (Date e.g. 11.10)", "value": number (revenue), "cost": number, "roas": number }
      ],
      "performanceByDevice": [
        { "name": "PC", "value": number },
        { "name": "Mobile", "value": number }
      ],
      "keywordOpportunities": ["string", ...],
      "negativeKeywords": ["string", ...]
    }
  `;

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    }));

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(cleanJson(text)) as AnalysisResult;

  } catch (error: any) {
    console.error("Analysis Failed", error);
    if (error.message?.includes('429') || error.message?.includes('Quota') || error.message?.includes('Resource has been exhausted')) {
        throw new Error("무료 사용량 한도(분당 요청 제한)를 초과했습니다. 잠시 후 다시 시도해주세요.");
    }
    if (error.message?.includes('503') || error.message?.includes('overloaded')) {
        throw new Error("서버 접속량이 많아 분석이 지연되고 있습니다. 30초 후 다시 시도해주세요.");
    }
    throw new Error("AI 분석에 실패했습니다. 데이터 형식을 확인하거나 잠시 후 다시 시도해주세요.");
  }
};