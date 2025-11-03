import { useQuery } from "@tanstack/react-query";
import { fetchJobs } from "../api/jobsApi";
import JobCard from "../components/JobCard";
import MouseSmokeEffect from '../components/MouseSmokeEffect';
import Spinner from "../components/Spinner";

// Todo
// Add hover: styles or animations to JobCard.

// Wrap the list in a grid or container for better spacing.

const Jobs = () => {
  const { data:jobs, isLoading, error} = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
  });

  if (isLoading) return <Spinner />;
  if (error instanceof Error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <MouseSmokeEffect />
      <h1 className="text-2xl font-bold mb-4">
        Available Jobs
      </h1>
      {jobs?.map((job) => (
        <JobCard key = {job.id} job={job}/>
      ))}
    </div>
  )
}

export default Jobs