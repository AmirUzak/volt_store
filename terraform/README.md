# Terraform — VOLT Store Infrastructure

Управление Docker инфраструктурой через Terraform.

## Быстрый старт

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Что создаётся

- Docker network `tf-volt-network`
- PostgreSQL 16 контейнер
- Redis 7 контейнер

## Удалить

```bash
terraform destroy
```
