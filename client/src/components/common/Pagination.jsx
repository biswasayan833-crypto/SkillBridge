import React from 'react';

/**
 * Reusable pagination bar component.
 */
const Pagination = ({ currentPage, totalPages, onPageChange, hasNextPage, hasPrevPage }) => {
  if (!totalPages || totalPages <= 1) return null;

  // Build range of page numbers around current page
  const pages = [];
  const delta = 2;
  const start = Math.max(1, currentPage - delta);
  const end = Math.min(totalPages, currentPage + delta);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginTop: '2rem',
        flexWrap: 'wrap',
      }}
    >
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevPage && currentPage <= 1}
        style={{
          padding: '0.4rem 0.8rem',
          fontSize: '0.875rem',
          opacity: (!hasPrevPage && currentPage <= 1) ? 0.5 : 1,
          cursor: (!hasPrevPage && currentPage <= 1) ? 'not-allowed' : 'pointer',
        }}
      >
        &larr; Prev
      </button>

      {start > 1 && (
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onPageChange(1)}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
          >
            1
          </button>
          {start > 2 && <span style={{ color: 'var(--gray-400)', padding: '0 0.25rem' }}>...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={p === currentPage ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{
            padding: '0.4rem 0.75rem',
            fontSize: '0.875rem',
            minWidth: '2.25rem',
          }}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: 'var(--gray-400)', padding: '0 0.25rem' }}>...</span>}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onPageChange(totalPages)}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage && currentPage >= totalPages}
        style={{
          padding: '0.4rem 0.8rem',
          fontSize: '0.875rem',
          opacity: (!hasNextPage && currentPage >= totalPages) ? 0.5 : 1,
          cursor: (!hasNextPage && currentPage >= totalPages) ? 'not-allowed' : 'pointer',
        }}
      >
        Next &rarr;
      </button>
    </div>
  );
};

export default Pagination;
