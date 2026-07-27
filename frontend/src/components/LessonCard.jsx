import './LessonCard.css'

function LessonCard(props) {
  return (
    <div className={`lesson-card ${props.mostPopular ? 'most-popular' : ''}`}>
      {props.mostPopular && <span className="badge">MOST POPULAR</span>}

      {/* Icon chip */}
      <div className="lesson-icon">
        <span style={{ width: '16px', height: '16px', background: '#e8b93f', borderRadius: props.iconShape === 'circle' ? '50%' : props.iconShape === 'lines' ? '2px' : '4px', boxShadow: props.iconShape === 'lines' ? '0 5px 0 #e8b93f, 0 -5px 0 #e8b93f' : 'none', display: 'block', ...(props.iconShape === 'lines' ? { height: '3px' } : {}) }}></span>
      </div>

      <h2>{props.lesson}</h2>
      <p className="lesson-desc">{props.description}</p>
      <p className="lesson-price">
        <span className="price">{props.price} </span>
        <span className="duration">/ {props.duration}</span>
      </p>
    </div>
  )
}

export default LessonCard
