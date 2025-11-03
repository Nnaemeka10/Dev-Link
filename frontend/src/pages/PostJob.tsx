import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { createJob } from "../api/jobsApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  title: z.string().min(2), //"Title must be at least 2 characters long"
  company: z.string().min(2), //"Company name must be at least 2 characters long"
  location: z.string(),
  salary: z.string(),
  description: z.string().min(10) //"Description must be at least 10 characters long"
});

type JobForm = z.infer<typeof schema>;

const PostJob = () => {

  const { register, handleSubmit, formState: { errors } } = useForm<JobForm>({
    resolver: zodResolver(schema),
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      navigate('/jobs');
    },
  });

  const onSubmit = (data: JobForm) => {
    mutation.mutate(data);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Post a New Job</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input 
          {...register("title")}
          type="text" 
          placeholder="Job Title"
          className="border p-2 w-full"
          />
          {errors.title && <p className="text-red-500">
            {errors.title.message}
          </p>}

        <input 
          {...register("company")}
          type="text" 
          placeholder="Company Name"
          className="border p-2 w-full"
          />
          {errors.company && <p className="text-red-500">
            {errors.company.message}
          </p>}

        <input 
          {...register("location")}
          type="text"
          placeholder="Job Location"
          className="border p-2 w-full"
          />

        <input 
          {...register("salary")}
          type="text"
          placeholder="Salary"
          className="border p-2 w-full"
          />

        <textarea 
          {...register("description")}
          placeholder="Job Description"
          className="border p-2 w-full"
        />
        {errors.description && <p className="text-red-500">
          {errors.description.message}
        </p>}

        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Post Job
        </button>  
      </form>
    </div>
  );
}

export default PostJob