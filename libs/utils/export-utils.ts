/**
 * Utility functions for exporting data in CSV, PDF, and Excel formats.
 * Uses dynamic imports for ESM-only libraries.
 */

/**
 * Generate a CSV buffer from an array of objects.
 * @param data - Array of objects to export
 * @returns Buffer containing CSV data
 */
export async function generateCSV(data: any[]): Promise<Buffer> {
  if (!Array.isArray(data)) throw new Error('Data must be an array');
  // @ts-ignore: No type definitions for papaparse
  const Papa = (await import('papaparse')).default;
  const csv = Papa.unparse(data || []);
  return Buffer.from(csv, 'utf-8');
}

/**
 * Generate a PDF buffer from an array of objects.
 * @param data - Array of objects to export
 * @returns Promise<Buffer> containing PDF data
 */
export async function generatePDF(data: any[]): Promise<Buffer> {
  if (!Array.isArray(data)) throw new Error('Data must be an array');
  // @ts-ignore: No type definitions for react
  const React = (await import('react'));
  // @ts-ignore: No type definitions for @react-pdf/renderer
  const ReactPDF = await import('@react-pdf/renderer');
  const { Document, Page, Text, View, StyleSheet } = ReactPDF;
  const styles = StyleSheet.create({
    page: { flexDirection: 'column', backgroundColor: '#fff' },
    section: { margin: 10, padding: 10, flexGrow: 1 },
    row: { flexDirection: 'row', borderBottom: 1, borderColor: '#eee', padding: 4 },
    cell: { flex: 1, fontSize: 10 },
    header: { fontWeight: 'bold', backgroundColor: '#f0f0f0' },
  });
  const keys = data && data.length > 0 ? Object.keys(data[0]) : [];
  const MyDocument = () => (
    React.createElement(Document, null,
      React.createElement(Page, { size: 'A4', style: styles.page },
        React.createElement(View, { style: styles.section },
          // Header row
          React.createElement(View, { style: [styles.row, styles.header] },
            keys.map((key) => React.createElement(Text, { style: styles.cell, key }, key))
          ),
          // Data rows
          data && data.map((row: any, i: number) =>
            React.createElement(View, { style: styles.row, key: i },
              keys.map((key) => React.createElement(Text, { style: styles.cell, key }, String(row[key] ?? '')))
            )
          )
        )
      )
    )
  );
  return await ReactPDF.renderToBuffer(React.createElement(MyDocument));
}

/**
 * Generate an Excel buffer from an array of objects.
 * @param data - Array of objects to export
 * @returns Buffer containing Excel data
 */
export async function generateExcel(data: any[]): Promise<Buffer> {
  if (!Array.isArray(data)) throw new Error('Data must be an array');
  // @ts-ignore: No type definitions for xlsx
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(data || []);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.isBuffer(excelBuffer) ? excelBuffer : Buffer.from(excelBuffer);
} 