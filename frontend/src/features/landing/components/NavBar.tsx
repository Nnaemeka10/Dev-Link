// import { ChevronDown } from "lucide-react"
import { COMPANY, NAV_LINKS } from "@constants/index";
import AOS from "aos"
import "aos/dist/aos.css"
import { ChevronDown, Menu, PhoneCall, X } from "lucide-react";
import { useEffect } from "react"
import { Link } from "react-router-dom";

import { useHomeStore } from "../store/usHomeStore";
import { Languages } from "../constants";
import { findFLags } from "../hooks/findflag";



const NavBar = () => {

  const { isMenuOpen, toggleMenu, isLanguageOpen, toggleLanguage, selectedLanguage, setSelectedLanguage} = useHomeStore();

  //initialize animate on scroll
  useEffect(() => {
    AOS.init({
      duration:1000,
      once:true,
      easing:"ease-in-out"
    });
  }, []);


  return (
    <nav className=" text-secondary-900 bg-secondary-50 z-40 w-full py-3 px-6 lg:px-12 2xl:px-32 relative">
      <div className="font-normal text-sm flex justify-between items-center">

        {/* links first nav content*/}
        <div className="hidden items-center gap-8 lg:flex" data-aos = "fade-down">
          {
            NAV_LINKS.map((link, index) => (
              <Link 
                key={index} 
                to={link.href} 
                className="relative text-secondary-900 hover:text-primary-600 transition link-underline-animation text-[0.95rem]">{link.label} 
              </Link>
            ))
          }
        </div>

        {/* Phone  and language setting 2nd mav content*/}
        <div className="flex items-center gap-6" data-aos = "fade-down" data-aos-delay="100">
          {/* phone */}
          <div className="hidden md:flex gap-1 items-center">
            <PhoneCall size={24} />
            <p className="font-[600]">
              { COMPANY.phone }
            </p>
          </div>

          {/* language */}     
          <div className="flex items-center justify-center relative">
            
            <div>  
              <img src={findFLags(selectedLanguage)?.flag} alt="flag" className="h-5 w-6"/>
            </div>

            <button onClick={() => toggleLanguage()} className="flex items-center justify-between p-2 cursor-pointer">
              { selectedLanguage }
              <ChevronDown size={16} className="ml-0.5"/>
            </button>

            { isLanguageOpen && (
              <div className="absolute left-4 top-full w-full bg-secondary-50 shadow-md z-50 px-4">
                { Languages.map((l, i) => (
                  <button 
                    key={i} 
                    onClick={() => {setSelectedLanguage(l.language); toggleLanguage()}} 
                    className="w-full flex items-center gap-2 p-2 cursor-pointer hover:bg-secondary-200">
                      {l.language}
                  </button>
                ))}

              </div>
            )}
          </div>
        </div>

        {/* Menu 3rd nav content*/}
        <div className="flex items-center lg:hidden">
              <button 
                className="p-2  hover:bg-primary-50 rounded-full transition"
                onClick={() => toggleMenu()}
                >
                  { isMenuOpen ? <X size={24} /> : <Menu size={24} /> }
              </button>
        </div>

      </div>

    </nav>
  )
}

export default NavBar