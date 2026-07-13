import React, { memo } from 'react';
import { FlatList, FlatListProps } from 'react-native';

// Using a generic <T> so it perfectly inherits your data types
function OptimizedList<T>(props: FlatListProps<T>) {
  return (
    <FlatList
      {...props}
      removeClippedSubviews={true} // Unmount components when they scroll off-screen (Massive memory saver!)
      initialNumToRender={10}      // Only draw 10 items before showing the screen to the user
      maxToRenderPerBatch={5}      // Draw 5 items at a time while scrolling
      windowSize={5}               // Keep 2 screens above and 2 screens below mounted. The rest are destroyed.
      updateCellsBatchingPeriod={50} // Wait 50ms between drawing batches to keep JS thread unblocked
    />
  );
}

// Export it memoized so the list itself doesn't re-render needlessly!
export default memo(OptimizedList) as typeof OptimizedList;