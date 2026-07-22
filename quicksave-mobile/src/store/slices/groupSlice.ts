import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/api/client';
import { GroupService } from '@/api/services/group.service';

export const fetchMyGroups = createAsyncThunk(
  'groups/fetchMyGroups',
  async (_, { rejectWithValue }) => {
    try {
      const groups = await GroupService.getMyGroups();
      return groups;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch groups');
    }
  },
);

export const fetchGroupDetails = createAsyncThunk(
  'groups/fetchDetails',
  async (groupId: string, { rejectWithValue }) => {
    try {
      const [group, timeline] = await Promise.all([
        GroupService.getGroupById(groupId),
        GroupService.getRotationTimeline(groupId),
      ]);
      return { group, timeline };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch group details');
    }
  },
);

export const fetchGroupActivity = createAsyncThunk(
  'groups/fetchActivity',
  async (groupId: string, { rejectWithValue }) => {
    try {
      return await GroupService.getActivityFeed(groupId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch activity');
    }
  },
);

export const joinGroupThunk = createAsyncThunk(
  'groups/join',
  async (inviteCode: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await GroupService.joinGroup(inviteCode);

      // 👉 FIX: Invalidate cache so the new group instantly appears on the Dashboard!
      dispatch(fetchMyGroups());

      return response;
    } catch (error: any) {
      // 👉 FIX: Always extract the exact message from your backend's AppError!
      const message = error.response?.data?.message || error.message || 'Failed to join group';
      return rejectWithValue(message);
    }
  },
);
export const updateStatusThunk = createAsyncThunk(
  'groups/updateStatus',
  async ({ groupId, status }: { groupId: string; status: any }, { rejectWithValue }) => {
    try {
      const updatedGroup = await GroupService.updateGroupStatus(groupId, status);
      return updatedGroup;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  },
);

const groupSlice = createSlice({
  name: 'groups',
  initialState: {
    activeGroups: [] as any[],
    completedGroups: [] as any[],
    currentGroup: null as any,
    currentTimeline: [] as any[], // Fix: Change null to []
    currentActivity: [] as any[], // Fix: Change null to []
    isLoading: false,
    isDetailLoading: false,
    error: null as string | null,
  },
  reducers: {
    // 👉 NEW: Real-time UI update!
    memberJoinedRealtime: (state, action) => {
      const { groupId, member } = action.payload;

      // 1. If they are looking at this specific group, increase the member count!
      if (state.currentGroup && state.currentGroup.id === groupId) {
        state.currentGroup.membersCount = (state.currentGroup.membersCount || 0) + 1;
        // Optionally push the member to the list of avatars
        if (!state.currentGroup.members) state.currentGroup.members = [];
        state.currentGroup.members.push({ user: member });
      }

      // 2. Update the "My Groups" list if it exists there
      const groupInList = state.activeGroups.find((g) => g.id === groupId);
      if (groupInList) {
        groupInList.membersCount = (groupInList.membersCount || 0) + 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Groups
      .addCase(fetchMyGroups.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeGroups = action.payload.filter(
          (g: any) => g.status === 'ACTIVE' || g.status === 'PENDING',
        );
        state.completedGroups = action.payload.filter((g: any) => g.status === 'COMPLETED');
      })
      .addCase(fetchMyGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Specific Group Details
      .addCase(fetchGroupDetails.pending, (state) => {
        state.isDetailLoading = true;
      })
      .addCase(fetchGroupDetails.fulfilled, (state, action) => {
        state.isDetailLoading = false;
        state.currentGroup = action.payload.group;
        state.currentTimeline = action.payload.timeline;
      })
      .addCase(fetchGroupDetails.rejected, (state, action) => {
        state.isDetailLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchGroupActivity.fulfilled, (state, action) => {
        state.currentActivity = action.payload;
      })
      .addCase(updateStatusThunk.fulfilled, (state, action) => {
        // Update the status of the current group in state
        if (state.currentGroup && state.currentGroup.id === action.payload.id) {
          state.currentGroup.status = action.payload.status;
        }
        // Also update it in the activeGroups list
        state.activeGroups = state.activeGroups.map((g: any) =>
          g.id === action.payload.id ? { ...g, status: action.payload.status } : g,
        );
      });
  },
});

export const { memberJoinedRealtime } = groupSlice.actions;
export default groupSlice.reducer;
