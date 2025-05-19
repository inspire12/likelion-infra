import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { Counter } from 'k6/metrics';

export const options = {
  vus: 10000,
  duration: '10s',
};

function createStompConnectFrame(token) {
  return [
    'CONNECT',
    'accept-version:1.2',
    'heart-beat:10000,10000',
    `Authorization:Bearer ${token}`,
    '',
    '\x00'
  ].join('\n');
}

function createStompSubscribeFrame(destination, id) {
  return [
    'SUBSCRIBE',
    `id:${id}`,
    `destination:${destination}`,
    '',
    '\x00'
  ].join('\n');
}

function createStompSendFrame(destination, body) {
  return [
    'SEND',
    `destination:${destination}`,
    'content-type:application/json',
    `content-length:${body.length}`,
    '',
    `${body}\x00`
  ].join('\n');
}

export default function () {
  const username = `user-${uuidv4().substring(0, 8)}`;
  const url = 'ws://host.docker.internal:8083/ws';
  const token = username; // 실제로는 JWT를 넣어야 함
  
  const res = ws.connect(url, {}, function (socket) {
    console.log('connect')
    socket.on('open', function () {
      console.log(`✅ WebSocket 연결됨: ${username}`);
      socket.send(createStompConnectFrame(token));
    });
    
    socket.on('message', function (msg) {
      console.log(`📩 수신 메시지: ${msg.substring(0, 80)}...`);
      
      if (msg.includes('CONNECTED')) {
        
        const subId = uuidv4();
        socket.send(createStompSubscribeFrame('/topic/public', subId));
        
        socket.setTimeout(function () {
          const message = {
            type: 'CHAT',
            roomId: 'test-room',
            sender: username,
            content: `k6 test message from ${username}`
          };
          socket.send(createStompSendFrame('/app/chat.sendMessage', JSON.stringify(message)));
        }, 1000);
      }
      
      if (msg.includes('MESSAGE')) {
        check(msg, {
          'MESSAGE 수신됨': (m) => m.includes('MESSAGE'),
        });
      }
    });
    
    socket.on('error', function (e) {
      console.error(`❌ WebSocket 오류: ${e.error}`);
    });
    
    socket.on('close', function () {
      console.log(`🔌 연결 종료: ${username}`);
    });
    
    socket.setTimeout(() => socket.close(), 10000);
  });
  
  console.log(JSON.stringify(res))
  
  check(res, {
    '🟢 상태 코드 101': (r) => r && r.status === 101,
  });
  
  sleep(1);
}
