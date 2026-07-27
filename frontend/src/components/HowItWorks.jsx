import './HowItWorks.css'

const steps = [
  {
    number: 1,
    title: 'Pick a lesson type',
    description: 'Choose the coaching that matches where you are in your game.',
  },
  {
    number: 2,
    title: 'Choose a date & time',
    description: 'Book an open slot directly on the calendar below.',
  },
  {
    number: 3,
    title: 'Show up & roll',
    description: 'Get a confirmation email with everything you need to know.',
  },
]

function HowItWorks() {
  return (
    <section className="how-it-works">

      {/* Header */}
      <div className="hiw-header">
        <span className="hiw-label">How It Works</span>
        <h2>Three steps to your next lesson</h2>
      </div>

      {/* Steps */}
      <div className="hiw-steps">
        {steps.map((step) => (
          <div className="hiw-step" key={step.number}>
            <div className="hiw-number">{step.number}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>

    </section>
  )
}

export default HowItWorks
