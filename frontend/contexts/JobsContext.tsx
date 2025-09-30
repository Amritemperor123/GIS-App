import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('jobs');
        if (raw) setJobs(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const persist = async (next: Job[]) => {
    setJobs(next);
    try { await AsyncStorage.setItem('jobs', JSON.stringify(next)); } catch {}
  };

  const createJob: JobsContextType['createJob'] = (input) => {
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
    const next = [job, ...jobs];
    persist(next);
    return job;
  };

  const acceptJob: JobsContextType['acceptJob'] = (jobId, providerId) => {
    const next = jobs.map(j => j.id === jobId ? { ...j, assignedProviderId: providerId, status: 'accepted', updatedAt: new Date().toISOString() } : j);
    persist(next);
  };

  const addProgressImage: JobsContextType['addProgressImage'] = (jobId, imageUri, uploadedBy) => {
    const now = new Date().toISOString();
    const next = jobs.map(j => {
      if (j.id !== jobId) return j;
      const newStatus: JobStatus = j.status === 'new' ? 'accepted' : (j.status === 'accepted' ? 'in_progress' : j.status);
      return { ...j, status: newStatus, images: [...j.images, { uri: imageUri, uploadedAt: now, uploadedBy }], updatedAt: now };
    });
    persist(next);
  };

  const completeJob: JobsContextType['completeJob'] = (jobId, imageUri, uploadedBy) => {
    const now = new Date().toISOString();
    const next = jobs.map(j => j.id === jobId ? { ...j, status: 'completed', images: [...j.images, { uri: imageUri, uploadedAt: now, uploadedBy }], updatedAt: now } : j);
    persist(next);
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


