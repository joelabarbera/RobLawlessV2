import LessonCard from './LessonCard'

function LessonTypes() {
  return (
    <section id="lessons" className="lesson-types">

      {/* Section header */}
      <div className="lesson-types-header">
        <span className="lesson-types-label">Lesson Types</span>
        <h2>A lesson for every stage of your game</h2>
      </div>
      {/* Cards row */}
      <div className="lesson-cards-row">
        <LessonCard
          lesson="Beginner Fundamentals"
          description="Stance, approach, and release — build a repeatable game from day one."
          price="$65"
          duration="60 min"
          iconShape="square"
        />
        <LessonCard
          lesson="Performance Coaching"
          description="Ball motion, timing, and spare shooting for league and tournament bowlers."
          price="$85"
          duration="60 min"
          mostPopular={true}
          iconShape="circle"
        />
        <LessonCard
          lesson="Video Game Review"
          description="Send footage from league night for frame-by-frame breakdown and feedback."
          price="$45"
          duration="session"
          iconShape="lines"
        />
      </div>
    </section>
  )
}

export default LessonTypes
