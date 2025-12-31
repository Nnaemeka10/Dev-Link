import MetricCard from "@shared/components/MetricCard"
import { TESTIMONIALS } from "../constants"
import { ArrowLeft, ArrowRight, Quote, Star, } from "lucide-react"
import { Button } from "@shared/components/Button"


const Testimonial = () => {
  return (
    <section className="text-secondary-900 bg-secondary-50 w-full py-20 bodypad">
      <div className="flex items-center justify-center gap-18 relative flex-col">
        <h1 className="header">Clients Testimonial</h1>
        {/* testimonials */}
        <div className="flex flex-col gap-10">
          {
            TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="bg-white p-3">
                {/* rating stars and descriptiion */}
                <div>
                  {/* star */}
                  <div className="flex gap-3">
                    <Star className="text-amber-300"/>
                    <Star />
                    <Star />
                    <Star />
                    <Star />
                    {/* {
                      for(let i = 0, i < testimonial.rating, i++) {
                        <Star />
                      }
                    } */}
                  </div>
                  <p>{testimonial.description}</p>
                  
                </div>

                {/* testimonail person profile and quotation icon */}
                <div className="flex items-end">
                  {/* quotation proifle */}
                
                    <MetricCard 
                      metric={testimonial.name}
                      description={testimonial.role}
                      image = {testimonial.profileimg}
                    />
                  
                  {/* Quaotation icon */}
                 
                    <Quote className="rotate-180 text-secondary-200" />
                  
                </div>

              </div>
            ))
          }
        </div>

        {/* carousel indicator */}
        <div className="flex gap-2"> 
            {
              TESTIMONIALS.map((_t, index) => (
                <div key={index} className="w-3 h-3 rounded-full bg-primary-200"></div>
              ))
            }
        </div>

        {/* carousel buttons */}
        <div>
            <Button 
              variant="secondary"
              size="sm"
            >
              <ArrowLeft size={16}/>
            </Button>

            <Button 
              variant="secondary"
              size="sm"
            >
              <ArrowRight size={16}/>
            </Button>
        </div>

      </div>
    </section>
  )
}

export default Testimonial