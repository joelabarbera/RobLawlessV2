import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      <div className="hero-left">

        {/* Badge */}
        <div className="hero-badge">
          <span className="hero-badge-dot"></span>
          <span>PRIVATE COACHING · ALL SKILL LEVELS</span>
        </div>

        {/* Heading */}
        <h1>Bowl Better.<br />One Lesson at a Time.</h1>

        {/* Subhead */}
        <p>
          One-on-one coaching from a certified instructor. Whether you're
          rolling your first ball or chasing a 300, get personalized
          instruction built around your game.
        </p>

        {/* Buttons */}
        <div className="hero-buttons">
          <a href="#book" className="btn-gold">Book a Lesson</a>
          <a href="#lessons" className="btn-text">See Lesson Types</a>
        </div>

        {/* Stats row */}
        <div className="hero-stats">
          <div>
            <h3>15+</h3>
            <p>Years Coaching</p>
          </div>
          <div>
            <h3>400+</h3>
            <p>Students Trained</p>
          </div>
          <div>
            <h3>USBC</h3>
            <p>Certified Coach</p>
          </div>
        </div>

      </div>

      {/* Right column */}
      <div className="hero-right">
        <div className="hero-photo">
          <p className="photo-label">COACH PHOTO — action shot on the lane</p>
          <div className="coach-card">
            <h4>Coach Name</h4>
            <p>Head Instructor, The Bowling Lab</p>
          </div>
        </div>
      </div>

    </section>
  )
}

export default Hero
