brew install minikube kubectl

# 설치 후 확인
minikube version
kubectl version --client

minikube start --cpus=2 --memory=2048