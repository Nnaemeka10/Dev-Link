
import type { ReactNode } from "react"

interface MetricCardProps {
    metric: string,
    description?: string,
    uniquedescription?: ReactNode,
    icon?: ReactNode,
    className?: string,
    iconStyle?: string,
    theme?: string,
    image?: string,
    size?: string,
    tag?: string,

}
       
const MetricCard = ({metric, tag, description, size = 'md', icon, image,iconStyle = 'square', theme = 'light', className = '', uniquedescription} : MetricCardProps) => {
    return (  
          <article className={`flex items-center p-3 rounded-md gap-3 transition-all duration-300 cursor-pointer hover:shadow-md group ${className} ${theme === 'dark' ? '' : 'bg-white'} ${size === 'long' ? 'w-[21.5rem]' : 'w-72'}`}>
            {/* blue icon*/}
            { icon ? 
              <div className={`flex items-center justify-center p-2 group-hover:bg-primary-800 group-hover:transition-all group-hover:duration-300 ${iconStyle === 'circle' ? 'rounded-full' : 'rounded-md'} ${theme === 'dark' ? 'bg-white text-primary-400' : 'bg-primary-100'}`}>
                  {icon}
              </div>
              :
              <div className={`flex items-center justify-center rounded-md`}>
                  <img src={image} alt="company logo" />
              </div>
            }
            {/* next content */}
            <div className="w-full">
              <div className={`flex w-full ${tag? '': ''}`}>
                <h5 className="font-[600]">{metric}</h5>
                {
                  tag && ( 
                    <div className="bg-primary-100 px-2 flex items-center rounded-4xl text-xs ml-auto">
                      <p className="text-primary-300 ">{tag}</p> 
                    </div>)
                }
              </div>
              {description ? 
                <p className="text-secondary-500">{description}</p> : 
                uniquedescription
              }
              
            </div>
          </article>
    )
}

export default MetricCard   
          
          
         