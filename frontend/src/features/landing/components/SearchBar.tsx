import { Button } from "@shared/components/Button"
import { Input } from "@shared/components/Input"
import { BriefcaseBusiness, Search} from "lucide-react"


const SearchBar = () => {
  return (
    <>
      <section className=" text-secondary-900 bg-white w-full shadow-xs py-3 px-6 lg:px-12 2xl:px-32">
        <div className="font-normal text-sm flex justify-between items-center">
          {/* logo and search bar section item 1 */}
          <div className="flex items-center gap-6">
            {/* logo */}
            <div className="flex items-center gap-2">
              <BriefcaseBusiness size={32} className="text-primary-500"/>
              <h1 className="font-bold text-lg">DevLink</h1>
            </div>
            {/* search bar */}
            <div className="hidden border-2 border-secondary-100 items-center rounded-sm lg:flex xl:w-2xl lg:w-xl ">
              <Input 
                name = 'SearchBar'
                type="search" 
                className="py-2 border-none focus:border-none" 
                placeholder="Job title, keyword, company">
              </Input>
            </div>
          </div>

          {/* buttons item 2 in nav bar */}
          <div className="flex items-center gap-2">
            <Search className="not-sm:hidden lg:hidden"/>
            <Button variant="outline" className="not-sm:hidden">
              Sign In
            </Button>
            <Button>
              Post A Job
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

export default SearchBar