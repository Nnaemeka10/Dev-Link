import { Button } from "@shared/components/Button"
import { Input } from "@shared/components/Input"
import { BriefcaseBusiness, Search} from "lucide-react"
import { useHomeStore } from "../store/usHomeStore"
import { NAV_LINKS } from "@constants/index"
import { Link } from "react-router-dom"


const SearchBar = () => {
  const {isMenuOpen, toggleMenu} = useHomeStore();

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

      {/* Mobile menu overlay */}
      {
        isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-60 lg:hidden"
            onClick={() => toggleMenu()}
          />
        )
      }

      {/* menu dropdown */}
      <div className={`fixed top-0 right-0 w-[280px] bg-white shadow-2xl z-60 transform transition-transform duration-300 ease-in-out lg:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full px-6 gap-6">
          {/* Menu links */}
          {
            NAV_LINKS.map((l, i) => (
              <Link 
                key={i}
                to={l.href}
                className="relative text-secondary-900 hover:text-primary-600 transition link-underline-animation text-[0.95rem] border-b border-b-secondary-900"  
              >
                {l.label}
              </Link> 
            ))
          }

          {/* buttons */}
          <div className="flex items-center gap-3">
            <Button>Create Account</Button>
            <Button>Sign In</Button>
          </div>
        </div>

      </div>
    </>
  )
}

export default SearchBar