import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchGroupDetails } from '../store/slices/groupSlice';

export function useAjoGroup(groupId: string) {
  const dispatch = useAppDispatch();
  const { currentGroup, currentTimeline, isDetailLoading, error } = useAppSelector(
    (state) => state.groups,
  );

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroupDetails(groupId));
    }
  }, [groupId, dispatch]);

  return {
    group: currentGroup,
    timeline: currentTimeline,
    isLoading: isDetailLoading,
    error,
    refresh: () => dispatch(fetchGroupDetails(groupId)), // Expose a manual refresh trigger!
  };
}
