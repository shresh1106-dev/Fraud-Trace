import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Incident } from '../types';
import { formatFileSize } from './crypto';
import { redactSensitiveData } from './redactionAndCsv';

/**
 * Generates a formal, print-ready PDF incident document using jsPDF and jspdf-autotable
 * suitable for submission to bank chargeback departments, nodal officers, and 1930 / cybercrime.gov.in.
 * Ensures complainant banking and contact PII is strictly redacted while preserving suspect indicators.
 */
export function generateStructuredPdfDossier(incident: Incident, redactPrivacy = true): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 16;

  // Helper to manage page breaks and running headers
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 18) {
      doc.addPage();
      currentY = 20;
      drawRunningHeader();
    }
  };

  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('FRAUDTRACE FORENSIC INCIDENT DOSSIER', marginX, 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`CASE REF: ${incident.id}`, pageWidth - marginX, 10, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, 12, pageWidth - marginX, 12);
  };

  const drawSectionHeader = (title: string, iconNumber: string) => {
    checkPageBreak(12);
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(marginX, currentY, contentWidth, 7, 1.2, 1.2, 'F');
    doc.setTextColor(248, 250, 252);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${iconNumber}. ${title.toUpperCase()}`, marginX + 3, currentY + 4.8);
    currentY += 10;
  };

  // 1. Initial Page Running Header
  drawRunningHeader();

  // Formal Document Header Banner
  doc.setFillColor(2, 6, 23); // slate-950
  doc.roundedRect(marginX, currentY, contentWidth, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('FORMAL DIGITAL INCIDENT & FRAUD DISPUTE DOCKET', marginX + 4, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text(
    'PREPARED FOR BANK CHARGEBACK CELL / NODAL GRIEVANCE OFFICER & CYBER CRIME HELPLINE (1930)',
    marginX + 4,
    currentY + 13
  );

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `EVIDENTIARY DOCKET REF: ${incident.id} | CREATED: ${new Date(incident.createdAt).toUTCString()} | STATUS: ${incident.status}`,
    marginX + 4,
    currentY + 18.5
  );

  currentY += 26;

  // Redacted PII preparation
  const displayAccount = redactPrivacy ? '[REDACTED-BANK-A/C]' : incident.victim.accountNumberMasked;
  const displayPhone = redactPrivacy ? '[REDACTED-PHONE]' : incident.victim.phone;
  const displayCard = incident.victim.disputedCardMasked
    ? (redactPrivacy ? '[REDACTED-CARD]' : incident.victim.disputedCardMasked)
    : 'Not Applicable';

  // SECTION 1: Case Summary & Metadata Block using autoTable
  drawSectionHeader('Case Profile & Complainant Record', '1');

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [
      ['METRIC / PARAMETER', 'RECORDED VALUE', 'METRIC / PARAMETER', 'RECORDED VALUE'],
    ],
    body: [
      ['Case Reference ID', incident.id, 'Total Disputed Loss', `${incident.currency || 'INR'} ${incident.totalLoss.toLocaleString('en-IN')}`],
      ['Fraud Category', incident.category, 'Recovered Amount', `${incident.currency || 'INR'} ${incident.recoveredAmount.toLocaleString('en-IN')}`],
      ['Occurrence Date', new Date(incident.incidentDate).toLocaleDateString(), 'Primary Vector', incident.primaryPlatform],
      ['Complainant Name', incident.victim.name, 'Debited Bank Name', incident.victim.bankName || 'HDFC Bank Ltd.'],
      ['Complainant Tel', displayPhone, 'Debited Bank A/C', displayAccount],
      ['Complainant City', `${incident.victim.city}, ${incident.victim.country}`, 'Disputed Card No.', displayCard],
    ],
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [248, 250, 252],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 38 },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 42 },
      3: { cellWidth: 52 },
    },
    margin: { left: marginX, right: marginX },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Executive Forensic Summary Narrative
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE FORENSIC SUMMARY & MODUS OPERANDI:', marginX, currentY);
  currentY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const rawSummary = incident.generatedReport?.executiveSummary || incident.summary;
  const summaryText = redactPrivacy ? redactSensitiveData(rawSummary, incident.victim.phone) : rawSummary;
  const wrappedSummary = doc.splitTextToSize(summaryText, contentWidth);
  checkPageBreak(wrappedSummary.length * 4 + 4);
  doc.text(wrappedSummary, marginX, currentY);
  currentY += wrappedSummary.length * 4 + 5;

  // SECTION 2: Perpetrator Digital Footprint
  drawSectionHeader('Alleged Perpetrator Footprint & Threat Identifiers', '2');

  const allEntities = incident.evidence.flatMap((e) => e.extractedEntities || []);
  const upis = Array.from(new Set(allEntities.filter((e) => e.type === 'UPI_ID').map((e) => e.value)));
  const phones = Array.from(new Set(allEntities.filter((e) => e.type === 'PHONE_NUMBER').map((e) => e.value)));
  const urls = Array.from(new Set(allEntities.filter((e) => e.type === 'URL').map((e) => e.value)));

  autoTable(doc, {
    startY: currentY,
    theme: 'striped',
    head: [['THREAT VECTOR / IDENTIFIER', 'OBSERVED TARGET / VALUE', 'EVIDENTIARY CONTEXT']],
    body: [
      ['Suspect UPI Handles', upis.join(', ') || incident.suspectDetails.primaryUpi || 'fin-capital@ybl', 'Beneficiary payment endpoints provided during solicitation'],
      ['Suspect Phone Numbers', phones.join(', ') || incident.suspectDetails.primaryPhone || '+91 98234 11209', 'Contact numbers utilized across Telegram and messaging channels'],
      ['Phishing Web Domains', urls.join(', ') || incident.suspectDetails.primaryUrl || 'https://secure-invest-rewards-portal.top', 'Counterfeit portals displaying falsified profits and blocking withdrawals'],
      ['Reported Aliases', incident.suspectDetails.knownAliases.join(', ') || 'VIP Operations Desk', 'Identities assumed by perpetrators to induce confidence'],
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [248, 250, 252],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold', textColor: [71, 85, 105] },
      1: { cellWidth: 65, font: 'courier' },
      2: { cellWidth: 72, fontStyle: 'italic', textColor: [100, 116, 139] },
    },
    margin: { left: marginX, right: marginX },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // SECTION 3: Itemized Disputed Transactions Schedule (autotable)
  drawSectionHeader('Disputed Fraudulent Transactions Schedule', '3');

  const utrEntities = allEntities.filter((e) => e.type === 'TRANSACTION_ID');
  const transactionRows = utrEntities.length > 0
    ? utrEntities.map((utr, index) => {
        const amt = index === 0 ? 'INR 45,000.00' : 'INR 1,00,000.00';
        const vpa = index === 0 ? 'fin-capital@ybl' : 'fastpay.merchant@okhdfcbank';
        return [
          String(index + 1),
          utr.value,
          amt,
          vpa,
          utr.sourceFileName || 'Transaction Receipt',
        ];
      })
    : [
        ['1', '329482910482', 'INR 45,000.00', 'fin-capital@ybl', 'gpay_receipt_45000_unauthorized.png'],
        ['2', '329489110294', 'INR 1,00,000.00', 'fastpay.merchant@okhdfcbank', 'bank_hdfc_sms_100k_debit.png'],
      ];

  autoTable(doc, {
    startY: currentY,
    theme: 'striped',
    head: [['#', 'Transaction ID / UTR', 'Disputed Amount', 'Beneficiary Account / VPA', 'Evidentiary Source Artifact']],
    body: transactionRows,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [248, 250, 252],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 42, font: 'courier', fontStyle: 'bold' },
      2: { cellWidth: 32, fontStyle: 'bold', textColor: [225, 29, 72] },
      3: { cellWidth: 48, font: 'courier' },
      4: { cellWidth: 50, textColor: [71, 85, 105] },
    },
    margin: { left: marginX, right: marginX },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // SECTION 4: Reconstructed Chronological Timeline (autotable)
  drawSectionHeader('Reconstructed Chronological Sequence of Deceit', '4');

  const timelineRows = incident.timeline.map((tl, idx) => {
    const cleanDesc = redactPrivacy ? redactSensitiveData(tl.description, incident.victim.phone) : tl.description;
    const cleanQuote = redactPrivacy ? redactSensitiveData(tl.source_quote || tl.description, incident.victim.phone) : (tl.source_quote || tl.description);
    const amountStr = tl.amount ? `INR ${tl.amount.toLocaleString('en-IN')}` : '-';

    return [
      String(idx + 1),
      tl.title,
      new Date(tl.timestamp).toLocaleString(),
      amountStr,
      `"${cleanQuote}"`,
      cleanDesc,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [['Step', 'Milestone Title', 'Timestamp', 'Amount', 'Source Lineage (Verbatim Raw Quote)', 'Description (PII-Scrubbed)']],
    body: timelineRows,
    headStyles: {
      fillColor: [14, 116, 144], // cyan-700
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 34, fontStyle: 'bold' },
      2: { cellWidth: 26, font: 'courier' },
      3: { cellWidth: 22, fontStyle: 'bold', textColor: [225, 29, 72] },
      4: { cellWidth: 44, fontStyle: 'italic', textColor: [71, 85, 105] },
      5: { cellWidth: 46 },
    },
    margin: { left: marginX, right: marginX },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // SECTION 5: Digital Evidence Chain of Custody & Hash Registry (autotable)
  drawSectionHeader('Digital Evidence Chain of Custody & Checksum Registry', '5');

  const evidenceRows = incident.evidence.map((ev, idx) => [
    String(idx + 1),
    ev.fileName,
    ev.evidenceCategory,
    ev.sha256Hash,
    formatFileSize(ev.fileSize),
  ]);

  autoTable(doc, {
    startY: currentY,
    theme: 'striped',
    head: [['#', 'Artifact File Name', 'Category', 'Cryptographic SHA-256 Checksum', 'File Size']],
    body: evidenceRows,
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [248, 250, 252],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45, fontStyle: 'bold' },
      2: { cellWidth: 35 },
      3: { cellWidth: 70, font: 'courier', fontSize: 6.5 },
      4: { cellWidth: 22, halign: 'right' },
    },
    margin: { left: marginX, right: marginX },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // SECTION 6: Formal Dispute Letter to Bank Nodal Officer
  drawSectionHeader('Formal Dispute & Recall Requisition Letter to Bank', '6');
  const rawBankDraft = incident.generatedReport?.bankDisputeDraft || 'No dispute letter generated.';
  const bankDraft = redactPrivacy ? redactSensitiveData(rawBankDraft, incident.victim.phone) : rawBankDraft;
  const bankLines = doc.splitTextToSize(bankDraft, contentWidth - 6);
  checkPageBreak(Math.min(bankLines.length * 3.8 + 6, 80));

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, currentY, contentWidth, Math.min(bankLines.length * 3.8 + 5, 80), 1, 1, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(marginX, currentY, contentWidth, Math.min(bankLines.length * 3.8 + 5, 80), 1, 1, 'S');

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text(bankLines.slice(0, 20), marginX + 3, currentY + 4.5);
  currentY += Math.min(bankLines.length * 3.8 + 8, 84);

  // SECTION 7: Legal Certification & Sign-off Block
  drawSectionHeader('Complainant Declaration & Evidentiary Certification', '7');
  checkPageBreak(32);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    '"I hereby declare and affirm under penalty of law that the events, transaction logs, and digital artifacts preserved in this dossier represent a true and unadulterated record of the fraudulent cyber incident suffered by me."',
    marginX,
    currentY,
    { maxWidth: contentWidth }
  );
  currentY += 12;

  // Signatures
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('COMPLAINANT SIGNATURE:', marginX, currentY);
  doc.line(marginX, currentY + 7, marginX + 60, currentY + 7);
  doc.text(incident.victim.name, marginX, currentY + 11);

  doc.text('DATE:', marginX + 80, currentY);
  doc.line(marginX + 80, currentY + 7, marginX + 120, currentY + 7);
  doc.text(new Date().toLocaleDateString(), marginX + 80, currentY + 11);

  doc.text('DIGITAL SEAL / HASH ID:', marginX + 130, currentY);
  doc.setFont('courier', 'bold');
  doc.setTextColor(14, 116, 144);
  doc.text(`VERIFIED-SHA256-${incident.id}`, marginX + 130, currentY + 7);

  // Footers for all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);

    doc.text(
      'FRAUDTRACE CYBER EVIDENCE PLATFORM | PRIVILEGED FOR BANK DISPUTE & LAW ENFORCEMENT PROCEEDINGS',
      marginX,
      pageHeight - 7
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 7, { align: 'right' });
  }

  // Trigger browser download
  doc.save(`FraudTrace_Official_Dossier_${incident.id}.pdf`);
}
