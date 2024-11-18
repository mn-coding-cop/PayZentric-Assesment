import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PDFContent {
  headers: string[];
  content: string[][];
  pageInfo?: string;
}

const PDFContentViewer: React.FC = () => {
  const [pdfContent, setPdfContent] = useState<PDFContent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 15;

  useEffect(() => {
    const processRawContent = (rawContent: any): PDFContent | null => {
      const contentArray = rawContent.pdf_cntnt || [];
      const headerIndex = contentArray.findIndex((row: string[]) =>
        row.includes("SUBSTANCE")
      );

      if (headerIndex === -1) return null;

      const headers = contentArray[headerIndex];
      const dataRows = contentArray.filter(
        (row: string[], index: number) =>
          index !== headerIndex &&
          row.length === headers.length &&
          row[0] !== "SUBSTANCE"
      );

      return {
        headers,
        content: dataRows,
        pageInfo: "Controlled Substances List",
      };
    };

    const fetchPDFContent = async () => {
      try {
        const response = await fetch("/parse_pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        const processedContent = processRawContent(data);

        setPdfContent(
          processedContent ||
            (() => {
              throw new Error("Unable to process PDF content");
            })()
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    };

    fetchPDFContent();
  }, []);

  // Memoize pagination calculations
  const { totalPages, currentPageData } = useMemo(() => {
    if (!pdfContent) return { totalPages: 0, currentPageData: [] };

    const totalPages = Math.ceil(pdfContent.content.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentPageData = pdfContent.content.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    return { totalPages, currentPageData };
  }, [pdfContent, currentPage, itemsPerPage]);

  if (error)
    return (
      <div className="w-full max-w-4xl mx-auto mt-8 p-4 bg-red-50 border-l-4 border-red-500">
        <h2 className="text-xl font-semibold text-red-700">
          Error Loading Data
        </h2>
        <p className="text-red-600">{error}</p>
      </div>
    );

  if (!pdfContent)
    return (
      <div className="w-full max-w-4xl mx-auto mt-8 p-4 bg-gray-50 animate-pulse">
        <h2 className="text-xl font-semibold text-gray-700">
          Loading Substances...
        </h2>
      </div>
    );

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="bg-blue-600 text-white p-4">
        <h2 className="text-2xl font-bold">Controlled Substances List</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-50">
              {pdfContent.headers.map((header, index) => (
                <th
                  key={index}
                  className="p-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider border-b"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentPageData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-blue-100 transition-colors duration-200"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="p-3 text-sm text-gray-700 border-b"
                  >
                    {cell || "N/A"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center p-4 bg-gray-50">
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-full hover:bg-blue-100 disabled:opacity-50 transition-all"
          >
            <ChevronLeft className="text-blue-600" />
          </button>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="p-2 rounded-full hover:bg-blue-100 disabled:opacity-50 transition-all"
          >
            <ChevronRight className="text-blue-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFContentViewer;
