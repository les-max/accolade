import PageHero from '@/components/PageHero';

export const metadata = {
  title: 'Past Shows — Accolade Community Theatre',
};

// Placeholder shows — to be replaced with real data from Supabase
const seasons = [
  {
    year: '2024–2025',
    shows: [
      { title: 'Frog and Toad Kids', type: 'Musical', image: null },
      { title: 'Newsies', type: 'Musical (Current)', image: null },
    ],
  },
  {
    year: '2023–2024',
    shows: [
      { title: 'Show Title', type: 'Musical', image: null },
      { title: 'Show Title', type: 'Play', image: null },
      { title: 'Show Title', type: 'Musical', image: null },
    ],
  },
  {
    year: '2022–2023',
    shows: [
      { title: 'Show Title', type: 'Musical', image: null },
      { title: 'Show Title', type: 'Musical', image: null },
      { title: 'Show Title', type: 'Play', image: null },
    ],
  },
];

const gradients = [
  'linear-gradient(160deg, #2d1b4e, #1b0a2e)',
  'linear-gradient(160deg, #0d2a28, #061514)',
  'linear-gradient(160deg, #302a1a, #141008)',
  'linear-gradient(160deg, #1a0a2a, #0a0515)',
  'linear-gradient(160deg, #1a2a1a, #0a1a0a)',
];

export default function PastShowsPage() {
  return (
    <>
      <PageHero
        eyebrow="The Archive"
        title="Past Productions"
        subtitle="Every show is a chapter in Accolade's story. Browse our production history below."
      />

      <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(20px, 5vw, 48px) clamp(48px, 10vw, 120px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {seasons.map(({ year, shows }) => (
            <div key={year} style={{ marginBottom: '80px' }}>
              <p className="section-label">{year} Season</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {shows.map(({ title, type }, i) => (
                  <div key={`${title}-${i}`} style={{ position: 'relative', aspectRatio: '2/3', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: gradients[i % gradients.length] }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(14,13,20,0.95) 0%, rgba(14,13,20,0.1) 50%, transparent 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 24px', zIndex: 2 }}>
                      <span style={{ fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--teal)', fontWeight: 500, display: 'block', marginBottom: '8px' }}>{type}</span>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.1 }}>{title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>
      </section>
    </>
  );
}
