const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');
const WebSocket = require('ws'); // WebSocket 모듈 로드

const app = express();
app.use(bodyParser.json());
app.use(cors()); // CORS 미들웨어 추가

// 정적 파일 제공 설정
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('counts.db');

// 테이블 생성
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS counts (id INTEGER PRIMARY KEY, grade TEXT, class TEXT, count INTEGER)", (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Table created or already exists.');
        }
    });
    const grades = {
        "1학년": 5,
        "2학년": 5,
        "3학년": 5,
        "4학년": 4,
        "5학년": 6,
        "6학년": 6
    };

    const stmt = db.prepare("INSERT INTO counts (grade, class, count) VALUES (?, ?, ?)");
    for (const [grade, classCount] of Object.entries(grades)) {
        for (let i = 1; i <= classCount; i++) {
            stmt.run(grade, `${i}반`, 0, (err) => {
                if (err) {
                    console.error('Error inserting data:', err.message);
                } else {
                    console.log(`Inserted ${grade} ${i}반 with count 0`);
                }
            });
        }
    }
    stmt.finalize();
});

// 클릭 수 조회
app.get('/counts', (req, res) => {
    db.all("SELECT * FROM counts", (err, rows) => {
        if (err) {
            console.error('Error retrieving counts:', err.message);
            res.status(500).send(err.message);
        } else {
            console.log('Retrieved counts:', rows);
            res.json(rows);
        }
    });
});

// 클릭 수 증가
app.post('/increment', (req, res) => {
    const { grade, className } = req.body;
    db.run("UPDATE counts SET count = count + 1 WHERE grade = ? AND class = ?", [grade, className], function(err) {
        if (err) {
            console.error('Error updating count:', err.message);
            res.status(500).send(err.message);
        } else {
            console.log(`Updated count for ${grade} ${className}`);
            db.get("SELECT * FROM counts WHERE grade = ? AND class = ?", [grade, className], (err, row) => {
                if (err) {
                    console.error('Error retrieving updated count:', err.message);
                    res.status(500).send(err.message);
                } else {
                    console.log('Retrieved updated count:', row);
                    res.json(row);
                }
            });
        }
    });
});

// HTTP 서버와 WebSocket 서버 생성
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 모든 클라이언트에게 점수 전송
function broadcastCounts() {
    db.all("SELECT * FROM counts", (err, rows) => {
        if (err) {
            console.error('Failed to retrieve counts:', err.message);
            return;
        }
        const data = JSON.stringify(rows);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });
}

// 30초마다 모든 클라이언트에게 점수 전송
setInterval(broadcastCounts, 30000);

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
