import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export const options = {
  vus: 10,
  duration: '10s',
};

const messagesSent = new Counter('messages_sent');

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
  // k6에서는 String.fromCharCode(0)가 null 바이트를 더 정확하게 표현할 수 있음
  const a =  [
    'SEND',
    `destination:${destination}`,
    'content-type:application/json',
    `content-length:${body.length}`,
    '',
    body,
  ].join('\n') + String.fromCharCode(0);
  console.log(a)
  return a;
}

export default function () {
  const username = `user-${uuidv4().substring(0, 8)}`;
  const url = 'ws://host.docker.internal:8083/ws';
  const token = username;
  
  const res = ws.connect(url, {}, function (socket) {
    let intervalRef = null;
    
    socket.on('open', function () {
      console.log(`✅ 연결됨: ${username}`);
      socket.send(createStompConnectFrame(token));
    });
    
    socket.on('message', function (msg) {
      if (msg.includes('CONNECTED')) {
        const subId = uuidv4();
        socket.send(createStompSubscribeFrame('/topic/public', subId));
        
        // ✅ 1초마다 메시지 전송
        intervalRef = socket.setInterval(function () {
          console.log("send message")
          const message = {
            type: 'CHAT',
            roomId: 'test-room',
            sender: username,
            content: `k6 test message from ${username}`
          };
          socket.send(createStompSendFrame('/app/chat.sendMessage', JSON.stringify(message)));
          messagesSent.add(1);
        }, 1000);
      }
      
      if (msg.includes('MESSAGE')) {
        check(msg, {
          'MESSAGE 수신됨': (m) => m.includes('MESSAGE'),
        });
      }
    });
    
    socket.on('error', function (e) {
      console.error(`❌ WebSocket 오류: ${JSON.stringify(e)}`);
    });
    
    socket.on('close', function () {
      console.log(`🔌 연결 종료됨: ${username}`);
    });
    
    // duration 끝날 때까지 기다리기
    socket.setTimeout(() => {
      if (intervalRef) {
        socket.clearInterval(intervalRef);
      }
      socket.close();
    }, 12000); // duration과 맞춰줘야 함
  });
  
  check(res, {
    '🟢 상태 코드 101': (r) => r && r.status === 101,
  });
  
  sleep(1); // 빠른 종료 방지
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}