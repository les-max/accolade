import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import AutoPrint from './AutoPrint'

export async function generateMetadata({ params }: { params: Promise<{ 'show-slug': string }> }) {
  const { 'show-slug': slug } = await params
  const supabase = await createClient()
  const { data: show } = await supabase.from('shows').select('title').eq('slug', slug).single()
  return { title: show ? `Audition Announcement — ${show.title}` : 'Audition Announcement' }
}

export default async function AnnouncementPrintPage({
  params,
}: {
  params: Promise<{ 'show-slug': string }>
}) {
  const { 'show-slug': slug } = await params
  const supabase = await createClient()

  const { data: show } = await supabase
    .from('shows')
    .select('title, start_date, field_config')
    .eq('slug', slug)
    .single()

  if (!show) notFound()

  const announcement = (show.field_config as Record<string, unknown> | null)?.audition_announcement as string | null
  if (!announcement) notFound()

  const auditionDate = show.start_date
    ? new Date(show.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <>
      <AutoPrint />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: Georgia, 'Times New Roman', serif;
          color: #1a1a1a;
          background: #fff;
        }

        .print-page {
          max-width: 680px;
          margin: 0 auto;
          padding: 48px 40px;
        }

        .print-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 24px;
          border-bottom: 2px solid #1a1a1a;
          margin-bottom: 36px;
        }

        .print-header-text {
          text-align: right;
        }

        .print-org {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 2px;
        }

        .print-tagline {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #999;
        }

        .print-eyebrow {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 9px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 10px;
        }

        .print-show-title {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: 6px;
        }

        .print-date {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 32px;
        }

        .print-divider {
          border: none;
          border-top: 1px solid #ddd;
          margin-bottom: 32px;
        }

        .announcement-content {
          font-size: 0.95rem;
          line-height: 1.85;
          color: #1a1a1a;
        }

        .announcement-content p { margin-bottom: 14px; }
        .announcement-content p:last-child { margin-bottom: 0; }
        .announcement-content strong { font-weight: 700; }
        .announcement-content em { font-style: italic; color: #444; }
        .announcement-content h3 { font-size: 1.1rem; font-weight: 700; margin: 20px 0 8px; }
        .announcement-content ul, .announcement-content ol { padding-left: 22px; margin-bottom: 14px; }
        .announcement-content li { margin-bottom: 5px; }
        .announcement-content blockquote {
          border-left: 3px solid #ccc;
          padding-left: 14px;
          color: #555;
          font-style: italic;
          margin: 14px 0;
        }

        .print-footer {
          margin-top: 48px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 9px;
          color: #aaa;
          letter-spacing: 0.05em;
          display: flex;
          justify-content: space-between;
        }

        /* Screen-only: print button bar */
        .screen-toolbar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #1a1a1a;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          z-index: 10;
        }

        .screen-toolbar p {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 0.8rem;
          color: #aaa;
        }

        .screen-toolbar button {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 0.8rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: #c9a227;
          color: #1a1a1a;
          border: none;
          padding: 10px 24px;
          cursor: pointer;
          font-weight: 600;
          border-radius: 2px;
        }

        @media print {
          .screen-toolbar { display: none !important; }
          .print-page { padding: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="print-page">
        <div className="print-header">
          <Image
            src="/accolade small.png"
            alt="Accolade Community Theatre"
            width={80}
            height={80}
            style={{ objectFit: 'contain' }}
          />
          <div className="print-header-text">
            <p className="print-org">Accolade Community Theatre</p>
            <p className="print-tagline">accoladetheatre.org</p>
          </div>
        </div>

        <p className="print-eyebrow">Audition Announcement</p>
        <h1 className="print-show-title">{show.title}</h1>
        {auditionDate && <p className="print-date">Auditions: {auditionDate}</p>}

        <hr className="print-divider" />

        <div
          className="announcement-content"
          dangerouslySetInnerHTML={{ __html: announcement }}
        />

        <div className="print-footer">
          <span>Accolade Community Theatre — accoladetheatre.org</span>
          <span>Printed {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="screen-toolbar">
        <p>Use your browser&rsquo;s print dialog to save as PDF.</p>
        <button onClick={() => {}} id="print-btn">Print / Save as PDF</button>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('print-btn').addEventListener('click', function() { window.print(); });
      `}} />
    </>
  )
}
