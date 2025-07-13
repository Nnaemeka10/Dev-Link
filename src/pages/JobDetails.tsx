import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchJobById } from "../api/jobsApi";


const Jobdetails = () => {
  const { id } = useParams<{ id:string}>();

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => fetchJobById(id!),
    enabled: !!id, // Only run the query if id is defined
  });

  if ( isLoading ) return <p>Loading job details...</p>;
  if (error instanceof Error) return <p>Error: {error.message}</p>;
  if (!job) return <p>No job found</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">{job.title}</h1>
      <p className="text-gray-600">{job.company} - {job.location}</p>
      <p className="text-green-700 font-medium">{job.salary}</p>
      <p className="mt-2">{job.description}</p>
    </div>
  )
}

export default Jobdetails

// toDo
// customize the  zod error messages