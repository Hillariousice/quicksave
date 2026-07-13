import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import Client, { Socket as ClientSocket } from 'socket.io-client';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { initSocket } from '../../config/socket';

describe('Real-Time Sockets & Race Conditions', () => {
  let ioServer: any;
  let httpServer: any;
  let clientSocketA: ClientSocket;
  let port: number;

  beforeAll((done) => {
    // 1. Spin up a real HTTP + Socket server on a random port (port 0)
    httpServer = createServer(app);
    ioServer = initSocket(httpServer);
    
    httpServer.listen(0, () => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll((done) => {
    clientSocketA.disconnect();
    ioServer.close();
    httpServer.close(done);
  });

  it('1. should connect to sockets and receive real-time broadcasts', (done) => {
    // Generate a valid JWT for the socket connection
    const testToken = jwt.sign({ id: 'test-user-id' }, env.JWT_SECRET);

    clientSocketA = Client(`http://localhost:${port}`, { 
      auth: { token: testToken },
      transports: ['websocket']
    });

    clientSocketA.on('connect', () => {
      clientSocketA.emit('joinGroupScreen', 'test-group-id');

      // Test if the client receives the broadcast
      clientSocketA.on('member:joined', (data) => {
        expect(data.groupName).toBe('Concurrency Testers');
        done();
      });

      // Manually trigger the broadcast from the server
      setTimeout(() => {
        ioServer.to('test-group-id').emit('member:joined', { groupName: 'Concurrency Testers' });
      }, 50);
    });
  });

  it('2. should prevent race conditions when 5 users join a group with 2 slots', async () => {
    // 1. Setup: Create 5 fake users
    const users = await Promise.all(
      [1, 2, 3, 4, 5].map(n => 
        prisma.user.create({ data: { email: `test${n}@ajo.com`, phone: `080${n}`, firstName: 'T', lastName: 'T', passwordHash: 'hash' } })
      )
    );

    // 2. Setup: Create a group with maxCapacity = 2
    const group = await prisma.group.create({
      data: {
        name: 'Race Condition Test',
        contributionAmount: 1000,
        maxCapacity: 2,
        inviteCode: 'RACE1234',
        creatorId: users[0].id,
      }
    });

    // 3. Generate tokens for the 5 users
    const tokens = users.map(u => jwt.sign({ id: u.id }, env.JWT_SECRET));

    // 4. Fire 5 requests at the EXACT SAME MILLISECOND
    const responses = await Promise.all(
      tokens.map(token => 
        request(app)
          .post('/api/v1/groups/join')
          .set('Authorization', `Bearer ${token}`)
          .send({ inviteCode: 'RACE1234' })
      )
    );

    // 5. Evaluate the results
    const successCount = responses.filter(r => r.status === 200).length;
    const failCount = responses.filter(r => r.status === 403).length;

    // Because we used `FOR UPDATE` locking, EXACTLY 2 must succeed, and 3 MUST fail!
    expect(successCount).toBe(2);
    expect(failCount).toBe(3);

    // Verify database integrity
    const finalGroup = await prisma.group.findUnique({ where: { id: group.id }, include: { members: true } });
    expect(finalGroup?.members.length).toBe(2);
  });
});