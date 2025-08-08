import React from "react";

const DataPreviewTable = ({ data, maxRows = 5 }) => {
  // Guard against null or empty data
  if (!data || data.length === 0) {
    return <p className="text-slate-400 text-center">No data to display.</p>;
  }

  // Dynamically get headers from the first data object
  const headers = Object.keys(data[0]);
  const displayedData = data.slice(0, maxRows);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800/50">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-6 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="bg-transparent border-b border-slate-700 hover:bg-slate-700/30"
            >
              {headers.map((header) => (
                <td key={`${rowIndex}-${header}`} className="px-6 py-4">
                  {/* Handle null/undefined values gracefully */}
                  {row[header] !== null && row[header] !== undefined
                    ? String(row[header])
                    : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > maxRows && (
        <div className="p-3 text-center text-xs text-slate-500">
          ... and {data.length - maxRows} more row(s)
        </div>
      )}
    </div>
  );
};

export default DataPreviewTable;
