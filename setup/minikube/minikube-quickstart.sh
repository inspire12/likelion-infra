#!/bin/bash

# 클러스터 시작
minikube start

# Docker 환경 연동 (로컬 이미지 빌드용)
eval $(minikube docker-env)

echo "[INFO] minikube 시작 완료 및 도커 환경 연동됨"

# 서비스 목록 확인
echo "[INFO] 현재 서비스 목록"
minikube service list

# 대시보드 실행 (선택)
echo "[INFO] 대시보드 실행 중..."
minikube dashboard