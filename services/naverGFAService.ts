import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

// Helper function to safely parse CSV line
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

// Helper to clean numeric strings
const parseNumber = (str: string | undefined): number => {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '').replace(/"/g, '')) || 0;
};

// Calculate summary from the "Campaign/Period" file (most accurate for totals)
const calculateGFASummary = (csvText: string) => {
  if (!csvText) return null;
  const lines = csvText.split('\n');
  
  let totalCost = 0;
  let totalRevenue = 0;
  let totalConversions = 0;
  let totalClicks = 0;
  let totalImpressions = 0;

  let headerIndex = -1;
  let headers: string[] = [];

  for(let i=0; i<Math.min(lines.length, 50); i++) {
    if(lines[i].includes('총 비용') || lines[i].includes('Cost')) {
      headerIndex = i;
      headers = parseCSVLine(lines[i]);
      break;
    }
  }

  if (headerIndex === -1) return null;

  const costIdx = headers.findIndex(h => h.includes('총 비용') || h.includes('Cost'));
  const revIdx = headers.findIndex(h => h.includes('전환 매출액') || h.includes('Revenue') || h.includes('구매완료 전환 매출액'));
  const convIdx = headers.findIndex(h => h.includes('구매완료수') || h.includes('전환수') || h.includes('Conversions'));
  const clickIdx = headers.findIndex(h => h.includes('클릭') || h.includes('Clicks'));
  const impIdx = headers.findIndex(h => h.includes('노출') || h.includes('Impressions'));

  for(let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const row = parseCSVLine(line);
    if (row.length < headers.length) continue;
    if (row[0] && (row[0].includes('합계') || row[0].includes('Total'))) continue;

    if (costIdx !== -1) totalCost += parseNumber(row[costIdx]);
    if (revIdx !== -1) totalRevenue += parseNumber(row[revIdx]);
    if (convIdx !== -1) totalConversions += parseNumber(row[convIdx]);
    if (clickIdx !== -1) totalClicks += parseNumber(row[clickIdx]);
    if (impIdx !== -1) totalImpressions += parseNumber(row[impIdx]);
  }

  const totalRoas = totalCost > 0 ? (totalRevenue / totalCost) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalCost / totalClicks : 0;
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpm = totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0;
  const avgCvr = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  return {
    totalCost,
    totalRevenue,
    totalConversions,
    totalClicks,
    totalRoas,
    totalImpressions,
    avgCpc,
    avgCtr,
    avgCpm,
    avgCvr
  };
};

const cleanJson = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const analyzeNaverGFAData = async (
  campaignFile: string, // File 2: Campaign/Date (Trend)
  creativeFile: string, // File 3: Creative (Reach/Freq)
  audienceFile: string,  // File 1: Audience/Group
  apiKey: string
): Promise<AnalysisResult> => {

  const effectiveApiKey = apiKey || process.env.API_KEY;
  if (!effectiveApiKey) {
    throw new Error("API Key is missing.");
  }

  // 1. Calculate Accurate Totals (JS)
  const realStats = calculateGFASummary(campaignFile);
  const statsPrompt = realStats ? `
    **MANDATORY: USE THESE PRE-CALCULATED TOTALS.**
    - Total Cost: ${realStats.totalCost}
    - Total Revenue: ${realStats.totalRevenue}
    - Total Conversions: ${realStats.totalConversions}
    - Total ROAS: ${realStats.totalRoas.toFixed(2)}%
    - Avg CPM: ${realStats.avgCpm.toFixed(0)}
    - Avg CTR: ${realStats.avgCtr.toFixed(2)}%
    - Avg CPC: ${realStats.avgCpc.toFixed(0)}
    - Avg CVR (Conv/Click): ${realStats.avgCvr.toFixed(2)}%
  ` : '';

  const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
  const MAX_CONTEXT_LENGTH = 50000; // 50k chars per file to be safe

  const prompt = `
    You are AdAiAn, a Naver GFA (Glad for Advertisers - Display Ads) Expert.
    Analyze the provided CSV data for a Korean brand.
    
    IMPORTANT: ALL OUTPUT MUST BE IN KOREAN.

    ${statsPrompt}

    DATASETS PROVIDED:
    1. **CAMPAIGN/PERIOD DATA** (For Trends & Funnel):
    ${campaignFile.substring(0, MAX_CONTEXT_LENGTH)}

    2. **CREATIVE DATA** (For Asset Analysis - Reach, Frequency, CTR):
    ${creativeFile.substring(0, MAX_CONTEXT_LENGTH)}

    3. **AUDIENCE/GROUP DATA** (For Targeting Analysis - Age, Gender, Placement):
    ${audienceFile.substring(0, MAX_CONTEXT_LENGTH)}

    --- ANALYSIS REQUIREMENTS (VERY IMPORTANT) ---

    **1. Summary & Funnel Diagnosis**
    - Diagnose the Funnel: CPM -> CTR -> CPC -> CVR -> ROAS.
    - Identify bottleneck.

    **2. Critical Issues (Critical Problems)**
    - **INEFFICIENT CREATIVES**: Identify specific Creative Names with High Spend (> 50,000 KRW) but Low ROAS (< 150%) or Low CTR.
    - **FATIGUE**: Identify creatives with Frequency > 3~4 that show declining CTR.
    - **INEFFICIENT TARGETING**: From Audience Data, identify specific 'Ad Group' + 'Age/Gender' combinations that have High Spend but Low ROAS.
    
    **3. Action Items (Concrete Steps)**
    - **OFF ACTIONS**: Suggest specific elements to PAUSE.
    - **SCALE ACTIONS**: Suggest what to increase budget on.
    - **CREATIVE REFRESH**: Suggest replacing images if fatigue is detected.

    **4. Creative (Asset) Analysis**
    - List top creatives.
    - **SORT ORDER**: You MUST sort this list by **'Cost' (High to Low)**. The most expensive creatives must appear first.

    **5. Audience Analysis (Split into two Categories)**
    - **Audience Age Stats**: Aggregate performance by Age Group (e.g., "20-24", "30-34"). **SORT by Cost (High to Low)**.
    - **Audience Media Stats**: Aggregate performance by Media/Platform/OS (e.g., "Smart Channel", "Main Feed", "Android", "iOS"). **SORT by Cost (High to Low)**.

    RETURN JSON ONLY (Schema):
    {
      "summary": {
        "totalCost": "string (KRW)",
        "totalRevenue": "string (KRW)",
        "totalRoas": "string (%)",
        "totalConversions": "string",
        "roasChange": "string",
        "costChange": "string"
      },
      "funnelAnalysis": {
        "cpm": number,
        "ctr": number,
        "cpc": number,
        "cvr": number,
        "roas": number,
        "diagnosis": "string (Korean funnel diagnosis)"
      },
      "trendData": [
        { "name": "string (Date)", "value": number (Revenue), "cost": number, "roas": number }
      ],
      "creativeStats": [
        { 
          "creativeName": "string", 
          "cost": number, 
          "revenue": number, 
          "roas": number, 
          "clicks": number, 
          "ctr": number, 
          "conversions": number,
          "reach": number,
          "frequency": number
        }
      ],
      "audienceAgeStats": [
        { "segment": "string (e.g. 30-34)", "cost": number, "revenue": number, "roas": number, "clicks": number }
      ],
      "audienceMediaStats": [
        { "segment": "string (e.g. GFA Mobile, Android)", "cost": number, "revenue": number, "roas": number, "clicks": number }
      ],
      "criticalIssues": ["string (Be specific: Name, Metric, Problem)", ...],
      "actionItems": ["string (Be specific: Name, Action, Reason)", ...],
      "insights": [
        { "title": "string", "description": "string", "severity": "high" | "medium" | "low" }
      ]
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
    console.error("GFA Analysis Failed", error);
    throw new Error("GFA Report Generation Failed. Please retry.");
  }
};