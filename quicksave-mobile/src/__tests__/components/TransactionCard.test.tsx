import React from 'react';
import { render } from '@testing-library/react-native';
import  TransactionCard  from '@/components/card/transaction-card';
import { Colors } from '@/theme/Colors';

describe('TransactionCard Component', () => {
  const mockFormatCurrency = jest.fn((val: number) => val.toString());

  it('1. renders a PAYOUT in Green with a (+) sign', () => {
    const payoutTx = { id: '1', type: 'PAYOUT', amount: 50000, description: 'Payout Received', createdAt: new Date().toISOString() };

    const { getByText } = render(
      <TransactionCard 
        tx={payoutTx} 
        theme={Colors.light} 
        isLast={false} 
        formatCurrency={mockFormatCurrency} 
        // colorScheme="light"
      />
    );

    const amountText = getByText('+₦50000');
    expect(amountText).toBeTruthy();
    
    // Check if the color is explicitly your Success Green
    expect(amountText.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#34C759' })])
    );
  });

  it('2. renders a WITHDRAWAL in Orange/Red with a (-) sign', () => {
    const withdrawTx = { id: '2', type: 'WITHDRAWAL', amount: 15000, description: 'Bank Transfer', createdAt: new Date().toISOString() };

    const { getByText } = render(
      <TransactionCard 
        tx={withdrawTx} 
        theme={Colors.light} 
        isLast={true} 
        formatCurrency={mockFormatCurrency} 
        // colorScheme="light"
      />
    );

    const amountText = getByText('-₦15000');
    expect(amountText).toBeTruthy();
    
    // Check if the color is explicitly your Danger Red
    expect(amountText.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#FF3B30' })])
    );
  });
});