import PageHero from '@/components/PageHero';
import PastShowsGrid from '@/components/PastShowsGrid';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Past Shows — Accolade Community Theatre',
};

export default async function PastShowsPage() {
  const supabase = await createClient();

  const { data: shows } = await supabase
    .from('shows')
    .select('id, title, event_type, end_date, show_image, show_image_wide, youtube_video_id')
    .eq('past_shows_visible', true)
    .order('end_date', { ascending: false, nullsFirst: false });

  return (
    <>
      <PageHero
        eyebrow="The Archive"
        title="Past Productions"
        subtitle="Every show is a chapter in Accolade's story. Browse our production history below."
      />

      <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(20px, 5vw, 48px) clamp(48px, 10vw, 120px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {shows && shows.length > 0 ? (
            <PastShowsGrid shows={shows} />
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', marginBottom: '12px' }}>
                The archive is still warming up
              </p>
              <p style={{ fontSize: '0.9rem' }}>Past productions will appear here as shows close out.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
