// Utility function to export data to CSV
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get all unique keys from data objects
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      let value = row[header];
      // Handle null/undefined
      if (value === null || value === undefined) {
        value = '';
      }
      // Escape quotes and wrap in quotes if contains comma or quote
      value = String(value).replace(/"/g, '""');
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value}"`;
      }
      return value;
    });
    csvContent += values.join(',') + '\n';
  });

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
