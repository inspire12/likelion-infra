import ws from 'k6/ws';
import {check, sleep} from 'k6';
import {uuidv4} from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import {Counter} from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';


export const options = {
  vus: 5,
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
  const frame = [
    'SEND',
    `destination:${destination}`,
    'content-type:application/json',
    `content-length:${body.length}`,
    '',
    body  // 여긴 순수 body만
  ].join('\n') + '\x00';
  
  // ✅ 문자열을 바이너리로 변환해서 보내야 정확하게 전달됨
  const encoder = new TextEncoder();
  return encoder.encode(frame); // Uint8Array (binary)
}

const messagesSent = new Counter('messages_sent');

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

export function handleSummary(data) {
  return {
    stdout: textSummary(data, {indent: ' ', enableColors: true})
    // messages_sent: data.metrics?.messages_sent?.values.count || 0,
  };
}