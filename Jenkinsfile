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
                    sh 'docker compose build --no-cache'
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'volt-env-file', variable: 'ENV_FILE')]) {
                    sh 'cp $ENV_FILE .env'
                    sh 'docker compose --profile prod up -d --build'
                    sh 'sleep 15'
                    sh 'docker compose exec -T backend npx prisma migrate deploy || true'
                    sh 'docker compose ps'
                }
            }
        }

        stage('Notify') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    withCredentials([string(credentialsId: 'telegram-bot-token', variable: 'TG_TOKEN')]) {
                        sh """
                            curl -s -X POST https://api.telegram.org/bot\${TG_TOKEN}/sendMessage \
                                -d chat_id=YOUR_CHAT_ID \
                                -d text="✅ VOLT Store deployed — build #${env.BUILD_NUMBER}"
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker compose ps || true'
        }
        failure {
            sh 'docker compose logs > build-logs.txt 2>&1 || true'
            archiveArtifacts artifacts: 'build-logs.txt', allowEmptyArchive: true
            catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                withCredentials([string(credentialsId: 'telegram-bot-token', variable: 'TG_TOKEN')]) {
                    sh """
                        curl -s -X POST https://api.telegram.org/bot\${TG_TOKEN}/sendMessage \
                            -d chat_id=YOUR_CHAT_ID \
                            -d text="❌ VOLT Store FAILED — build #${env.BUILD_NUMBER}"
                    """
                }
            }
        }
    }
}
