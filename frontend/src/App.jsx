import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import LessonTypes from './components/LessonTypes.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import HowItWorks from './components/HowItWorks.jsx'
import Booking from './components/Booking.jsx'
import CTABanner from './components/CTABanner.jsx'
import Testimonials from './components/Testimonials.jsx'
import Admin from './components/Admin.jsx'

function MainPage() {
  return (
    <>
      <Header />
      <Hero />
      <LessonTypes />
      <About />
      <HowItWorks />
      <Booking />
      <Testimonials />
      <CTABanner />
      <Footer />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
