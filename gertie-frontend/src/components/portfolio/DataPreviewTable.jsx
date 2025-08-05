import React from "react";

const DataPreviewTable = ({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Get headers from the keys of the first object in the data array
  const headers = Object.keys(data[0]);

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Data Preview
          </h3>
          <div className="overflow-hidden shadow ring-1 ring-slate-700 sm:rounded-lg">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-800">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                {data.slice(0, 5).map(
                  (
                    row,
                    rowIndex // Show first 5 rows
                  ) => (
                    <tr key={rowIndex}>
                      {headers.map((header, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-300 sm:pl-6"
                        >
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPreviewTable;
