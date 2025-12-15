

const Vacancies = () => {

  const PopularVacancies = [
    {
      role: 'Anaestiologist',
      number: '45,904'
    },
    {
      role: 'Anaestiologist',
      number: '45,904'
    },
    {
      role: 'Anaestiologist',
      number: '45,904'
    },
    {
      role: 'Anaestiologist',
      number: '45,904'
    },
    {
      role: 'Anaestiologist',
      number: '45,904'
    },
    {
      role: 'Anaestiologist',
      number: '45,904'
    },
    {
      role: 'Anaestiologist',
      number: '45,904'
    },
    {
      role: 'Anaestiologist',
      number: '45,904'
    },
    {
      role: 'Anaestiologist',
      number: '45,904'
    },
    {
      role: 'Anaestiologist',
      number: '45,904'
    },
    {
      role: 'Anaestiologist',
      number: '45,904'
    },
    {
      role: 'Anaestiologist',
      number: '45,904'
    }, 
  ]

  return (
    <section className=" text-secondary-900 bg-white-50 w-full py-20 bodypad">
      <div className="flex flex-col justify-between gap-18">
        <h1 className="header">Most Popular Vacancies</h1>          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {
              PopularVacancies.map((vacancy, index) => (
                <article key={index}>
                  <h5 className="font-[700]">{vacancy.role}</h5>
                  <p>{`${vacancy.number} Open Positions`}</p>
                </article>
              ))
            }
          </div>
      </div>
    </section>
  )
}

export default Vacancies