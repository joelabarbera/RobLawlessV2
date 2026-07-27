import './Footer.css'

function Footer() {
  return (
    <footer className="footer">

      {/* Main footer content */}
      <div className="footer-main">

        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo">
            <div className="footer-logo-circle">TBL</div>
            <span className="footer-logo-name">The Bowling Lab</span>
          </div>
          <p>Private bowling coaching for every skill level. USBC certified instruction, on your schedule.</p>
        </div>

        {/* Location */}
        <div className="footer-col">
          <h4>Location</h4>
          <p>Rabs Country Lanes</p>
          <p>1600 Hylan Blvd</p>
          <p>Staten Island, NY</p>
        </div>

        {/* Contact */}
        <div className="footer-col">
          <h4>Contact</h4>
          <p>coach@thebowlinglab.com</p>
          <p>(718) 979-1600</p>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} The Bowling Lab. All rights reserved.</p>
      </div>

    </footer>
  )
}

export default Footer
