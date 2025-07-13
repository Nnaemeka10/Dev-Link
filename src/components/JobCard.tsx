import { type Job } from '../types/job';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteJob } from '../api/jobsApi';
import { useAuth } from '../hooks/authContext';



interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {

    const queryClient = useQueryClient();
    const { user } = useAuth();

    const mutation = useMutation({
        mutationFn: () => deleteJob(job.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
    });

    return (
        
        <div className='border p-4 rounded-lg shadow-sm mb-4 hover:shadow-md'>
            <h2 className='text-xl font-semibold'>{job.title}</h2>
            <p className='text-gray-600'>{job.company} - {job.location}</p>
            <p className='text-green-700 font-medium'>{job.salary}</p>
            <p className='text-sm mt-2'>{job.description}</p>
            <Link 
                to = {`/jobs/${job.id}`} 
                className = 'inline-block mt-2 text-blue-500 hover:underline'>
                View Details
            </Link>

            {user && (
                <button
                    onClick = {() => mutation.mutate()}
                    className='text-red-600 mt-2'
                    >
                        Delete
                </button>
            )}
        </div>
    );
}