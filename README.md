# Setup:
Nachdem NodeJS installiert wurde schlicht die folgenden cmds ausführen:

```sh
# yarn von Node anschalten
corepack enable 
# Dependencies installieren
yarn install 
npm install
```

# Tests ausführen:
```sh
yarn test
```

# Server Starten:

```sh
npm i -g five-server@latest && five-server --port=8000
```

Server öffnet sich auf [localhost](http://localhost:8000)

# Typescript einrichten nach [Digital Ocean](https://www.digitalocean.com/community/tutorials/setting-up-a-node-project-with-typescript-de)


# Common Problems:
## Yarn funktioniert nicht
Falls `yarn` unter windows nicht ausgeführt werden kann. So bennene die `yarn.ps1` nach `old_yarn.ps1` um. Dann wird für yarn die `yarn.cmd` ausgeführt. 
