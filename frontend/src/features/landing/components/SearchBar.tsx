import Button from "@shared/components/Button"
import { Input } from "@shared/components/Input"
import { BriefcaseBusiness, Search} from "lucide-react"
import { useHomeStore } from "../store/usHomeStore"
import { COUNTRIES, NAV_LINKS } from "../constants"
import { Link } from "react-router-dom"
import FlagDropdown from "@shared/components/FlagDropdown"


const SearchBar = () => {
  const {
    isMenuOpen, 
    toggleMenu, 
    isCountriesOpen, 
    toggleCountry, 
    selectedCountry, 
    setSelectedCountry
  } = useHomeStore();

  return (
    <>
      <section className="relative text-secondary-900 bg-white w-full shadow-xs py-3 px-6 lg:px-12 2xl:px-32 z-50">
        <div className="font-normal text-sm flex justify-between items-center">
          {/* logo and search bar section item 1 */}
          <div className="flex items-center gap-6">
            {/* logo */}
            <div className="flex items-center gap-2">
              <BriefcaseBusiness size={32} className="text-primary-500"/>
              <h1 className="font-bold text-lg">DevLink</h1>
            </div>
            {/* search bar */}
            <div className="hidden px-4 border-2 border-secondary-100 items-center gap-2 rounded-sm lg:flex xl:w-2xl lg:w-xl ">
              
              <FlagDropdown 
                value= {selectedCountry}
                onChange={setSelectedCountry}
                isOpen = {isCountriesOpen}
                onToggle={() => toggleCountry()}
                options={COUNTRIES}
                labelKey="country"
                className="bg-white -left-4"
              />
              <div className="border-l-[1.5px] h-6 border-secondary-300" />
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
            <Search className="inline-flex lg:hidden"/>
            <Button variant="outline" className="not-sm:hidden">
              Sign In
            </Button>
            <Button>
              Post A Job
            </Button>
          </div>
        </div>
      </section>

      

      {/* menu dropdown */}
      <div className={`absolute top-31 right-0 py-2 pb-7 w-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full hidden'}`}>
        <div className="flex flex-col h-full px-6">
          {/* Menu links */}
          {
            NAV_LINKS.map((l, i) => (
              <Link 
                key={i}
                to={l.href}
                className="relative flex py-4 text-secondary-900 hover:text-primary-600 transition link-underline-animation text-[0.95rem] border-b border-b-secondary-900"  
              >
                {l.label}
              </Link> 
            ))
          }

          {/* buttons */}
          <div className="flex items-center gap-3 mt-6">
            <Button>Create Account</Button>
            <Button variant="outline">Sign In</Button>
          </div>
        </div>

      </div>

      {/* Mobile menu overlay */}
      {
        isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => toggleMenu()}
          />
        )
      }
    </>
  )
}

export default SearchBar