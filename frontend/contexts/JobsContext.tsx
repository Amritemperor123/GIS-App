import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../utils/api';

export type JobStatus = 'new' | 'accepted' | 'in_progress' | 'completed';

export interface JobImage {
  uri: string;
  uploadedAt: string; // ISO string
  uploadedBy: string; // user name
}

export interface Job {
  id: string;
  sector: string;
  location: { latitude: number; longitude: number };
  createdBy: string;
  assignedProviderId?: string;
  status: JobStatus;
  images: JobImage[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

interface JobsContextType {
  jobs: Job[];
  createJob: (input: { sector: string; location: { latitude: number; longitude: number }; imageUri: string; createdBy: string; }) => Job;
  acceptJob: (jobId: string, providerId: string) => void;
  addProgressImage: (jobId: string, imageUri: string, uploadedBy: string) => void;
  completeJob: (jobId: string, imageUri: string, uploadedBy: string) => void;
  getJobsForSector: (sector: string) => Job[];
  getJobById: (jobId: string) => Job | undefined;
  completedCountForSector: (sector: string) => number;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export const JobsProvider = ({ children }: { children: ReactNode }) => {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/images`);
        const data = await response.json();
        if (data.success) {
          // The backend returns 'image' as base64, but the frontend expects a URI.
          // For now, we'll prepend the base64 string with the necessary prefix to make it a data URI.
          const formattedJobs = data.images.map((job: any) => ({
            id: job.imageId.toString(),
            sector: '', // The /api/images endpoint doesn't return sector, so we leave it empty
            location: JSON.parse(job.location),
            createdBy: '', // The /api/images endpoint doesn't return createdBy, so we leave it empty
            status: 'new', // The /api/images endpoint doesn't return status, so we set it to 'new'
            images: [{ uri: `data:image/jpeg;base64,${job.image}`, uploadedAt: job.createdAt, uploadedBy: '' }],
            createdAt: job.createdAt,
            updatedAt: job.createdAt,
          }));
          setJobs(formattedJobs);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };

    fetchJobs();
  }, []);

  const createJob: JobsContextType['createJob'] = (input) => {
    // This function is now only responsible for creating the job in the frontend state.
    // The backend is responsible for persisting the job.
    // A refetch of the jobs will happen automatically after the upload in index.tsx.
    const now = new Date().toISOString();
    const job: Job = {
      id: Date.now().toString(),
      sector: input.sector,
      location: input.location,
      createdBy: input.createdBy,
      status: 'new',
      images: [{ uri: input.imageUri, uploadedAt: now, uploadedBy: input.createdBy }],
      createdAt: now,
      updatedAt: now,
    };
    setJobs([job, ...jobs]);
    return job;
  };

  // TODO: Implement backend integration for these functions
  const acceptJob: JobsContextType['acceptJob'] = (jobId, providerId) => {
    const next = jobs.map(j => j.id === jobId ? { ...j, assignedProviderId: providerId, status: 'accepted', updatedAt: new Date().toISOString() } : j);
    setJobs(next);
  };

  const addProgressImage: JobsContextType['addProgressImage'] = (jobId, imageUri, uploadedBy) => {
    const now = new Date().toISOString();
    const next = jobs.map(j => {
      if (j.id !== jobId) return j;
      const newStatus: JobStatus = j.status === 'new' ? 'accepted' : (j.status === 'accepted' ? 'in_progress' : j.status);
      return { ...j, status: newStatus, images: [...j.images, { uri: imageUri, uploadedAt: now, uploadedBy }], updatedAt: now };
    });
    setJobs(next);
  };

  const completeJob: JobsContextType['completeJob'] = (jobId, imageUri, uploadedBy) => {
    const now = new Date().toISOString();
    const next = jobs.map(j => j.id === jobId ? { ...j, status: 'completed', images: [...j.images, { uri: imageUri, uploadedAt: now, uploadedBy }], updatedAt: now } : j);
    setJobs(next);
  };

  const getJobsForSector = (sector: string) => jobs.filter(j => j.sector === sector);
  const getJobById = (jobId: string) => jobs.find(j => j.id === jobId);
  const completedCountForSector = (sector: string) => jobs.filter(j => j.sector === sector && j.status === 'completed').length;

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


