import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ActionBtn from '@/components/home/action-btn';
import { Colors } from '@/theme/Colors';

describe('ActionBtn Component', () => {
  it('fires the onPress callback when tapped', () => {
    const mockOnPress = jest.fn(); // Create a spy function

    const { getByText } = render(
      <ActionBtn 
        icon="arrow-up" 
        label="Contribute" 
        theme={Colors.light} 
        onPress={mockOnPress} 
      />
    );

    // Find the button by its label and tap it
    const button = getByText('Contribute');
    fireEvent.press(button);

    // Verify the spy was called exactly once!
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});