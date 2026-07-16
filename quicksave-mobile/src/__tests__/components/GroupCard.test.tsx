import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GroupCard } from '@/components/card/group-card'; 
import { Colors } from '@/theme/Colors';

describe('GroupCard Component', () => {
  const mockGroup = {
    id: 'group-123',
    title: 'Lagos Techies',
    subtitle: 'Weekly Contribution',
    progress: 75,
    nextDate: 'Oct 24, 2026',
    membersCount: 5,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. renders all group data correctly', () => {
    const { getByText } = render(<GroupCard {...mockGroup} />);

    // Assert that the UI renders the exact strings passed via props
    expect(getByText('Lagos Techies')).toBeTruthy();
    expect(getByText('Weekly Contribution')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy();
    expect(getByText('+5')).toBeTruthy(); // Members count badge
  });

  it('2. navigates to the dynamic Group Detail screen when clicked', () => {
    const router = useRouter(); // Gets the mocked router
    const { getByText } = render(<GroupCard {...mockGroup} />);

    const detailsButton = getByText('View Details');
    fireEvent.press(detailsButton); // Simulate user tap!

    // Assert the router was called with the exact right URL
    expect(router.push).toHaveBeenCalledWith('/groups/group-123');
  });

  it('3. dynamically applies Dark Mode styling', () => {
    // ⭐️  Force the OS into Dark Mode for this specific test
    (useColorScheme as jest.Mock).mockReturnValue('dark');

    const { getByTestId } = render(<GroupCard {...mockGroup} testID="group-card-container" />);
    const cardContainer = getByTestId('group-card-container');

    // Assert the background color swapped to your deep dark hex code!
    expect(cardContainer.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: Colors.dark.inputBg })
      ])
    );
  });
});