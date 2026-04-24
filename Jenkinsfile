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
                    sh 'docker-compose build backend frontend nginx'
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'volt-env-file', variable: 'ENV_FILE')]) {
                    sh 'cp $ENV_FILE .env'
                    sh '''
                        for name in volt-backend volt-frontend volt-nginx volt-certbot; do
                            docker stop $name 2>/dev/null || true
                            docker rm $name 2>/dev/null || true
                        done
                    '''
                    sh 'docker-compose -p volt --profile prod up -d backend frontend nginx certbot'
                    sh 'sleep 20'
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
            sh 'docker-compose -p volt logs backend > build-logs.txt 2>&1 || true'
            archiveArtifacts artifacts: 'build-logs.txt', allowEmptyArchive: true
        }
    }
}
