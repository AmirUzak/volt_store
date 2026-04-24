pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        COMPOSE_PROJECT_NAME = 'volt'
        DOCKER_BUILDKIT = '1'
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Получаем код из GitHub..."
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[url: 'https://github.com/AmirUzak/volt_store.git']]
                ])
            }
        }

        stage('Build') {
            steps {
                withCredentials([file(credentialsId: 'volt-env-file', variable: 'ENV_FILE')]) {
                    sh 'cp $ENV_FILE .env'
                    sh 'docker-compose build'
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'volt-env-file', variable: 'ENV_FILE')]) {
                    sh 'cp $ENV_FILE /root/volt_store/.env'
                    sh 'cd /root/volt_store && docker-compose --profile prod down --remove-orphans || true'
                    sh 'cd /root/volt_store && docker-compose --profile prod up -d --build'
                    sh 'sleep 15'
                    sh 'cd /root/volt_store && docker-compose exec -T backend npx prisma migrate deploy || true'
                    sh 'cd /root/volt_store && docker-compose ps'
                }
            }
        }
    }

    post {
        always {
            sh 'cd /root/volt_store && docker-compose ps || true'
        }
        failure {
            sh 'cd /root/volt_store && docker-compose logs > /tmp/build-logs.txt 2>&1 || true'
            archiveArtifacts artifacts: '/tmp/build-logs.txt', allowEmptyArchive: true
        }
    }
}
