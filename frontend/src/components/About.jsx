import './About.css'

function About(){
    return(
        <section id="about" className="about">

            {/* Left column */}
            <div className="about-left">
                <div className="about-photo">
                    <p className="photo-label">FACILITY PHOTO — pro shop / lanes</p>
                </div>
            </div>

            {/* Right column */}
            <div className="about-right">

                {/* Label */}
                <span className="about-label">About The Coach</span>

                {/* Heading */}
                <h2>Coaching built on fundamentals, not gimmicks.</h2>

                {/* Description */}
                <p>
                    With over 25 years on the lanes and a USBC coaching certification,
                    I work with bowlers of every level — from first-timers learning
                    their approach to league veterans refining their release. Every
                    lesson is video-reviewed and tailored to your goals.
                </p>

                {/* Bullet points */}
                <ul>
                    <li>USBC Certified Silver Coach</li>
                    <li>Former collegiate competitor</li>
                    <li>Slow-motion video analysis included</li>
                </ul>

            </div>

        </section>
    )
}

export default About
