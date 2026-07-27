import './Header.css'

function Header() {
  return (
    <header className="header">

      {/* Logo */}
      <div className="header-logo">
        <div className="logo-circle">TBL</div>
        <span className="logo-name">The Bowling Lab</span>
      </div>

      {/* Nav */}
      <nav className="header-nav">
        <a href="#about">About</a>
        <a href="#lessons">Lessons</a>
        <a href="#book">Book</a>
        <a href="#reviews">Reviews</a>
        <a href="#book" className="btn-book-now">Book Now</a>
      </nav>

    </header>
  )
}

export default Header
