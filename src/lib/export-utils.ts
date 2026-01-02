
export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    headers?: Record<keyof T, string> // Map data keys to Arabic headers
) {
    if (!data || data.length === 0) {
        console.warn("No data to export");
        return;
    }

    // Get keys from first object if headers not provided
    const keys = (Object.keys(data[0])) as (keyof T)[];

    // Construct CSV Header row
    const csvHeaders = headers
        ? keys.map(key => headers[key] || key).join(',')
        : keys.join(',');

    // Construct CSV Rows
    const csvRows = data.map(row => {
        return keys.map(key => {
            const val = row[key];
            // Handle special characters, commas, or newlines by escaping
            const escaped = typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
            return escaped;
        }).join(',');
    });

    // Combine with BOM for Excel Arabic support
    const csvContent = '\uFEFF' + [csvHeaders, ...csvRows].join('\n');

    // Create Blob and Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
