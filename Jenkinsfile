pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[url: 'https://github.com/AmirUzak/volt_store.git']]
                ])
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    cd /root/volt_store
                    git pull origin main
                    docker-compose --profile prod up -d --build backend frontend nginx
                    sleep 10
                    docker-compose exec -T backend npx prisma migrate deploy || true
                    docker-compose ps
                '''
            }
        }
    }

    post {
        always {
            sh 'cd /root/volt_store && docker-compose ps || true'
        }
    }
}