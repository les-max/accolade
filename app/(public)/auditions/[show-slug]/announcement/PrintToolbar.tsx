'use client'

export default function PrintToolbar() {
  return (
    <>
      <style>{`@media print { .print-toolbar { display: none !important; } }`}</style>
      <div className="print-toolbar" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#1a1a1a',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        zIndex: 10,
      }}>
        <p style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: '0.8rem', color: '#aaa', margin: 0 }}>
          Use your browser&rsquo;s print dialog to save as PDF.
        </p>
        <button
          onClick={() => window.print()}
          style={{
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            background: '#c9a227', color: '#1a1a1a',
            border: 'none', padding: '10px 24px',
            cursor: 'pointer', fontWeight: 600, borderRadius: '2px',
          }}
        >
          Print / Save as PDF
        </button>
      </div>
    </>
  )
}
