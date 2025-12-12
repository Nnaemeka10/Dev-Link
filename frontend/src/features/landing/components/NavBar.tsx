
import { COMPANY } from "@shared/constants/index";
import AOS from "aos"
import "aos/dist/aos.css"
import { Menu, PhoneCall, X } from "lucide-react";
import { useEffect } from "react"
import { Link } from "react-router-dom";

import { useHomeStore } from "../store/usHomeStore";
import { Languages, NAV_LINKS } from "../constants";

import FlagDropdown from "@shared/components/FlagDropdown"; 



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
    <nav className=" text-secondary-900 bg-secondary-50 z-60 w-full py-3 px-6 lg:px-12 2xl:px-32 relative">
      <div className="font-normal text-xs md:text-sm flex justify-between items-center">

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

          <FlagDropdown 
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            isOpen = {isLanguageOpen}
            onToggle={() => toggleLanguage()}
            options={Languages}
            labelKey="language"
            className="bg-secondary-50"
          />
        </div>

        {/* Menu 3rd nav content*/}
        <div className="flex items-center lg:hidden">
              <button 
                className="p-2  hover:bg-primary-50 rounded-full transition duration-300"
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