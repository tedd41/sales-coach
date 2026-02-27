import axios from "axios";
import type {
  SalesRep,
  RepDetails,
  Update,
  Feedback,
  Insights,
  CoachingStrategy,
  DashboardData,
} from "../types";

const API_BASE = "/api/v1";

export const api = {
  // Dashboard
  getDashboard: async (): Promise<DashboardData> => {
    const { data } = await axios.get(`${API_BASE}/dashboard`);
    return data.data;
  },

  // Reps
  getReps: async (): Promise<SalesRep[]> => {
    const { data } = await axios.get(`${API_BASE}/reps`);
    return data.data;
  },

  getRepById: async (id: string): Promise<RepDetails> => {
    const { data } = await axios.get(`${API_BASE}/reps/${id}`);
    return data.data;
  },

  getRepUpdates: async (id: string): Promise<Update[]> => {
    const { data } = await axios.get(`${API_BASE}/reps/${id}/updates`);
    return data.data;
  },

  getRepFeedback: async (id: string): Promise<Feedback[]> => {
    const { data } = await axios.get(`${API_BASE}/reps/${id}/feedback`);
    return data.data;
  },

  // Intelligence
  generateInsights: async (repId: string): Promise<Insights> => {
    const { data } = await axios.post(`${API_BASE}/intelligence/insights`, {
      repId,
    });
    return data.data;
  },

  generateStrategy: async (repId: string): Promise<CoachingStrategy> => {
    const { data } = await axios.post(`${API_BASE}/intelligence/strategy`, {
      repId,
    });
    return data.data;
  },

  generateDraft: async (
    repId: string,
    latestUpdate?: string,
  ): Promise<{ message: string }> => {
    const { data } = await axios.post(`${API_BASE}/intelligence/draft`, {
      repId,
      latestUpdate,
    });
    return data.data;
  },

  // Save Feedback
  saveFeedback: async (
    repId: string,
    content: string,
    category?: string,
  ): Promise<Feedback> => {
    const { data } = await axios.post(`${API_BASE}/reps/feedback`, {
      repId,
      content,
      category,
    });
    return data.data;
  },
};
