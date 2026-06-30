import { api } from '../client';
import { ApiResponse } from '../types';

export const GroupService = {
  getMyGroups: async () => {
    const res = await api.get<ApiResponse>('/groups');
    return res.data.data;
  },

  getGroupById: async (id: string) => {
    const res = await api.get<ApiResponse>(`/groups/${id}`);
    return res.data.data;
  },

  createGroup: async (groupData: any) => {
    const res = await api.post<ApiResponse>('/groups', groupData);
    return res.data.data;
  },

  joinGroup: async (inviteCode: string) => {
    const res = await api.post<ApiResponse>('/groups/join', { inviteCode });
    return res.data.data;
  },

  getRotationTimeline: async (groupId: string) => {
    const res = await api.get<ApiResponse>(`/groups/${groupId}/rotation`);
    return res.data.data;
  },

  getActivityFeed: async (groupId: string) => {
    const res = await api.get<ApiResponse>(`/groups/${groupId}/activity`);
    return res.data.data;
  },

  searchUsers: async (query: string) => {
    const res = await api.get<ApiResponse>(`/groups/users/search?q=${query}`);
    return res.data.data;
  },

  inviteMembers: async (groupId: string, userIds: string[]) => {
    const res = await api.post<ApiResponse>(`/groups/${groupId}/invites`, { userIds });
    return res.data;
  },
  
  makeContribution: async (groupId: string) => {
    const res = await api.post<ApiResponse>(`/groups/${groupId}/contributions`);
    return res.data.data;
  },
  updateGroupStatus: async (groupId: string, status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED') => {
    const res = await api.patch<ApiResponse>(`/groups/${groupId}/status`, { status });
    return res.data.data;
  },
};