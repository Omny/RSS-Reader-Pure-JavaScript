develop:
	npx webpack serve

install:
	npm ci

build:
	npx webpack --mode=production --node-env=production

test:
	npm test

lint:
	npx eslint .

.PHONY: test