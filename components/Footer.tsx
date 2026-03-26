import Link from 'next/link';
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/accolade-logo.png" alt="Accolade Community Theatre" style={{ height: '48px', width: 'auto', display: 'block', marginBottom: '16px' }} />
          <p>
            A community theatre dedicated to bringing stories to life and
            welcoming everyone — performers, crew, and audience alike — to
            the stage.
          </p>
        </div>

        <div className="footer-col">
          <h4>Productions</h4>
          <ul>
            <li><Link href="/tickets">Current Shows</Link></li>
            <li><Link href="/past-shows">Past Shows</Link></li>
            <li><Link href="/auditions">Auditions</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Get Involved</h4>
          <ul>
            <li><Link href="/volunteering">Volunteer</Link></li>
            <li><Link href="/partners">Partner With Us</Link></li>
            <li><Link href="/donate">Donate</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>About</h4>
          <ul>
            <li><Link href="/about">Our Story</Link></li>
            <li><Link href="/about#board">Board & Staff</Link></li>
            <li><Link href="/member">Member Login</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} Accolade Community Theatre. All rights reserved.</span>
        <span>Richardson, TX</span>
      </div>
    </footer>
  );
}
