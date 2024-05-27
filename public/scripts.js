const grades = {
    "1학년": 5,
    "2학년": 5,
    "3학년": 5,
    "4학년": 4,
    "5학년": 6,
    "6학년": 6
};

let counts = {};
let selectedGrade = "";
let selectedClass = "";
let topScore = 0;

async function fetchCounts() {
    const response = await fetch('http://localhost:3000/counts');
    const data = await response.json();
    for (const row of data) {
        if (!counts[row.grade]) {
            counts[row.grade] = {};
        }
        counts[row.grade][`${row.class}`] = row.count;

        // 최고 점수를 업데이트합니다.
        if (row.count > topScore) {
            topScore = row.count;
            document.getElementById('top-score-value').innerText = topScore;
        }
    }
}

function loadClasses() {
    selectedGrade = document.getElementById('grade-select').value;
    if (selectedGrade) {
        const classCount = grades[selectedGrade];
        const classContainer = document.getElementById('class-container');
        classContainer.innerHTML = '';
        for (let i = 1; i <= classCount; i++) {
            const classDiv = document.createElement('div');
            classDiv.innerText = `${i}반`;
            classDiv.onclick = () => selectClass(i);
            classContainer.appendChild(classDiv);
        }
    }
}

function selectClass(classNum) {
    selectedClass = `${classNum}반`;
    document.getElementById('selected-info').innerText = `${selectedGrade} ${selectedClass}`;

    // 만약 해당 학년과 반에 대한 클릭 수가 없을 경우에 대비하여 기본값을 설정합니다.
    const clickCount = counts[selectedGrade] && counts[selectedGrade][selectedClass] ? counts[selectedGrade][selectedClass] : 0;
    document.getElementById('count').innerText = clickCount;
    document.getElementById('selected-score-value').innerText = clickCount;
    document.getElementById('selected-class-name').innerText = `${selectedGrade} ${selectedClass}`;

    document.getElementById('click-container').style.display = 'block';
    document.getElementById('score-bar').style.display = 'none'; // score-bar를 숨기도록 변경
    document.getElementById('class-selection').style.display = 'none';
}

async function incrementCount() {
    const response = await fetch('http://localhost:3000/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: selectedGrade, className: selectedClass })
    });
    const result = await response.json();
    counts[selectedGrade][selectedClass] = result.count;
    document.getElementById('count').innerText = counts[selectedGrade][selectedClass];
    document.getElementById('selected-score-value').innerText = counts[selectedGrade][selectedClass];

    // 최고 점수를 업데이트합니다.
    if (counts[selectedGrade][selectedClass] > topScore) {
        topScore = counts[selectedGrade][selectedClass];
        document.getElementById('top-score-value').innerText = topScore;
    }
}

function toggleScoreDetails() {
    const scoreDetails = document.getElementById('score-details');
    const allScores = document.getElementById('all-scores');
    const scoreBar = document.getElementById('score-bar');

    if (scoreDetails.style.display === 'none') {
        // 모든 반의 점수를 표시합니다.
        allScores.innerHTML = '';
        for (const grade in counts) {
            for (const className in counts[grade]) {
                const scoreDiv = document.createElement('div');
                scoreDiv.innerText = `${grade} ${className}: ${counts[grade][className]}점`;
                allScores.appendChild(scoreDiv);
            }
        }
        scoreDetails.style.display = 'block';
        scoreBar.style.display = 'none'; // score-bar를 숨기도록 변경
    } else {
        scoreDetails.style.display = 'none';
        scoreBar.style.display = 'flex'; // score-bar를 보이도록 설정
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchCounts();
});
