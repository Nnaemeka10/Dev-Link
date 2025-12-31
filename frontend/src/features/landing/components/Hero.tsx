import { Input } from "@shared/components/Input"
import { Heroimg } from "@assets/index"
import { BriefcaseBusiness } from "lucide-react"
import MetricCard from "@shared/components/MetricCard"
import { Button } from "@shared/components/Button"


const Hero = () => {
  return (
    <section className=" text-secondary-900 bg-secondary-50 w-full py-20 bodypad relative">
      <div className="flex flex-col justify-between gap-18">
        {/* hero content and image */}
        <div className="flex items-center justify-between gap-28">
          {/* hero content */}
          <article className="flex flex-col w-full lg:w-[60%] gap-4 ">
            <h1 className="font-[600] text-4xl lg:w-[80%] w-full">Find a job that suits your interests & skills</h1>
            <p className="text-secondary-600 lg:w-[80%] w-full">Lorem ipsum dolor sit amet consectetur adipisicing elit. Animi, excepturi minus deserunt accusantium, labore dolores fugiat perspiciatis impedit quidem, doloremque molestiae vitae? Accusamus, saepe!</p>
            <div className="flex bg-white border-2 border-secondary-100 py-3 px-2 items-center gap-2 pl-5">
              <Input 
                type="search" 
                name="Search bar" 
                className="border-none focus:border-none" 
                placeholder="Job title, keyword..."
              />
              <div className="border-l-[1.5px] h-6 border-secondary-300" />
              <Input 
                type="location" 
                name="Location bar" 
                className="border-none focus:border-none" 
                placeholder="Your Location"
              />
              <Button className="w-52">
                Find Job
              </Button>
            </div>
            <p><span className="text-secondary-500">Suggestion: </span>Designer, Programming, <span className="text-primary-600 font-medium">Digital marketing </span>Video, Animation</p>           
          </article>

          {/* hero image */}
          <div className="flex w-full lg:w-[40%] absolute right-0 opacity-10 lg:relative lg:opacity-100">
            <img src = {Heroimg} alt=""/>
          </div>

        </div>

        {/* Hero metrics */}
        <div className="flex justify-center gap-4 flex-col lg:flex-row">
          <div className="flex items-center gap-4">
            <MetricCard 
              metric="1,750,324"
              description="Live Job"
              icon = {<BriefcaseBusiness className="text-primary-400 group-hover:text-white group-hover:transition-all group-hover:duration-300"/>}
            />
            <MetricCard 
              metric="97,354"
              description="Companies"
              icon = {<BriefcaseBusiness className="text-primary-400  group-hover:text-white group-hover:transition-all group-hover:duration-300"/>}
            />
          </div>

          <div className="flex items-center gap-4">
            <MetricCard 
              metric="38,471,154"
              description="Candidates"
              icon = {<BriefcaseBusiness className="text-primary-400  group-hover:text-white group-hover:transition-all group-hover:duration-300"/>}
            /><MetricCard 
              metric="7,532"
              description="New Jobs"
              icon = {<BriefcaseBusiness className="text-primary-400  group-hover:text-white group-hover:transition-all group-hover:duration-300"/>}
            />
            </div>

        </div>
      </div>

    </section>
  )
}

export default Hero