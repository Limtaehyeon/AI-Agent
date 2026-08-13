# 🏭 Aegis Factory

> **생성형 AI와 실시간 데이터를 활용한 스마트팩토리 운영 지원 웹 서비스**

Aegis Factory는 제조 현장에서 발생하는 **에너지 사용량과 작업자 안전 데이터를 실시간으로 모니터링**하고,  
AI Agent가 상황을 분석하여 필요한 대응을 지원하는 웹 기반 스마트팩토리 서비스입니다.

**Google Cloud AI Agent Challenge 대상 수상 프로젝트**로,  
서비스 기획부터 UI/UX 설계, 프론트엔드 개발, 백엔드 및 AI Agent 연동까지 직접 구현했습니다.

<br>

## 🏆 Achievement

### Google Cloud AI Agent Challenge 대상

- 개인 프로젝트로 기획 및 개발
- 생성형 AI와 제조 현장의 에너지·안전 관리 문제를 결합
- AI Agent의 분석 결과를 실제 웹 인터페이스와 연결
- 실시간 모니터링 및 사용자 중심 Dashboard 구현

<br>

## 💡 Project Overview

제조 현장에서는 에너지 사용량, 작업자 안전 상태, 설비 정보 등 다양한 데이터가 지속적으로 발생합니다.

하지만 운영자가 여러 데이터를 각각 확인하고 직접 상황을 판단해야 한다면 빠른 대응이 어렵습니다.

Aegis Factory는 이러한 문제를 해결하기 위해 **AI Agent가 현장 데이터를 분석하고 상황을 판단하여 필요한 정보를 사용자에게 제공하는 것**을 목표로 개발했습니다.

단순한 생성형 AI API 호출이 아니라 다음과 같은 Agent 구조를 기반으로 설계했습니다.

```text
Perceive → Reason → Act → Evaluate
```

AI가 데이터를 인식하고 상황을 판단한 뒤 필요한 행동을 수행하고, 그 결과를 다시 평가하는 구조입니다.

<br>

## ✨ Key Features

### 1. 📊 Real-time Factory Dashboard

공장 내 **4개 구역의 운영 상태를 하나의 Dashboard에서 확인**할 수 있도록 구현했습니다.

- 구역별 센서 데이터 확인
- 에너지 사용량 모니터링
- 작업자 안전 상태 확인
- 주요 운영 지표 시각화
- 상태 변화에 따른 동적 UI 업데이트

여러 데이터를 단순히 나열하기보다 사용자가 현재 공장의 상태를 빠르게 파악할 수 있도록 정보의 중요도를 고려하여 UI를 구성했습니다.

<br>

### 2. ⚡ AI 기반 에너지 관리

공장 내부의 에너지 데이터를 AI Agent가 분석하여 운영자가 효율적인 의사결정을 할 수 있도록 구현했습니다.

- 구역별 에너지 사용량 분석
- 에너지 절감 방안 제안
- 센서 데이터 기반 운영 상태 분석
- 절감 결과 및 주요 지표 시각화

AI의 분석 결과가 단순한 텍스트 응답으로 끝나지 않고 **웹 서비스의 데이터 및 UI와 연결되도록 구현**했습니다.

<br>

### 3. 🦺 작업자 안전 모니터링

현장 데이터를 기반으로 작업자의 안전 상태를 확인하고 위험 수준에 따라 대응할 수 있도록 구현했습니다.

```text
Level 1 → Level 2 → Level 3
```

주요 기능은 다음과 같습니다.

- 안전모 착용 여부 확인
- 작업 구역 과밀 상태 감지
- 위험 수준 분류
- 위험 상황 발생 시 대응 정보 제공
- 현장 방송 기능 연계

객체 탐지 모델은 약 **1,200장의 데이터**를 활용했으며, 프로젝트 테스트 환경에서 **mAP@0.5 92.3%**의 성능을 기록했습니다.

<br>

### 4. 🤖 AI Agent

Aegis Factory의 핵심 AI Agent는 다음 구조를 기반으로 동작합니다.

```text
┌─────────────┐
│   Perceive  │
│ 데이터 인식 │
└──────┬──────┘
       ↓
┌─────────────┐
│   Reason    │
│ 상황 판단   │
└──────┬──────┘
       ↓
┌─────────────┐
│     Act     │
│ 행동 수행   │
└──────┬──────┘
       ↓
┌─────────────┐
│  Evaluate   │
│ 결과 평가   │
└─────────────┘
```

#### Perceive
센서 데이터와 공장 상태 정보를 수집합니다.

#### Reason
수집된 데이터를 기반으로 현재 상황과 위험 요소를 분석합니다.

#### Act
분석 결과에 따라 에너지 절감 방안 제안, 안전 경고, 운영 정보 제공 등의 작업을 수행합니다.

#### Evaluate
수행 결과와 변경된 데이터를 다시 확인하여 이후 판단에 반영합니다.

이를 통해 단순한 LLM API 호출이 아닌 **상태를 인식하고 판단하여 행동하는 Agent 구조**를 구현했습니다.

<br>

### 5. 📝 Shift Report 자동 생성

공장 운영 데이터를 기반으로 **Shift Report를 자동 생성**하도록 구현했습니다.

Report에는 다음과 같은 정보가 포함됩니다.

- 에너지 사용 현황
- 안전 이벤트
- 주요 운영 상태
- 위험 발생 내역
- 대응 및 조치 결과

반복적인 보고서 작성 업무를 줄이고 운영자가 중요한 의사결정에 집중할 수 있도록 설계했습니다.

<br>

### 6. 💬 자연어 기반 데이터 조회

사용자가 복잡한 데이터 조회 방법을 알지 못해도 자연어를 통해 필요한 공장 정보를 확인할 수 있도록 구현했습니다.

예를 들어,

```text
오늘 에너지 사용량이 가장 높은 구역은 어디야?
```

```text
현재 안전 위험이 발생한 구역을 알려줘.
```

와 같은 질문을 통해 필요한 정보를 조회하고 결과를 확인할 수 있도록 구성했습니다.

<br>

## 🖥️ Frontend

Aegis Factory의 프론트엔드는 **React + Vite**를 기반으로 개발했습니다.

AI 기능을 단순히 API 형태로 제공하는 것이 아니라 사용자가 AI의 분석 결과와 공장 상태를 직관적으로 확인할 수 있는 웹 인터페이스를 만드는 데 집중했습니다.

### 주요 구현 내용

- React 기반 컴포넌트 UI 구현
- 공장 운영 Dashboard 개발
- 센서 및 상태 데이터 시각화
- 사용자 인터랙션에 따른 동적 UI 업데이트
- AI Agent 분석 결과와 UI 연결
- 에너지 및 안전 상태 시각적 표현
- 사용자 중심 정보 구조 및 UI/UX 설계
- 반복 UI 요소의 컴포넌트화

기능별 UI를 컴포넌트 단위로 분리하여 **재사용성과 유지보수성**을 고려했으며, 상태 변화에 따라 필요한 정보가 화면에 반영되도록 구성했습니다.

<br>

## 🛠 Tech Stack

### Frontend

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

### Database

![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

### AI / Cloud

![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)

- Vertex AI
- Generative AI
- LLM
- AI Agent

<br>

## 🏗 System Architecture

```text
┌─────────────────────────────────┐
│          React Client           │
│                                 │
│ Dashboard / Monitoring / UI     │
└───────────────┬─────────────────┘
                │
                │ API
                ▼
┌─────────────────────────────────┐
│         Express Server          │
│                                 │
│ API / Business Logic            │
└────────────┬───────────┬────────┘
             │           │
             ▼           ▼
┌──────────────────┐  ┌──────────────────┐
│    SQLite DB     │  │     AI Agent     │
│                  │  │                  │
│   Factory Data   │  │    Vertex AI     │
└──────────────────┘  └─────────┬────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Analyze & Act   │
                       │                  │
                       │ Energy / Safety  │
                       └──────────────────┘
```

프론트엔드, 서버, 데이터베이스, AI Agent의 역할을 분리하고 각 기능이 API를 통해 연결되도록 구성했습니다.

<br>

## 📊 Project Results

| 항목 | 결과 |
|---|---:|
| 객체 탐지 성능 | mAP@0.5 **92.3%** |
| 학습 데이터 | 약 **1,200장** |
| 처리 시간 | 약 **0.44초** |
| 에너지 절감 | 약 **29.9%** |
| 대응 시간 단축 | 약 **18%** |
| 안전 이벤트 감지율 | 약 **90%** |

> 위 수치는 실제 제조 현장 운영 성과가 아닌 **프로젝트 테스트 및 시뮬레이션 환경에서 측정한 결과**입니다.

<br>

## 👨‍💻 My Role

본 프로젝트는 **개인 프로젝트**로 진행했으며 기획부터 구현까지 전반적인 개발 과정을 직접 수행했습니다.

### Planning
- 서비스 아이디어 기획
- 문제 정의 및 요구사항 분석
- 핵심 기능 설계
- 사용자 흐름 설계

### Frontend
- React 기반 프론트엔드 개발
- UI/UX 설계
- 컴포넌트 구조 설계
- Dashboard 구현
- 데이터 시각화
- 사용자 인터랙션 구현
- AI 분석 결과와 UI 연결

### Backend
- Express 기반 서버 구현
- API 구성
- SQLite 데이터 구조 구성
- 프론트엔드와 서버 데이터 연동

### AI
- AI Agent 구조 설계
- Vertex AI 연동
- Perceive → Reason → Act → Evaluate 프로세스 설계
- 에너지 관리 및 안전 관리 기능 연동

<br>

## 🔍 What I Learned

Aegis Factory를 개발하면서 생성형 AI 서비스를 구현하기 위해서는 모델의 성능뿐만 아니라 **AI의 결과를 사용자가 어떻게 이해하고 실제 행동으로 연결할 수 있도록 제공할 것인지**가 중요하다는 것을 배웠습니다.

특히 여러 종류의 데이터를 하나의 웹 인터페이스에서 표현하면서 **컴포넌트 구조, 데이터 흐름, 사용자 인터랙션 및 UI/UX**를 함께 고려하는 경험을 할 수 있었습니다.

또한 익숙하지 않은 기술이 필요한 경우 Google Cloud 공식 문서와 기술 자료를 직접 찾아 학습하고 실제 기능으로 구현하면서 새로운 기술을 빠르게 습득하고 적용하는 역량을 키울 수 있었습니다.

<br>

## 🚀 Future Improvements

현재 구현된 기능을 기반으로 다음과 같은 방향으로 서비스를 확장할 계획입니다.

- WebSocket 기반 실시간 데이터 통신 구조 고도화
- 대규모 센서 데이터 처리 최적화
- 프론트엔드 상태 관리 구조 개선
- 공통 UI 컴포넌트 기반 디자인 시스템 구축
- 실시간 협업 기능 추가
- Three.js / WebGL 기반 3D 공장 시각화
- AI Agent 판단 과정 및 실행 결과 시각화 고도화

<br>

## 📌 Summary

> **AI를 단순히 호출하는 웹 페이지가 아니라, AI의 판단과 데이터를 사용자가 실제로 활용할 수 있는 인터랙티브 웹 서비스로 구현하는 것을 목표로 했습니다.**

### 🏆 Google Cloud AI Agent Challenge 대상
