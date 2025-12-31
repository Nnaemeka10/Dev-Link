import MetricCard from "@shared/components/MetricCard"
import { HOW_WE_WORK } from "../constants"


const HowWeWork = () => {
  return (
    <section className="text-secondary-900 bg-secondary-50 w-full py-20 bodypad">
      <div className="flex items-center justify-center gap-18 flex-wrap relative">
        <h1 className = 'header'> How jobpilot works</h1>
        <div className="flex flex-wrap relative gap-18 justify-center">        
          {
            HOW_WE_WORK.map((item, index) => {
              return(
                <div  key={index} className="flex relative items-center">
                  <MetricCard  
                    icon = {<item.icon/>} 
                    metric={item.title}
                    description={item.description}
                    className="flex-col text-center"
                    iconStyle = 'circle' 
                    theme="dark"           
                  />

                  {item.arrow && (
                    <img 
                      src={item.arrow} 
                      alt="" 
                      aria-hidden
                      className={`absolute z-50 top-full mt-6 rotate-90 lg:static lg:mt-0 lg:ml-0 lg:rotate-0 pointer-events-none opacity-50 ${index === 1 ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'}` }
                      
                      />
                      
                  )}
                </div>
              )
            })
          }
        </div>
      </div>
    </section>
  )
}

export default HowWeWork