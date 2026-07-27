import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import LessonTypes from './components/LessonTypes.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import HowItWorks from './components/HowItWorks.jsx'
import Booking from './components/Booking.jsx'
import CTABanner from './components/CTABanner.jsx'
import Testimonials from './components/Testimonials.jsx'

function App() {
  return (
    <>
      <Header></Header>
      <Hero></Hero>
      <LessonTypes></LessonTypes>
      <About></About>
      <HowItWorks></HowItWorks>
      <Booking></Booking>
      <Testimonials></Testimonials>
      <CTABanner></CTABanner>
      <Footer></Footer>
    </>
  );
}

export default App
