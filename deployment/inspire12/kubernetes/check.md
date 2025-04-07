endpoint: curl http://likelion-backend-1:8082/health/os

## namespace
### namespace 확인
kubectl config view --minify --output 'jsonpath={..namespace}'; echo
### namespace 변경
kubectl config set-context --current --namespace=likelion
 
## deployment

### 일괄 삭제 
kubectl delete deployment --all -n 네임스페이스명



### 로컬 Port Forwarding 사용 (가장 확실한 테스트)
kubectl get svc nginx-likelion
kubectl port-forward svc/nginx-likelion 8080:80