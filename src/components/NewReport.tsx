import React from 'react';
import { NewReportView } from './NewReportView';
import { TimelineRiskAnalysis } from '../types';

interface NewReportProps {
  onSyncWithMainLocker?: (analysis: TimelineRiskAnalysis, rawNarrative: string) => void;
}

export const NewReport: React.FC<NewReportProps> = (props) => {
  return <NewReportView {...props} />;
};

export default NewReport;
