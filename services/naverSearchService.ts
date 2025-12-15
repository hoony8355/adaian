import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

// --- ROBUST CSV PARSING UTILS ---

// Handle BOM and clean text
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
  // Remove quotes and commas, then parse
  return parseFloat(str.replace(/["',]/g, '')) || 0;
};

// --- DATA PRE-PROCESSING (The Fix) ---

// Extract Top N keywords by Cost to reduce payload size
const processTopKeywords = (csvText: string, limit = 100): string => {
  const cleanText = cleanCSVText(csvText);
  const lines = cleanText.split('\n').filter(l => l.trim() !== '');
  
  if (lines.length < 2) return "";

  // 1. Find Header
  let headerIndex = -1;
  let headers: string[] = [];
  
  // Search first 20 lines for header
  for(let i=0; i<Math.min(lines.length, 20); i++) {
    // Naver Keyword Report typically has '검색어' or '키워드' and '총비용'
    if ((lines[i].includes('검색어') || lines[i].includes('키워드')) && 
        (lines[i].includes('총비용') || lines[i].includes('Cost'))) {
      headerIndex = i;
      headers = parseCSVLine(lines[i]);
      break;
    }
  }

  if (headerIndex === -1) return "Header not found in Keyword file.";

  // 2. Identify Columns
  const keywordIdx = headers.findIndex(h => h.includes('검색어') || h.includes('키워드'));
  const costIdx = headers.findIndex(h => h.includes('총비용') || h.includes('Cost'));
  
  if (keywordIdx === -1 || costIdx === -1) return "Essential columns missing in Keyword file.";

  // 3. Parse Rows & Sort
  const parsedRows = [];
  for(let i = headerIndex + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < headers.length) continue;
    
    parsedRows.push({
      originalLine: lines[i],
      cost: parseNumber(row[costIdx])
    });
  }

  // Sort descending by Cost
  parsedRows.sort((a, b) => b.cost - a.cost);

  // 4. Take Top N and reconstruct CSV string
  const topRows = parsedRows.slice(0, limit).map(item => item.originalLine);
  
  return [lines[headerIndex], ...topRows].join('\n');
};

// Calculate summary from Campaign (Weekly) file
// This uses the FULL data for accurate totals
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
    // Naver specific: skip total summary row if present (usually starts with "합계")
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
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  // 1. Calculate Real Totals (Client-side, full precision)
  const realStats = calculateSummaryStats(campaignData);
  
  // 2. Pre-process Keyword Data (Client-side filtering)
  // Extract only Top 100 keywords by Cost to prevent token overflow/timeout
  const processedKeywordData = processTopKeywords(keywordData, 100);

  const statsPrompt = realStats ? `
    **MANDATORY: USE THESE PRE-CALCULATED TOTALS.**
    - Total Cost: ${new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(realStats.totalCost)}
    - Total Revenue: ${new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(realStats.totalRevenue)}
    - Total Conversions: ${realStats.totalConversions}
    - Total Clicks: ${realStats.totalClicks}
    - Total ROAS: ${realStats.totalRoas.toFixed(2)}%
  ` : '';

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 3. Construct Prompt with Optimized Data
  // We send full Campaign/Device data (usually small) but ONLY top keywords.
  // MAX_CONTEXT_LENGTH safety is still good for Campaign/Device files.
  const MAX_CONTEXT_LENGTH = 100000; 

  const prompt = `
    You are AdAiAn, a high-end Advertising AI Analyst expert in Naver Search Ads.
    Analyze the provided data and provide a PROFESSIONAL, IN-DEPTH Report.
    
    IMPORTANT: ALL OUTPUT MUST BE IN KOREAN.

    ${statsPrompt}

    DATASETS:
    1. **CAMPAIGN (Weekly)**:
    ${campaignData.substring(0, MAX_CONTEXT_LENGTH)}

    2. **DEVICE/PLACEMENT**:
    ${deviceData.substring(0, MAX_CONTEXT_LENGTH)}

    3. **TOP 100 KEYWORDS (By Cost)**:
    ${processedKeywordData} 
    *(Note: This is a pre-filtered list of high-spend keywords. Focus your keyword analysis on these.)*

    --- ANALYSIS INSTRUCTIONS (STRICTLY FOLLOW) ---

    1. **Summary**: Use the provided totals.
    
    2. **Trend Data (Weekly)**:
       - **CRITICAL**: The 'name' field MUST be the **Date/Week string** (e.g., "2025.11.10", "2025.11.17") from the Campaign Data.
       - **DO NOT** use "Power Link" or "Shopping Search" as the name.
       - Aggregate ALL campaigns for each week to get the total Cost and ROAS for that specific week.
    
    3. **Device Performance**:
       - Calculate **PC** ROAS: Sum(Revenue of all PC rows) / Sum(Cost of all PC rows) * 100.
       - Calculate **Mobile** ROAS: Sum(Revenue of all Mobile rows) / Sum(Cost of all Mobile rows) * 100.
       - **DO NOT** simply sum up the ROAS percentages. You must recalculate based on total totals.

    4. **Deep Insights & Critical Issues (LONG FORM)**:
       - The user wants DETAILED analysis. Do not be brief.
       - For 'Critical Issues' and 'Action Items', provide at least **3-4 detailed sentences** per point.
       - Explain the *Cause*, the *Effect*, and the *Specific Solution*.
       - Example: Instead of "Low ROAS in Mobile", say "Mobile devices show a ROAS of 150% compared to PC's 400%, despite consuming 60% of the budget. This suggests inefficient mobile landing pages or accidental clicks."

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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(cleanJson(text)) as AnalysisResult;

  } catch (error) {
    console.error("Analysis Failed", error);
    throw new Error("AI 분석에 실패했습니다. 데이터 형식을 확인하거나 잠시 후 다시 시도해주세요.");
  }
};