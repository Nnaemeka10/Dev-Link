import { Link } from "react-router-dom"
import { POPULAR_VACANCIES } from "../constants"


const Vacancies = () => {

  return (
    <section className=" text-secondary-900 bg-white w-full py-20 bodypad">
      <div className="flex flex-col justify-between gap-18">
        <h1 className="header">Most Popular Vacancies</h1>          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {
              POPULAR_VACANCIES.map((vacancy, index) => (
                <article key={index} className="flex gap-2 flex-col">
                  <Link to = '#' className="font-[700]">{vacancy.role}</Link>
                  <p className="text-secondary-500 text-sm">{`${vacancy.number} Open Positions`}</p>
                </article>
              ))
            }
          </div>
      </div>
    </section>
  )
}

export default Vacancies