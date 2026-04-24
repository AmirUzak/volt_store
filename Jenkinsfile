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

        stage('Build & Deploy') {
            steps {
                withCredentials([file(credentialsId: 'volt-env-file', variable: 'ENV_FILE')]) {
                    sh 'cp $ENV_FILE .env'
                    sh 'docker-compose -p volt down --remove-orphans || true'
                    sh 'docker-compose -p volt --profile prod up -d --build'
                    sh 'sleep 15'
                    sh 'docker-compose -p volt exec -T backend npx prisma migrate deploy || true'
                    sh 'docker-compose -p volt ps'
                }
            }
        }
    }

    post {
        always {
            sh 'docker-compose -p volt ps || true'
        }
        failure {
            sh 'docker-compose -p volt logs > build-logs.txt 2>&1 || true'
            archiveArtifacts artifacts: 'build-logs.txt', allowEmptyArchive: true
        }
    }
}
