import { 
  NavBar,
  Hero,
  HowWeWork,
  Vacancies,
  Category,
  Testimonial,
  CTA,
  Footer,
  SearchBar
 } from "@features/landing/components";

const Home = () => {
  return (
    
      <main>
        <NavBar />
        <SearchBar />
        <Hero />
        <Vacancies />
        <HowWeWork />
        <Category />
        <Testimonial />
        <CTA />
        <Footer />
      </main>
  
  )
}

export default Home