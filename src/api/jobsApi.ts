import { type Job } from "../types/job";

const API_URL = "http://localhost:3001";

export async  function fetchJobs(): Promise<Job[]> {
    const res = await fetch(`${API_URL}/jobs`);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
}

export async function fetchJobById(id: string): Promise<Job> {
    const res = await fetch(`${API_URL}/jobs/${id}`);
    if(!res.ok) throw new Error('Failed to fetch job');
    return res.json();
}

export async function createJob(job:Omit<Job, "id">): Promise<Job> {
    const res = await fetch (`${API_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(job),  
    });

    if (!res.ok) throw new Error('Failed to create job');
    return res.json();
}

export async function updateJob(id: string, job: Omit<Job, "id">): Promise<Job> {
    const res = await fetch(`${API_URL}/jobs/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(job),
    });

    if (!res.ok) throw new Error('Failed to update Job');
    return res.json();
}

export async function deleteJob(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/jobs/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete Job');
}