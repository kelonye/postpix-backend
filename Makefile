dev:
	env-cmd pnpm dev

test-prd:
	NODE_ENV=production pnpm build
	NODE_ENV=production pnpm start

lint:
	pnpm lint

up:
	docker compose up --build -d

stop:
	docker compose stop

logs:
	docker compose logs -f -n 100

ssh:
	ssh saas

scp:
	@scp .env.dev saas:/home/octocat/postpix-backend-dev/.env
	@scp .env.prd saas:/home/octocat/postpix-backend-prd/.env

.PHONY: dev test-prd lint up stop logs ssh scp
