import './Testimonials.css'

const reviews = [
  {
    quote: "Rob broke everything down in a way that was easy to understand. My consistency improved within just a few sessions.",
    name: "Courtney G.",
  },
  {
    quote: '"Went from a 130 average to consistently breaking 180 in three months. The video review sessions made all the difference."',
    name: 'Matteo R.',
  },
  {
    quote: '"Booking online was effortless and the lessons are worth every dollar. Highly recommend for league bowlers."',
    name: 'Terri H.',
  },
]

function Testimonials() {
  return (
    <section id="reviews" className="testimonials">

      {/* Header */}
      <div className="testimonials-header">
        <span className="testimonials-label">Testimonials</span>
        <h2>What students are saying</h2>
      </div>

      {/* Cards */}
      <div className="testimonials-grid">
        {reviews.map((r) => (
          <div className="testimonial-card" key={r.name}>
            <div className="stars">★★★★★</div>
            <p className="quote">{r.quote}</p>
            <div className="reviewer">{r.name}</div>
          </div>
        ))}
      </div>

    </section>
  )
}

export default Testimonials
