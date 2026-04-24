pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        REMOTE_HOST = '164.92.181.151'
        REMOTE_USER = 'root'
        REMOTE_DIR  = '/opt/volt_store'
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
            when { branch 'main' }
            steps {
                sshagent(credentials: ['do-server-ssh']) {
                    // Пуллим код на сервере
                    bat """
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% ^
                        "cd %REMOTE_DIR% && git pull origin main"
                    """
                    // Пересобираем и поднимаем контейнеры
                    bat """
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% ^
                        "cd %REMOTE_DIR% && docker compose --profile prod up -d --build"
                    """
                    // Мигрируем БД
                    bat """
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% ^
                        "cd %REMOTE_DIR% && docker compose exec -T backend npx prisma migrate deploy"
                    """
                    // Health check
                    bat """
                        ssh -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_HOST% ^
                        "curl -f http://localhost/health"
                    """
                }
            }
        }

        stage('Notify') {
            when { branch 'main' }
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    withCredentials([string(credentialsId: 'telegram-bot-token', variable: 'TG_TOKEN')]) {
                        bat """
                            curl -s -X POST https://api.telegram.org/bot%TG_TOKEN%/sendMessage ^
                                -d chat_id=YOUR_CHAT_ID ^
                                -d text="✅ VOLT Store deployed build #%BUILD_NUMBER%"
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline завершён — build #${env.BUILD_NUMBER}"
        }
        failure {
            catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                withCredentials([string(credentialsId: 'telegram-bot-token', variable: 'TG_TOKEN')]) {
                    bat """
                        curl -s -X POST https://api.telegram.org/bot%TG_TOKEN%/sendMessage ^
                            -d chat_id=YOUR_CHAT_ID ^
                            -d text="❌ VOLT Store FAILED build #%BUILD_NUMBER%"
                    """
                }
            }
        }
    }
}