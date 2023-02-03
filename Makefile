develop:
	npx webpack serve

install:
	npm ci

build:
	npx webpack --mode=production --node-env=production

lint:
	npx eslint .

.PHONY: test