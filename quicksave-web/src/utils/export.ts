/* eslint-disable @typescript-eslint/no-explicit-any */
export const downloadAdminReport = async (endpoint: string, token: string, filename: string) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Export failed');

    // Convert response to a Blob (Binary Large Object)
    const blob = await res.blob();
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error(error);
    alert("Failed to download report.");
  }
};


export const convertToCSV = (data: any[]) => {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((obj: any)=> Object.values(obj).join(",")).join("\n");
  return `${headers}\n${rows}`;
};

export const downloadCSV = (data: any[], filename: string) => {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("download", `${filename}.csv`);
  a.click();
};