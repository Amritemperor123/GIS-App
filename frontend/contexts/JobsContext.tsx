import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { BASE_URL } from '../utils/api';
import { useAuth } from './AuthContext';

export type JobStatus = 'new' | 'accepted' | 'in_progress' | 'completed';

export interface JobImage {
  uri: string;
  uploadedAt: string; // ISO string
  uploadedBy: string; // user name
}

export interface Job {
  job_id: number;
  state: number;
  location: string;
  created_by: number;
  accepted_by?: number;
  key: number;
  images: JobImage[];
}

interface JobsContextType {
  jobs: Job[];
  createJob: (input: { state: number; location: string; created_by: number; }) => Promise<void>;
  acceptJob: (jobId: number, providerId: number) => Promise<void>;
  addProgressImage: (jobId: number, imageUri: string, uploadedBy: string) => Promise<void>;
  completeJob: (jobId: number, imageUri: string, uploadedBy: string) => Promise<void>;
  getJobsForSector: (sector: string) => Job[];
  getJobById: (jobId: number) => Job | undefined;
  completedCountForSector: (sector: string) => number;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export const JobsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/jobs`);
      const data = await response.json();
      setJobs(data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const createJob: JobsContextType['createJob'] = async (input) => {
    try {
      const response = await fetch(`${BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (data.jobId) {
        fetchJobs();
      }
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  const acceptJob: JobsContextType['acceptJob'] = async (jobId, providerId) => {
    try {
      await fetch(`${BASE_URL}/api/jobs/${jobId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: 2, accepted_by: providerId }),
        }
      );
      fetchJobs();
    } catch (error) {
      console.error('Error accepting job:', error);
    }
  };

  const addProgressImage: JobsContextType['addProgressImage'] = async (jobId, imageUri, uploadedBy) => {
    // This requires image upload logic, which is not yet implemented.
    // For now, we will just update the job state.
    try {
      await fetch(`${BASE_URL}/api/jobs/${jobId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: 3 }),
        }
      );
      fetchJobs();
    } catch (error) {
      console.error('Error adding progress image:', error);
    }
  };

  const completeJob: JobsContextType['completeJob'] = async (jobId, imageUri, uploadedBy) => {
    // This requires image upload logic, which is not yet implemented.
    // For now, we will just update the job state.
    try {
      await fetch(`${BASE_URL}/api/jobs/${jobId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: 4 }),
        }
      );
      fetchJobs();
    } catch (error) {
      console.error('Error completing job:', error);
    }
  };

  const getJobsForSector = (sector: string) => jobs.filter(j => j.location.includes(sector));
  const getJobById = (jobId: number) => jobs.find(j => j.job_id === jobId);
  const completedCountForSector = (sector: string) => jobs.filter(j => j.location.includes(sector) && j.state === 4).length;

  const value: JobsContextType = useMemo(() => ({
    jobs,
    createJob,
    acceptJob,
    addProgressImage,
    completeJob,
    getJobsForSector,
    getJobById,
    completedCountForSector,
  }), [jobs]);

  return (
    <JobsContext.Provider value={value}>{children}</JobsContext.Provider>
  );
};

export const useJobs = (): JobsContextType => {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs must be used within JobsProvider');
  return ctx;
};


