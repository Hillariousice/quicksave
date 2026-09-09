import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { setSocketConnection } from '@/store/slices/socketSlice';
import { fetchWalletData } from '@/store/slices/walletSlice';

// If you have an addActivity action in groupSlice or notificationSlice, import it here!

class SocketService {
  private socket: Socket | null = null;

  // Initialize the connection
  public async connect(dispatch: any) {
    if (this.socket?.connected) return; // Prevent duplicate connections

    const token = await SecureStore.getItemAsync('accessToken');
    
    // Extract the base URL (Remove '/api/v1' from the end of your EXPO_PUBLIC_API_URL)
    const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://192.168.1.15:5000';

    this.socket = io(baseUrl, {
      auth: { token }, // MOVE: Secure your sockets!
      transports: ['websocket'], // Force websockets for performance
    });

    // --- CONNECTION LISTENERS ---
    this.socket.on('connect', () => {
      console.log('🟢 Socket connected:', this.socket?.id);
      dispatch(setSocketConnection(true));
    });

    this.socket.on('disconnect', () => {
      console.log('🔴 Socket disconnected');
      dispatch(setSocketConnection(false));
    });

    // --- DOMAIN EVENT LISTENERS ---
    // Listen for new activity (From Day 19 Backend)
    this.socket.on('newActivity', (log) => {
      console.log('📥 New Activity Received:', log);
      // In a full app, you'd dispatch this to Redux to update the specific group's timeline!
    });

    // Listen for Payouts or Wallet Updates
    // this.socket.on('walletUpdated', () => {
    //   console.log('💰 Wallet updated! Fetching fresh data...');
    //   dispatch(fetchWalletData()); // Instantly updates the user's balance!
    // });
    this.socket.on('walletUpdated', () => {
      console.log('💰 Wallet updated! Syncing global Redux state...');
      dispatch(fetchWalletData()); 
    });
    
  }
   // 👉 NEW METHODS FOR THE TOAST UI
  public onPayoutReceived(callback: (data: any) => void) {
    if (this.socket) this.socket.on('payoutReceived', callback);
  }

  public offPayoutReceived(callback: (data: any) => void) {
    if (this.socket) this.socket.off('payoutReceived', callback);
  }

  // Join a specific group room (Call this when a user opens a Group Detail screen)
  public joinGroupRoom(groupId: string) {
    if (this.socket?.connected) {
      this.socket.emit('joinGroup', groupId);
    }
  }

  // Disconnect (Call this when the user logs out)
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

   public joinGroupScreen(groupId: string) {
    if (this.socket?.connected) {
      this.socket.emit('joinGroupScreen', groupId);
    }
  }

  // 👉 Leave the active screen room (Cleanup)
  public leaveGroupScreen(groupId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leaveGroupScreen', groupId);
    }
  }

   // Listen for live activity on the active screen
    public onScreenActivity(callback: (activity: any) => void) {
    if (this.socket) {
      this.socket.on('newScreenActivity', callback);
    }
  }

  // 👉 Remove the listener to prevent memory leaks when the screen closes
  public offScreenActivity(callback: (activity: any) => void) {
    if (this.socket) {
      this.socket.off('newScreenActivity', callback);
    }
  }

  public onMemberJoined(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('member:joined', callback);
    }
  }
   public offMemberJoined(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('member:joined', callback);
    }
  }

   public onNewTransaction(callback: (tx: any) => void) {
    if (this.socket) {
      this.socket.on('newTransaction', callback);
    }
  }

  public offNewTransaction(callback: (tx: any) => void) {
    if (this.socket) {
      this.socket.off('newTransaction', callback);
    }
  }
}


export const socketService = new SocketService();