install:
	npm ci

build:
	npx webpack --mode=production --node-env=production

develop:
	npx webpack serve

lint:
	npx eslint .