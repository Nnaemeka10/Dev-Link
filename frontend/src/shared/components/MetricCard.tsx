
import type { ReactNode } from "react"

interface MetricCardProps {
    metric: string,
    description: string,
    icon: ReactNode
}
       
const MetricCard = ({metric, description, icon} : MetricCardProps) => {
    return (  
          <article className="flex items-center p-3 rounded-md w-72 bg-white gap-3 transition-all duration-300 cursor-pointer hover:shadow-md group">
            {/* blue icon*/}
            <div className="flex items-center justify-center rounded-md bg-primary-100 p-2 group-hover:bg-primary-800 group-hover:transition-all group-hover:duration-300">
                {icon}
            </div>
            {/* next content */}
            <div className="">
              <h5 className="font-[600]">{metric}</h5>
              <p className="text-secondary-500">{description}</p>
            </div>
          </article>
    )
}

export default MetricCard   
          
          
         