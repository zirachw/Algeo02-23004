import React from 'react';

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

  return (
    <div className="flex items-center justify-between mt-12">
      {/* Showing entries */}
      <div className="text-sm text-black">
        Showing {startItem} - {endItem} of {totalItems} Entries
      </div>

      {/* Pagination Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          className={`px-2 py-1 ${currentPage === 1 ? 'text-gray-300' : 'text-gray-400'}`}
          disabled={currentPage === 1}
        >
          &lt;
        </button>

        {/* Logika Pagination Dinamis */}
        {(() => {
            const maxVisiblePages = 4;
            let startPage = Math.max(1, currentPage - 1); 
            const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages); 

            // Jika pengguna berada di 4 halaman terakhir
            if (currentPage > totalPages - maxVisiblePages + 1) {
            startPage = totalPages - maxVisiblePages + 1;
            }

            const pages = [];
            for (let page = startPage; page <= endPage; page++) {
            pages.push(
                <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={`px-2 py-1 text-black ${
                    currentPage === page ? 'bg-gray-200' : 'text-black'
                }`}
                >
                {page}
                </button>
            );
            }
            return pages;
         })()}

        {/* Tanda Ellipsis Jika Ada Lebih Banyak Halaman */}
        {currentPage + 2 < totalPages && <span className='text-black'>...</span>}
        
        <button
          onClick={() => handlePageClick(totalPages)}
          className={`px-2 py-1 text-black ${currentPage === totalPages ? 'bg-gray-300' : 'text-black'}`}
        >
          {totalPages}
        </button>

        <button
          onClick={() => handlePageClick(currentPage + 1)}
          className={`px-2 py-1 ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-400'}`}
          disabled={currentPage === totalPages}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default Pagination;
