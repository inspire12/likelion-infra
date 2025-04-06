curl http://likelion-backend-1:8082/health/os

로컬 Port Forwarding 사용 (가장 확실한 테스트)

kubectl get svc nginx-likelion
kubectl port-forward svc/nginx-likelion 8080:80
