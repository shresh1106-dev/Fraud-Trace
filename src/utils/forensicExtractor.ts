import { ExtractedEntity, ExtractedEntityType } from '../types';

/**
 * Extracts entities from raw text, OCR text, or evidence descriptions
 */
export function extractEntitiesFromText(
  text: string,
  evidenceId: string,
  sourceFileName: string
): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const seenValues = new Set<string>();

  const addEntity = (
    type: ExtractedEntityType,
    value: string,
    contextSnippet: string,
    confidence = 90,
    extra: Partial<ExtractedEntity> = {}
  ) => {
    const cleanVal = value.trim();
    const key = `${type}:${cleanVal.toLowerCase()}`;
    if (!cleanVal || seenValues.has(key)) return;
    seenValues.add(key);

    entities.push({
      id: `ent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      evidenceId,
      sourceFileName,
      type,
      value: cleanVal,
      confidence,
      contextSnippet: contextSnippet.slice(0, 140),
      verified: true,
      ...extra,
    });
  };

  // 1. UPI ID / VPA detection (e.g. user@okhdfcbank, scammer@ybl, name@paytm, 9876543210@ibl)
  const upiRegex = /\b[a-zA-Z0-9.\-_]{2,40}@(okhdfcbank|okaxis|okicici|oksbi|ybl|ibl|axl|paytm|barodampay|upi|postbank|idfcbank|federal|kotak)\b/gi;
  let upiMatch;
  while ((upiMatch = upiRegex.exec(text)) !== null) {
    const val = upiMatch[0];
    const start = Math.max(0, upiMatch.index - 25);
    const end = Math.min(text.length, upiMatch.index + val.length + 25);
    addEntity('UPI_ID', val, text.slice(start, end), 95);
  }

  // Generic VPA fallback
  const genericVpaRegex = /\b[a-zA-Z0-9.\-_]{3,30}@[a-zA-Z]{3,15}\b/g;
  let genericMatch;
  while ((genericMatch = genericVpaRegex.exec(text)) !== null) {
    const val = genericMatch[0];
    if (!val.includes('@example') && !val.includes('@gmail') && !val.includes('@yahoo')) {
      const start = Math.max(0, genericMatch.index - 20);
      const end = Math.min(text.length, genericMatch.index + val.length + 20);
      addEntity('UPI_ID', val, text.slice(start, end), 88);
    }
  }

  // 2. Transaction IDs / UTR / Reference Numbers (e.g. 12-digit UTRs: 329482910482, Txn: UPI/329482910482, Ref No. 984920491029)
  const utrRegex = /(?:UTR|Ref(?:erence)?(?:\s*No\.?)?|Txn(?:\s*ID)?|Trans(?:action)?(?:\s*ID)?|UPI\s*Ref(?:\s*No\.?)?)[\s:=#-]+([A-Z0-9]{8,24})/gi;
  let utrMatch;
  while ((utrMatch = utrRegex.exec(text)) !== null) {
    const val = utrMatch[1];
    const start = Math.max(0, utrMatch.index - 20);
    const end = Math.min(text.length, utrMatch.index + utrMatch[0].length + 20);
    addEntity('TRANSACTION_ID', val, text.slice(start, end), 95);
  }

  // Standalone 12-digit banking reference (common Indian banking UTR pattern)
  const standaloneUtrRegex = /\b(3[0-9]{11}|4[0-9]{11}|2[0-9]{11})\b/g;
  let standMatch;
  while ((standMatch = standaloneUtrRegex.exec(text)) !== null) {
    const val = standMatch[1];
    const start = Math.max(0, standMatch.index - 25);
    const end = Math.min(text.length, standMatch.index + val.length + 25);
    addEntity('TRANSACTION_ID', val, text.slice(start, end), 90);
  }

  // 3. Amounts (e.g. ₹ 45,000, Rs. 1,00,000, $500, EUR 1200)
  const amountRegex = /(?:₹|Rs\.?|INR|\$|USD|EUR|GBP)\s*([\d,]+(?:\.\d{2})?)/gi;
  let amtMatch;
  while ((amtMatch = amountRegex.exec(text)) !== null) {
    const fullMatch = amtMatch[0];
    const rawVal = amtMatch[1];
    const numeric = parseFloat(rawVal.replace(/,/g, ''));
    if (!isNaN(numeric) && numeric > 0) {
      let currency = 'INR';
      if (fullMatch.includes('$')) currency = 'USD';
      else if (fullMatch.toLowerCase().includes('eur')) currency = 'EUR';
      else if (fullMatch.toLowerCase().includes('gbp')) currency = 'GBP';

      const start = Math.max(0, amtMatch.index - 20);
      const end = Math.min(text.length, amtMatch.index + fullMatch.length + 20);
      addEntity('AMOUNT', fullMatch.trim(), text.slice(start, end), 94, {
        numericAmount: numeric,
        currency,
        formattedValue: `${currency} ${numeric.toLocaleString()}`,
      });
    }
  }

  // 4. Phone numbers (e.g. +91 98234 11209, +1 555 123 4567, 10-digit Indian numbers starting with 6-9)
  const phoneRegex = /(?:\+?(\d{1,3}))?[-.\s]?(?:\(?([6-9]\d{2})\)?|([6-9]\d{2}))[-.\s]?(\d{3,4})[-.\s]?(\d{3,4})/g;
  let phoneMatch;
  while ((phoneMatch = phoneRegex.exec(text)) !== null) {
    const rawPhone = phoneMatch[0].trim();
    // Validate length of digits
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 13) {
      const start = Math.max(0, phoneMatch.index - 20);
      const end = Math.min(text.length, phoneMatch.index + rawPhone.length + 20);
      addEntity('PHONE_NUMBER', rawPhone, text.slice(start, end), 92);
    }
  }

  // 5. URLs and Phishing Domains
  const urlRegex = /(https?:\/\/[^\s"'<>]+|t\.me\/[a-zA-Z0-9_+]+)/gi;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    const val = urlMatch[0];
    const start = Math.max(0, urlMatch.index - 20);
    const end = Math.min(text.length, urlMatch.index + val.length + 20);
    addEntity('URL', val, text.slice(start, end), 96);
  }

  // 6. Dates (e.g. 21-SEP-2026, 21/09/2026, 2026-09-21)
  const dateRegex = /\b(\d{1,2}[-/](?:[0-9]{1,2}|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[-/]\d{2,4})\b/gi;
  let dateMatch;
  while ((dateMatch = dateRegex.exec(text)) !== null) {
    const val = dateMatch[0];
    const start = Math.max(0, dateMatch.index - 20);
    const end = Math.min(text.length, dateMatch.index + val.length + 20);
    addEntity('DATE', val, text.slice(start, end), 89);
  }

  // 7. Times (e.g. 14:32:10, 02:45 PM, 09:15am)
  const timeRegex = /\b((?:[01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?(?:\s*[AaPp][Mm])?)\b/g;
  let timeMatch;
  while ((timeMatch = timeRegex.exec(text)) !== null) {
    const val = timeMatch[0];
    const start = Math.max(0, timeMatch.index - 20);
    const end = Math.min(text.length, timeMatch.index + val.length + 20);
    addEntity('TIME', val, text.slice(start, end), 86);
  }

  // 8. Bank IFSC codes (e.g. HDFC0001234, SBIN0004921)
  const ifscRegex = /\b[A-Z]{4}0[A-Z0-9]{6}\b/g;
  let ifscMatch;
  while ((ifscMatch = ifscRegex.exec(text)) !== null) {
    const val = ifscMatch[0];
    const start = Math.max(0, ifscMatch.index - 20);
    const end = Math.min(text.length, ifscMatch.index + val.length + 20);
    addEntity('SUSPECT_IDENTIFIER', `Bank IFSC: ${val}`, text.slice(start, end), 95);
  }

  return entities;
}

/**
 * Calls backend Gemini API to extract entities from an evidence image/document,
 * and falls back gracefully to the pattern engine if offline or key is missing.
 */
export async function analyzeEvidenceFile(
  evidenceId: string,
  fileName: string,
  fileType: string,
  fileData: string,
  userNotes: string
): Promise<{
  entities: ExtractedEntity[];
  summary: string;
  engine: string;
  suggestedEvent?: {
    type: string;
    timestamp: string;
    title: string;
  };
}> {
  // First, extract from file name and notes with pattern engine
  const baseEntities = extractEntitiesFromText(`${fileName} ${userNotes}`, evidenceId, fileName);

  try {
    const res = await fetch('/api/analyze-evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        fileType,
        fileData: fileData.startsWith('data:image/') ? fileData : null,
        manualText: userNotes,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const aiEntities: ExtractedEntity[] = [...baseEntities];
        const seen = new Set(baseEntities.map(e => `${e.type}:${e.value.toLowerCase()}`));

        // Merge Gemini extracted transaction IDs
        if (Array.isArray(d.transactionIds)) {
          d.transactionIds.forEach((tid: string) => {
            const key = `TRANSACTION_ID:${tid.toLowerCase()}`;
            if (!seen.has(key) && tid) {
              seen.add(key);
              aiEntities.push({
                id: `ent-ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                evidenceId,
                sourceFileName: fileName,
                type: 'TRANSACTION_ID',
                value: tid,
                confidence: 96,
                contextSnippet: `Extracted via Gemini Vision from ${fileName}`,
                verified: true,
              });
            }
          });
        }

        // Merge Gemini extracted Amounts
        if (Array.isArray(d.amounts)) {
          d.amounts.forEach((amt: any) => {
            const valStr = typeof amt === 'string' ? amt : (amt.raw || `${amt.currency || ''} ${amt.value || ''}`);
            const key = `AMOUNT:${valStr.toLowerCase()}`;
            if (!seen.has(key) && valStr) {
              seen.add(key);
              const num = parseFloat((amt.value || valStr).replace(/[^0-9.]/g, '')) || 0;
              aiEntities.push({
                id: `ent-ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                evidenceId,
                sourceFileName: fileName,
                type: 'AMOUNT',
                value: valStr,
                numericAmount: num,
                currency: amt.currency || 'INR',
                confidence: 95,
                contextSnippet: `Payment amount identified in ${fileName}`,
                verified: true,
              });
            }
          });
        }

        // Merge UPI IDs
        if (Array.isArray(d.upiIds)) {
          d.upiIds.forEach((upi: string) => {
            const key = `UPI_ID:${upi.toLowerCase()}`;
            if (!seen.has(key) && upi) {
              seen.add(key);
              aiEntities.push({
                id: `ent-ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                evidenceId,
                sourceFileName: fileName,
                type: 'UPI_ID',
                value: upi,
                confidence: 98,
                contextSnippet: `Fraudulent VPA/UPI address in ${fileName}`,
                verified: true,
              });
            }
          });
        }

        // Merge Phone Numbers
        if (Array.isArray(d.phoneNumbers)) {
          d.phoneNumbers.forEach((phone: string) => {
            const key = `PHONE_NUMBER:${phone.toLowerCase()}`;
            if (!seen.has(key) && phone) {
              seen.add(key);
              aiEntities.push({
                id: `ent-ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                evidenceId,
                sourceFileName: fileName,
                type: 'PHONE_NUMBER',
                value: phone,
                confidence: 94,
                contextSnippet: `Contact number associated with fraud in ${fileName}`,
                verified: true,
              });
            }
          });
        }

        // Merge URLs
        if (Array.isArray(d.urls)) {
          d.urls.forEach((url: string) => {
            const key = `URL:${url.toLowerCase()}`;
            if (!seen.has(key) && url) {
              seen.add(key);
              aiEntities.push({
                id: `ent-ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                evidenceId,
                sourceFileName: fileName,
                type: 'URL',
                value: url,
                confidence: 97,
                contextSnippet: `Phishing or malicious endpoint in ${fileName}`,
                verified: true,
              });
            }
          });
        }

        // Merge Dates
        if (Array.isArray(d.dates)) {
          d.dates.forEach((date: string) => {
            const key = `DATE:${date.toLowerCase()}`;
            if (!seen.has(key) && date) {
              seen.add(key);
              aiEntities.push({
                id: `ent-ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                evidenceId,
                sourceFileName: fileName,
                type: 'DATE',
                value: date,
                confidence: 90,
                contextSnippet: `Timestamp date stamped on ${fileName}`,
                verified: true,
              });
            }
          });
        }

        // Merge Times
        if (Array.isArray(d.times)) {
          d.times.forEach((time: string) => {
            const key = `TIME:${time.toLowerCase()}`;
            if (!seen.has(key) && time) {
              seen.add(key);
              aiEntities.push({
                id: `ent-ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                evidenceId,
                sourceFileName: fileName,
                type: 'TIME',
                value: time,
                confidence: 90,
                contextSnippet: `Timestamp time recorded in ${fileName}`,
                verified: true,
              });
            }
          });
        }

        // Merge Suspect Entities
        if (Array.isArray(d.suspectEntities)) {
          d.suspectEntities.forEach((se: any) => {
            const val = typeof se === 'string' ? se : `${se.type || 'Suspect'}: ${se.value || ''}`;
            const key = `SUSPECT_IDENTIFIER:${val.toLowerCase()}`;
            if (!seen.has(key) && val) {
              seen.add(key);
              aiEntities.push({
                id: `ent-ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                evidenceId,
                sourceFileName: fileName,
                type: 'SUSPECT_IDENTIFIER',
                value: val,
                confidence: 92,
                contextSnippet: `Perpetrator identifier found in ${fileName}`,
                verified: true,
              });
            }
          });
        }

        return {
          entities: aiEntities,
          summary: d.summary || `Forensic inspection completed for ${fileName}.`,
          engine: 'Gemini 3.8 Flash Multimodal',
          suggestedEvent: d.suggestedEventType
            ? {
                type: d.suggestedEventType,
                timestamp: d.suggestedTimestamp || new Date().toISOString(),
                title: `${d.suggestedEventType} (${fileName})`,
              }
            : undefined,
        };
      }
    }
  } catch (err) {
    console.warn('Backend forensic call fallback to client engine:', err);
  }

  // Graceful fallback to client pattern extraction
  return {
    entities: baseEntities,
    summary: `Processed with FraudTrace Pattern Extraction Engine (${baseEntities.length} entities detected).`,
    engine: 'Pattern Recognition Engine',
  };
}
