import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Helper function to safely parse CSV line, handling quotes
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

// Helper to clean numeric strings from CSV (e.g. "1,000" -> 1000)
const parseNumber = (str: string | undefined): number => {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '').replace(/"/g, '')) || 0;
};

// --- DATA CALCULATION FUNCTION ---
// Calculates real summary stats from the "Campaign Data (Weekly)" file
const calculateSummaryStats = (csvText: string) => {
  const lines = csvText.split('\n');
  let totalCost = 0;
  let totalRevenue = 0;
  let totalConversions = 0;
  let totalClicks = 0;
  let headerIndex = -1;
  let headers: string[] = [];

  // Find header row (usually contains '총비용' or 'Cost')
  // Check first 50 lines to be safe against metadata rows
  for(let i=0; i<Math.min(lines.length, 50); i++) {
    if(lines[i].includes('총비용') || lines[i].includes('Cost')) {
      headerIndex = i;
      headers = parseCSVLine(lines[i]);
      break;
    }
  }

  if (headerIndex === -1) return null;

  // Identify column indices
  const costIdx = headers.findIndex(h => h.includes('총비용') || h.includes('Cost'));
  const revIdx = headers.findIndex(h => h.includes('전환매출액') || h.includes('매출') || h.includes('Revenue')); // Broader match
  const convIdx = headers.findIndex(h => h.includes('전환수') || h.includes('Conversions'));
  const clickIdx = headers.findIndex(h => h.includes('클릭수') || h.includes('Clicks'));

  // Sum up values
  for(let i = headerIndex + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < headers.length) continue; // Skip empty/malformed rows

    // Skip summary rows if they exist (Naver reports might contain '합계' or 'Total')
    if (row[0] && (row[0].includes('합계') || row[0].includes('Total'))) continue;

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

export const analyzeAdData = async (
  campaignData: string,
  deviceData: string,
  keywordData: string
): Promise<AnalysisResult> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  // --- 1. CALCULATE REAL NUMBERS FIRST ---
  const realStats = calculateSummaryStats(campaignData);
  
  const statsPrompt = realStats ? `
    **MANDATORY: USE THESE EXACT CALCULATED TOTALS FOR THE SUMMARY SECTION. DO NOT HALLUCINATE NUMBERS.**
    - Total Cost: ${new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(realStats.totalCost)}
    - Total Revenue: ${new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(realStats.totalRevenue)}
    - Total Conversions: ${realStats.totalConversions}
    - Total Clicks: ${realStats.totalClicks}
    - Total ROAS: ${realStats.totalRoas.toFixed(2)}%
    
    **CRITICAL**: When aggregating data for tables (Weekly, Campaign, Device), ensure the sum of Clicks and Conversions across rows matches the provided TOTALS exactly.
  ` : '';


  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Note: Removed substring() calls to pass FULL data to the model.
  // Gemini 2.5 Flash has a large context window and can handle typical CSV reports.
  const prompt = `
    You are AdAiAn, a high-end Advertising AI Analyst expert in Naver Search Ads (South Korea).
    Your goal is to analyze the provided raw CSV data and provide expert-level insights for a small brand owner.
    
    IMPORTANT: ALL OUTPUT MUST BE IN KOREAN. (한국어로 작성해주세요)

    ${statsPrompt}

    The user has provided three specific datasets:
    1. **Campaign Structure (Weekly)**: Columns include Campaign Type, Campaign, Weekly Breakdown (e.g., 2025.11.17.(Mon) Week), Cost, Impressions, Clicks, Conversions, Revenue, ROAS.
    2. **Device/Placement**: Columns include Campaign, Ad Group, PC/Mobile, Search/Content, Cost, etc.
    3. **Search Terms**: Columns include Search Term, Cost, etc.

    DATA SNIPPETS (FULL DATA PROVIDED):
    --- CAMPAIGN DATA (WEEKLY) ---
    ${campaignData}

    --- DEVICE/PLACEMENT DATA ---
    ${deviceData}

    --- SEARCH TERM DATA ---
    ${keywordData}

    PERFORM THE FOLLOWING DEEP ANALYSIS (IN KOREAN):
    1. **Summary**: Use the PRE-CALCULATED totals provided above. For trends (changes), estimate from the weekly data rows.
    2. **Tables Data Extraction**:
       - **Weekly Stats**: Aggregate data by week from Campaign Data. Ensure the sum matches Total Cost/Revenue/Clicks.
       - **Campaign Stats**: Aggregate data by Campaign Name.
       - **Device/Placement Stats**: Aggregate by Device (PC/Mobile) AND Placement (Search/Content).
       - **Top Keywords**: Extract the top 100 keywords sorted by Cost (high to low).
    3. **Critical Issues (5-10 items)**: Identify specific problems. Look for high spend/zero conversion keywords, Mobile vs PC disparities, low ROAS campaigns, or "Content" placement waste. Be specific (e.g., mention specific campaign names or terms).
    4. **Immediate Actions (5-10 items)**: Concrete steps the user should take in the Naver Ad Manager. E.g., "Exclude [keyword]", "Decrease Mobile bid for [Campaign]", "Turn off Content Network for [Campaign]".
    5. **Detailed Insights**: Provide deep analysis. 
       - Analyze brand vs non-brand performance.
       - Analyze which specific products are driving value.
       - Identify if 'Shopping Search' or 'Power Link' is performing better.
    6. **Trend Data (Weekly)**: Extract the Weekly Cost and ROAS from File 1. X-axis labels should be the Week Date.
    7. **Keyword Opportunities & Negatives**: Suggest high-potential keywords to expand and specific negative keywords to add.

    RETURN JSON ONLY matching this schema (All string values must be in Korean):
    {
      "summary": {
        "totalCost": "string (formatted KRW)",
        "totalRevenue": "string (formatted KRW)",
        "totalRoas": "string (%)",
        "totalConversions": "string",
        "roasChange": "string (+/- %)",
        "costChange": "string (+/- %)"
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
      "criticalIssues": ["string", ...],
      "actionItems": ["string", ...],
      "insights": [
        { "title": "string", "description": "string", "severity": "high" | "medium" | "low" }
      ],
      "trendData": [
        { "name": "string (Week Date)", "value": number (revenue), "cost": number, "roas": number }
      ],
      "performanceByDevice": [
        { "name": "PC", "value": number (roas) },
        { "name": "Mobile", "value": number (roas) }
      ],
      "keywordOpportunities": ["string", ...],
      "negativeKeywords": ["string", ...]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(cleanJson(text));
    return json as AnalysisResult;

  } catch (error) {
    console.error("Analysis Failed", error);
    // Strict Error Handling: Do NOT return mock data.
    // Throw error so the UI can prompt the user to retry.
    throw new Error("AI 분석 생성에 실패했습니다. 데이터 형식이 올바른지 확인하거나 잠시 후 다시 시도해주세요.");
  }
};