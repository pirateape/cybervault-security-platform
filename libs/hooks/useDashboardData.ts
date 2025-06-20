import {
  useComplianceReports,
  useHeatMapData,
  useFeedbackEntries,
  useScanResults,
} from '../data-access/dashboardApi';

/**
 * Unified dashboard data hook.
 * Usage:
 *   const data = useDashboardData(reportId, orgId, scanId);
 */
export function useDashboardData(
  reportId?: string,
  orgId?: string,
  scanId?: string
) {
  const complianceReports = useComplianceReports(orgId || '');
  const heatMapData = useHeatMapData(orgId || '');
  const feedbackEntries = useFeedbackEntries(orgId || '', reportId || '');
  const scanResults = useScanResults(orgId || '', scanId);

  return {
    complianceReports,
    heatMapData,
    feedbackEntries,
    scanResults,
    isLoading:
      complianceReports.isLoading ||
      heatMapData.isLoading ||
      feedbackEntries.isLoading ||
      scanResults.isLoading,
    isError:
      complianceReports.isError ||
      heatMapData.isError ||
      feedbackEntries.isError ||
      scanResults.isError,
    error:
      complianceReports.error ||
      heatMapData.error ||
      feedbackEntries.error ||
      scanResults.error,
  };
}
