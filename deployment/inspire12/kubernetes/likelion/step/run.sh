# minikube
eval $(minikube docker-env)
# docker image 생성 likelion-backend:latest
docker build -t likelion-backend:latest .
# namespace
kubectl create ns likelion
kubectl config set-context --current --namespace=likelion
kubectl config view --minify --output 'jsonpath={..namespace}'; echo

# pod 실행, imagePullError 해결
kubectl run likelion-pod --image=likelion-backend:latest --port=8082

kubectl get pods
kubectl describe pod likelion-pod
kubectl delete pod likelion-pod

# service 실행, 접근 확인
kubectl apply -f service.yaml
kubectl get svc
kubectl port-forward svc/backend-service 8082:8082
