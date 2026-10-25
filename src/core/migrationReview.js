// A report acknowledged as a whole has no outstanding items. Newer reports may
// also record acknowledgement per issue.
export function unreviewedMigrationIssues(protocol) {
  const report = protocol?.legacy?.migrationReport;
  if (!report || report.formalRunAllowed !== false || report.reviewedAt) return [];
  return (report.issues || []).filter(issue => !issue.reviewed && !issue.reviewedAt);
}
