pipeline {
    agent any
    
    options {
        disableConcurrentBuilds()
        timestamps()
        ansiColor('xterm')
    }
    
    environment {
        COMPOSE_PROJECT_NAME = 'volt'
        DOCKER_BUILDKIT = '1'
        PATH = "${PATH}:/usr/local/bin:/usr/bin"
    }
    
    stages {
        stage('Checkout') {
            timeout(time: 10, unit: 'MINUTES') {
                steps {
                    script {
                        echo "🔄 Cloning repository from GitHub (branch: main)..."
                    }
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        userRemoteConfigs: [[url: 'https://github.com/AmirUzak/volt_store.git']]
                    ])
                }
            }
        }
        
        stage('Lint & Type Check') {
            timeout(time: 10, unit: 'MINUTES') {
                steps {
                    script {
                        echo "📝 Installing frontend dependencies..."
                        sh 'npm ci'
                        
                        echo "🔍 Running frontend linter..."
                        sh 'npm run lint'
                        
                        echo "📦 Installing backend dependencies..."
                        sh 'cd backend && npm ci'
                        
                        echo "🎯 Running TypeScript type check..."
                        sh 'cd backend && npx tsc --noEmit'
                    }
                }
            }
        }
        
        stage('Build') {
            timeout(time: 10, unit: 'MINUTES') {
                steps {
                    withCredentials([file(credentialsId: 'volt-env-file', variable: 'ENV_FILE')]) {
                        script {
                            echo "🐳 Building Docker images..."
                            sh 'docker compose build --no-cache --env-file ${ENV_FILE}'
                        }
                    }
                }
            }
        }
        
        stage('Test') {
            timeout(time: 10, unit: 'MINUTES') {
                steps {
                    withCredentials([file(credentialsId: 'volt-env-file', variable: 'ENV_FILE')]) {
                        script {
                            echo "🧪 Starting postgres and redis for testing..."
                            sh 'docker compose up -d postgres redis --env-file ${ENV_FILE}'
                            
                            // Wait for postgres to be ready
                            sh 'sleep 10'
                            
                            echo "📊 Running Prisma migrations..."
                            sh 'docker compose run --rm backend npx prisma migrate deploy --env-file ${ENV_FILE}'
                            
                            // Check if tests are configured
                            echo "🔬 Checking for tests..."
                            def hasTests = sh(script: 'cd backend && npm run 2>&1 | grep -q "test"', returnStatus: true) == 0
                            
                            if (hasTests) {
                                echo "▶️  Running backend tests..."
                                sh 'docker compose run --rm backend npm test'
                            } else {
                                echo "⏭️  No tests configured, skipping"
                            }
                        }
                    }
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            timeout(time: 10, unit: 'MINUTES') {
                steps {
                    withCredentials([file(credentialsId: 'volt-env-file', variable: 'ENV_FILE')]) {
                        script {
                            echo "🚀 Deploying to production..."
                            
                            sh 'docker compose down --remove-orphans'
                            sh 'docker compose --profile prod up -d --build --env-file ${ENV_FILE}'
                            
                            echo "⏳ Waiting for services to be ready..."
                            sh 'sleep 30'
                            
                            echo "📊 Running database migrations..."
                            sh 'docker compose exec -T backend npx prisma migrate deploy'
                            
                            echo "🏥 Performing health check..."
                            sh 'curl -f http://localhost/health || exit 1'
                            
                            echo "✅ Deployment successful!"
                        }
                    }
                }
            }
        }
        
        stage('Notify') {
            when {
                allOf {
                    branch 'main'
                    environment name: 'TELEGRAM_BOT_TOKEN', value: 'true'
                }
            }
            steps {
                script {
                    withCredentials([string(credentialsId: 'telegram-bot-token', variable: 'TELEGRAM_TOKEN')]) {
                        def message = "✅ VOLT deployed successfully — branch: main, build: #${env.BUILD_NUMBER}"
                        def chatId = '-1001234567890' // Replace with actual group chat ID
                        sh '''
                            curl -s -X POST https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage \
                                -d chat_id=${chatId} \
                                -d text="${message}"
                        ''' || echo "Telegram notification skipped (token not configured)"
                    }
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "🧹 Cleaning up..."
                sh 'docker system prune -f'
            }
        }
        
        failure {
            script {
                echo "📝 Collecting logs..."
                sh 'docker compose logs > build-logs.txt 2>&1 || true'
                archiveArtifacts artifacts: 'build-logs.txt', allowEmptyArchive: true
                
                withCredentials([string(credentialsId: 'telegram-bot-token', variable: 'TELEGRAM_TOKEN')]) {
                    def message = "❌ VOLT deploy FAILED — branch: main, build: #${env.BUILD_NUMBER}"
                    def chatId = '-1001234567890' // Replace with actual group chat ID
                    sh '''
                        curl -s -X POST https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage \
                            -d chat_id=${chatId} \
                            -d text="${message}" || echo "Telegram notification skipped"
                    ''' || true
                }
            }
        }
    }
}
