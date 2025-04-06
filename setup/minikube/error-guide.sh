# 1. 클러스터 상태 확인
minikube status

# 2. 컨텍스트 강제 설정
kubectl config use-context minikube

# 3. 완전 초기화 후 재시작
minikube stop
minikube delete
minikube start --driver=docker --force

# 4. Docker 환경 연동 다시 적용
eval $(minikube docker-env)