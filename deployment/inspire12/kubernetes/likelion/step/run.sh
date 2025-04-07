# namespace
kubectl create ns likelion
kubectl config set-context --current --namespace=likelion
kubectl config view --minify --output 'jsonpath={..namespace}'; echo

# pod 실행
kubectl run likelion-pod --image=likelion-backend:latest --port=8082

kubectl get pods
kubectl describe pod likelion-pod
kubectl delete pod likelion-pod

