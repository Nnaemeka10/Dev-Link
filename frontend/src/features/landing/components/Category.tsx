import { Button } from "@shared/components/Button"
import { ArrowLeft, ArrowRight, Bookmark, DollarSign, LocationEdit,} from "lucide-react"
import { FEATURED_JOBS, POPULAR_CATEGORIES, TOP_COMPANIES } from "../constants"
import MetricCard from "@shared/components/MetricCard"


const Category = () => {
  return (
    <div className=" text-secondary-900 bg-white w-full py-20 bodypad">
      <div className="flex flex-col justify-between gap-18">
        <section className="flex flex-col gap-10">
          <div className="flex justify-between">
            <h2 className="header-md">Popular category</h2>
            <Button 
              icon = {<ArrowRight size={16}/>}
              variant="lightoutline"
              className=""
            >
                View All
            </Button>
          </div>

          <div className="flex flex-wrap relative gap-2">
            {
              POPULAR_CATEGORIES.map((popularCat, index) => (
                <MetricCard
                  key = {index} 
                  metric= {popularCat.role}
                  description={popularCat.number}
                  icon = {<popularCat.icon className="text-primary-600"/>}
                />
              ))
            }
          </div>
        </section>

        <section className="flex flex-col gap-10">
          <div className="flex justify-between">
            <h2 className="header-md">Featured job</h2>
            <Button 
              icon = {<ArrowRight size={16}/>}
              variant="lightoutline"
              className=""
            >
                View All
            </Button>
          </div>
          
          <div className="flex relative gap-2 flex-col">
            {
              FEATURED_JOBS.map((featuredJob, index) => (
                <div key={index} className="border border-secondary-200 pb-3 flex flex-wrap">
                  <MetricCard 
                   metric={featuredJob.role}
                   image={featuredJob.companyLogo}
                   size="long"
                   tag = {featuredJob.tag}
                   uniquedescription = {
                   <div className="flex gap-4 mt-2">
                    <p className="text-secondary-500 flex items-center gap-2 text-sm"><LocationEdit size={20} className="text-secondary-500" />{featuredJob.location}</p>
                    <p className="text-secondary-500 flex items-center gap-1 text-sm"><DollarSign size={20} className="text-secondary-500"/>{`$${featuredJob.minSalary} - $${featuredJob.maxSalary}`}</p>
                   </div> 
                  }
                  />
                  <div className="flex px-3 items-center gap-4">
                    <div>
                      <Bookmark className="text-primary-300"/>
                    </div>
                    <Button variant="secondary">
                          Apply Now 
                        <ArrowRight className="text-primary-300 ml-1" size={15}/>
                    </Button>
                  </div>
            </div>
              ))
            }  
        </div>        
        </section>

       <section className="flex flex-col gap-10">
          <div className="flex justify-between">
            <h2 className="header-md">Top companies</h2>
            <div className="flex gap-1">
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

          <div className="flex flex-wrap relative gap-2">
            {
              TOP_COMPANIES.map((topCompany, index) => (
                <div key={index} className="border border-secondary-200 pb-3 flex flex-wrap gap-2">
                  <MetricCard 
                    image={topCompany.logo}
                    metric={topCompany.companyName}
                    uniquedescription = {
                      <p className="text-secondary-500 flex items-center gap-2 text-sm"><LocationEdit size={20} className="text-secondary-500" />{topCompany.location}</p>
                    }
                  />
                  <div className="px-3">
                    <Button variant="secondary" size="lg">
                        Open Position 
                    </Button>
                  </div>
                </div>
              ))
            }
          </div>
          
        </section>

        

      </div>
    </div>
  )
}

export default Category