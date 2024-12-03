import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Generate the array of page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // Show maximum 5 page numbers

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(start + maxVisiblePages - 1, totalPages);

    // Adjust start if we're near the end
    if (end === totalPages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    // Add page numbers
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-8">
      {/* Showing entries info */}
      <div className="text-l text-black">
        Showing {startItem} - {endItem} of {totalItems} Entries
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-2 py-1 ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          &lt;
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => handlePageClick(page)}
            className={`px-3 py-1 rounded ${
              currentPage === page
                ? "bg-gray-200 text-gray-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next button */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-2 py-1 ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default Pagination;
